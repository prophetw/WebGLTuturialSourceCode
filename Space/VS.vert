#version 300 es

in vec4 position;

uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;
uniform mat4 u_MvpMatrix;

out vec4 v_Pos;

void main() {
  // mat4 u_MvpMatrix = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix;
  mat4 u_mv = u_ViewMatrix * u_ModelMatrix;
  gl_Position = u_MvpMatrix * position;
  // gl_Position = u_mv * position;
  // gl_Position = u_ModelMatrix * position;
  v_Pos = position;
}
