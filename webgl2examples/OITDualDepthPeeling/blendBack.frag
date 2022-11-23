
        #version 300 es
precision highp float;

uniform sampler2D uBackColor;

out vec4 fragColor; // COLOR_ATTACHMENT0  frameBuffer id=4
void main() {
  fragColor = texelFetch(uBackColor, ivec2(gl_FragCoord.xy), 0);
  if(fragColor.a == 0.0) {
    discard;
  }
}
