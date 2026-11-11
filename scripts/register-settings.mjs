import { ContentSelector } from "./apps/content-selector.mjs";
import { SourceSelector } from "./apps/source-selector.mjs";
import { ClearSettings } from "./apps/clear.mjs";
import { MODULE_NAME, SETTINGS } from "./settings.mjs"
import { log } from "./lib.mjs";
import { EnableMenu } from "./apps/enable-menu.mjs";
import { ExportDialog, ImportDialog } from "./export.mjs";
import { PlayerHandbookMenu } from "./apps/player-handbook.mjs";
import { getOverrideCompendiumOptions } from "./presentation/override-compendium.mjs";


export function initVersionSetting() {
    game.settings.register(MODULE_NAME, SETTINGS.lastLoadedVersion, 
        {
            scope: "world",
            config: false,
            restricted: true,
            type: String,
            default: game.modules.get(MODULE_NAME).version
        }
    )
}

export function initSettings() {

    console.groupCollapsed("DnD Content Manager | Registering Settings")

    SETTINGS.itemtypes.forEach(i => {
        const item = SETTINGS[i];
        game.settings.register(MODULE_NAME, item.sources,
            {
                config: false,
                type: Array,
                scope: "world",
                restricted: true,
                default: []
            }
        ),
        log(`Registered setting ${item.sources}`)
        game.settings.register(MODULE_NAME, item.content,
            {
                config: false,
                type: Array,
                scope: "world",
                restricted: true,
                default: []
            }
        )
        log(`Registered setting ${item.content}`)
        game.settings.register(MODULE_NAME, item.enabled, 
            {
                config: false,
                type: Boolean,
                scope: "world",
                restricted: true,
                default: false
            }
        )
        log(`Registered setting ${item.enabled}`)
        game.settings.register(MODULE_NAME, item.previousContentSelections,
            {
                config: false,
                type: Object,
                scope: "world",
                restricted: true,
                default: {}
            
            }
        )
        log(`Registered setting ${item.previousContentSelections}`)
    })

    game.settings.registerMenu(MODULE_NAME, "sourceMenu", 
        {
            name: "DCM.Settings.SourceMenu.Name",
            label: "DCM.Settings.SourceMenu.Label",
            hint: "DCM.Settings.SourceMenu.Hint",
            scope: "world",
            config: true,
            type: SourceSelector,
            restricted: true,
            icon: "fas fa-book-open-reader"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "contentMenu",
        {
            name: "DCM.Settings.ContentMenu.Name",
            label: "DCM.Settings.ContentMenu.Label",
            hint: "DCM.Settings.ContentMenu.Hint",
            scope: "world",
            config: true,
            type: ContentSelector,
            restricted: true,
            icon: "fas fa-ballot-check"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "handbookMenu",
        {
            name: "DCM.Settings.HandbookMenu.Name",
            label: "DCM.Settings.HandbookMenu.Label",
            hint: "DCM.Settings.HandbookMenu.Hint",
            scope: "world",
            config: true,
            restricted: true,
            type: PlayerHandbookMenu,
            icon: "fas fa-book-sparkles"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "clear", 
        {
            name: "DCM.Settings.ClearMenu.Name",
            hint: "DCM.Settings.ClearMenu.Hint",
            label: "DCM.Settings.ClearMenu.Label",
            scope: "world",
            config: true,
            type: ClearSettings,
            restricted: true,
            icon: "fas fa-trash"
        }
    )

    game.settings.registerMenu(MODULE_NAME, "exportConfig", {
        name: "DCM.Settings.ExportMenu.Name",
        label: "DCM.Settings.ExportMenu.Label",
        hint: "DCM.Settings.ExportMenu.Hint",
        scope: "world",
        config: true,
        type: ExportDialog,
        restricted: true,
        icon: "fas fa-file-export"
    })

    game.settings.registerMenu(MODULE_NAME, 'importConfig', {
        name: "DCM.Settings.ImportMenu.Name",
        label: "DCM.Settings.ImportMenu.Label",
        hint: "DCM.Settings.ImportMenu.Hint",
        config: true,
        scope: "world",
        type: ImportDialog,
        restricted: true,
        icon: "fas fa-file-import"
      });

      game.settings.register(MODULE_NAME, SETTINGS.injectCompendiumButtons, 
        {
            name: "DCM.Settings.InjectCompendiumButtons.Name",
            hint: "DCM.Settings.InjectCompendiumButtons.Hint",
            config: true,
            scope: "player",
            type: Boolean,
            default: true,
            restricted: true,
            requiresReload: true
        }
      );
      
      
      game.settings.register(MODULE_NAME, SETTINGS.injectItemButton, 
        {
            name: "DCM.Settings.InjectItemButton.Name",
            hint: "DCM.Settings.InjectItemButton.Hint",
            config: true,
            scope: "player",
            type: Boolean,
            default: true,
            restricted: true,
            requiresReload: true
        }
      );


      if (game.modules.get("quick-insert")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterQuickInsert, 
            {
                name: "DCM.Settings.FilterQuickInsert.Name",
                hint: "DCM.Settings.FilterQuickInsert.Hint",
                scope: "world",
                config: true,
                type: Boolean,
                default: false,
                restricted: true,
                requiresReload: true
            }
        )
    }

    if (game.modules.get("spotlight-omnisearch")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterSpotlight, 
            {
                name: "DCM.Settings.FilterSpotlight.Name",
                hint: "DCM.Settings.FilterSpotlight.Hint",
                scope: "world",
                config: true,
                type: Boolean,
                default: false,
                restricted: true,
                requiresReload: true
            }
        )
    }

    if (game.modules.get("hero-mancer")) {
        game.settings.register(MODULE_NAME, SETTINGS.filterHeromancer, 
            {
                name: "DCM.Settings.FilterHeromancer.Name",
                hint: "DCM.Settings.FilterHeromancer.Hint",
                scope: "world",
                config: true,
                type: Boolean,
                default: false,
                restricted: true,
                requiresReload: true
            }
        )
    }

    game.settings.register(MODULE_NAME, SETTINGS.playerHandbookOptions, 
        {
            name: "DCM.Settings.PlayerHandbookOptions.Name",
            config: false,
            default: {
                class: true,
                races: true,
                backgrounds: true,
                feats: true,
                spells: true,
                existingPages: true,
                overridePages: true,
                folderTitle: "",
                styleOption: null
            },
            restricted: true,
            type: Object
        }
    ) 

    console.groupEnd()
}

export function registerCompendiumOverrideSetting() {
    //Handles settings which are only registered once Foundry is ready

    game.settings.register(MODULE_NAME, SETTINGS.overrideCompendium,
        {
            name: "DCM.Settings.OverrideCompendium.Name",
            hint: "DCM.Settings.OverrideCompendium.Hint",
            config: true,
            scope: "world",
            default: "none",
            type: String, 
            restricted: true,
            requiresReload: false,
            choices: getOverrideCompendiumOptions()
        }
    )
}