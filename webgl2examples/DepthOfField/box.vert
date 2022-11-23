 #version 300 es

layout(std140, column_major) uniform;

layout(location = 0) in vec4 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec3 normal;
layout(location = 3) in mat4 modelMatrix;

uniform SceneUniforms {
  mat4 uViewProj;
  vec4 uEyePosition;
  vec4 uLightPosition;
};

out vec3 vPosition;
out vec2 vUV;
out vec3 vNormal;
void main() {
  vec4 worldPosition = modelMatrix * position;
  vPosition = worldPosition.xyz;
  vUV = uv;
  vNormal = mat3(modelMatrix) * normal;
  gl_Position = uViewProj * worldPosition;
}
