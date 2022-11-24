#version 300 es

in vec4 position;

uniform mat4 u_MvpMatrix;
uniform mat4 u_ModelMatrix;
uniform mat4 u_ViewMatrix;
uniform mat4 u_ProjMatrix;

out vec4 v_Pos;

void main() {
  mat4 viewModel = u_ViewMatrix * u_ModelMatrix;
  gl_Position = viewModel * position;
  v_Pos = gl_Position;
}
