attribute vec4 position;
attribute vec2 texcoord;

uniform mat4 u_MvpMatrix;

varying vec2 v_Texcoord;

void main() {
  gl_Position = u_MvpMatrix * position;
  v_Texcoord = texcoord;
}
