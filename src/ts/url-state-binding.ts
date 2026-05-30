/**
 * Wires the pure URL state codec (`url-state.ts`) to the live Page-controlled UI.
 *
 * - At boot, parses `window.location.hash` and applies decoded values to the
 *   relevant Page controls before the first render.
 * - On every parameter change (via `Parameters.redrawObservers`), rebuilds the
 *   hash from the current UI state with a debounce so dragging a slider doesn't
 *   spam the history.
 * - Updates the URL via `history.replaceState` so the back button is unaffected.
 *
 * UI widgets (the Copy-link button, the toast) live in `ui/`. This module is
 * only concerned with the state <-> URL mapping.
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
import { controlId, MAIN_STRIPE_RANGE_SCALE } from "./control-ids";
import {
    getSelectSafe,
    setCheckboxSafe,
    setRangeSafe,
    setSelectSafe,
    setTabsSafe,
} from "./page-controls";

const DEBOUNCE_MS = 250;

/**
 * Window after boot during which crop values from the URL are re-asserted on
 * every tile-texture load. See `reassertCropAfterTileLoads` for the rationale.
 */
const CROP_REASSERT_WINDOW_MS = 5000;

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
        // All three presets are read the same way: straight off their <select>.
        heightmapPreset: getSelectSafe(controlId.HEIGHTMAP_PRESET_SELECT),
        tilePreset: getSelectSafe(controlId.TILE_PRESET_SELECT),
        modelId: getSelectSafe(controlId.MODEL_PRESET_SELECT),
    };
}

/** The four tile-crop slider IDs paired with their value in a given state. */
function cropTargets(state: StereogramUrlState): Array<[string, number | undefined]> {
    return [
        [controlId.TILE_CROP_MIN_U, state.tileCropMinU],
        [controlId.TILE_CROP_MAX_U, state.tileCropMaxU],
        [controlId.TILE_CROP_MIN_V, state.tileCropMinV],
        [controlId.TILE_CROP_MAX_V, state.tileCropMaxV],
    ];
}

/** Apply a (possibly partial) URL state back to the live UI controls. */
export function applyStateToUi(state: StereogramUrlState): void {
    if (state.tileMode !== undefined) {
        setTabsSafe(controlId.TILE_MODE_TABS, [state.tileMode]);
    }
    if (state.heightmapMode !== undefined) {
        setTabsSafe(controlId.HEIGHTMAP_MODE_TABS, [state.heightmapMode]);
    }
    if (state.mainStripe !== undefined) {
        setTabsSafe(controlId.STRIPES_MAIN_TABS, [state.mainStripe]);
    }
    if (state.stripesMode !== undefined) {
        setTabsSafe(controlId.STRIPES_MODE_TABS, [state.stripesMode]);
    }

    setRangeSafe(controlId.DEPTH_RANGE, state.depth);
    setRangeSafe(controlId.STRIPES_COUNT_RANGE, state.stripesCount);
    setRangeSafe(controlId.STRIPES_WIDTH_RANGE, state.stripesWidth);
    setRangeSafe(
        controlId.STRIPES_MAIN_CUSTOM_RANGE,
        state.mainStripeNormalized !== undefined
            ? state.mainStripeNormalized * MAIN_STRIPE_RANGE_SCALE
            : undefined
    );
    setRangeSafe(controlId.TILE_NOISE_RESOLUTION, state.noiseTileResolution);

    setCheckboxSafe(controlId.TILE_NOISE_SQUARE, state.noiseTileSquare);
    setCheckboxSafe(controlId.TILE_NOISE_COLORED, state.noiseTileColored);
    setCheckboxSafe(controlId.HEIGHTMAP_INVERT_CHECKBOX, state.invertHeightmap);
    setCheckboxSafe(controlId.SHOW_HEIGHTMAP, state.showHeightmap);
    setCheckboxSafe(controlId.SHOW_UV, state.showUV);

    setRangeSafe(controlId.TILE_PATTERN_OFFSET_X, state.tilePatternOffsetX);
    setRangeSafe(controlId.TILE_PATTERN_OFFSET_Y, state.tilePatternOffsetY);
    setRangeSafe(controlId.TILE_PATTERN_ZOOM, state.tilePatternZoom);
    setRangeSafe(controlId.TILE_PATTERN_REPEAT_X, state.tilePatternRepeatX);
    setRangeSafe(controlId.TILE_PATTERN_REPEAT_Y, state.tilePatternRepeatY);

    for (const [id, value] of cropTargets(state)) {
        setRangeSafe(id, value);
    }

    if (state.downloadSize !== undefined) {
        setTabsSafe(controlId.DOWNLOAD_SIZE_TABS, [String(state.downloadSize)]);
    }
    if (state.heightmapPreset !== undefined) {
        setSelectSafe(controlId.HEIGHTMAP_PRESET_SELECT, state.heightmapPreset);
    }
    if (state.tilePreset !== undefined) {
        setSelectSafe(controlId.TILE_PRESET_SELECT, state.tilePreset);
    }
    if (state.modelId !== undefined) {
        setSelectSafe(controlId.MODEL_PRESET_SELECT, state.modelId);
    }
}

/**
 * `parameters.ts` resets the four tile-crop sliders to 0/1 every time a tile
 * texture finishes loading (`onNewTileTexture -> resetTileCrop`). At boot a deep
 * link triggers one or two such loads (the default preset, then the
 * URL-specified preset) which complete in network order — so crop values set
 * synchronously by `applyStateToUi` get wiped by a load that lands afterwards.
 *
 * Fix: for a short settling window after boot, re-assert the URL's crop values
 * once each tile load completes. The reset runs synchronously right after the
 * tile-change observers, so we defer past it with a macrotask. After the window
 * the observer removes itself and the normal "changing preset resets crop"
 * behaviour resumes.
 *
 * Exported for unit testing; in normal use it is called only by
 * `applyUrlStateAtBoot`.
 */
export function reassertCropAfterTileLoads(state: StereogramUrlState): void {
    const targets = cropTargets(state);
    if (targets.every(([, value]) => value === undefined)) {
        return;
    }

    const windowEnd = Date.now() + CROP_REASSERT_WINDOW_MS;
    const observer = (): void => {
        if (Date.now() > windowEnd) {
            // Remove ourselves outside the observer iteration to avoid
            // disturbing the loop in parameters.ts.
            setTimeout(() => {
                const i = Parameters.tileChangeObservers.indexOf(observer);
                if (i >= 0) {
                    Parameters.tileChangeObservers.splice(i, 1);
                }
            }, 0);
            return;
        }
        // resetTileCrop() runs synchronously after this observer; defer past it.
        setTimeout(() => {
            for (const [id, value] of targets) {
                setRangeSafe(id, value);
            }
        }, 0);
    };
    Parameters.tileChangeObservers.push(observer);
}

/** Apply the URL hash to the UI. Safe to call once at boot. */
export function applyUrlStateAtBoot(): void {
    if (typeof window === "undefined" || !window.location.hash) {
        return;
    }
    try {
        const decoded = decodeState(window.location.hash);
        applyStateToUi(decoded);
        reassertCropAfterTileLoads(decoded);
    } catch (e) {
        // decodeState never throws; a Page setter might if a control is missing.
        // Swallow so a malformed link can never brick the app.
        console.warn("Failed to apply URL state at boot:", e);
    }
}

/** Start mirroring live parameter changes into the URL hash (debounced). */
export function startUrlStateSync(): void {
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
                    // replaceState so slider drags don't pollute browser history.
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

/** Convenience: apply the boot hash and start the live sync in one call. */
export function initUrlStateSync(): void {
    applyUrlStateAtBoot();
    startUrlStateSync();
}
