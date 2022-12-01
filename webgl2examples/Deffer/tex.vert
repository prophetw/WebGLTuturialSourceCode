
#version 300 es

layout(std140, column_major) uniform;

layout(location = 0) in vec4 aPosition;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec4 aUV;

uniform Matrices {
  mat4 uModelMatrix;
  mat4 uMVP;
};

out vec4 vPosition;
out vec4 vNormal;
out vec4 vUV;

void main() {
  vPosition = uModelMatrix * aPosition; // world position
  vNormal = uModelMatrix * vec4(aNormal, 0.0); // world position
  vUV = aUV;
  gl_Position = uMVP * aPosition;
}
