uniform sampler2D uHeightmapTexture;

uniform float uDepthFactor;
uniform float uInvertHeightmap;
uniform vec2 uHeightmapScaling;

float sampleHeightmap(vec2 position) {
    position = 0.5 + (position - 0.5) * uHeightmapScaling;
    position = clamp(position, vec2(0.0), vec2(1.0));

    vec4 sample = texture2D(uHeightmapTexture, position);
    float value = dot(vec3(1.0 / 3.0), sample.rgb);
    value = mix(value, 1.0 - value, uInvertHeightmap);
    return uDepthFactor * value;
}
