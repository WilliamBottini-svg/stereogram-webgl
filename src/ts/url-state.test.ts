import { describe, expect, it } from "vitest";
import { decodeState, encodeState, SUPPORTED_FIELDS, type StereogramUrlState } from "./url-state";

describe("encodeState", () => {
    it("returns an empty string for an empty state", () => {
        expect(encodeState({})).toBe("");
    });

    it("encodes a single numeric field with short key", () => {
        expect(encodeState({ depth: 0.5 })).toBe("d=0.5");
    });

    it("encodes a single boolean field as 0 or 1", () => {
        expect(encodeState({ showHeightmap: true })).toBe("sh=1");
        expect(encodeState({ showHeightmap: false })).toBe("sh=0");
    });

    it("encodes an enum string field", () => {
        expect(encodeState({ tileMode: "noise" })).toBe("tm=noise");
    });

    it("quantizes floats to keep the URL compact", () => {
        // 0.123456789 -> "d=0.1235" (4 dp, rounded)
        expect(encodeState({ depth: 0.123456789 })).toBe("d=0.1235");
    });

    it("strips trailing zeros from quantized floats", () => {
        expect(encodeState({ depth: 0.5 })).toBe("d=0.5");
        expect(encodeState({ depth: 0.1 })).toBe("d=0.1");
        expect(encodeState({ depth: 1 })).toBe("d=1");
    });

    it("emits 0 for zero values (not empty string)", () => {
        expect(encodeState({ depth: 0 })).toBe("d=0");
    });

    it("joins multiple fields with &", () => {
        const encoded = encodeState({ depth: 0.5, stripesCount: 12, showHeightmap: true });
        expect(encoded.split("&").sort()).toEqual(["d=0.5", "sc=12", "sh=1"]);
    });

    it("ignores undefined and null values", () => {
        const state = {
            depth: 0.5,
            stripesCount: undefined,
            tileMode: null as unknown as undefined,
        };
        expect(encodeState(state)).toBe("d=0.5");
    });

    it("ignores fields not in the schema", () => {
        const state = { depth: 0.5, bogus: "value" } as unknown as StereogramUrlState;
        expect(encodeState(state)).toBe("d=0.5");
    });

    it("ignores enum values not in the allowed list", () => {
        const state = { tileMode: "invalid" } as unknown as StereogramUrlState;
        expect(encodeState(state)).toBe("");
    });

    it("ignores non-finite numbers", () => {
        expect(encodeState({ depth: NaN })).toBe("");
        expect(encodeState({ depth: Infinity })).toBe("");
        expect(encodeState({ depth: -Infinity })).toBe("");
    });

    it("ignores empty strings for free-form string fields", () => {
        expect(encodeState({ heightmapPreset: "" })).toBe("");
    });

    it("URL-encodes string values that contain special characters", () => {
        expect(encodeState({ heightmapPreset: "my preset/1" })).toBe("hp=my%20preset%2F1");
    });
});

describe("decodeState", () => {
    it("returns an empty object for an empty hash", () => {
        expect(decodeState("")).toEqual({});
        expect(decodeState("#")).toEqual({});
    });

    it("strips a leading # if present", () => {
        expect(decodeState("#d=0.5")).toEqual({ depth: 0.5 });
        expect(decodeState("d=0.5")).toEqual({ depth: 0.5 });
    });

    it("decodes a single numeric field", () => {
        expect(decodeState("d=0.5")).toEqual({ depth: 0.5 });
    });

    it("decodes a single boolean field", () => {
        expect(decodeState("sh=1")).toEqual({ showHeightmap: true });
        expect(decodeState("sh=0")).toEqual({ showHeightmap: false });
    });

    it("decodes an enum string field", () => {
        expect(decodeState("tm=noise")).toEqual({ tileMode: "noise" });
    });

    it("decodes multiple &-separated fields", () => {
        expect(decodeState("d=0.5&sc=12&sh=1")).toEqual({
            depth: 0.5,
            stripesCount: 12,
            showHeightmap: true,
        });
    });

    it("ignores unknown keys (forwards-compatibility)", () => {
        expect(decodeState("d=0.5&futurething=42")).toEqual({ depth: 0.5 });
    });

    it("ignores pairs with no `=`", () => {
        expect(decodeState("d=0.5&garbage&sc=12")).toEqual({ depth: 0.5, stripesCount: 12 });
    });

    it("ignores numeric values that don't parse to finite numbers", () => {
        expect(decodeState("d=NaN")).toEqual({});
        expect(decodeState("d=hello")).toEqual({});
    });

    it("ignores boolean values that aren't exactly 0 or 1", () => {
        expect(decodeState("sh=true")).toEqual({});
        expect(decodeState("sh=2")).toEqual({});
    });

    it("ignores enum values not in the allowed list", () => {
        expect(decodeState("tm=banana")).toEqual({});
    });

    it("URL-decodes string values", () => {
        expect(decodeState("hp=my%20preset%2F1")).toEqual({ heightmapPreset: "my preset/1" });
    });

    it("survives malformed URI sequences without throwing", () => {
        expect(() => decodeState("hp=%E0%A4%A")).not.toThrow();
    });

    it("tolerates empty fragments between separators", () => {
        expect(decodeState("d=0.5&&sc=12")).toEqual({ depth: 0.5, stripesCount: 12 });
    });

    it("never throws on garbage input", () => {
        expect(() => decodeState("$$$&&&===")).not.toThrow();
        expect(() => decodeState("a".repeat(10000))).not.toThrow();
    });
});

describe("encode/decode round-trip", () => {
    it("round-trips a full state", () => {
        const state: StereogramUrlState = {
            tileMode: "texture",
            heightmapMode: "still",
            mainStripe: "middle",
            stripesMode: "adaptative",
            depth: 0.5,
            stripesCount: 12,
            stripesWidth: 0.25,
            mainStripeNormalized: 0.5,
            noiseTileResolution: 128,
            noiseTileSquare: true,
            noiseTileColored: false,
            invertHeightmap: false,
            showHeightmap: false,
            showUV: false,
            tilePatternOffsetX: 0.1,
            tilePatternOffsetY: 0.2,
            tilePatternZoom: 1.5,
            tilePatternRepeatX: 2,
            tilePatternRepeatY: 1,
            tileCropMinU: 0,
            tileCropMaxU: 1,
            tileCropMinV: 0,
            tileCropMaxV: 1,
            downloadSize: 2048,
            heightmapPreset: "planet.png",
            tilePreset: "clouds.jpg",
            modelId: "ship.obj",
        };
        const encoded = encodeState(state);
        const decoded = decodeState(encoded);
        expect(decoded).toEqual(state);
    });

    it("round-trips floats within the quantization precision (4 dp)", () => {
        const state: StereogramUrlState = { depth: 0.3333, stripesWidth: 0.6667 };
        const decoded = decodeState(encodeState(state));
        expect(decoded.depth).toBeCloseTo(0.3333, 4);
        expect(decoded.stripesWidth).toBeCloseTo(0.6667, 4);
    });

    it("decoding then re-encoding is idempotent", () => {
        const hash = "d=0.5&sc=12&tm=noise";
        expect(encodeState(decodeState(hash)).split("&").sort()).toEqual(hash.split("&").sort());
    });

    it("encoded output is reasonably compact for a typical state (< 200 chars)", () => {
        const state: StereogramUrlState = {
            depth: 0.5,
            stripesCount: 12,
            tileMode: "texture",
            heightmapPreset: "planet.png",
            tilePatternOffsetX: 0.3,
            tilePatternZoom: 1.2,
        };
        expect(encodeState(state).length).toBeLessThan(200);
    });
});

describe("SUPPORTED_FIELDS", () => {
    it("includes every documented field", () => {
        // Sanity: schema covers the parameter set described in the README.
        expect(SUPPORTED_FIELDS).toContain("depth");
        expect(SUPPORTED_FIELDS).toContain("tileMode");
        expect(SUPPORTED_FIELDS).toContain("tilePatternOffsetX");
        expect(SUPPORTED_FIELDS).toContain("tileCropMinU");
        expect(SUPPORTED_FIELDS).toContain("downloadSize");
    });
});
