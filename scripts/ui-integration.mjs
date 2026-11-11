import { SourceSelector } from "./apps/source-selector.mjs";
import { ContentSelector } from "./apps/content-selector.mjs";
import { PlayerHandbookMenu } from "./apps/player-handbook.mjs";
import { addContent, removeContent } from "./content-management.mjs";
import { log } from "./lib.mjs";
import { canModifySettings, getSetting, SETTINGS } from "./settings.mjs";

//Code for buttons which are injected into headers of Core DND5e apps

/**
 * Reads whether an item's source is enabled in DCM and whether the item itself is selected.
 * The index is rebuilt first (synchronous) so the state matches the current settings.
 * @param {Item} item
 * @returns {{sourceEnabled: boolean, selected: boolean}}
 */
function getItemToggleState(item) {
    const index = CONFIG.dndContentManager.index;
    index.rebuild();
    return {
        sourceEnabled: index.itemSourceInIndex(item),
        selected: index.itemInIndex("Item", item.type, item.uuid)
    };
}

/**
 * Adds the DCM toggle to the item sheet's header controls (the ⋮ menu).
 * Called from the synchronous getHeaderControlsItemSheet5e hook, so it must not await anything:
 * controls added after the hook returns are ignored. V14 builds the menu each time it opens; V13 builds
 * it once per sheet render. The state is therefore read again when the entry is clicked.
 * @param {ItemSheet5e} app - The item sheet application.
 * @param {ApplicationHeaderControlsEntry[]} controls - The header controls, modified in place.
 */
function injectItemButton(app, controls) {
    const item = app.document;
    if (!item) return;

    //If item type not managed, don't add a control
    const itemIndexType = CONFIG.dndContentManager.index.getItemIndexType(item);
    if (itemIndexType === null) return;

    const { sourceEnabled, selected } = getItemToggleState(item);
    let label = selected ? "Disable Item in DCM" : "Enable Item in DCM";
    let icon = selected ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
    if (!sourceEnabled) {
        label = "Item Source Disabled in DCM: Open Source Config";
        icon = "fa-solid fa-ban";
    }

    controls.unshift({
        action: "dcmToggleItem",
        icon,
        label,
        onClick: () => {
            const state = getItemToggleState(item);
            if (!state.sourceEnabled) {
                new SourceSelector(itemIndexType).render(true);
                return;
            }
            if (state.selected) {
                removeContent(itemIndexType, [item.uuid]);
                ui.notifications.info(`${item.name} is now disabled in DCM.`);
            } else {
                addContent(itemIndexType, [item.uuid]);
                ui.notifications.info(`${item.name} is now enabled in DCM.`);
            }
        }
    });
}

/**
 * Injects buttons into the Compendiun sidebar of the Foundry VTT interface to open the configuration menu
 * and Player Handbook generator.
 * @param {HTMLElement} html - The HTML element representing the sidebar where the buttons will be injected.
 */
function injectCompendiumButtons(html) {
    log("Injecting sidebar buttons")

    const div = document.createElement("div")
    div.classList.add("dcm-button-row")
    div.appendChild(ContentSelector.createSidebarButton())
    div.appendChild(PlayerHandbookMenu.createSidebarButton())

    const headerActions = html.querySelector(".header-actions");
    headerActions.prepend(div);

    log(headerActions)
}

/**
 * Registers the Interface buttons - needs to be done pre-render step in init
 */
export function registerInterfaceButtons() {
    if (getSetting(SETTINGS.injectCompendiumButtons)) {
        Hooks.on("renderCompendiumDirectory", (app, html, data) => {
            if (canModifySettings()) {
                log("Adding compendium sidebar buttons")
                injectCompendiumButtons(html)
            }
        })
    }
    log("Registered interface buttons");
}

/**
 * Registers the System buttons - needs to be done post system initialisation
 *  in ready step
 */
export function registerSystemButtons() {

    //Only users who can change the module's settings get the item toggle
    if (!canModifySettings()) {
        return
    }

    if (getSetting(SETTINGS.injectItemButton)) {
        // dnd5e 5.x/6.x item sheets are ApplicationV2 (ItemSheet5e); the old ItemSheet5e2 hook no longer fires.
        Hooks.on("getHeaderControlsItemSheet5e", (app, controls) => {
            injectItemButton(app, controls)
        })
    }

    log("Registered system buttons");
}