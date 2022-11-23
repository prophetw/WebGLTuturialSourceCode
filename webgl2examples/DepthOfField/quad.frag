 #version 300 es
precision highp float;

layout(std140, column_major) uniform;

        #define MAX_BLUR 20.0

uniform DOFUniforms {
  float uFocusDistance;
  float uBlurCoefficient;
  float uPPM;
  vec2 uDepthRange;
  vec2 uResolution;
};

uniform vec2 uTexelOffset;

uniform sampler2D uColor;
uniform sampler2D uDepth;

// out vec4 fragColor;
// out vec4 depthTex;

layout(location = 0) out vec4 fragColor; // (0,0,0,0)       allFBO.COLOR_ATTACHMENT1 colorFBO.COLOR_ATTACHMENT0
layout(location = 1) out vec4 depthTex; // (-9999.0, -9999.0)   allFBO.COLOR_ATTACHMENT0 RG32F, R - negative front depth, G - back depth

vec4 packDepth(float depth)
{
    // See Aras Pranckevičius' post Encoding Floats to RGBA
    // http://aras-p.info/blog/2009/07/30/encoding-floats-to-rgba-the-final/
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * depth;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    return enc;
}

void main() {
  ivec2 fragCoord = ivec2(gl_FragCoord.xy);
  ivec2 resolution = ivec2(uResolution) - 1;

            // Convert to linear depth
  float ndc = 2.0 * texelFetch(uDepth, fragCoord, 0).r - 1.0; // [0~1]  => [-1,1]
  float depth = -(2.0 * uDepthRange.y * uDepthRange.x) / (ndc * (uDepthRange.y - uDepthRange.x) - uDepthRange.y - uDepthRange.x);
  float deltaDepth = abs(uFocusDistance - depth);

  vec4 dep = texelFetch(uDepth, fragCoord, 0);
  depthTex = dep;
            // Blur more quickly in the foreground.
  float xdd = depth < uFocusDistance ? abs(uFocusDistance - deltaDepth) : abs(uFocusDistance + deltaDepth);
  float blurRadius = min(floor(uBlurCoefficient * (deltaDepth / xdd) * uPPM), MAX_BLUR);

  vec4 color = vec4(0.0);
  if(blurRadius > 1.0) {
    float halfBlur = blurRadius * 0.5;

    float count = 0.0;

    for(float i = 0.0; i <= MAX_BLUR; ++i) {
      if(i > blurRadius) {
        break;
      }

                    // texelFetch outside texture gives vec4(0.0) (undefined in ES 3)
      ivec2 sampleCoord = clamp(fragCoord + ivec2(((i - halfBlur) * uTexelOffset)), ivec2(0), resolution);
      color += texelFetch(uColor, sampleCoord, 0);

      ++count;
    }

    color /= count;
  } else {
    color = texelFetch(uColor, fragCoord, 0);
  }

  fragColor = color;
}
