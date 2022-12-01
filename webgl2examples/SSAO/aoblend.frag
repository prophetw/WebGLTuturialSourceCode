  #version 300 es
precision highp float;

uniform sampler2D uColorBuffer;
uniform sampler2D uOcclusionBuffer;

float unpackDepth(vec4 rgbaDepth) {
    const vec4 bitShift = vec4(1.0, 1.0/255.0, 1.0/(255.0 * 255.0), 1.0/(255.0*255.0*255.0));
    float depth = dot(rgbaDepth, bitShift);
    return depth;
}
out vec4 color;
void main() {
  ivec2 fragCoord = ivec2(gl_FragCoord.xy);
  vec4 occlusion = texelFetch(uOcclusionBuffer, fragCoord, 0);
  // float occlusionFloat = unpackDepth(occlusion);

  // occlusion = vec4(occlusionFloat, 0.0, 0.0, 1.0);
  color = vec4(clamp(texelFetch(uColorBuffer, fragCoord, 0).rgb - occlusion.r, 0.0, 1.0), 1.0);
}
