precision mediump float;

uniform sampler2D uTileTexture;

uniform float uTileColor;
uniform float uTileHeight;
uniform vec2 uTileScaling;
uniform vec2 uTileOffset;
uniform float uTileZoom;
uniform vec2 uTileRepeatScale;
uniform vec2 uTileCropMin;
uniform vec2 uTileCropMax;
uniform float uShowUV;
uniform float uMainStripe;

varying vec2 vPosition;

#include "_heightmap.frag"

vec2 computeTileUv(vec2 position) {
    const float stripesCount = #INJECT(STRIPES_COUNT);
    const int loopSize = #INJECT(LOOP_SIZE);

    float mainStripeWidth = 1.0 - sampleHeightmap(vec2((uMainStripe + 0.5) / (stripesCount + 1.0), position.y)) * 0.45;
    float mainstripeLeft = uMainStripe + 0.5 * (1.0 - mainStripeWidth);
    float mainstripeRight = uMainStripe + 1.0 - + 0.5 * (1.0 - mainStripeWidth);

    position.x *= stripesCount + 1.0;

    for (int i = 0; i < loopSize; i++) {
        if (position.x < mainstripeLeft) {
            vec2 previousPosition = vec2((position.x - 0.25) / stripesCount, position.y);
            position.x += 1.0 - sampleHeightmap(previousPosition) * 0.45;
        } else if (position.x >= mainstripeRight) {
            vec2 previousPosition = vec2((position.x - 1.0) / stripesCount, position.y);
            position.x -= 1.0 - sampleHeightmap(previousPosition) * 0.45;
        } else {
            break;
        }
    }

    position.x = (position.x - mainstripeLeft) / mainStripeWidth;
    position.y = fract(position.y / uTileHeight);
    return position;
}

// Sample the tile so that pattern UV [0,1]^2 maps directly onto the crop rectangle of the
// texture. The crop's aspect ratio drives the tile shape (set in CPU via uTileHeight); the
// shader just samples within the crop. Pan/zoom act inside the crop and clamp-to-edge keeps
// offsets from sampling outside the cropped area.
vec4 sampleTile(vec2 coords) {
    vec2 cropCenter = 0.5 * (uTileCropMin + uTileCropMax);
    vec2 cropSize = uTileCropMax - uTileCropMin;
    vec2 zoomed = cropSize * uTileScaling * uTileZoom;
    coords = cropCenter + (coords - 0.5) * zoomed;
    coords += uTileOffset;
    vec2 he = 0.5 * abs(zoomed);
    coords = clamp(coords, cropCenter - he, cropCenter + he);
    return texture2D(uTileTexture, coords);
}

void main(void) {
    vec2 tileUv = computeTileUv(vPosition) * uTileRepeatScale;

    vec4 tileSample = sampleTile(tileUv);
    vec4 monocolorTile = vec4(vec3(tileSample.r), 1);

    vec4 color = mix(monocolorTile, tileSample, uTileColor);

    vec4 colorUV = vec4(tileUv, 0, 1);
    gl_FragColor = mix(color, colorUV, uShowUV);
}
