  #version 300 es

layout(std140, column_major) uniform;

layout(location = 0) in vec4 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec4 color;
layout(location = 4) in mat4 modelMatrix;

uniform SceneUniforms {
  mat4 uViewMatrix;
  mat4 uProjection;
  vec4 uEyePosition;
  vec4 uLightPosition;
};

out vec4 vPosition;
out vec2 vUV;
out vec4 vNormal;
out vec4 vViewPosition;
out vec4 vViewNormal;

void main() {
  vPosition = modelMatrix * position;
  vNormal = modelMatrix * vec4(normal, 0.0);
  vUV = uv;
  vViewPosition = uViewMatrix * vPosition;
  vViewNormal = uViewMatrix * vNormal;
  gl_Position = uProjection * vViewPosition;
}
