
attribute vec4 position;
attribute vec2 texCoord;
varying vec2 v_texCoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

void main() {
  // Multiply the position by the matrices.
  gl_Position = u_projection * u_view * u_world * position;
  v_texCoord = texCoord;
}
