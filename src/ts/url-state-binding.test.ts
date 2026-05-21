/**
 * Tests for the URL-state binding layer.
 *
 * The binding layer talks to two globals: the framework's `Page` object and the
 * `Parameters` singleton. Both are substituted here:
 *
 * - `Parameters` is replaced with a plain mock object via `vi.mock`, so the real
 *   `parameters.ts` (which registers framework observers at import time) never
 *   loads.
 * - `Page` is replaced with a recording fake installed on `globalThis`. The
 *   `page-controls.ts` helpers reference the bare `Page` global, exactly as they
 *   do in the browser, so the fake is transparent to them.
 *
 * This keeps the tests in a plain Node environment — no JSDOM needed.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { controlId } from "./control-ids";
import type { StereogramUrlState } from "./url-state";

/* === Parameters mock ================================================== */

const { mockParameters } = vi.hoisted(() => ({
    mockParameters: {
        tileChangeObservers: [] as Array<(image?: unknown) => unknown>,
        heightmapChangeObservers: [] as Array<(image?: unknown) => unknown>,
        redrawObservers: [] as Array<() => unknown>,
        recomputeNoiseTileObservers: [] as Array<() => unknown>,
        imageDownloadObservers: [] as Array<() => unknown>,

        tileMode: "texture",
        heightmapMode: "still",
        mainStripe: "middle",
        stripesMode: "adaptative",
        depth: 0,
        stripesCount: 0,
        stripesWidth: 0,
        mainStripeNormalized: 0,
        noiseTileResolution: 0,
        noiseTileSquare: false,
        noiseTileColored: false,
        invertHeightmap: false,
        showHeightmap: false,
        showUV: false,
        tilePatternOffsetX: 0,
        tilePatternOffsetY: 0,
        tilePatternZoom: 0,
        tilePatternRepeatX: 0,
        tilePatternRepeatY: 0,
        tileCropMinU: 0,
        tileCropMaxU: 1,
        tileCropMinV: 0,
        tileCropMaxV: 1,
        downloadSize: 2048,
    },
}));

vi.mock("./parameters", () => ({ Parameters: mockParameters }));

// Imported after the mock is declared; vi.mock is hoisted above the import.
import {
    applyStateToUi,
    readStateFromUi,
    reassertCropAfterTileLoads,
    startUrlStateSync,
} from "./url-state-binding";

/* === Page fake ======================================================== */

interface FakePageState {
    ranges: Map<string, number>;
    checkboxes: Map<string, boolean>;
    tabs: Map<string, string[]>;
    selects: Map<string, string | null>;
}

function installFakePage(): FakePageState {
    const state: FakePageState = {
        ranges: new Map(),
        checkboxes: new Map(),
        tabs: new Map(),
        selects: new Map(),
    };
    const page = {
        Range: {
            setValue(id: string, value: number): void {
                state.ranges.set(id, value);
            },
            getValue(id: string): number {
                return state.ranges.get(id) ?? 0;
            },
        },
        Checkbox: {
            setChecked(id: string, value: boolean): void {
                state.checkboxes.set(id, value);
            },
            isChecked(id: string): boolean {
                return state.checkboxes.get(id) ?? false;
            },
        },
        Tabs: {
            setValues(id: string, values: string[]): void {
                state.tabs.set(id, values);
            },
            getValues(id: string): string[] {
                return state.tabs.get(id) ?? [];
            },
        },
        Select: {
            setValue(id: string, value: string | null): void {
                state.selects.set(id, value);
            },
            getValue(id: string): string | null {
                return state.selects.get(id) ?? null;
            },
        },
    };
    (globalThis as Record<string, unknown>).Page = page;
    return state;
}

function resetMockParameters(): void {
    mockParameters.tileChangeObservers.length = 0;
    mockParameters.heightmapChangeObservers.length = 0;
    mockParameters.redrawObservers.length = 0;
    mockParameters.recomputeNoiseTileObservers.length = 0;
    mockParameters.imageDownloadObservers.length = 0;
}

let page: FakePageState;

beforeEach(() => {
    page = installFakePage();
    resetMockParameters();
});

afterEach(() => {
    delete (globalThis as Record<string, unknown>).Page;
});

/* === readStateFromUi ================================================== */

describe("readStateFromUi", () => {
    it("reads numeric, boolean and enum parameters off the Parameters singleton", () => {
        Object.assign(mockParameters, {
            tileMode: "noise",
            heightmapMode: "moving",
            mainStripe: "custom",
            stripesMode: "fixed",
            depth: 0.42,
            stripesCount: 14,
            stripesWidth: 0.3,
            mainStripeNormalized: 0.75,
            noiseTileResolution: 256,
            noiseTileSquare: true,
            noiseTileColored: true,
            invertHeightmap: true,
            showHeightmap: true,
            showUV: true,
            downloadSize: 4096,
        });

        const state = readStateFromUi();

        expect(state.tileMode).toBe("noise");
        expect(state.heightmapMode).toBe("moving");
        expect(state.mainStripe).toBe("custom");
        expect(state.stripesMode).toBe("fixed");
        expect(state.depth).toBe(0.42);
        expect(state.stripesCount).toBe(14);
        expect(state.mainStripeNormalized).toBe(0.75);
        expect(state.noiseTileResolution).toBe(256);
        expect(state.noiseTileSquare).toBe(true);
        expect(state.invertHeightmap).toBe(true);
        expect(state.downloadSize).toBe(4096);
    });

    it("reads all three preset selects through the Page Select API", () => {
        page.selects.set(controlId.HEIGHTMAP_PRESET_SELECT, "planet.png");
        page.selects.set(controlId.TILE_PRESET_SELECT, "clouds.jpg");
        page.selects.set(controlId.MODEL_PRESET_SELECT, "ship.obj");

        const state = readStateFromUi();

        expect(state.heightmapPreset).toBe("planet.png");
        expect(state.tilePreset).toBe("clouds.jpg");
        expect(state.modelId).toBe("ship.obj");
    });

    it("reports an unset select as undefined", () => {
        const state = readStateFromUi();
        expect(state.heightmapPreset).toBeUndefined();
        expect(state.tilePreset).toBeUndefined();
        expect(state.modelId).toBeUndefined();
    });
});

/* === applyStateToUi =================================================== */

describe("applyStateToUi", () => {
    it("applies numeric ranges to their sliders", () => {
        applyStateToUi({ depth: 0.6, stripesCount: 11, stripesWidth: 0.4 });
        expect(page.ranges.get(controlId.DEPTH_RANGE)).toBe(0.6);
        expect(page.ranges.get(controlId.STRIPES_COUNT_RANGE)).toBe(11);
        expect(page.ranges.get(controlId.STRIPES_WIDTH_RANGE)).toBe(0.4);
    });

    it("applies booleans to their checkboxes", () => {
        applyStateToUi({ showHeightmap: true, showUV: false, invertHeightmap: true });
        expect(page.checkboxes.get(controlId.SHOW_HEIGHTMAP)).toBe(true);
        expect(page.checkboxes.get(controlId.SHOW_UV)).toBe(false);
        expect(page.checkboxes.get(controlId.HEIGHTMAP_INVERT_CHECKBOX)).toBe(true);
    });

    it("applies enum values to their tab groups", () => {
        applyStateToUi({ tileMode: "noise", heightmapMode: "moving", stripesMode: "fixed" });
        expect(page.tabs.get(controlId.TILE_MODE_TABS)).toEqual(["noise"]);
        expect(page.tabs.get(controlId.HEIGHTMAP_MODE_TABS)).toEqual(["moving"]);
        expect(page.tabs.get(controlId.STRIPES_MODE_TABS)).toEqual(["fixed"]);
    });

    it("converts mainStripeNormalized (0..1) to the slider's 0..1000 scale", () => {
        applyStateToUi({ mainStripeNormalized: 0.5 });
        expect(page.ranges.get(controlId.STRIPES_MAIN_CUSTOM_RANGE)).toBe(500);
    });

    it("applies downloadSize as a stringified tab value", () => {
        applyStateToUi({ downloadSize: 4096 });
        expect(page.tabs.get(controlId.DOWNLOAD_SIZE_TABS)).toEqual(["4096"]);
    });

    it("applies the three preset selects", () => {
        applyStateToUi({
            heightmapPreset: "planet.png",
            tilePreset: "clouds.jpg",
            modelId: "ship.obj",
        });
        expect(page.selects.get(controlId.HEIGHTMAP_PRESET_SELECT)).toBe("planet.png");
        expect(page.selects.get(controlId.TILE_PRESET_SELECT)).toBe("clouds.jpg");
        expect(page.selects.get(controlId.MODEL_PRESET_SELECT)).toBe("ship.obj");
    });

    it("applies all four tile-crop values", () => {
        applyStateToUi({
            tileCropMinU: 0.1,
            tileCropMaxU: 0.9,
            tileCropMinV: 0.2,
            tileCropMaxV: 0.8,
        });
        expect(page.ranges.get(controlId.TILE_CROP_MIN_U)).toBe(0.1);
        expect(page.ranges.get(controlId.TILE_CROP_MAX_U)).toBe(0.9);
        expect(page.ranges.get(controlId.TILE_CROP_MIN_V)).toBe(0.2);
        expect(page.ranges.get(controlId.TILE_CROP_MAX_V)).toBe(0.8);
    });

    it("skips fields absent from a partial state", () => {
        applyStateToUi({ depth: 0.5 });
        expect(page.ranges.get(controlId.DEPTH_RANGE)).toBe(0.5);
        expect(page.ranges.has(controlId.STRIPES_COUNT_RANGE)).toBe(false);
        expect(page.tabs.has(controlId.TILE_MODE_TABS)).toBe(false);
        expect(page.selects.has(controlId.TILE_PRESET_SELECT)).toBe(false);
    });
});

/* === reassertCropAfterTileLoads ======================================= */

describe("reassertCropAfterTileLoads", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const CROP_STATE: StereogramUrlState = {
        tileCropMinU: 0.2,
        tileCropMaxU: 0.8,
        tileCropMinV: 0.3,
        tileCropMaxV: 0.7,
    };

    /** Simulate parameters.ts: fire tile-change observers, then resetTileCrop. */
    function simulateTileLoad(): void {
        for (const observer of mockParameters.tileChangeObservers) {
            observer();
        }
        // resetTileCrop() runs synchronously right after the observer loop.
        page.ranges.set(controlId.TILE_CROP_MIN_U, 0);
        page.ranges.set(controlId.TILE_CROP_MAX_U, 1);
        page.ranges.set(controlId.TILE_CROP_MIN_V, 0);
        page.ranges.set(controlId.TILE_CROP_MAX_V, 1);
    }

    function currentCrop(): [number, number, number, number] {
        return [
            page.ranges.get(controlId.TILE_CROP_MIN_U) ?? NaN,
            page.ranges.get(controlId.TILE_CROP_MAX_U) ?? NaN,
            page.ranges.get(controlId.TILE_CROP_MIN_V) ?? NaN,
            page.ranges.get(controlId.TILE_CROP_MAX_V) ?? NaN,
        ];
    }

    it("registers a tile-change observer when the state carries crop values", () => {
        reassertCropAfterTileLoads(CROP_STATE);
        expect(mockParameters.tileChangeObservers).toHaveLength(1);
    });

    it("registers nothing when the state carries no crop values", () => {
        reassertCropAfterTileLoads({ depth: 0.5, tileMode: "noise" });
        expect(mockParameters.tileChangeObservers).toHaveLength(0);
    });

    it("re-applies the URL crop values after a tile load, overriding resetTileCrop", () => {
        reassertCropAfterTileLoads(CROP_STATE);

        simulateTileLoad();
        // Immediately after the load, resetTileCrop has won.
        expect(currentCrop()).toEqual([0, 1, 0, 1]);

        // The deferred re-assert runs on the next macrotask.
        vi.runAllTimers();
        expect(currentCrop()).toEqual([0.2, 0.8, 0.3, 0.7]);
    });

    it("re-applies on every tile load within the settling window", () => {
        reassertCropAfterTileLoads(CROP_STATE);

        simulateTileLoad();
        vi.advanceTimersByTime(2000);
        vi.runAllTimers();
        expect(currentCrop()).toEqual([0.2, 0.8, 0.3, 0.7]);

        // A second load, still inside the 5s window.
        simulateTileLoad();
        expect(currentCrop()).toEqual([0, 1, 0, 1]);
        vi.runAllTimers();
        expect(currentCrop()).toEqual([0.2, 0.8, 0.3, 0.7]);
    });

    it("stops re-applying once the settling window has elapsed", () => {
        reassertCropAfterTileLoads(CROP_STATE);

        vi.advanceTimersByTime(6000); // past the 5s window
        simulateTileLoad();
        vi.runAllTimers();

        // resetTileCrop's 0/1 values are left untouched.
        expect(currentCrop()).toEqual([0, 1, 0, 1]);
    });

    it("removes its observer after the window has elapsed", () => {
        reassertCropAfterTileLoads(CROP_STATE);
        expect(mockParameters.tileChangeObservers).toHaveLength(1);

        vi.advanceTimersByTime(6000);
        simulateTileLoad();
        vi.runAllTimers();

        expect(mockParameters.tileChangeObservers).toHaveLength(0);
    });
});

/* === startUrlStateSync ================================================ */

describe("startUrlStateSync", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        (globalThis as Record<string, unknown>).window = {
            location: { hash: "", pathname: "/app/", search: "" },
        };
        (globalThis as Record<string, unknown>).history = { replaceState: vi.fn() };
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (globalThis as Record<string, unknown>).window;
        delete (globalThis as Record<string, unknown>).history;
    });

    function fakeHistory(): { replaceState: ReturnType<typeof vi.fn> } {
        return (globalThis as Record<string, unknown>).history as {
            replaceState: ReturnType<typeof vi.fn>;
        };
    }

    it("registers a redraw observer", () => {
        startUrlStateSync();
        expect(mockParameters.redrawObservers).toHaveLength(1);
    });

    it("writes the encoded state to history.replaceState after the debounce", () => {
        startUrlStateSync();
        mockParameters.depth = 0.5;

        mockParameters.redrawObservers[0]();
        expect(fakeHistory().replaceState).not.toHaveBeenCalled(); // still debouncing

        vi.advanceTimersByTime(250);

        expect(fakeHistory().replaceState).toHaveBeenCalledTimes(1);
        const url = fakeHistory().replaceState.mock.calls[0][2] as string;
        expect(url.startsWith("/app/#")).toBe(true);
        expect(url).toContain("d=0.5");
    });

    it("debounces a burst of changes into a single history write", () => {
        startUrlStateSync();
        const notify = mockParameters.redrawObservers[0];

        notify();
        vi.advanceTimersByTime(100);
        notify();
        vi.advanceTimersByTime(100);
        notify();
        vi.advanceTimersByTime(250);

        expect(fakeHistory().replaceState).toHaveBeenCalledTimes(1);
    });
});
