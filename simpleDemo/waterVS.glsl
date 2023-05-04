attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;

varying vec2 v_texCoord;
varying vec3 WorldPos;

void main() {
  gl_Position = projection * view * model * position;
  v_texCoord = texcoord;
  vec4 worldPos = model * position;
  WorldPos = worldPos.xyz;
}
