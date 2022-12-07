attribute vec4 position;
attribute vec3 normal;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec3 v_worldPosition;
varying vec3 v_worldNormal;

void main() {
  // Multiply the position by the matrix.
  gl_Position = u_projection * u_view * u_world * position;

  // send the view position to the fragment shader
  v_worldPosition = (u_world * position).xyz;

  // orient the normals and pass to the fragment shader
  v_worldNormal = mat3(u_world) * normal;
}
