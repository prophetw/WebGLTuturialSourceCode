 #version 300 es
precision highp float;

uniform sampler2D uColorBuffer;

out vec4 color;

void main() {
  color = vec4(texelFetch(uColorBuffer, ivec2(gl_FragCoord.xy), 0).rgb, 1.0);
}
