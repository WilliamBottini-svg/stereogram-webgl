/**
 * Pure geometry helpers for the "download stereogram" feature.
 * Kept WebGL-free so they can be unit-tested in a plain Node environment.
 */

/**
 * Given the canvas's on-screen size (clientWidth/clientHeight) and a target
 * "longest side" in pixels, return the export resolution that preserves the
 * canvas aspect ratio.
 *
 * Both inputs are sanitized to a minimum of 1 to avoid zero-sized canvases
 * (which can happen briefly during layout) producing a divide-by-zero.
 */
export function computeExportDimensions(
    canvasClientWidth: number,
    canvasClientHeight: number,
    targetLongest: number
): [number, number] {
    const cw = canvasClientWidth > 0 ? canvasClientWidth : 1;
    const ch = canvasClientHeight > 0 ? canvasClientHeight : 1;
    const aspect = cw / ch;

    if (cw >= ch) {
        const w = targetLongest;
        const h = Math.max(1, Math.round(targetLongest / aspect));
        return [w, h];
    }
    const h = targetLongest;
    const w = Math.max(1, Math.round(targetLongest * aspect));
    return [w, h];
}

/**
 * Clamp an export resolution down to the WebGL implementation limits while
 * preserving aspect ratio. Returns the original dimensions if they already fit.
 */
export function clampExportToLimits(
    w: number,
    h: number,
    maxW: number,
    maxH: number
): [number, number] {
    if (w <= maxW && h <= maxH) {
        return [w, h];
    }
    const scale = Math.min(maxW / w, maxH / h);
    return [Math.max(1, Math.floor(w * scale)), Math.max(1, Math.floor(h * scale))];
}
