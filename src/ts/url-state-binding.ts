/**
 * Wires the pure URL state codec (`url-state.ts`) to the live Page-controlled UI.
 *
 * - At boot, parses `window.location.hash` and applies decoded values to the
 *   relevant Page controls before the first render.
 * - On every parameter change (via `Parameters.redrawObservers`), rebuilds the
 *   hash from the current UI state with a 250 ms debounce so dragging a slider
 *   doesn't spam the history.
 * - Updates the URL via `history.replaceState` so the back button is not affected.
 * - Injects a small "Copy link" button into the canvas controls column with a
 *   transient toast confirmation. This is a placeholder UI for Phase 3; the
 *   redesigned UI in Phase 4 will replace it with a properly styled control.
 */

import {
    DownloadSize,
    HeightmapMode,
    MainStripe,
    StereogramUrlState,
    StripesMode,
    TileMode,
    decodeState,
    encodeState,
} from "./url-state";
import { Parameters } from "./parameters";

import "./page-interface-generated";

const DEBOUNCE_MS = 250;
const TOAST_VISIBLE_MS = 1800;

// Control IDs — duplicated from parameters.ts so this module is self-contained.
// If parameters.ts ever exports its IDs, this list should be replaced with that
// import. Today they're a private const.
const CONTROL_IDS = {
    TILE_MODE_TABS: "tile-mode-tabs-id",
    TILE_PRESET_SELECT: "tile-preset-select-id",
    TILE_NOISE_RESOLUTION: "tile-noise-resolution-range-id",
    TILE_NOISE_SQUARE: "tile-noise-square-checkbox-id",
    TILE_NOISE_COLORED: "tile-noise-colored-checkbox-id",
    SHOW_UV: "show-uv-checkbox-id",
    TILE_PATTERN_OFFSET_X: "tile-pattern-offset-x-range-id",
    TILE_PATTERN_OFFSET_Y: "tile-pattern-offset-y-range-id",
    TILE_PATTERN_ZOOM: "tile-pattern-zoom-range-id",
    TILE_PATTERN_REPEAT_X: "tile-pattern-repeat-x-range-id",
    TILE_PATTERN_REPEAT_Y: "tile-pattern-repeat-y-range-id",
    TILE_CROP_MIN_U: "tile-crop-min-u-range-id",
    TILE_CROP_MAX_U: "tile-crop-max-u-range-id",
    TILE_CROP_MIN_V: "tile-crop-min-v-range-id",
    TILE_CROP_MAX_V: "tile-crop-max-v-range-id",

    HEIGHTMAP_MODE_TABS: "heightmap-mode-tabs-id",
    HEIGHTMAP_PRESET_SELECT: "heightmap-preset-select-id",
    MODEL_PRESET_SELECT: "model-preset-select-id",
    DEPTH_RANGE: "depth-range-id",
    HEIGHTMAP_INVERT_CHECKBOX: "invert-heightmap-checkbox-id",
    SHOW_HEIGHTMAP: "show-heightmap-checkbox-id",

    STRIPES_MAIN_TABS: "main-stripe-tabs-id",
    STRIPES_MAIN_CUSTOM_RANGE: "main-stripe-custom-range-id",
    STRIPES_MODE_TABS: "stripes-mode-tabs-id",
    STRIPES_WIDTH_RANGE: "stripes-width-range-id",
    STRIPES_COUNT_RANGE: "stripes-count-range-id",

    DOWNLOAD_SIZE_TABS: "download-size-tabs-id",
} as const;

/** Read every encodable parameter out of the live UI. */
export function readStateFromUi(): StereogramUrlState {
    return {
        tileMode: Parameters.tileMode as TileMode,
        heightmapMode: Parameters.heightmapMode as HeightmapMode,
        mainStripe: Parameters.mainStripe as MainStripe,
        stripesMode: Parameters.stripesMode as StripesMode,

        depth: Parameters.depth,
        stripesCount: Parameters.stripesCount,
        stripesWidth: Parameters.stripesWidth,
        mainStripeNormalized: Parameters.mainStripeNormalized,
        noiseTileResolution: Parameters.noiseTileResolution,

        noiseTileSquare: Parameters.noiseTileSquare,
        noiseTileColored: Parameters.noiseTileColored,
        invertHeightmap: Parameters.invertHeightmap,
        showHeightmap: Parameters.showHeightmap,
        showUV: Parameters.showUV,

        tilePatternOffsetX: Parameters.tilePatternOffsetX,
        tilePatternOffsetY: Parameters.tilePatternOffsetY,
        tilePatternZoom: Parameters.tilePatternZoom,
        tilePatternRepeatX: Parameters.tilePatternRepeatX,
        tilePatternRepeatY: Parameters.tilePatternRepeatY,

        tileCropMinU: Parameters.tileCropMinU,
        tileCropMaxU: Parameters.tileCropMaxU,
        tileCropMinV: Parameters.tileCropMinV,
        tileCropMaxV: Parameters.tileCropMaxV,

        downloadSize: Parameters.downloadSize as DownloadSize,
        heightmapPreset: getSelectSafe(CONTROL_IDS.HEIGHTMAP_PRESET_SELECT),
        tilePreset: getSelectSafe(CONTROL_IDS.TILE_PRESET_SELECT),
        modelId: Parameters.modelId,
    };
}

/** Apply a (possibly partial) URL state back to the live UI controls. */
export function applyStateToUi(state: StereogramUrlState): void {
    if (state.tileMode !== undefined) setTabsSafe(CONTROL_IDS.TILE_MODE_TABS, [state.tileMode]);
    if (state.heightmapMode !== undefined)
        setTabsSafe(CONTROL_IDS.HEIGHTMAP_MODE_TABS, [state.heightmapMode]);
    if (state.mainStripe !== undefined)
        setTabsSafe(CONTROL_IDS.STRIPES_MAIN_TABS, [state.mainStripe]);
    if (state.stripesMode !== undefined)
        setTabsSafe(CONTROL_IDS.STRIPES_MODE_TABS, [state.stripesMode]);

    setRangeSafe(CONTROL_IDS.DEPTH_RANGE, state.depth);
    setRangeSafe(CONTROL_IDS.STRIPES_COUNT_RANGE, state.stripesCount);
    setRangeSafe(CONTROL_IDS.STRIPES_WIDTH_RANGE, state.stripesWidth);
    setRangeSafe(
        CONTROL_IDS.STRIPES_MAIN_CUSTOM_RANGE,
        // Parameters.mainStripeNormalized is the range value / 1000; reverse here.
        state.mainStripeNormalized !== undefined ? state.mainStripeNormalized * 1000 : undefined
    );
    setRangeSafe(CONTROL_IDS.TILE_NOISE_RESOLUTION, state.noiseTileResolution);

    setCheckboxSafe(CONTROL_IDS.TILE_NOISE_SQUARE, state.noiseTileSquare);
    setCheckboxSafe(CONTROL_IDS.TILE_NOISE_COLORED, state.noiseTileColored);
    setCheckboxSafe(CONTROL_IDS.HEIGHTMAP_INVERT_CHECKBOX, state.invertHeightmap);
    setCheckboxSafe(CONTROL_IDS.SHOW_HEIGHTMAP, state.showHeightmap);
    setCheckboxSafe(CONTROL_IDS.SHOW_UV, state.showUV);

    setRangeSafe(CONTROL_IDS.TILE_PATTERN_OFFSET_X, state.tilePatternOffsetX);
    setRangeSafe(CONTROL_IDS.TILE_PATTERN_OFFSET_Y, state.tilePatternOffsetY);
    setRangeSafe(CONTROL_IDS.TILE_PATTERN_ZOOM, state.tilePatternZoom);
    setRangeSafe(CONTROL_IDS.TILE_PATTERN_REPEAT_X, state.tilePatternRepeatX);
    setRangeSafe(CONTROL_IDS.TILE_PATTERN_REPEAT_Y, state.tilePatternRepeatY);

    setRangeSafe(CONTROL_IDS.TILE_CROP_MIN_U, state.tileCropMinU);
    setRangeSafe(CONTROL_IDS.TILE_CROP_MAX_U, state.tileCropMaxU);
    setRangeSafe(CONTROL_IDS.TILE_CROP_MIN_V, state.tileCropMinV);
    setRangeSafe(CONTROL_IDS.TILE_CROP_MAX_V, state.tileCropMaxV);

    if (state.downloadSize !== undefined)
        setTabsSafe(CONTROL_IDS.DOWNLOAD_SIZE_TABS, [String(state.downloadSize)]);
    if (state.heightmapPreset !== undefined)
        setSelectSafe(CONTROL_IDS.HEIGHTMAP_PRESET_SELECT, state.heightmapPreset);
    if (state.tilePreset !== undefined)
        setSelectSafe(CONTROL_IDS.TILE_PRESET_SELECT, state.tilePreset);
    if (state.modelId !== undefined) setSelectSafe(CONTROL_IDS.MODEL_PRESET_SELECT, state.modelId);
}

/** Set up the boot-time hash read and the change-driven hash write. */
export function initUrlStateSync(): void {
    // Boot: apply hash to UI before the first render observers fire.
    if (typeof window !== "undefined" && window.location.hash) {
        try {
            applyStateToUi(decodeState(window.location.hash));
        } catch (e) {
            // Decoder is supposed to be exception-free; if a Page setter throws on
            // a missing control, swallow it so a malformed link never bricks the app.
            console.warn("Failed to apply URL state:", e);
        }
    }

    // Live: debounced write of the current state to the URL on every change.
    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleUrlUpdate = (): void => {
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            timer = null;
            try {
                const encoded = encodeState(readStateFromUi());
                const newHash = encoded ? `#${encoded}` : "";
                if (window.location.hash !== newHash) {
                    // Use replaceState so slider drags don't pollute browser history.
                    const url = window.location.pathname + window.location.search + newHash;
                    history.replaceState(null, "", url);
                }
            } catch (e) {
                console.warn("Failed to update URL state:", e);
            }
        }, DEBOUNCE_MS);
    };

    Parameters.redrawObservers.push(scheduleUrlUpdate);
}

/** Inject a Copy-link button into the canvas controls column with a small toast. */
export function installCopyLinkButton(): void {
    if (typeof document === "undefined") {
        return;
    }
    const column = document.getElementById("canvas-buttons-column");
    if (!column) {
        return;
    }
    if (document.getElementById("copy-link-button")) {
        return;
    }

    const button = document.createElement("button");
    button.id = "copy-link-button";
    button.type = "button";
    button.title = "Copy a shareable link to the current configuration";
    button.setAttribute("aria-label", "Copy shareable link");
    button.textContent = "Copy link";

    button.addEventListener("click", () => {
        const url = window.location.href;
        const copy = (): Promise<void> | void => {
            if (navigator.clipboard?.writeText) {
                return navigator.clipboard.writeText(url);
            }
            // Fallback for environments without async clipboard.
            const ta = document.createElement("textarea");
            ta.value = url;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        };
        Promise.resolve(copy())
            .then(() => showToast("Link copied"))
            .catch(() => showToast("Copy failed"));
    });

    column.appendChild(button);
}

function showToast(message: string): void {
    if (typeof document === "undefined") {
        return;
    }
    const existing = document.getElementById("url-state-toast");
    if (existing) {
        existing.remove();
    }
    const toast = document.createElement("div");
    toast.id = "url-state-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = message;
    // Position/size come from custom.css; keep a minimal fallback inline so the
    // toast is still positioned reasonably if the stylesheet fails to load.
    toast.style.cssText =
        "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);" +
        "padding:8px 16px;z-index:9999;pointer-events:none";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), TOAST_VISIBLE_MS);
}

// === Page setter wrappers that swallow errors on missing controls ============

function setRangeSafe(id: string, value: number | undefined): void {
    if (value === undefined) return;
    try {
        Page.Range.setValue(id, value);
    } catch {
        // ignore missing control
    }
}

function setCheckboxSafe(id: string, value: boolean | undefined): void {
    if (value === undefined) return;
    try {
        Page.Checkbox.setChecked(id, value);
    } catch {
        // ignore missing control
    }
}

function setTabsSafe(id: string, values: string[]): void {
    try {
        Page.Tabs.setValues(id, values);
    } catch {
        // ignore missing control
    }
}

function setSelectSafe(id: string, value: string): void {
    try {
        Page.Select.setValue(id, value);
    } catch {
        // ignore missing control
    }
}

function getSelectSafe(id: string): string | undefined {
    try {
        return Page.Select.getValue(id) ?? undefined;
    } catch {
        return undefined;
    }
}
