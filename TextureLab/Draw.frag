#version 300 es
precision highp float;

in vec2 v_TexCoord;

uniform sampler2D texture0; // read tex

out vec4 fragColor;

void main() {
  vec4 color = texture(texture0, v_TexCoord);
  fragColor = color;
}
