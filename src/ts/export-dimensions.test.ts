import { describe, expect, it } from "vitest";
import { clampExportToLimits, computeExportDimensions } from "./export-dimensions";

describe("computeExportDimensions", () => {
    it("returns target × target for a square canvas", () => {
        expect(computeExportDimensions(800, 800, 2048)).toEqual([2048, 2048]);
    });

    it("preserves landscape aspect ratio (longest side wins on width)", () => {
        // 1600x900 → target 2048 longest → expect 2048 x 1152
        expect(computeExportDimensions(1600, 900, 2048)).toEqual([2048, 1152]);
    });

    it("preserves portrait aspect ratio (longest side wins on height)", () => {
        // 900x1600 → target 2048 longest → expect 1152 x 2048
        expect(computeExportDimensions(900, 1600, 2048)).toEqual([1152, 2048]);
    });

    it("rounds the short side to the nearest integer", () => {
        // 1920x1080 → target 4096 → 4096 x round(4096 * 1080/1920) = 4096 x 2304
        expect(computeExportDimensions(1920, 1080, 4096)).toEqual([4096, 2304]);
    });

    it("never produces a side smaller than 1px", () => {
        // Ultra-wide canvas + tiny target → short side would round to 0 → clamped to 1
        const [w, h] = computeExportDimensions(10000, 1, 1);
        expect(w).toBeGreaterThanOrEqual(1);
        expect(h).toBeGreaterThanOrEqual(1);
    });

    it("treats a zero-width canvas as 1px to avoid divide-by-zero", () => {
        const result = computeExportDimensions(0, 600, 1024);
        expect(result[0]).toBeGreaterThan(0);
        expect(result[1]).toBeGreaterThan(0);
        expect(Number.isFinite(result[0])).toBe(true);
        expect(Number.isFinite(result[1])).toBe(true);
    });

    it("treats a zero-height canvas as 1px to avoid divide-by-zero", () => {
        const result = computeExportDimensions(800, 0, 1024);
        expect(result[0]).toBeGreaterThan(0);
        expect(result[1]).toBeGreaterThan(0);
        expect(Number.isFinite(result[0])).toBe(true);
        expect(Number.isFinite(result[1])).toBe(true);
    });
});

describe("clampExportToLimits", () => {
    it("returns the original dimensions when both fit", () => {
        expect(clampExportToLimits(2048, 1152, 4096, 4096)).toEqual([2048, 1152]);
    });

    it("returns the original dimensions when they exactly equal the limits", () => {
        expect(clampExportToLimits(4096, 4096, 4096, 4096)).toEqual([4096, 4096]);
    });

    it("scales down proportionally when width exceeds the limit", () => {
        // 8000 x 4500, max 4000 x 4000 → scale = 4000/8000 = 0.5 → 4000 x 2250
        expect(clampExportToLimits(8000, 4500, 4000, 4000)).toEqual([4000, 2250]);
    });

    it("scales down proportionally when height exceeds the limit", () => {
        // 4500 x 8000, max 4000 x 4000 → scale = 4000/8000 = 0.5 → 2250 x 4000
        expect(clampExportToLimits(4500, 8000, 4000, 4000)).toEqual([2250, 4000]);
    });

    it("preserves aspect ratio when both dimensions exceed limits", () => {
        const [w, h] = clampExportToLimits(8192, 4608, 4096, 4096);
        // Both exceed: scale = min(4096/8192, 4096/4608) = 4096/8192 = 0.5
        expect(w).toBe(4096);
        expect(h).toBe(2304);
        expect(w / h).toBeCloseTo(8192 / 4608, 5);
    });

    it("never produces a side smaller than 1px even with extreme aspect ratios", () => {
        const [w, h] = clampExportToLimits(100000, 1, 1024, 1024);
        expect(w).toBeGreaterThanOrEqual(1);
        expect(h).toBeGreaterThanOrEqual(1);
    });

    it("returns integer dimensions", () => {
        const [w, h] = clampExportToLimits(3333, 4444, 1024, 1024);
        expect(Number.isInteger(w)).toBe(true);
        expect(Number.isInteger(h)).toBe(true);
    });
});

describe("computeExportDimensions + clampExportToLimits (end-to-end)", () => {
    it("a typical 1920x1080 layout exporting at 4096 with 4096 max produces the layout-correct result", () => {
        const [w0, h0] = computeExportDimensions(1920, 1080, 4096);
        const [w1, h1] = clampExportToLimits(w0, h0, 4096, 4096);
        expect([w1, h1]).toEqual([4096, 2304]);
    });

    it("a 1920x1080 layout exporting at 4096 with a 2048 hardware cap clamps down", () => {
        const [w0, h0] = computeExportDimensions(1920, 1080, 4096);
        const [w1, h1] = clampExportToLimits(w0, h0, 2048, 2048);
        // 4096 x 2304 → scale = 2048/4096 = 0.5 → 2048 x 1152
        expect([w1, h1]).toEqual([2048, 1152]);
    });
});
