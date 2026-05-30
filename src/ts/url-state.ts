/**
 * Shareable URL state codec for the stereogram generator.
 *
 * Design notes:
 * - Format is a `&`-separated `key=value` string stored in `window.location.hash`.
 *   Familiar query-string syntax, human-readable, fully diffable.
 * - Short keys (e.g. `d` for depth, `sc` for stripesCount) chosen so the encoded
 *   string stays short enough to paste in chat without wrapping.
 * - Floats are quantized to 4 decimal places before encoding; this is well below
 *   the precision of any slider in the UI and roughly halves the URL length.
 * - Unknown keys are ignored on decode (forwards-compatibility) and malformed
 *   values fall through silently (no exceptions thrown for bad input).
 * - File-backed parameters (uploaded depth maps, uploaded pattern textures)
 *   cannot be encoded — a URL is too small to embed an image. The exclusion
 *   is documented in the README.
 * - The codec is intentionally pure and Page-free so it can be unit-tested in
 *   plain Node, and so it has no coupling to the rest of the codebase.
 */

export type TileMode = "texture" | "noise";
export type HeightmapMode = "still" | "moving";
export type MainStripe = "left" | "middle" | "right" | "custom";
export type StripesMode = "adaptative" | "fixed";
export type DownloadSize = 1024 | 2048 | 4096;

export interface StereogramUrlState {
    tileMode?: TileMode;
    heightmapMode?: HeightmapMode;
    mainStripe?: MainStripe;
    stripesMode?: StripesMode;

    depth?: number;
    stripesCount?: number;
    stripesWidth?: number;
    mainStripeNormalized?: number;
    noiseTileResolution?: number;

    noiseTileSquare?: boolean;
    noiseTileColored?: boolean;
    invertHeightmap?: boolean;
    showHeightmap?: boolean;
    showUV?: boolean;

    tilePatternOffsetX?: number;
    tilePatternOffsetY?: number;
    tilePatternZoom?: number;
    tilePatternRepeatX?: number;
    tilePatternRepeatY?: number;

    tileCropMinU?: number;
    tileCropMaxU?: number;
    tileCropMinV?: number;
    tileCropMaxV?: number;

    downloadSize?: DownloadSize;
    heightmapPreset?: string;
    tilePreset?: string;
    modelId?: string;
}

type ValueType = "number" | "bool" | "string";

interface FieldSpec {
    field: keyof StereogramUrlState;
    key: string;
    type: ValueType;
    allowed?: readonly string[];
}

const SPEC: readonly FieldSpec[] = [
    { field: "tileMode", key: "tm", type: "string", allowed: ["texture", "noise"] },
    { field: "heightmapMode", key: "hm", type: "string", allowed: ["still", "moving"] },
    {
        field: "mainStripe",
        key: "ms",
        type: "string",
        allowed: ["left", "middle", "right", "custom"],
    },
    { field: "stripesMode", key: "sm", type: "string", allowed: ["adaptative", "fixed"] },

    { field: "depth", key: "d", type: "number" },
    { field: "stripesCount", key: "sc", type: "number" },
    { field: "stripesWidth", key: "sw", type: "number" },
    { field: "mainStripeNormalized", key: "msn", type: "number" },
    { field: "noiseTileResolution", key: "ntr", type: "number" },

    { field: "noiseTileSquare", key: "nts", type: "bool" },
    { field: "noiseTileColored", key: "ntc", type: "bool" },
    { field: "invertHeightmap", key: "ih", type: "bool" },
    { field: "showHeightmap", key: "sh", type: "bool" },
    { field: "showUV", key: "uv", type: "bool" },

    { field: "tilePatternOffsetX", key: "ox", type: "number" },
    { field: "tilePatternOffsetY", key: "oy", type: "number" },
    { field: "tilePatternZoom", key: "z", type: "number" },
    { field: "tilePatternRepeatX", key: "rx", type: "number" },
    { field: "tilePatternRepeatY", key: "ry", type: "number" },

    { field: "tileCropMinU", key: "cu0", type: "number" },
    { field: "tileCropMaxU", key: "cu1", type: "number" },
    { field: "tileCropMinV", key: "cv0", type: "number" },
    { field: "tileCropMaxV", key: "cv1", type: "number" },

    { field: "downloadSize", key: "ds", type: "number" },
    { field: "heightmapPreset", key: "hp", type: "string" },
    { field: "tilePreset", key: "tp", type: "string" },
    { field: "modelId", key: "mid", type: "string" },
] as const;

const KEY_BY_FIELD = new Map<string, FieldSpec>(SPEC.map((s) => [s.field, s]));
const FIELD_BY_KEY = new Map<string, FieldSpec>(SPEC.map((s) => [s.key, s]));

const FLOAT_PRECISION = 4;

function quantize(n: number): string {
    if (!Number.isFinite(n)) {
        return "";
    }
    // toFixed then strip trailing zeros to keep the URL compact.
    const fixed = n.toFixed(FLOAT_PRECISION);
    return fixed.replace(/\.?0+$/, "") || "0";
}

/**
 * Encode a partial state into a hash-suitable string (no leading `#`).
 * Returns an empty string if the state has no encodable fields.
 */
export function encodeState(state: StereogramUrlState): string {
    const parts: string[] = [];

    for (const [field, value] of Object.entries(state)) {
        if (value === undefined || value === null) {
            continue;
        }
        const spec = KEY_BY_FIELD.get(field);
        if (!spec) {
            continue;
        }

        let encoded: string;
        switch (spec.type) {
            case "number":
                if (typeof value !== "number" || !Number.isFinite(value)) {
                    continue;
                }
                encoded = quantize(value);
                break;
            case "bool":
                if (typeof value !== "boolean") {
                    continue;
                }
                encoded = value ? "1" : "0";
                break;
            case "string":
                if (typeof value !== "string" || value === "") {
                    continue;
                }
                if (spec.allowed && !spec.allowed.includes(value)) {
                    continue;
                }
                encoded = encodeURIComponent(value);
                break;
        }

        parts.push(`${spec.key}=${encoded}`);
    }

    return parts.join("&");
}

/**
 * Decode a hash string (with or without leading `#`) into a partial state.
 * Unknown keys are skipped; malformed values for known keys are skipped.
 * Never throws.
 */
export function decodeState(hash: string): StereogramUrlState {
    const result: StereogramUrlState = {};
    if (!hash) {
        return result;
    }
    const raw = hash.startsWith("#") ? hash.slice(1) : hash;
    if (!raw) {
        return result;
    }

    for (const pair of raw.split("&")) {
        if (!pair) {
            continue;
        }
        const eq = pair.indexOf("=");
        if (eq < 0) {
            continue;
        }
        const key = pair.slice(0, eq);
        const value = pair.slice(eq + 1);
        const spec = FIELD_BY_KEY.get(key);
        if (!spec) {
            continue;
        }

        switch (spec.type) {
            case "number": {
                const n = parseFloat(value);
                if (Number.isFinite(n)) {
                    (result as Record<string, unknown>)[spec.field] = n;
                }
                break;
            }
            case "bool":
                if (value === "1" || value === "0") {
                    (result as Record<string, unknown>)[spec.field] = value === "1";
                }
                break;
            case "string": {
                let decoded: string;
                try {
                    decoded = decodeURIComponent(value);
                } catch {
                    continue;
                }
                if (spec.allowed && !spec.allowed.includes(decoded)) {
                    continue;
                }
                (result as Record<string, unknown>)[spec.field] = decoded;
                break;
            }
        }
    }

    return result;
}

/** Convenience: list of every supported field. Used in tests and tooling. */
export const SUPPORTED_FIELDS: ReadonlyArray<keyof StereogramUrlState> = SPEC.map((s) => s.field);
