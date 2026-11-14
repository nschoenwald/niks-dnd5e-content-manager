### 14.3.2
Bug Fixes:
- No more libWrapper warning about a conflict with Nik's DnD5e Tweaks when both modules are active. The Content Manager now hooks into the Compendium Browser through libWrapper (when installed), so both modules work together cleanly

### 14.3.1
Bug Fixes:
- GM View no longer draws a line through the Compendium Browser's title, and the "i" icon of the GM View note is no longer cut off

### 14.3.0
New Features:
- GM View for the Compendium Browser: GMs get an eye button in the browser's title bar that shows all content, unfiltered, in that window. A note above the results shows when it's on. Every newly opened browser starts in the normal player view, and players don't see the button
- German translation. All texts of the module can now be translated

Bug Fixes:
- The warning about a subclass whose class is filtered out now names the right class (it always said "Bard")
- Recreating the player option journals in another language replaces the old journals instead of adding a second set

### 14.2.0
Other Changes:
- This fork is now its own module, "Nik's DnD Content Manager". Before, it shared its ID with jennis0's original, so Foundry's Update button kept replacing it with the original's version 1.6.0
- To switch: install it with the Manifest URL `https://github.com/nschoenwald/niks-dnd5e-content-manager/releases/latest/download/module.json`, disable "DnD Content Manager" in your world, enable "Nik's DnD Content Manager" and log in as GM. Your settings are copied over automatically and the page reloads once. Then uninstall the original module

### 14.1.3
Other Changes:
- Verified with Foundry VTT 14.370 and D&D 5e 6.1.0

### 14.1.2
Bug Fixes:
- The item sheet toggle is back: open an item, click the ⋮ button in its title bar and choose "Enable Item in DCM" or "Disable Item in DCM". It had stopped appearing with recent D&D 5e versions

### 14.1.1
Bug Fixes:
- Fixed a server error ("Cannot use 'in' operator to search for 'baseItem'…") that could break opening compendiums, the trait and proficiency settings on character sheets and other modules' compendium lookups while DnD Content Manager was active

Other Changes:
- Updates now come from Nik's fork. To switch an existing install, reinstall the module with the Manifest URL `https://github.com/nschoenwald/niks-dnd5e-content-manager/releases/latest/download/module.json`. Your settings are kept

### 14.1.0
Improvements:
- The Player Content menu is much faster with large compendiums (thousands of monsters, items or spells):
  - Searching filters the list instantly instead of rebuilding it on every keystroke
  - Changing the grouping or the Unique/Duplicates filters no longer reloads every compendium
  - Item images load only when they scroll into view, and rows outside the visible area cost almost nothing to display
  - Switching between tabs no longer makes Foundry reload compendium indexes from the server
  - Spell list journals are loaded once per opened menu instead of on every change
- Clicking many checkboxes quickly sends far fewer updates to the server (and to other connected players)

Bug Fixes:
- Grouping spells by "Spell Level" no longer breaks the menu; spell level groups are now sorted Cantrip, 1st, 2nd and so on
- Changing the grouping or filters no longer empties the search box while the search keeps being applied

### 14.0.0
Bug Fixes:
- Users with the "Modify Configuration Settings" permission (e.g. Assistant GMs or trusted players) can now save changes to compendium sources, allowed content, filter toggles, player journal options and imported settings. Before, their changes appeared in the menus but were never saved.
- These users now also get the Compendium sidebar buttons and the item sheet toggle
- Clicking several checkboxes quickly in the source or content menus no longer loses some of the changes
- A notification is shown if a setting can't be saved

Other Changes:
- The version number now follows the Foundry generation (14.x)

### v1.6.0
New Features:
- Compatibility with Foundry VTT v14 (verified on 14.360)

Bug Fixes:
- Content index is now rebuilt when a compendium source is added or removed, so newly added content appears immediately
- Fixed an error during world setup caused by leftover development code

Other Changes:
- Filtering is now disabled by default for each item type in new worlds. Existing worlds keep their current settings.

### v1.5.5
Bug Fixes:
- Fixed integration with HeroMancer
- Fixed an issue where removing a compendium source could accidentally remove content from other sources with similar names (e.g., removing "Classes" could also remove items from "Subclasses")
- Fixed an issue where re-adding a previously removed compendium source could restore items you had manually unchecked from other sources
- Fixed filtering not updating after toggling type filtering on/off in the Enable Menu or Source Selector
- Fixed filtering not updating after importing settings from a file
- Improved error handling across all integrations (Compendium Browser, Spotlight, Quick Insert, HeroMancer) — a single problematic item can no longer break filtering for an entire category

Improvements:
- A warning notification is now shown when filtering is enabled for a type but no content is selected, making it clearer why filtering appears inactive
- The Compendium Browser no longer unnecessarily rebuilds the filter index every time you switch tabs — it only rebuilds when settings have actually changed
- Confirmed compatibility with D&D 5e v5.3

### v1.5.4
New Features
 - Warn the user when a subclass for an unselected class is included in the Player Handbook generation

Bug Fixes:
 - Player options can now be generated without making the source compendiums editable
 - Content from disabled, but previously enabled, sources will no longer appear in the player handbook

### v1.5.3
Bug Fixes: 
 - Don't filter non-feat features in advanced Compendium browser.

### v1.5.2
Bug Fixes: 
 - Fix crash on spell list tab when subclass lists are present.

### v1.5.1
Version bump for v13.347 and D&D 5.1

### v1.5.0
New Feature: Support for Foundry v13
**This release and all future releases will support v13 and D&D5e > 4.3. To use DnD Content Manager with v12/D&D v3.3.1 use release v1.4.5 instead**

### 1.4.5
New Features:
- Integration with [Hero Mancer](https://foundryvtt.com/packages/hero-mancer) to control what options are available to players in the character creation dialog. Turn this on from the settings menu if desired.
- Customise the pages generated Player Handbook for Classes, Subclasses, Species, and Backgrounds by adding your custom pages to the override journals in the DCM Journals Compendium
- Added in-game manual in the DCM Journals compendium

Bug Fixes:
- Fixed list overflow issue in the Source Selector when the final compendium in the list was only one entry long

### 1.4.4
New Features
- Addition of monster filtering

Bug Fixes
- Fixes crash when a filtered compendium is removed from the world
- Fixes crash in handbook generation when a filtered item is missing

### 1.4.3
- General tweaks to presentation to make a better experience
  
Bug Fixes:
- Resolved CSS issue with content selector sidebar spacing in Firefox
- Add feat types back in for 5e 2024

### 1.4.2
New Features:
- Improvement of how duplicate filtering works and addition of an inverse filter to find unique
- Button to collapse/expand tables of items for easier working with large sets of items
  
Bug Fixes
- "Make Spells journal" option in Create Player Handbook now actually creates a journal
- Fixed QuickInsert integration bug which caused it not to function until changes we made
- Feat handbook no longer contains non-feat features if when Feats are not being managed by DCM

### 1.4.1
- Fix for Quick Insert integration broken by latest QI update
- Retain settings when generating player handbooks
- Hide/Unhide items directly from the 5e Item Sheet
- Fix for labels of custom feat types

### 1.4.0
- Introduce Player Option Journal creation - on-demand generation of journals containing approved player options
- Fix items still showing after a source has been removed
- Fix checkbox and slider behaviour in D&D v3.3.1

### 1.3.1
- Add Spotlight Omnisearch integration
- Fixed bug where using the toggle all button in source selector would cause source from other modules to become unselected

### v1.3.0
- Add QuickInsert integration
- Visible lock on module-loaded spelllists which can't be disabled
- Import and export of module settings
- Introduced "Find Duplicate" view mode which filters down to items with identical names

### v1.2.0
- Fix breaking bug in migrations script
- Add Item and Spell filtering
- Add button to open content selector from the compendium sidebar
- Add button to open compendium config from the content selector
- Add button to enable/disable filtering of a particular item type from the compendium selector (currently buggy in D&D5e v3.3.1)

### v1.1.2
- Fix breaking bug in v1.1.1 that caused loss of config
- Improve logging and fix errors when run by non GM users

### v1.1.1
- Fix bug in persisting settings to non-GM users
- Add text search to compendium source setup

### v1.1.0
- Add basic text filter to content browser

### v1.0.0
- First public release
- Implements filtering for Classes, subclasses, feats, backgrounds, species/races, and (to a limited degree) spell lists
- Pimarily v4-focused but compatible with v3 with slightly reduced visual prettyness
