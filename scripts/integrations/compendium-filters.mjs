import { log, warn } from "../lib.mjs";
import { MODULE_NAME } from "../settings.mjs";

/** Per-window GM View state, kept on the CompendiumBrowser instance. Never saved: a new window starts filtered. */
const GM_VIEW = Symbol("dcmGmView");

/**
 * True only while a GM View browser prepares its results. CompendiumBrowser#_prepareResultsContext calls
 * CompendiumBrowser.fetch synchronously (before any await), so the flag covers exactly that one fetch and
 * never other callers (players' browsers, advancement lookups, other modules).
 */
let showAllContent = false;

/**
 * Wraps a method with libWrapper when it is active, so other modules wrapping the same method (e.g. Nik's DnD5e
 * Tweaks' Compendium Browser columns) chain cleanly without libWrapper's conflict warning. Without libWrapper the
 * method is replaced by a wrapper that calls the previous one.
 * @param {object} owner      Object holding the method.
 * @param {string} path       Path of the method from globalThis, for libWrapper.
 * @param {string} name       Method name on the owner.
 * @param {Function} wrapper  `function(wrapped, ...args)`, called with the original `this`.
 */
function wrapMethod(owner, path, name, wrapper) {
    if (globalThis.libWrapper?.register) {
        libWrapper.register(MODULE_NAME, path, wrapper, "WRAPPER");
        return;
    }
    const original = owner[name];
    owner[name] = function(...args) {
        return wrapper.call(this, (...a) => original.apply(this, a), ...args);
    };
}

function patchedFetch(wrapped, ...args) {
    const results = wrapped(...args);
    if (showAllContent) return results;
    return results
        .then(result => result.filter(r => {
            try {
                return CONFIG.dndContentManager.index.compendiumBrowserItemInIndex(r)
            } catch (e) {
                warn(`Failed to filter item ${r?.uuid}: ${e.message}`)
                return true
            }
        }))
}

/**
 * Wraps CompendiumBrowser#_prepareResultsContext so a browser in GM View fetches unfiltered results.
 * If dnd5e ever awaits before fetching, the flag is already reset and the browser simply stays filtered.
 */
function patchResultsContext() {
    const proto = dnd5e.applications.CompendiumBrowser.prototype;
    if (typeof proto._prepareResultsContext !== "function") {
        warn("CompendiumBrowser#_prepareResultsContext not found, GM View is unavailable");
        return false;
    }
    wrapMethod(proto, "dnd5e.applications.CompendiumBrowser.prototype._prepareResultsContext", "_prepareResultsContext",
        function(wrapped, context, options) {
            if (!this[GM_VIEW]) return wrapped(context, options);
            showAllContent = true;
            try {
                return wrapped(context, options);
            } finally {
                showAllContent = false;
            }
        });
    return true;
}

/**
 * Updates the GM View button, the window class and the note above the results to match the browser's state.
 * The note uses dnd5e's own `.note.info` style (with its "i" marker).
 * @param {CompendiumBrowser} app
 */
function syncGmViewUI(app) {
    const element = app.element;
    if (!element) return;
    const active = !!app[GM_VIEW];
    element.classList.toggle("dcm-gm-view-active", active);

    const button = element.querySelector(".window-header .dcm-gm-view-toggle");
    if (button) {
        button.classList.toggle("fa-eye", active);
        button.classList.toggle("fa-eye-slash", !active);
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
        const label = game.i18n.localize(active ? "DCM.GMView.Disable" : "DCM.GMView.Enable");
        button.dataset.tooltip = label;
        button.setAttribute("aria-label", label);
    }

    const results = element.querySelector('[data-application-part="results"]');
    if (!results) return;
    let note = results.querySelector(".dcm-gm-view-note");
    if (active && !note) {
        note = document.createElement("p");
        note.className = "note info dcm-gm-view-note";
        note.textContent = game.i18n.localize("DCM.GMView.Note");
        // The part element is the template's root section, so the note becomes a direct child like dnd5e's notes
        results.prepend(note);
    } else if (!active && note) {
        note.remove();
    }
}

/**
 * Adds the GM View toggle to a CompendiumBrowser's title bar (GMs only, once per window).
 * @param {CompendiumBrowser} app
 */
function addGmViewButton(app) {
    const header = app.element?.querySelector(".window-header");
    if (!header || header.querySelector(".dcm-gm-view-toggle")) return;

    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("header-control", "icon", "fa-solid", "fa-eye-slash", "dcm-gm-view-toggle");
    button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        app[GM_VIEW] = !app[GM_VIEW];
        syncGmViewUI(app);
        app.render({ parts: ["results"] });
    });

    //Insert to the left of the first visible header control
    const firstControl = header.querySelector(":scope > .header-control:not(.hidden)");
    header.insertBefore(button, firstControl);
}

export function patchCompendiumBrowser() {
    // Hijack the CompendiumBrowsers fetch function to restrict to only the
    // items we care about.

    const browser = dnd5e.applications.CompendiumBrowser;
    wrapMethod(browser, "dnd5e.applications.CompendiumBrowser.fetch", "fetch", patchedFetch);
    const gmViewAvailable = patchResultsContext();

    Hooks.on("renderCompendiumBrowser", (app) => {
        if (CONFIG.dndContentManager.forceRebuild) {
            CONFIG.dndContentManager.index.rebuild();
        }
        if (gmViewAvailable && game.user.isGM) {
            addGmViewButton(app);
            syncGmViewUI(app);
        }
    })

    log("Patched filters into CompendiumBrowser");
}
