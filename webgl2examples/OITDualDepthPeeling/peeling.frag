
        #version 300 es
precision highp float;
precision highp sampler2D;

        #define MAX_DEPTH 99999.0

layout(std140, column_major) uniform;

uniform SceneUniforms {
  mat4 uViewProj;
  vec4 uEyePosition;
  vec4 uLightPosition;
};

uniform sampler2D uTexture;
uniform sampler2D uDepth;
uniform sampler2D uFrontColor;

in vec3 vPosition;
in vec2 vUV;
in vec3 vNormal;
flat in vec4 vColor;

// 2组
// allFBO   COLOR_ATTACHMENT0 COLOR_ATTACHMENT1 COLOR_ATTACHMENT2
// colorFBO                   COLOR_ATTACHMENT0 COLOR_ATTACHMENT1

layout(location = 0) out vec4 depth; // (-9999.0, -9999.0)   allFBO.COLOR_ATTACHMENT0 RG32F, R - negative front depth, G - back depth
layout(location = 1) out vec4 frontColor; // (0,0,0,0)       allFBO.COLOR_ATTACHMENT1 colorFBO.COLOR_ATTACHMENT0
layout(location = 2) out vec4 backColor; //   (0,0,0,0)      allFBO.COLOR_ATTACHMENT2 colorFBO.COLOR_ATTACHMENT1

void main() {

            // -------------------------
            // dual depth peeling
            // -------------------------
  // z 从 NDC坐标（-1,1）转换成窗口坐标范围  (0,1)
  // current frag depth
  float fragDepth = gl_FragCoord.z;   // 0 - 1
  ivec2 fragCoord = ivec2(gl_FragCoord.xy);

  // fetch from current background     first uDepth (-0,1)  first uFrontColor (0,0,0,0)
  vec2 lastDepth = texelFetch(uDepth, fragCoord, 0).rg;
  vec4 lastFrontColor = texelFetch(uFrontColor, fragCoord, 0);

            // depth value always increases
            // so we can use MAX blender equation
  depth.rg = vec2(-MAX_DEPTH);

            // front color always increases
            // so we can use MAX blender equation
  frontColor = lastFrontColor;

            // back color is separatly blend afterwards each pass
  backColor = vec4(0.0);

  float nearestDepth = -lastDepth.x;
  float furthestDepth = lastDepth.y;
  float alphaMultiplier = 1.0 - lastFrontColor.a; // alpha 乘数    resColor = Csrc * Ca + Cdes * (1-Ca)

  if(fragDepth < nearestDepth || fragDepth > furthestDepth) {
                // Skip this depth since it's been peeled.
    return;
  }

  if(fragDepth > nearestDepth && fragDepth < furthestDepth) {
                // This needs to be peeled.
                // the one remains after MAX blended for all need-to-peel will be peeled next pass
                // 获取剥离的层信息 比如 4个重合的点  depth 分别是 0 0.2 0.4 0.9 根据 MAX blend 最后使用的是 -0.9~0.9
    depth.rg = vec2(-fragDepth, fragDepth); // 实际上打印出来就是  (-0.1,0.1) 的效果 绿色 -0.1 = 0
    return;
  }

// 进入这个里面 说明 当前的 fragDepth 符合要求
// fragDepth == nearestDepth fragDepth == furthestDepth   最近的或者最远的
// return;
  // 相交
            // If it reaches here, it is the layer we need to render for this pass

            // -------------------------

  vec3 position = vPosition.xyz;
  vec3 normal = normalize(vNormal.xyz);
  vec2 uv = vUV;

  // vec4 baseColor = vColor * texture(uTexture, uv);
  vec4 baseColor = vColor;
  vec3 eyeDirection = normalize(uEyePosition.xyz - position);
  vec3 lightVec = uLightPosition.xyz - position;
  vec3 lightDirection = normalize(lightVec);
  vec3 reflectionDirection = reflect(-lightDirection, normal);
  float nDotL = max(dot(lightDirection, normal), 0.0);
  float diffuse = nDotL;
  float ambient = 0.2;
  float specular = pow(max(dot(reflectionDirection, eyeDirection), 0.0), 20.0);

  // 球原本颜色 + 球纹理 + 旁氏光照
  vec4 color = vec4((ambient + diffuse + specular) * baseColor.rgb, vColor.a);

            // dual depth peeling
            // write to back and front color buffer

  if(fragDepth == nearestDepth) {
    frontColor.rgb += color.rgb * color.a * alphaMultiplier;
    frontColor.a = 1.0 - alphaMultiplier * (1.0 - color.a);
  } else {
    backColor += color;
  }
}
