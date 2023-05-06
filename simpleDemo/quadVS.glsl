// quad vertex shader

attribute vec3 position;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
	vec3 pos = projection * view * model * position;
	gl_Position = vec4(pos, 1.0);
}