export const MODULE_NAME = "niks-dnd5e-content-manager"

/** Module ID used before the fork got its own ID (14.2.0); settings are migrated from it once. */
export const LEGACY_MODULE_NAME = "dnd5e-content-manager"
export const MODULE_LABEL = "DnD Content Manager"

/**
 * A global settings object for the module
 */
export const SETTINGS = {

    /**
     * The list of item types that can be managed by the module
     */
    itemtypes: [
        "class",
        "subclass",
        "race",
        "background",
        "feat",
        "items",
        "spell",
        "spelllist",
        "monster",
    ],

    /**
     * Configuration of the 'item' type management
     */
    items : {
        label: "DCM.Type.Items",
        metadataLabel: "DCM.Metadata.Type",
        icon: "systems/dnd5e/icons/svg/items/container.svg",
        sources: "itemSources",
        content: "items",
        previousContentSelections: "previousItemSelections",
        enabled: "filterItems",
        type: "Item",
        subtype: "items",
        item_subtypes: ["container", "consumable", "equipment", "loot", "tattoo", "tool", "weapon"],
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Type", valuePath: "metadata"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    spell : {
        label: "DCM.Type.Spells",
        metadataLabel: "DCM.Metadata.LevelSchool",
        icon: "systems/dnd5e/icons/svg/items/spell.svg",
        sources: "spellSources",
        content: "spells",
        previousContentSelections: "previousSpellSelections",
        enabled: "filterSpells",
        type: "Item",
        subtype: "spell",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.School", valuePath: "school"},
            {groupLabel: "DCM.Group.SpellLevel", valuePath: "levelInt", itemLabelPath: "level"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    spelllist: {
        label: "DCM.Type.SpellLists",
        metadataLabel: "DCM.Metadata.Class",
        icon: "systems/dnd5e/icons/svg/item-grant.svg",
        sources: "spellListSources",
        content: "spellLists",
        previousContentSelections: "previousSpellListSelections",
        enabled: "filterSpellLists",
        type: "JournalEntry",
        subtype: "spells",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Journal", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Class", valuePath: "metadata"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    class: {
        label: "DCM.Type.Classes",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/class.svg",
        sources: "classSources",
        content: "classes",
        previousContentSelections: "previousClassSelections",
        enabled: "filterClasses",
        type: "Item",
        subtype: "class",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    subclass: {
        label: "DCM.Type.Subclasses",
        metadataLabel: "DCM.Metadata.Class",
        icon: "systems/dnd5e/icons/svg/items/subclass.svg",
        sources: "subclassSources",
        content: "subclasses",
        previousContentSelections: "previousSubclassSelections",
        enabled: "filtersubClasses", // Persisted setting key — do not rename without migration
        type: "Item",
        subtype: "subclass",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Class", valuePath: "metadata"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    feat: {
        label: "DCM.Type.Feats",
        metadataLabel: "DCM.Metadata.FeatType",
        icon: "systems/dnd5e/icons/svg/items/feature.svg",
        sources: "featSources",
        content: "feats",
        previousContentSelections: "previousFeatSelections",
        enabled: "filterFeats",
        type: "Item",
        subtype: "feat",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.FeatType", valuePath: "metadata"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    race: {
        label: "DCM.Type.Species",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/race.svg",
        sources: "speciesSources",
        content: "species",
        previousContentSelections: "previousSpeciesSelections",
        enabled: "filterSpecies",
        type: "Item",
        subtype: "race",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    background: {
        label: "DCM.Type.Backgrounds",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/items/background.svg",
        sources: "backgroundSources",
        content: "backgrounds",
        previousContentSelections: "previousBackgroundSelections",
        enabled: "filterBackgrounds",
        type: "Item",
        subtype: "background",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    monster: {
        label: "DCM.Type.Monsters",
        metadataLabel: "",
        icon: "systems/dnd5e/icons/svg/monster.svg",
        sources: "monsterSources",
        content: "monsters",
        previousContentSelections: "previousMonsterSelections",
        enabled: "filterMonsters",
        type: "Actor",
        subtype: "npc",
        groups: [
            {groupLabel: "DCM.Group.Module", valuePath: "module", itemLabelPath: "moduleName"},
            {groupLabel: "DCM.Group.Compendium", valuePath: "compendium", itemLabelPath: "compendiumName"},
            {groupLabel: "DCM.Group.Source", valuePath: "source", itemLabelPath: "sourceName"},
            {groupLabel: "DCM.Group.Type", valuePath: "typeName"},
            {groupLabel: "DCM.Group.Name", valuePath: "label"}
        ]
    },

    lastLoadedVersion: "lastLoadedVersion",
    filterQuickInsert: "filterQuickInsert",
    filterSpotlight: "filterSpotlight",
    filterHeromancer: "filterHeromancer",
    injectCompendiumButtons: "injectCompendiumButtons",
    injectItemButton: "injectItemButton",
    playerHandbookOptions: "playerHandbookOptions",
    overrideCompendium: "overrideCompendium"
}

/**
 * Replaces the i18n keys in SETTINGS (type labels, metadata column labels, grouping labels) with their
 * translations. Called once from the i18nInit hook; everything that displays these labels runs later.
 */
export function localizeSettingLabels() {
    const loc = key => (typeof key === "string" && key.startsWith("DCM.")) ? game.i18n.localize(key) : key;
    for (const type of SETTINGS.itemtypes) {
        const config = SETTINGS[type];
        config.label = loc(config.label);
        config.metadataLabel = loc(config.metadataLabel);
        for (const group of config.groups ?? []) group.groupLabel = loc(group.groupLabel);
    }
}

/**
 * Writes that the server hasn't confirmed yet, keyed by setting path.
 * - value: the newest value set; reads return it so they see their own changes immediately
 * - inFlight: the write currently on its way to the server
 * - next: the single write queued behind it, or null. Further sets only replace `value`, so
 *   rapid changes (e.g. clicking many checkboxes) send at most one more update, not one each.
 * @type {Map<string, {value: *, inFlight: Promise, next: Promise|null}>}
 */
const pendingWrites = new Map();

/**
 * Whether a user may change this module's world settings. Mirrors Foundry's own check for
 * Setting documents, which allow any user with the "Modify Configuration Settings"
 * (SETTINGS_MODIFY) permission, not only Gamemasters.
 * @param {User} [user=game.user] - The user to check
 * @returns {boolean}
 */
export function canModifySettings(user = game.user) {
    return user?.can?.("SETTINGS_MODIFY") ?? false;
}

/**
 * Wrapper for game.settings.get that includes the module name.
 * Returns the value of a write that is still on its way to the server, so that
 * read-modify-write updates made in quick succession don't overwrite each other.
 * @param {string} path - The path of the setting
 * @returns {*} The value of the setting
 */
export function getSetting(path) {
    const pending = pendingWrites.get(path);
    if (pending) {
        return foundry.utils.deepClone(pending.value);
    }
    return game.settings.get(MODULE_NAME, path);
}

/**
 * Sets a world setting of this module, if the current user is allowed to.
 * Writes to the same key are sent one after another, so a second write never races
 * the first (e.g. two Setting documents being created for the same key). While a write is
 * on its way, later values are merged into one queued write that sends the newest value.
 * @param {string} path - The path of the setting
 * @param {*} value - The value of the setting
 * @returns {Promise<void>} Resolves once the server has stored this value (or a newer one)
 */
export function setSetting(path, value) {
    if (!canModifySettings()) {
        console.debug(`${MODULE_LABEL} | Skipped setting "${path}": user lacks the SETTINGS_MODIFY permission`);
        return Promise.resolve();
    }

    const state = pendingWrites.get(path);
    if (state) {
        state.value = value;
        state.next ??= state.inFlight.then(() => {
            state.next = null;
            return sendWrite(path, state, state.value);
        });
        return state.next;
    }

    let result;
    try {
        result = game.settings.set(MODULE_NAME, path, value);
    } catch (err) {
        result = Promise.reject(err);
    }

    // Synchronous setter (unit test mocks): nothing to track
    if (!(result instanceof Promise)) {
        return Promise.resolve();
    }

    const newState = { value, inFlight: null, next: null };
    pendingWrites.set(path, newState);
    return trackWrite(path, newState, result);
}

/**
 * Sends a queued write to the server.
 * @param {string} path - The path of the setting
 * @param {object} state - The pending write state for this path
 * @param {*} value - The value to send
 * @returns {Promise<void>}
 */
function sendWrite(path, state, value) {
    let result;
    try {
        result = Promise.resolve(game.settings.set(MODULE_NAME, path, value));
    } catch (err) {
        result = Promise.reject(err);
    }
    return trackWrite(path, state, result);
}

/**
 * Reports a failed write and forgets the pending state once nothing more is queued.
 * @param {string} path - The path of the setting
 * @param {object} state - The pending write state for this path
 * @param {Promise} result - The server write
 * @returns {Promise<void>} Never rejects
 */
function trackWrite(path, state, result) {
    state.inFlight = result
        .then(() => {}, err => {
            console.error(`${MODULE_LABEL} | Failed to save setting "${path}"`, err);
            ui.notifications?.error(game.i18n.format("DCM.Notify.SaveFailed", { module: MODULE_LABEL }));
        })
        .then(() => {
            // A write queued meanwhile registered on inFlight, so state.next is already set here
            if (!state.next && pendingWrites.get(path) === state) {
                pendingWrites.delete(path);
            }
        });
    return state.inFlight;
}
