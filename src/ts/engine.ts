import { gl } from "./gl-utils/gl-canvas";
import { Shader } from "./gl-utils/shader";
import { VBO } from "./gl-utils/vbo";
import { Viewport } from "./gl-utils/viewport";

import { Heightmap } from "./heightmap";
import { EMainStripe, EStripesMode, ETileMode, Parameters } from "./parameters";
import * as StereogramShader from "./stereogram-shader";
import { Tile } from "./tile";
import { asyncLoadShader, clamp } from "./utils";


class Engine {
    private static readonly MIN_STRIPES_COUNT: number = 8;
    private static readonly MAX_STRIPES_COUNT: number = 24;

    private static computeMainStripeIndex(stripesCount: number): number {
        const maxIdx = Math.max(0, stripesCount - 1);
        const ms = Parameters.mainStripe;
        let idx: number;
        switch (ms) {
            case EMainStripe.LEFT:
                idx = 0;
                break;
            case EMainStripe.MIDDLE:
                idx = Math.floor(stripesCount / 2);
                break;
            case EMainStripe.RIGHT:
                idx = maxIdx;
                break;
            case EMainStripe.CUSTOM:
                idx = Math.round(Parameters.mainStripeNormalized * maxIdx);
                break;
            default:
                idx = Math.floor(stripesCount / 2);
        }
        return clamp(0, maxIdx, idx);
    }

    private readonly fullscreenVBO: VBO;

    private heightmapShader: Shader;

    public stripesCount: number;

    public constructor() {
        this.fullscreenVBO = VBO.createQuad(gl, -1, -1, 1, 1);

        asyncLoadShader("heightmap", "fullscreen.vert", "heightmap.frag", (shader: Shader) => {
            this.heightmapShader = shader;
        });
    }

    public draw(heightmap: Heightmap, tile: Tile): boolean {
        const currentTile = tile.current;
        const heightmapTexture = heightmap.current;

        this.stripesCount = this.computeIdealStripeCount();
        const usefulStripesProportion = this.stripesCount / (this.stripesCount + 1);
        let heightmapHScaling = 1;

        let shader: Shader;
        if (Parameters.showHeightmap) {
            shader = this.heightmapShader;
            heightmapHScaling = usefulStripesProportion;
        } else {
            shader = StereogramShader.getShader(this.stripesCount);

            if (shader) {
                const tileUsefulWidth = currentTile.texture.width - 2 * currentTile.padding;
                const tileUsefulHeight = currentTile.texture.height - 2 * currentTile.padding;

                const isTextureMode = Parameters.tileMode === ETileMode.TEXTURE;
                const eps = 1e-3;
                const cropMinU = isTextureMode ? Math.min(Parameters.tileCropMinU, Parameters.tileCropMaxU - eps) : 0;
                const cropMaxU = isTextureMode ? Math.max(Parameters.tileCropMaxU, Parameters.tileCropMinU + eps) : 1;
                const cropMinV = isTextureMode ? Math.min(Parameters.tileCropMinV, Parameters.tileCropMaxV - eps) : 0;
                const cropMaxV = isTextureMode ? Math.max(Parameters.tileCropMaxV, Parameters.tileCropMinV + eps) : 1;
                const cropFracW = cropMaxU - cropMinU;
                const cropFracH = cropMaxV - cropMinV;

                // Tile aspect ratio is driven by the cropped region's pixel dimensions, so
                // cropping a square down to a rectangle yields a rectangular tile in the
                // stereogram (no stretching of the image content).
                const effectiveTileWidth = tileUsefulWidth * cropFracW;
                const effectiveTileHeight = tileUsefulHeight * cropFracH;

                const tileWidthInPixel = this.canvasWidth / (this.stripesCount + 1);
                const tileHeightInPixel = tileWidthInPixel / (effectiveTileWidth / effectiveTileHeight);
                const tileHeight = tileHeightInPixel / this.canvasHeight;

                shader.u["uTileTexture"].value = currentTile.texture.id;
                shader.u["uTileColor"].value = (Parameters.tileMode === ETileMode.NOISE && !Parameters.noiseTileColored) ? 0 : 1;
                shader.u["uTileHeight"].value = tileHeight;
                shader.u["uTileScaling"].value = [tileUsefulWidth / currentTile.texture.width, -tileUsefulHeight / currentTile.texture.height];
                shader.u["uTileOffset"].value = [Parameters.tilePatternOffsetX, Parameters.tilePatternOffsetY];
                shader.u["uTileZoom"].value = Parameters.tilePatternZoom;
                shader.u["uTileRepeatScale"].value = [Parameters.tilePatternRepeatX, Parameters.tilePatternRepeatY];
                shader.u["uTileCropMin"].value = [cropMinU, cropMinV];
                shader.u["uTileCropMax"].value = [cropMaxU, cropMaxV];
                shader.u["uShowUV"].value = Parameters.showUV ? 1 : 0;
                shader.u["uMainStripe"].value = Engine.computeMainStripeIndex(this.stripesCount);
            }
        }

        let drewStereogram = false;
        if (shader) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            Viewport.setFullCanvas(gl);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // tslint:disable-line:no-bitwise

            shader.a["aCorner"].VBO = this.fullscreenVBO;
            shader.u["uHeightmapTexture"].value = heightmapTexture.id;
            shader.u["uInvertHeightmap"].value = Parameters.invertHeightmap;
            shader.u["uDepthFactor"].value = Parameters.depth;

            const canvasAspectRatio = this.canvasWidth / this.canvasHeight * usefulStripesProportion;
            const heightmapAspectRatio = heightmapTexture.width / heightmapTexture.height;
            if (canvasAspectRatio > heightmapAspectRatio) {
                shader.u["uHeightmapScaling"].value = [canvasAspectRatio / heightmapAspectRatio / heightmapHScaling, -1];
            } else {
                shader.u["uHeightmapScaling"].value = [1 / heightmapHScaling, -heightmapAspectRatio / canvasAspectRatio];
            }

            shader.use();
            shader.bindUniformsAndAttributes();
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
            drewStereogram = true;
        }

        return drewStereogram;
    }

    private computeIdealStripeCount(): number {
        if (Parameters.stripesMode === EStripesMode.ADAPTATIVE) {
            const idealCount = Math.round(this.canvasWidth / Parameters.stripesWidth);
            return clamp(Engine.MIN_STRIPES_COUNT, Engine.MAX_STRIPES_COUNT, idealCount);
        } else {
            return Parameters.stripesCount;
        }
    }

    /** CSS / layout pixels (matches on-screen size even when the backing buffer is resized for export). */
    private get canvasWidth(): number {
        const c = gl.canvas as HTMLCanvasElement;
        const cw = c.clientWidth;
        if (cw > 0) {
            return cw;
        }
        return gl.canvas.width / window.devicePixelRatio;
    }

    private get canvasHeight(): number {
        const c = gl.canvas as HTMLCanvasElement;
        const ch = c.clientHeight;
        if (ch > 0) {
            return ch;
        }
        return gl.canvas.height / window.devicePixelRatio;
    }
}

export {
    Engine
};

