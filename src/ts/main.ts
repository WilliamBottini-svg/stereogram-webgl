import * as GLCanvas from "./gl-utils/gl-canvas";
import { gl } from "./gl-utils/gl-canvas";

import { Engine } from "./engine";
import { Heightmap } from "./heightmap";
import { EHeightmapMode, ETileMode, Parameters } from "./parameters";
import { Tile } from "./tile";
import { initBrowserFullscreenPreview } from "./fullscreen-preview";
import { computeExportDimensions, clampExportToLimits } from "./export-dimensions";
import { initUrlStateSync, installCopyLinkButton } from "./url-state-binding";
import { initTheme, installThemeToggle } from "./theme";

import "./page-interface-generated";
import "./ui-enhancements";

// Run before anything else so the chosen theme is in place before first paint.
initTheme();

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

    const maybeCanvas = Page.Canvas.getCanvas();
    if (!maybeCanvas) {
        return;
    }
    const canvas: HTMLCanvasElement = maybeCanvas;

    initUrlStateSync();

    const engine = new Engine();
    const heightmap = new Heightmap();
    const tile = new Tile();

    initBrowserFullscreenPreview();
    installCopyLinkButton();
    installThemeToggle();

    let nbFramesSinceLastUpdate = 0;
    setInterval(() => {
        Page.Canvas.setIndicatorText(
            "fps-indicator",
            Math.round(nbFramesSinceLastUpdate).toFixed(0)
        );
        nbFramesSinceLastUpdate = 0;

        const currentTile = tile.current.texture;
        Page.Canvas.setIndicatorText(
            "tilesize-indicator",
            `${currentTile.width}x${currentTile.height}`
        );

        Page.Canvas.setIndicatorText("stripes-count-indicator", engine.stripesCount.toFixed(0));
    }, 1000);

    let needToDownload = false;
    Parameters.imageDownloadObservers.push(() => {
        needToDownload = true;
    });

    let needToRedraw = true;
    Parameters.redrawObservers.push(() => {
        needToRedraw = true;
    });

    let needToRecomputeNoiseTile = true;
    Parameters.recomputeNoiseTileObservers.push(() => {
        needToRecomputeNoiseTile = true;
    });

    function mainLoop(): void {
        nbFramesSinceLastUpdate++;

        if (needToDownload) {
            // Redraw at chosen export resolution, then restore the original backing buffer once the blob is ready.
            const prevW = canvas.width;
            const prevH = canvas.height;
            let [expW, expH] = computeExportDimensions(
                canvas.clientWidth,
                canvas.clientHeight,
                Parameters.downloadSize
            );
            const maxRb = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
            const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
            const maxVp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
            [expW, expH] = clampExportToLimits(
                expW,
                expH,
                Math.min(maxRb, maxTex, maxVp[0]),
                Math.min(maxRb, maxTex, maxVp[1])
            );
            canvas.width = expW;
            canvas.height = expH;
            engine.draw(heightmap, tile);

            canvas.toBlob((blob: Blob | null) => {
                canvas.width = prevW;
                canvas.height = prevH;
                needToRedraw = true;
                if (!blob) {
                    return;
                }
                const link = document.createElement("a");
                link.download = "stereogram.png";
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            });
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

main();
