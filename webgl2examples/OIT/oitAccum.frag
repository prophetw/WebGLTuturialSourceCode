#version 300 es
precision highp float;

layout(std140, column_major) uniform;

uniform SceneUniforms {
  mat4 uViewProj;
  vec4 uEyePosition;
  vec4 uLightPosition;
};

uniform sampler2D uTexture;

in vec3 vPosition;
in vec2 vUV;
in vec3 vNormal;
flat in vec4 vColor;

layout(location = 0) out vec4 accumColor;
layout(location = 1) out float accumAlpha;

float weight(float z, float a) {
  // 权重函数 frag 的深度和 frag 的透明度 计算出一个中间值  可能是深度越深 透明度作用越小 深度越前 透明的作用越大
  // 返回一个 0.01~3000 直接的值
  return clamp(pow(min(1.0, a * 10.0) + 0.01, 3.0) * 1e8 * pow(1.0 - z * 0.9, 3.0), 1e-2, 3e3);
}

void main() {
  vec3 position = vPosition.xyz;
  vec3 normal = normalize(vNormal.xyz);
  vec2 uv = vUV;

  vec4 baseColor = vColor * texture(uTexture, uv);
  vec3 eyeDirection = normalize(uEyePosition.xyz - position);
  vec3 lightVec = uLightPosition.xyz - position;
  vec3 lightDirection = normalize(lightVec);
  vec3 reflectionDirection = reflect(-lightDirection, normal);
  float nDotL = max(dot(lightDirection, normal), 0.0);
  float diffuse = nDotL;
  float ambient = 0.2;
  float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 20.0);

  vec4 color = vec4((ambient + diffuse + specular) * baseColor.rgb, vColor.a);
  color.rgb *= color.a;
  float w = weight(gl_FragCoord.z, color.a); // 权重函数 根据场景不同做适当调整
  // gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
  // blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha)
  // color(RGB) = (sourceColor * srcRGB) + (destinationColor * dstRGB)
  // color(A) = (sourceAlpha * srcAlpha) + (destinationAlpha * dstAlpha)
  accumColor = vec4(color.rgb * w, color.a); // 颜色累加
  accumAlpha = color.a * w;  // 透明度累加  blend
}
