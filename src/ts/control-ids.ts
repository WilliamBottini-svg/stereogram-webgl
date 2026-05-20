/**
 * Single source of truth for the DOM IDs of every interactive control on the
 * page. Imported by `parameters.ts` (which reads/observes them) and by
 * `url-state-binding.ts` (which reads/writes them for shareable links).
 *
 * Previously this table lived privately in `parameters.ts` and was copy-pasted
 * into the URL-state code; a rename in one place silently broke the other.
 */

export const controlId = {
    TILE_MODE_TABS: "tile-mode-tabs-id",
    TILE_PRESET_SELECT: "tile-preset-select-id",
    TILE_NOISE_RESOLUTION: "tile-noise-resolution-range-id",
    TILE_NOISE_SQUARE: "tile-noise-square-checkbox-id",
    TILE_NOISE_COLORED: "tile-noise-colored-checkbox-id",
    SHOW_UV: "show-uv-checkbox-id",
    TILE_UPLOAD_BUTTON: "input-tile-upload-button",
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
    HEIGHTMAP_UPLOAD_BUTTON: "input-heightmap-upload-button",

    STRIPES_MAIN_TABS: "main-stripe-tabs-id",
    STRIPES_MAIN_CUSTOM_RANGE: "main-stripe-custom-range-id",
    STRIPES_MODE_TABS: "stripes-mode-tabs-id",
    STRIPES_WIDTH_RANGE: "stripes-width-range-id",
    STRIPES_COUNT_RANGE: "stripes-count-range-id",

    SHOW_INDICATORS_CHECKBOX: "show-indicators-checkbox-id",
    DOWNLOAD_SIZE_TABS: "download-size-tabs-id",
    IMAGE_DOWNLOAD: "image-download-id",
} as const;

/**
 * The "main stripe custom" slider stores an integer 0..1000; the rest of the
 * app works with a normalized 0..1 value. This is the single conversion factor
 * — used both when reading the slider and when applying a value back to it.
 */
export const MAIN_STRIPE_RANGE_SCALE = 1000;
