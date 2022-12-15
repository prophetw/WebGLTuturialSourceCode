#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec2 texcoord;

uniform mat4 u_MvpMatrix;

out vec2 v_TexCoord;

void main() {

  v_TexCoord = texcoord;

	gl_Position = u_MvpMatrix * vec4(position, 1.0);

}
