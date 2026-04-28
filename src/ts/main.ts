import * as GLCanvas from "./gl-utils/gl-canvas";
import { gl } from "./gl-utils/gl-canvas";

import { Engine } from "./engine";
import { Heightmap } from "./heightmap";
import { EHeightmapMode, ETileMode, Parameters } from "./parameters";
import { Tile } from "./tile";
import { initBrowserFullscreenPreview } from "./fullscreen-preview";

import "./page-interface-generated";
import "./ui-enhancements";


function main(): void {
    const webglFlags = {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        preserveDrawingBuffer: false,
    };
    if (!GLCanvas.initGL(webglFlags)) {
        return;
    }
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    const canvas = Page.Canvas.getCanvas();

    const engine = new Engine();
    const heightmap = new Heightmap();
    const tile = new Tile();

    initBrowserFullscreenPreview();

    let nbFramesSinceLastUpdate = 0;
    setInterval(() => {
        Page.Canvas.setIndicatorText("fps-indicator", Math.round(nbFramesSinceLastUpdate).toFixed(0));
        nbFramesSinceLastUpdate = 0;

        const currentTile = tile.current.texture;
        Page.Canvas.setIndicatorText("tilesize-indicator", `${currentTile.width}x${currentTile.height}`);

        Page.Canvas.setIndicatorText("stripes-count-indicator", engine.stripesCount.toFixed(0));
    }, 1000);

    let needToDownload = false;
    Parameters.imageDownloadObservers.push(() => { needToDownload = true; });

    let needToRedraw = true;
    Parameters.redrawObservers.push(() => { needToRedraw = true; });

    let needToRecomputeNoiseTile = true;
    Parameters.recomputeNoiseTileObservers.push(() => { needToRecomputeNoiseTile = true; });

    function mainLoop(): void {
        nbFramesSinceLastUpdate++;

        if (needToDownload) {
            // Redraw at chosen export resolution; backing buffer is restored after toBlob (or immediately for IE).
            const prevW = canvas.width;
            const prevH = canvas.height;
            let [expW, expH] = computeExportDimensions(canvas, Parameters.downloadSize);
            [expW, expH] = clampExportToWebGLLimits(expW, expH);
            canvas.width = expW;
            canvas.height = expH;
            engine.draw(heightmap, tile);

            const name = "stereogram.png";
            if ((canvas as any).msToBlob) {
                const blob = (canvas as any).msToBlob();
                (window.navigator as any).msSaveBlob(blob, name);
                canvas.width = prevW;
                canvas.height = prevH;
                needToRedraw = true;
            } else {
                canvas.toBlob((blob: Blob | null) => {
                    canvas.width = prevW;
                    canvas.height = prevH;
                    needToRedraw = true;
                    if (!blob) {
                        return;
                    }
                    const link = document.createElement("a");
                    link.download = name;
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                });
            }
            needToDownload = false;
        }

        if (Parameters.heightmapMode === EHeightmapMode.MOVING) {
            needToRecomputeNoiseTile = true;
            needToRedraw = true;
        }

        if (needToRecomputeNoiseTile && Parameters.tileMode === ETileMode.NOISE) {
            const width = Parameters.noiseTileResolution;
            const height = Parameters.noiseTileSquare ? width : 5 * width;
            needToRecomputeNoiseTile = !tile.randomize(width, height);
        }

        if (needToRedraw) {
            GLCanvas.adjustSize(true);
            needToRedraw = !engine.draw(heightmap, tile);
        }

        requestAnimationFrame(mainLoop);
    }
    mainLoop();
}

/** Longest side = targetPx; preserves aspect ratio from layout (clientWidth / clientHeight). */
function computeExportDimensions(canvas: HTMLCanvasElement, targetLongest: number): [number, number] {
    const cw = canvas.clientWidth > 0 ? canvas.clientWidth : 1;
    const ch = canvas.clientHeight > 0 ? canvas.clientHeight : 1;
    const aspect = cw / ch;
    let w: number;
    let h: number;
    if (cw >= ch) {
        w = targetLongest;
        h = Math.max(1, Math.round(targetLongest / aspect));
    } else {
        h = targetLongest;
        w = Math.max(1, Math.round(targetLongest * aspect));
    }
    return [w, h];
}

function clampExportToWebGLLimits(w: number, h: number): [number, number] {
    const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    const maxVp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
    const maxW = Math.min(maxRb, maxTex, maxVp[0]);
    const maxH = Math.min(maxRb, maxTex, maxVp[1]);
    if (w <= maxW && h <= maxH) {
        return [w, h];
    }
    const scale = Math.min(maxW / w, maxH / h);
    return [
        Math.max(1, Math.floor(w * scale)),
        Math.max(1, Math.floor(h * scale)),
    ];
}

main();
