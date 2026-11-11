import { getFeatType } from "../enrich-feats.mjs";
import { getSetting, SETTINGS, MODULE_NAME } from "../settings.mjs";
import { getClassDetailsFromIdent } from "../enrich-class.mjs";
import { enrichSource, getPackageFromMetadata } from "../enrich-source.mjs";
import { getOrdinalSuffix, warn } from "../lib.mjs";
import { SourceSelector } from "./source-selector.mjs";
import { forceSpotlightRebuild } from "../integrations/spotlight.mjs";
import { addContent, removeContent } from "../content-management.mjs";
import { getMonsterType } from "../enrich-monsters.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api

/**
 * Index fields the Content Selector reads, per document type. They are added to Foundry's
 * compendium index fields at init (see registerContentIndexFields), so every index request,
 * including dnd5e's, already contains them. Foundry only keeps the field list of the last
 * getIndex call, so asking for different fields per tab made it reload the index from the server.
 *
 * Only list leaf paths for objects such as system.type, never the parent object itself. Foundry's
 * server builds the index projection with setProperty and puts these fields first in every request,
 * so a parent ("system.type") followed by a child another package asks for ("system.type.baseItem",
 * dnd5e's "system.type.value") makes the server throw "Cannot use 'in' operator to search for ...".
 */
export const CONTENT_INDEX_FIELDS = {
    Item: ["system.source", "system.school", "system.level", "system.classIdentifier",
        "system.type.value", "system.type.subtype", "system.container"],
    Actor: ["system.source", "system.details.type.value"]
};

/** Adds CONTENT_INDEX_FIELDS to CONFIG.<Document>.compendiumIndexFields. Call during init. */
export function registerContentIndexFields() {
    for (const [documentName, fields] of Object.entries(CONTENT_INDEX_FIELDS)) {
        const config = CONFIG[documentName];
        if (!config) continue;
        config.compendiumIndexFields ??= [];
        for (const field of fields) {
            if (!config.compendiumIndexFields.includes(field)) config.compendiumIndexFields.push(field);
        }
    }
}

/** Shared collator: much faster than calling localeCompare for every comparison. */
const compare = new Intl.Collator().compare;

export class ContentSelector extends HandlebarsApplicationMixin(ApplicationV2) {
    //Allow a GM to select approved content for their game
    constructor() {
        super();

        //Starting tab
        this.tabGroups.primary = "class";

        //Keep track of which groups are currently selected
        this.selected_groups = Object.fromEntries(SETTINGS.itemtypes.map(i => [i, new Set([0])]))
        
        //Filters applied to the current content
        this.currentFilters = {
            name: null,
            minItems: 0,
            unique: false
        }

        //Set if we want to ask the user to reload when closing the app
        this.reloadRequired = false;

        //Processed rows per subtype and pack, kept while this window is open
        this._entryCache = new Map();

    }

    async _onClose() {
        if (CONFIG.dndContentManager.forceRebuild) {
            forceSpotlightRebuild()
        }

        if (this.reloadRequired) {
            foundry.applications.api.DialogV2.confirm({
                window: { title: "Reload Page?" },
                content: "<p>Changing spell lists only takes effect when Foundry is reloaded. Reload now?</p>",
                modal: true,
                submit: (result) => {if (result) {window.location.reload()}}
              })
        }
    }

    //Add a button to open the ContentSelector to the Compendium Sidebar
    /**
     * Creates a sidebar button for the content selector.
     *
     * This button is styled with the class "content-selector-button" and includes an icon and text.
     * When clicked, it opens the Content Selector application.
     *
     * @returns {HTMLButtonElement} The created button element.
     */
    static createSidebarButton() {
        const button = document.createElement("button");
        button.classList.add("content-selector-button")
        button.type = "button";
        button.setAttribute("data-tooltip", "Open Content Selector")
        button.innerHTML = `
          <i class="fas fa-ballot" inert></i>Configure Player Content`;
        button.addEventListener("click", event => (new ContentSelector()).render({ force: true }));
        return button;
      }

    /**
     * Intercepts the frame rendering and adds a settings button to the header.
     * 
     * @param {Object} options - The options to render the frame with.
     * @returns {Promise<HTMLElement>} The rendered HTML element.
     * @override
     */
    async _renderFrame(options) {
        const html = await super._renderFrame(options);

        //Add button to open SourceSelector
        const settingsButton = document.createElement("button");
        settingsButton.classList.add("header-control");
        settingsButton.classList.add("fas", "fa-cog", "icon")
        settingsButton.dataset.tooltip = "Open Source Config"
        settingsButton.setAttribute("aria-label", "Open Source Config");
        settingsButton.addEventListener("click", event => {
            event.stopPropagation();
            new SourceSelector(
                this.tabGroups.primary,
                () => {this.render()}
            ).render(true);
        })

        //Insert to left of close button
        const header = html.querySelector(".window-header");
        const button = header.querySelector(":not(.hidden).header-control");
        header.insertBefore(settingsButton, button);

        return html;
    }  
    
    static SEARCH_DELAY = 150;

    static DEFAULT_OPTIONS = {
            tag: "form",
            window: {
                title: "Choose Available Content",
                icon: "fas fa-ballot",
                resizeable: true
            },
            id: 'content-selector',
            classes: ["dcm dnd5e2 dialog-lg compendium-browser selector"],
            position: {
                width: 900,
                height: 800,
              },
            actions: {
                selectPack: ContentSelector.#onSelectPack,
                selectAll: ContentSelector.#onSelectAll,
                selectGrouping: ContentSelector.#onSelectGroup,
                clearSearch: ContentSelector.#onClearSearch,
                changeTab: ContentSelector.#onChangeTab,
                openItem: ContentSelector.#onOpenItem,
                togglePackContent: ContentSelector.#onTogglePackContent,
                openCompendiumConfig: () => {}
              },
    }
    
    /*********************************************************************
     *                      Action Functions
     *********************************************************************/

    /**
     * Toggles the visibility of the pack content in the compendium.
     *
     * @param {Event} event - The event object triggered by the user interaction.
     * @param {HTMLElement} target - The target element that was interacted with.
     * @private
     * @async
     */
    static async #onTogglePackContent(event, target) {
        const pack = target.closest(".packs-list").querySelector(".compendium-content");
        const icon = target.querySelector("i");
        if (pack) {
            if (pack.style.display === "none") {
                pack.style.display = "block";
                pack.style.height = pack.scrollHeight + "px";
                // Back to automatic height after the transition, so searching can shrink the group
                setTimeout(() => {
                    if (pack.style.display !== "none") pack.style.height = "";
                }, 300);
                icon.classList.remove("fa-arrow-down");
                icon.classList.add("fa-arrow-up");
            } else {
                pack.style.height = pack.scrollHeight + "px";
                setTimeout(() => {
                    pack.style.height = "0px";
                }, 5);
                setTimeout(() => {
                    pack.style.display = "none";
                }, 300);
                icon.classList.remove("fa-arrow-up");
                icon.classList.add("fa-arrow-down");
            }
        }
    }

    /**
     * Handles the event when an item is opened.
     *
     * @param {Event} event - The event object triggered by the user action.
     * @param {HTMLElement} target - The target HTML element that contains the data-id attribute.
     * @private
     */
    static async #onOpenItem(event, target) {
        const item = await fromUuid(target.getAttribute("data-id"))
        if (item) {
            item.sheet.render(true)
        }
    }

    /**
     * Selects or deselects every visible row of a group (rows hidden by the search stay as they are).
     *
     * @param {Event} event - The event object triggered by the user action.
     * @param {HTMLElement} target - The target element that triggered the event.
     * @private
     */
    static async #onSelectAll(event, target) {
        const category = target.getAttribute("category")
        const checked = target.checked;
        const section = target.closest(".packs-section")

        const changedContent = [];
        for (const box of ContentSelector.#visibleBoxes(section)) {
            if (box.disabled || box.checked === checked) continue;
            box.checked = checked;
            changedContent.push(box.name);
        }

        if (changedContent.length) {
            if (checked) {
                addContent(category, changedContent)
            } else {
                removeContent(category, changedContent);
            }
        }
        ContentSelector.#refreshSectionState(section);

        if (category === "spelllist") {
            this.reloadRequired = true
        }
    }

    /**
     * Handles the selection of a single row.
     *
     * @param {Event} event - The event object triggered by the selection.
     * @param {HTMLElement} target - The target element that was selected.
     * @private
     */
    static async #onSelectPack(event, target) {
        const category = target.getAttribute("category")

        if (target.checked) {
            addContent(category, [target.name]);
        } else {
            removeContent(category, [target.name])
        }
        ContentSelector.#refreshSectionState(target.closest(".packs-section"));

        if (category === "spelllist") {
            this.reloadRequired = true
        }
    }

    /**
     * The row checkboxes of a group that the search currently shows.
     * @param {HTMLElement} section - The group's fieldset.
     * @returns {HTMLElement[]}
     */
    static #visibleBoxes(section) {
        const boxes = [];
        for (const row of section.querySelectorAll("li.compendium-list-row[data-name]")) {
            if (row.hidden) continue;
            const box = row.querySelector("dcm-checkbox[data-action=selectPack]");
            if (box) boxes.push(box);
        }
        return boxes;
    }

    /**
     * Updates a group's "x/y Selected" count and its Select All box from the visible rows.
     * @param {HTMLElement|null} section - The group's fieldset.
     */
    static #refreshSectionState(section) {
        if (!section) return;
        const boxes = ContentSelector.#visibleBoxes(section);
        const n_on = boxes.filter(b => b.checked).length;

        const count = section.querySelector(".selected-count");
        if (count) count.textContent = `${n_on}/${boxes.length} Selected`;

        const all_box = section.querySelector("dcm-checkbox[data-action=selectAll]");
        if (all_box) {
            all_box.checked = n_on > 0;
            all_box.indeterminate = n_on > 0 && n_on < boxes.length;
        }
    }

    /**
     * Applies the name search by hiding rows, without re-rendering. Groups without visible
     * rows are hidden too, and their counts reflect only the visible rows.
     */
    _applySearch() {
        const content = this.element?.querySelector(".content-selector");
        if (!content) return;
        const query = this.currentFilters.name ?? "";
        const sections = content.querySelectorAll(".packs-section");
        let anyVisible = false;

        for (const section of sections) {
            let visible = 0;
            for (const row of section.querySelectorAll("li.compendium-list-row[data-name]")) {
                const show = !query || row.dataset.name.includes(query);
                row.hidden = !show;
                if (show) visible++;
            }
            section.hidden = visible === 0;
            anyVisible ||= visible > 0;
            ContentSelector.#refreshSectionState(section);
        }

        const note = content.querySelector(".no-search-results");
        if (note) note.hidden = anyVisible || sections.length === 0;
    }

    /** @override */
    async _onRender(context, options) {
        await super._onRender(context, options);
        this._applySearch();
    }

    /**
     * Handles the selection of a group based on the target element's attributes and state.
     *
     * @param {Event} event - The event object triggered by the selection action.
     * @param {HTMLElement} target - The target element that triggered the event.
     * @private
     */
    static #onSelectGroup(event, target) {

        const category = target.getAttribute("category");

        if (target.name === "duplicates") {
            this.currentFilters.unique = false;
            this.currentFilters.minItems = this.currentFilters.minItems === 0 ? 2 : 0

        } else if (target.name === "unique") {
            this.currentFilters.unique = !this.currentFilters.unique;
            this.currentFilters.minItems = 0;

        } else {
            const index = parseInt(target.name);
    
            if (target.checked) {
                this.selected_groups[category].add(index);
            } else {
                this.selected_groups[category].delete(index);
            }
        }

        this.render(false);
    }

    /**
     * Handles the change of tabs in the content selector.
     * 
     * @param {Event} event - The event object triggered by the tab change.
     * @param {HTMLElement} target - The target element representing the new tab.
     * @private
     */
    static #onChangeTab(event, target) {
        this.tabGroups.primary = target.getAttribute("category")

        //Reset filters
        this.currentFilters = {
            name: null,
            minItems: 0,
            unique: false
        }

        //Keep duplicate selection between tabs
        // if (this.duplicates) {
        //     this.selected_groups[this.tabGroups.primary] = new Set();
        // }
        this.render(false);
    }

    /**
     * Clears the search input field and shows all rows again.
     *
     * @param {Event} event - The event object triggered by the clear search action.
     * @param {HTMLElement} target - The target element that initiated the clear search action.
     * @private
     */
    static async #onClearSearch(event, target) {
        const input = target.closest("search").querySelector(":scope > input");
        input.value = "";
        this.currentFilters.name = null;
        this._applySearch();
    }

    /**
     * Handles the search input event to filter content by name.
     *
     * @param {Event} event - The input event triggered by the search field.
     */
    _onSearchName(event) {
        if ( !event.target.matches("search > input[type='text']") ) return;
        this.currentFilters.name = event.target.value.toLowerCase();
        this._applySearch();
    }
    
    //Debounce search input
    _debouncedSearch = foundry.utils.debounce(this._onSearchName.bind(this), ContentSelector.SEARCH_DELAY);

    /**
     * Attaches event listeners to the frame element.
     * 
     * This method overrides the parent class's _attachFrameListeners method
     * to add an input event listener to the element. The event listener
     * triggers a debounced search function.
     * 
     * @override
     * @private
     */
    _attachFrameListeners() {
        super._attachFrameListeners();
        this.element.addEventListener("input", this._debouncedSearch, { passive: true });
      }

    static PARTS = {
        sidebar: {
            id: "sidebar",
            template: `modules/${MODULE_NAME}/templates/parts/tab-selector.html`
        },
        content: {
            id: "packs",
            template: `modules/${MODULE_NAME}/templates/parts/content-selector.html`
        },
    }

    /*********************************************************************
    *                      Content Loading
    *********************************************************************/


    /**
     * Get the name of the source based on its type and ID, handling needed special case
     * for world and system compendia.
     *
     * @param {string} sourceType - The type of the source (e.g., "world", "system", "module").
     * @param {string} sourceId - The ID of the source.
     * @returns {string} The name of the source.
     */
    _getSourceName(sourceType, sourceId) {
        if (sourceType === "world") {
            return "World";
        };
        if (sourceType === "system") {
            return "D&D 5E Core";
        };
        return game.modules.get(sourceId).title;
    }

    /**
     * Retrieve the module information based on the package type.
     *
     * @param {Object} pack - The package object.
     * @param {Object} pack.metadata - Metadata of the package.
     * @param {string} pack.metadata.packageType - The type of the package (e.g., "world", "system").
     * @param {string} pack.metadata.packageName - The name of the package.
     * @returns {Object} The module information. If the package type is "world", returns an object with id and title.
     *                   If the package type is "system", returns the game system object.
     *                   Otherwise, returns the module from the game modules collection.
     */
    _getModule(pack) {
        if (pack.metadata.packageType === "world") {
            return {
                id: "world",
                title: "World"
            }
        }
        if (pack.metadata.packageType === "system") {
            return game.system
        }
        return game.modules.get(pack.metadata.packageName)
    }

    /**
     * Read a pack's index and turn the entries this tab manages into display rows.
     * The result is cached per window (see _getPackEntries), so it must not depend on the
     * current selection or search; `checked` is filled in on every render.
     *
     * @param {CompendiumCollection} pack - The compendium pack to read.
     * @param {Function} filter_fn - Keeps the index entries this tab manages.
     * @param {Function} data_fn - Adds type-specific fields (metadata, grouping values).
     * @returns {Promise<Array<Object>>} The rows for this pack.
     */
    async _fetch(pack, filter_fn, data_fn) {
        const module = this._getModule(pack);
        const pkg = getPackageFromMetadata(pack.metadata);
        const compendium = pack.metadata.id;
        const compendiumName = `${pack.metadata.name} (${pack.metadata.id})`;
        const index = await pack.getIndex({fields: CONTENT_INDEX_FIELDS[pack.documentName] ?? []});

        const entries = [];
        for (const d of index) {
            if (!filter_fn(d)) continue;
            const source = this._getSource(d, pkg);
            const label = d.name ?? "";
            entries.push({
                uuid: d.uuid,
                checked: false,
                label,
                searchName: label.toLowerCase(),
                module: module.id,
                moduleName: module.title,
                source: source.value,
                sourceName: source.label ? source.label : source.value,
                compendium,
                compendiumName,
                img: d.img,
                ...data_fn(d)
            });
        }
        return entries;
    }

    /**
     * Builds the source information for an index entry. Works on a copy, so Foundry's
     * cached compendium index (shared with other modules) is left untouched.
     *
     * @param {Object} doc - The index entry.
     * @param {Object|null} pkg - The package the entry's compendium belongs to.
     * @returns {Object} The source data with `label` and `value` filled in.
     */
    _getSource(doc, pkg) {
        const raw = doc.system?.source;
        const source = typeof raw === "string" ? {book: raw} : {...(raw ?? {})};
        enrichSource(source, pkg);
        return source;
    }

    _getSubclasses(pack) {
        return this._fetch(pack,
            (d) => d.type === "subclass",
            (d) => {return {metadata: getClassDetailsFromIdent(d.system.classIdentifier).name}}
        )
    }

    _getSpells(pack) {
        return this._fetch(pack,
            (d) => d.type === "spell",
            (d) => {
                const levelInt = d.system.level;
                const level = levelInt === 0 ? "Cantrip" : `${getOrdinalSuffix(levelInt)} level`
                const school = CONFIG.DND5E.spellSchools[d.system.school]?.label ?? "Unknown";
                return {metadata: `${level} | ${school}`, levelInt: levelInt, level: level, school: school}}
        )
    }

    /**
     * Retrieves the spell list pages of a journal compendium. This needs the full journal
     * documents, so it is the most expensive fetch; _getPackEntries caches it per window.
     *
     * @param {Object} pack - The compendium pack to retrieve spell lists from.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of spell list objects.
     */
    async _getSpellLists(pack) {
        const journals = await pack.getDocuments()
        const fixed = CONFIG.dndContentManager.fixed.get("spelllist").items;
        const module = this._getModule(pack)
        const compendiumName = `${pack.metadata.name} (${pack.metadata.id})`;
        return journals
            .map(d => d.pages.filter(p => p.type === "spells")
            .map(p => {
                let ident = p.system.identifier;
                let img = "systems/dnd5e/icons/spell-tiers/spell3.webp";
                if (ident) {
                    if (p.system.type === "class") {
                        const cls = getClassDetailsFromIdent(ident)
                        ident = cls.name
                        img = cls.img
                    } else {
                        ident = `${ident.charAt(0).toUpperCase()}${ident.slice(1, ident.length)}`
                    }
                } else {
                    ident = "No identifier"
                }

                const label = p.name ?? "";
                return {
                    uuid: p.uuid,
                    label,
                    searchName: label.toLowerCase(),
                    checked: false,
                    metadata: ident,
                    module: module.id,
                    moduleName: module.title,
                    fixed: fixed.has(p.uuid),
                    source: p.parent.uuid,
                    sourceName: p.parent.name,
                    compendium: pack.metadata.id,
                    compendiumName,
                    journal: d.name || "Untitled Journal",
                    img: img
                }

        })).flat()
    }

    _getFeats(pack) {
        return this._fetch(pack,
            d => d.type === "feat" && d.system.type?.value === "feat",
            d => {return {metadata: getFeatType(d.system.type?.subtype)}}
        )
    }

    _getItems(pack) {
        return this._fetch(pack,
            d => SETTINGS.items.item_subtypes.includes(d.type) && !d.system.container,
            d => {return {metadata: `${d.type.slice(0, 1).toUpperCase()}${d.type.slice(1, d.type.length)}`}}
        )
    }

    _getMonsters(pack) {
        return this._fetch(pack,
            d => d.type === "npc",
            d => {
                const typeName = getMonsterType(d.system.details?.type?.value);
                return {metadata: typeName, typeName};
            }
        )
    }

    /**
     * Retrieves the rows of one pack for the given subtype.
     *
     * @param {Object} pack - The data pack from which to retrieve documents.
     * @param {string} subtype - The subtype of documents to retrieve.
     * @returns {Promise<Array>} A promise that resolves to the rows for this pack.
     */
    _getDocuments(pack, subtype) {
        switch (subtype) {
            case SETTINGS.subclass.subtype: return this._getSubclasses(pack);
            case SETTINGS.feat.subtype: return this._getFeats(pack);
            case SETTINGS.spelllist.subtype: return this._getSpellLists(pack);
            case SETTINGS.spell.subtype: return this._getSpells(pack);
            case SETTINGS.items.subtype: return this._getItems(pack);
            case SETTINGS.monster.subtype: return this._getMonsters(pack);
            default: return this._fetch(pack, (d) => d.type === subtype, () => ({}));
        }
    }

    /**
     * Returns the rows of a pack, reading and processing the pack only once per window.
     * Searching, grouping and filtering then work on the cached rows.
     *
     * @param {Object} pack - The compendium pack.
     * @param {string} subtype - The subtype of documents to retrieve.
     * @returns {Promise<Array<Object>>} The cached rows. Don't reorder or replace this array.
     */
    _getPackEntries(pack, subtype) {
        const key = `${subtype}|${pack.collection}`;
        let entries = this._entryCache.get(key);
        if (!entries) {
            entries = this._getDocuments(pack, subtype);
            entries.catch(() => this._entryCache.delete(key));
            this._entryCache.set(key, entries);
        }
        return entries;
    }

    /**
     * Retrieves content options based on the provided subtype, source compendia, and selected options.
     *
     * @param {string} subtype - The subtype of content to retrieve.
     * @param {Array<string>} sourceCompendia - An array of compendium identifiers to source content from.
     * @param {Set<string>} selectedOptions - The UUIDs that are currently selected.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of content options.
     */
    async _getContentOptions(subtype, sourceCompendia, selectedOptions) {

        const grouped_options = (await Promise.all(sourceCompendia.map(async (c) => {
            const pack = game.packs.get(c);

            //Filter out registered packs which are not currently present
            if (pack === null || pack === undefined) {
                warn(`Pack ${c} not found`)
                return null;
            }

            const entries = await this._getPackEntries(pack, subtype);
            for (const e of entries) {
                e.checked = !!e.fixed || selectedOptions.has(e.uuid);
            }
            return { id: pack.metadata.id, entries };
        }))).filter(r => r !== null)

        //Apply the unique/duplicate filters if selected
        if (this.currentFilters.minItems > 0 || this.currentFilters.unique) {
            const labels = new Map();
            for (const group of grouped_options) {
                for (const option of group.entries) {
                    labels.set(option.searchName, (labels.get(option.searchName) ?? 0) + 1);
                }
            }

            // filter() returns new arrays, so the cached rows stay complete
            if (this.currentFilters.minItems > 0) {
                grouped_options.forEach(group => {
                    group.entries = group.entries
                        .filter(e => labels.get(e.searchName) >= this.currentFilters.minItems)
                })
            }

            if (this.currentFilters.unique) {
                grouped_options.forEach(group => {
                    group.entries = group.entries
                        .filter(e => labels.get(e.searchName) === 1)
                })
            }
        }

        return grouped_options
    }

    /**
     * Regroups the given compendia options based on the specified item type and group categories.
     *
     * @param {string} itemtype - The type of item to group (e.g., "spell", "item").
     * @param {Array} group_details - An array of groups to categorise entities by
     * @param {Array} compendia_options - An array of compendia options, each containing entries to be grouped.
     * @returns {Array} - An array of grouped entries, each with metadata such as label, category, and checked status.
     */
    _reGroup(itemtype, group_details, compendia_options) {

        const selected_groups = [...this.selected_groups[itemtype]].map(g => group_details[g])
        const byLabel = (a, b) => compare(a.label, b.label) || compare(a.compendium, b.compendium);
        // flat() copies, so sorting never reorders the cached rows
        const allEntries = compendia_options.map(o => o.entries).flat();

        // Handle case of no filtering
        if (selected_groups.length === 0) {
            const n_checked = allEntries.filter(e => e.checked).length;
            return [{
                id: "all",
                entries: allEntries.sort(byLabel),
                label: "All",
                source: null,
                category: itemtype,
                checked: n_checked === allEntries.length,
                indeterminate: n_checked > 0 && n_checked < allEntries.length,
                selected: n_checked
            }]
        }

        // Grouping values can be numbers (e.g. spell level), so convert before trimming
        const text = (value) => String(value ?? "").trim();

        // Create new groups
        const grouped_entries = new Map();
        for (const e of allEntries) {
            const group_key = selected_groups.map(gc => text(e[gc.valuePath]).toLowerCase()).join(" | ");
            let group = grouped_entries.get(group_key);
            if (!group) {
                group = {
                    key: group_key,
                    label: selected_groups.map(gc => text(e[gc.itemLabelPath])).join(" | "),
                    // Numeric grouping values sort by number (Cantrip, 1st, 2nd... rather than by label)
                    sortValues: selected_groups.map(gc => {
                        const value = e[gc.valuePath];
                        return typeof value === "number" ? value : text(e[gc.itemLabelPath]);
                    }),
                    entries: []
                };
                grouped_entries.set(group_key, group);
            }
            group.entries.push(e);
        }

        const compareGroups = (a, b) => {
            for (let i = 0; i < a.sortValues.length; i++) {
                const x = a.sortValues[i];
                const y = b.sortValues[i];
                const result = (typeof x === "number" && typeof y === "number") ? x - y : compare(String(x), String(y));
                if (result !== 0) return result;
            }
            return 0;
        };

        // Create metadata and sort groups
        return [...grouped_entries.values()].sort(compareGroups).map(group => {
            const entries = group.entries;
            const n_checked = entries.filter(e => e.checked).length;

            return {
                id: group.key.slugify(),
                entries: entries.sort(byLabel),
                label: group.label,
                source: null,
                category: itemtype,
                checked: n_checked > 0,
                metadataLabel: SETTINGS[itemtype].metadataLabel,
                indeterminate: n_checked > 0 && n_checked < entries.length,
                selected: n_checked
            }
        })
    }

    _onChangeTab(event, tabs, active) {
        super._onChangeTab(event, tabs, active);
    }

    /**
     * Prepares groups for a given item type.
     *
     * @param {string} itemtype - The type of item for which to prepare groups.
     * @returns {Array<Object>} An array of group objects, each containing:
     *   - {string} label: The label of the group.
     *   - {number} id: The index of the group.
     *   - {string} itemtype: The type of item.
     *   - {boolean} checked: Whether the group is checked.
     *   - {string} valuePath: The path to the value to group by.
     *   - {string} itemLabelPath: The path to the item label to display.
     */
    _prepareGroups(itemtype) {
        return SETTINGS[itemtype].groups.map(
            (g, index) => {
                return {
                    label: g.groupLabel,
                    id: index,
                    itemtype: itemtype,
                    checked: this.selected_groups[itemtype].has(index),
                    valuePath: g.valuePath,
                    itemLabelPath: g.itemLabelPath || g.valuePath,
                }
            }
        )
    }

    /**
     * Prepares the context for the content selector.
     *
     * @param {Object} options - The options for preparing the context.
     * @returns {Promise<Object>} The prepared context.
     */
    async _prepareContext(options) {
        // Get current selections from settings
        const context = await super._prepareContext(options);
        const settings = SETTINGS[this.tabGroups.primary];        
        const selectedCompendia = [...new Set(getSetting(settings.sources).concat( 
            ...CONFIG.dndContentManager.fixed.get(this.tabGroups.primary).compendia)
        )];
        const selectedContent = new Set(getSetting(settings.content));


        //Get the entries we want users to be able to sort between with any filtering applied
        context.entries = await this._getContentOptions(settings.subtype, selectedCompendia, selectedContent);

        //Regroup the entries based on user selections
        context.groups = this._prepareGroups(this.tabGroups.primary)
        context.entries = this._reGroup(this.tabGroups.primary, context.groups, context.entries)

        context.categories = SETTINGS.itemtypes.map(i => {
            const setting = SETTINGS[i];
            const active = this.tabGroups.primary === i;

            return {id: i, label:setting.label, svg: setting.icon,
                    group: "primary",
                    active,
                    cssClass: active ? "active" : "",
            }
        })
    
        context.type = SETTINGS[this.tabGroups.primary].label
        context.enabled = getSetting(SETTINGS[this.tabGroups.primary].enabled);
        context.isSpelllist = this.tabGroups.primary === "spelllist";
        context.isV3 = CONFIG.dndContentManager.systemV3;
        context.itemtype = this.tabGroups.primary
        context.duplicates = this.currentFilters.minItems > 0
        context.unique = this.currentFilters.unique
        context.numSources = selectedCompendia.length
        context.searchText = this.currentFilters.name ?? ""

        return context;
    }
}