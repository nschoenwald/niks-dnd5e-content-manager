import { exportSettings, importSettings } from "./export.mjs";
import { log } from "./lib.mjs";
import { getSetting, SETTINGS, MODULE_LABEL, MODULE_NAME, LEGACY_MODULE_NAME } from "./settings.mjs";
import { Version } from "./version-utils.mjs";

/**
 * Handles a bug from v1.1.0 where user settings were not copied to world settings
 */
function v111MigrationRegisterSettings() {
    SETTINGS.itemtypes.forEach(i => {
        const item = SETTINGS[i];
        game.settings.register(MODULE_NAME, item.sources,
            {
                config: false,
                type: Array,
                default: []
            }
        ),
        game.settings.register(MODULE_NAME, item.content,
            {
                config: false,
                type: Array,
                default: []
            }
        )
        game.settings.register(MODULE_NAME, item.enabled, 
            {
                config: false,
                type: Boolean,
                default: true
            }
        )
    })
}

/**
 * Displays the changelog by rendering the most recent page of a specific journal entry.
 * 
 * This function retrieves a journal entry from a Compendium using its UUID. If the journal
 * is found, it identifies the most recent page and renders the journal sheet, displaying
 * the changelog. If the journal is not found, it logs a message and exits.
 * 
 * @async
 * @function showChangelog
 * @returns {Promise<void>} Resolves when the changelog is displayed or logs a message if no journal is found.
 */
export async function showChangelog() {

    const currentVersion = CONFIG.dndContentManager.version;
    const lastVersion = Version.fromString(getSetting(SETTINGS.lastLoadedVersion));

    if (currentVersion.equals(lastVersion)) {
        return
    }

    const journal = await fromUuid(
        `Compendium.${MODULE_NAME}.dcm-journals.JournalEntry.TwVIF5nUDBsdcWxs`
    );
    if (!journal) {
        log("No journal found, not showing changelog")
        return
    }
    const mostRecentPage = journal.pages.contents[journal.pages.contents.length - 1];
    journal.sheet.render(true, {pageId: mostRecentPage.id});
}

/**
 * Checks current and last loaded versions and handles any necessary migrations
 */
export function handleMigrations() {
    const currentVersion = CONFIG.dndContentManager.version;
    const lastVersion = Version.fromString(getSetting(SETTINGS.lastLoadedVersion));

    if (currentVersion.equals(lastVersion)) {
        return false
    }

    if (lastVersion.equals(new Version(1,1,0))) {
        log("Migration: Copying user settings to migrate to world settings")
        v111MigrationRegisterSettings();
        CONFIG.dndContentManager.migrationData = exportSettings();

        Hooks.once("ready", () => {
            log("Migration: Writing to world settings")
            importSettings(CONFIG.dndContentManager.migrationData)
            CONFIG.dndContentManager.migrationData = null;
        })
    }
}

/* -------------------------------------------- */
/*  Migration from the old module ID (14.2.0)   */
/* -------------------------------------------- */

const LEGACY_PREFIX = `${LEGACY_MODULE_NAME}.`;
const NEW_PREFIX = `${MODULE_NAME}.`;

/**
 * Points compendium references inside a stored setting value at this module's journal pack.
 * @param {string|null} raw - The raw JSON string stored for the setting.
 * @returns {string|null}
 */
function renameLegacyReferences(raw) {
    if (typeof raw !== "string") return raw;
    return raw.replaceAll(`Compendium.${LEGACY_MODULE_NAME}.`, `Compendium.${MODULE_NAME}.`);
}

/**
 * Copies client-scope settings (browser localStorage) saved under the old module ID to the new ID.
 * Runs at the start of init, before the settings are registered. Keys that already exist are left alone.
 */
export function migrateLegacyClientSettings() {
    try {
        const legacyKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(LEGACY_PREFIX)) legacyKeys.push(key);
        }
        for (const key of legacyKeys) {
            const newKey = NEW_PREFIX + key.slice(LEGACY_PREFIX.length);
            if (localStorage.getItem(newKey) !== null) continue;
            localStorage.setItem(newKey, renameLegacyReferences(localStorage.getItem(key)));
            log(`Migration: copied client setting ${key} to ${newKey}`);
        }
    } catch (e) {
        console.warn(`${MODULE_LABEL} | Could not migrate client settings from ${LEGACY_MODULE_NAME}`, e);
    }
}

/**
 * Copies world and user settings saved under the old module ID ("dnd5e-content-manager", shared with
 * jennis0's original) to the new ID. Only the active GM writes them, and only keys without a value under
 * the new ID are copied, so this runs once per world and never overwrites newer choices.
 * The old Setting documents are kept, so the original module still works if it is reinstalled.
 * @returns {Promise<boolean>} True if settings were copied and the page is reloading.
 */
export async function migrateLegacyWorldSettings() {
    if (game.modules.get(LEGACY_MODULE_NAME)?.active) {
        ui.notifications.warn(game.i18n.format("DCM.Migration.BothActive", { module: MODULE_LABEL }), { permanent: true });
    }
    if (!game.users.activeGM?.isSelf) return false;

    const storage = game.settings.storage.get("world");
    const toCreate = [];
    for (const setting of storage) {
        if (!setting.key.startsWith(LEGACY_PREFIX)) continue;
        const key = NEW_PREFIX + setting.key.slice(LEGACY_PREFIX.length);
        if (storage.getSetting(key, setting.user)) continue;
        toCreate.push({ key, value: renameLegacyReferences(setting._source.value), user: setting.user });
    }
    if (!toCreate.length) return false;

    try {
        await Setting.implementation.createDocuments(toCreate);
    } catch (e) {
        console.error(`${MODULE_LABEL} | Could not migrate settings from ${LEGACY_MODULE_NAME}`, e);
        ui.notifications.error(game.i18n.format("DCM.Migration.Failed", { module: MODULE_LABEL }), { permanent: true });
        return false;
    }
    log(`Migration: copied ${toCreate.length} settings from ${LEGACY_MODULE_NAME}`);
    ui.notifications.info(game.i18n.format("DCM.Migration.Done", { module: MODULE_LABEL }));
    foundry.utils.debouncedReload();
    return true;
}
