import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupFoundryMocks } from "../mocks/foundry.mjs";
import { getSetting, setSetting } from "../../scripts/settings.mjs";

describe("getSetting", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("reads a setting from the store", () => {
        settingsStore.set("myKey", [1, 2, 3]);
        expect(getSetting("myKey")).toEqual([1, 2, 3]);
    });

    it("returns undefined for missing settings", () => {
        expect(getSetting("missing")).toBeUndefined();
    });
});

describe("setSetting", () => {
    let settingsStore;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
    });

    it("writes a setting to the store", () => {
        setSetting("myKey", "hello");
        expect(settingsStore.get("myKey")).toBe("hello");
    });

    it("does nothing for a player without SETTINGS_MODIFY", () => {
        game.user.role = 1;
        setSetting("myKey", "should not write");
        expect(settingsStore.get("myKey")).toBeUndefined();
    });

    it("writes for a player with SETTINGS_MODIFY", () => {
        game.user.role = 1;
        game.user.permissions.SETTINGS_MODIFY = true;
        setSetting("myKey", "written");
        expect(settingsStore.get("myKey")).toBe("written");
    });

    it("writes for an Assistant GM with SETTINGS_MODIFY", () => {
        game.user.role = 3;
        game.user.permissions.SETTINGS_MODIFY = true;
        setSetting("myKey", "written");
        expect(settingsStore.get("myKey")).toBe("written");
    });

    it("does nothing for an Assistant GM without SETTINGS_MODIFY", () => {
        game.user.role = 3;
        setSetting("myKey", "nope");
        expect(settingsStore.get("myKey")).toBeUndefined();
    });
});

describe("setSetting with an async server round trip", () => {
    let settingsStore;
    let resolvers;

    beforeEach(() => {
        ({ settingsStore } = setupFoundryMocks());
        resolvers = [];
        // Store only updates once the "server" confirms, like a real world setting
        game.settings.set = (_module, path, value) => new Promise(resolve => {
            resolvers.push(() => { settingsStore.set(path, value); resolve(value); });
        });
    });

    const flush = async () => {
        while (resolvers.length) {
            resolvers.shift()();
            await new Promise(r => setTimeout(r, 0));
        }
    };

    // Pending writes are module state: settle them so they don't leak into the next test
    afterEach(flush);

    it("reads the pending value before the server confirms", () => {
        settingsStore.set("myKey", ["a"]);
        setSetting("myKey", ["a", "b"]);
        expect(settingsStore.get("myKey")).toEqual(["a"]);
        expect(getSetting("myKey")).toEqual(["a", "b"]);
    });

    it("keeps back-to-back read-modify-write updates", async () => {
        settingsStore.set("myKey", ["a"]);
        setSetting("myKey", [...getSetting("myKey"), "b"]);
        setSetting("myKey", [...getSetting("myKey"), "c"]);
        // Second write waits for the first
        expect(resolvers.length).toBe(1);
        await flush();
        expect(settingsStore.get("myKey")).toEqual(["a", "b", "c"]);
        expect(getSetting("myKey")).toEqual(["a", "b", "c"]);
    });

    it("merges writes queued behind an in-flight write into one", async () => {
        settingsStore.set("myKey", ["a"]);
        let calls = 0;
        const realSet = game.settings.set;
        game.settings.set = (...args) => { calls++; return realSet(...args); };

        setSetting("myKey", [...getSetting("myKey"), "b"]);
        setSetting("myKey", [...getSetting("myKey"), "c"]);
        setSetting("myKey", [...getSetting("myKey"), "d"]);
        await flush();

        expect(calls).toBe(2);
        expect(settingsStore.get("myKey")).toEqual(["a", "b", "c", "d"]);
    });

    it("returns a copy of the pending value", () => {
        setSetting("myKey", ["a"]);
        getSetting("myKey").push("x");
        expect(getSetting("myKey")).toEqual(["a"]);
    });

    it("falls back to the stored value when a write fails", async () => {
        settingsStore.set("myKey", "old");
        game.settings.set = () => Promise.reject(new Error("denied"));
        const origError = console.error;
        console.error = () => {};
        await setSetting("myKey", "new");
        console.error = origError;
        expect(getSetting("myKey")).toBe("old");
    });
});
