#extension GL_EXT_draw_buffers : enable 
#extension GL_OES_standard_derivatives : enable
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable
#extension GL_EXT_frag_depth : enable 
#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp sampler2D;
#else
    precision mediump float;
    precision mediump sampler2D;
#endif

#define LOG_DEPTH
#define OES_texture_float_linear

struct czm_depthRangeStruct {
    float near;
    float far;
};
uniform float czm_log2FarDepthFromNearPlusOne;
uniform vec2 czm_currentFrustum;
uniform mat4 czm_viewportTransformation;
const float czm_epsilon7 = 0.0000001;
float czm_unpackDepth(vec4 packedDepth) {
    return dot(packedDepth, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0));
}
uniform vec4 czm_viewport;
uniform float czm_oneOverLog2FarDepthFromNearPlusOne;
uniform float czm_farDepthFromNearPlusOne;
const czm_depthRangeStruct czm_depthRange = czm_depthRangeStruct(0.0, 1.0);
float czm_reverseLogDepth(float logZ) {
    #ifdef LOG_DEPTH
        float near = czm_currentFrustum.x;
        float far = czm_currentFrustum.y;
        float log2Depth = logZ * czm_log2FarDepthFromNearPlusOne;
        float depthFromNear = pow(2.0, log2Depth) - 1.0;
        return far * (1.0 - near / (depthFromNear + near)) / (far - near);
    #endif
    return logZ;
}
uniform float czm_gamma;
float czm_alphaWeight(float a) {
    float z = (gl_FragCoord.z - czm_viewportTransformation[3][2]) / czm_viewportTransformation[2][2];
    return pow(a + 0.01, 4.0) + max(1e-2, min(3.0 * 1e3, 0.003 / (1e-5 + pow(abs(z) / 200.0, 4.0))));
}
#ifdef LOG_DEPTH
    float czm_logDepth;
    #ifdef REVERSE_WRITE_DEPTH
        varying vec4 v_eyeCoordinate;
        uniform sampler2D depth_colorTexture;
        float getDepth(in float z) {
            float z_window = czm_reverseLogDepth(z);
            float n_range = czm_depthRange.near;
            float f_range = czm_depthRange.far;
            float d = (2.0 * z_window - n_range - f_range) / (f_range - n_range);
            return d;
        }
    #endif
    varying float v_depthFromNearPlusOne;
    #ifdef POLYGON_OFFSET
        uniform vec2 u_polygonOffset;
    #endif
#endif
void czm_writeLogDepth(float depth) {
    #if defined(GL_EXT_frag_depth) && defined(LOG_DEPTH)
        if (depth <= 0.9999999 || depth > czm_farDepthFromNearPlusOne) {
            discard;
        }
        #ifdef POLYGON_OFFSET
            float factor = u_polygonOffset[0];
            float units = u_polygonOffset[1];
            #ifdef GL_OES_standard_derivatives
                float x = dFdx(depth);
                float y = dFdy(depth);
                float m = sqrt(x * x + y * y);
                depth += m * factor;
            #endif // GL_OES_standard_derivatives
        #endif // POLYGON_OFFSET
        #ifdef REVERSE_WRITE_DEPTH
            if(gl_FrontFacing == false) {
                depth -= 0.01;
            }
            float d = log2(depth) * czm_oneOverLog2FarDepthFromNearPlusOne;
            vec2 st = gl_FragCoord.xy / czm_viewport.zw;
            float textureDepth = czm_unpackDepth(texture2D(depth_colorTexture, st));
            if(d > textureDepth && d < 1.0 && gl_FrontFacing == false) {
                float scale = (d - textureDepth) / (1.0 - textureDepth);
                d = scale * (textureDepth * 0.5) + textureDepth * 0.5;
            }
            else if(d < textureDepth) {
                d = (textureDepth - d) * 0.5;
            }
            czm_logDepth = d;
        #else
            czm_logDepth = log2(depth) * czm_oneOverLog2FarDepthFromNearPlusOne;
        #endif //REVERSE_WRITE_DEPTH
        #ifdef POLYGON_OFFSET
            czm_logDepth += czm_epsilon7 * units;
        #endif
        gl_FragDepthEXT = czm_logDepth;
    #endif //defined(GL_EXT_frag_depth) && defined(LOG_DEPTH)
}
void czm_writeLogDepth() {
    #ifdef LOG_DEPTH
        czm_writeLogDepth(v_depthFromNearPlusOne);
    #endif
}
vec3 czm_gammaCorrect(vec3 color) {
    #ifdef HDR
        color = pow(color, vec3(czm_gamma));
    #endif
    return color;
}
vec4 czm_gammaCorrect(vec4 color) {
    #ifdef HDR
        color.rgb = pow(color.rgb, vec3(czm_gamma));
    #endif
    return color;
}
uniform float czm_startSnowTime;
uniform float czm_time;
uniform vec3 czm_encodedCameraPositionMCLow;
uniform vec3 czm_encodedCameraPositionMCHigh;
uniform float czm_cameraPicth;
uniform mat4 czm_inverseView;
uniform sampler2D czm_environmentBrdfSampler;
uniform float czm_specularEnvironmentMapsMaximumLOD;
uniform vec2 czm_specularEnvironmentMapSize;
uniform sampler2D czm_specularEnvironmentMaps;
vec3 czm_sampleOctahedralProjectionWithFiltering(sampler2D projectedMap, vec2 textureSize, vec3 direction, float lod) {
    direction /= dot(vec3(1.0), abs(direction));
    vec2 rev = abs(direction.zx) - vec2(1.0);
    vec2 neg = vec2(direction.x < 0.0 ? rev.x : -rev.x, direction.z < 0.0 ? rev.y : -rev.y);
    vec2 uv = direction.y < 0.0 ? neg : direction.xz;
    vec2 coord = 0.5 * uv + vec2(0.5);
    vec2 pixel = 1.0 / textureSize;
    if (lod > 0.0) {
        float scale = 1.0 / pow(2.0, lod);
        float offset = ((textureSize.y + 1.0) / textureSize.x);
        coord.x *= offset;
        coord *= scale;
        coord.x += offset + pixel.x;
        coord.y += (1.0 - (1.0 / pow(2.0, lod - 1.0))) + pixel.y * (lod - 1.0) * 2.0;
    }
    else {
        coord.x *= (textureSize.y / textureSize.x);
    }
    #ifndef OES_texture_float_linear
        vec3 color1 = texture2D(projectedMap, coord + vec2(0.0, pixel.y)).rgb;
        vec3 color2 = texture2D(projectedMap, coord + vec2(pixel.x, 0.0)).rgb;
        vec3 color3 = texture2D(projectedMap, coord + pixel).rgb;
        vec3 color4 = texture2D(projectedMap, coord).rgb;
        vec2 texturePosition = coord * textureSize;
        float fu = fract(texturePosition.x);
        float fv = fract(texturePosition.y);
        vec3 average1 = mix(color4, color2, fu);
        vec3 average2 = mix(color1, color3, fu);
        vec3 color = mix(average1, average2, fv);
    #else
        vec3 color = texture2D(projectedMap, coord).rgb;
    #endif
    return color;
}
vec3 czm_sampleOctahedralProjection(sampler2D projectedMap, vec2 textureSize, vec3 direction, float lod, float maxLod) {
    float currentLod = floor(lod + 0.5);
    float nextLod = min(currentLod + 1.0, maxLod);
    vec3 colorCurrentLod = czm_sampleOctahedralProjectionWithFiltering(projectedMap, textureSize, direction, currentLod);
    vec3 colorNextLod = czm_sampleOctahedralProjectionWithFiltering(projectedMap, textureSize, direction, nextLod);
    return mix(colorNextLod, colorCurrentLod, nextLod - lod);
}
uniform vec3 czm_sphericalHarmonicCoefficients[9];
vec3 czm_sphericalHarmonics(vec3 normal, vec3 coefficients[9]) {
    const float c1 = 0.429043;
    const float c2 = 0.511664;
    const float c3 = 0.743125;
    const float c4 = 0.886227;
    const float c5 = 0.247708;
    vec3 L00 = coefficients[0];
    vec3 L1_1 = coefficients[1];
    vec3 L10 = coefficients[2];
    vec3 L11 = coefficients[3];
    vec3 L2_2 = coefficients[4];
    vec3 L2_1 = coefficients[5];
    vec3 L20 = coefficients[6];
    vec3 L21 = coefficients[7];
    vec3 L22 = coefficients[8];
    float x = normal.x;
    float y = normal.y;
    float z = normal.z;
    return c1 * L22 * (x * x - y * y) + c3 * L20 * z * z + c4 * L00 - c5 * L20 +
    2.0 * c1 * (L2_2 * x * y + L21 * x * z + L2_1 * y * z) +
    2.0 * c2 * (L11 * x + L1_1 * y + L10 * z);
}
uniform sampler2D czm_brdfLut;
uniform samplerCube czm_environmentMap;
uniform mat3 czm_temeToPseudoFixed;
uniform vec3 czm_ellipsoidRadii;
uniform mat3 czm_inverseViewRotation;
uniform vec3 czm_lightDirectionEC;
uniform float czm_lightScaleFactor;
uniform vec3 czm_lightColorHdr;
struct czm_lightStruct {
    vec3 positionWC;
    vec3 positionEC;
    vec3 normal;
    vec3 baseColor;
    vec3 diffuseColor;
    vec3 specularColor;
    float roughness;
    float alpha;
    vec3 lightColor;
    vec3 lightPosition;
    vec4 lightDirection;
    vec4 lightFalloff;
};
const vec4 K_HSB2RGB = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 czm_HSBToRGB(vec3 hsb) {
    vec3 p = abs(fract(hsb.xxx + K_HSB2RGB.xyz) * 6.0 - K_HSB2RGB.www);
    return hsb.z * mix(K_HSB2RGB.xxx, clamp(p - K_HSB2RGB.xxx, 0.0, 1.0), hsb.y);
}
const vec4 K_RGB2HSB = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
vec3 czm_RGBToHSB(vec3 rgb) {
    vec4 p = mix(vec4(rgb.bg, K_RGB2HSB.wz), vec4(rgb.gb, K_RGB2HSB.xy), step(rgb.b, rgb.g));
    vec4 q = mix(vec4(p.xyw, rgb.r), vec4(rgb.r, p.yzx), step(p.x, rgb.r));
    float d = q.x - min(q.w, q.y);
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + czm_epsilon7)), d / (q.x + czm_epsilon7), q.x);
}
uniform float czm_frameNumber;
uniform mat4 czm_inverseModel;
vec3 czm_acesTonemapping(vec3 color) {
    float g = 0.985;
    float a = 0.065;
    float b = 0.0001;
    float c = 0.433;
    float d = 0.238;
    color = (color * (color + a) - b) / (color * (g * color + c) + d);
    color = clamp(color, 0.0, 1.0);
    return color;
}
const float czm_epsilon3 = 0.001;
vec4 czm_gl_FragColor;
bool czm_discard = false;
#define USE_SUN_LUMINANCE 
uniform float gltf_luminanceAtZenith;
uniform mat4 gltf_clippingPlanesMatrix;
#define USE_IBL_LIGHTING 

#define PLANE_MODE
vec3 normal;
varying vec3 v_positionEC;
varying vec3 real_position;
uniform float tile_colorBlend;
vec4 tile_diffuse = vec4(1.0);
vec4 tile_texDiffuse = vec4(1.0);
bool isWhite(vec3 color) {
    return all(greaterThan(color, vec3(1.0 - czm_epsilon3)));
}
vec4 tile_diffuse_final(vec4 sourceDiffuse, vec4 tileDiffuse) {
    vec4 blendDiffuse = mix(sourceDiffuse, tileDiffuse, tile_colorBlend);
    vec4 diffuse = isWhite(tileDiffuse.rgb) ? sourceDiffuse : blendDiffuse;
    return vec4(diffuse.rgb, sourceDiffuse.a);
}
varying vec4 pbrBaseColor;
uniform vec3 u_emissiveFactor;
uniform float exposure;
uniform float brightMax;
uniform bool useGradual;
uniform vec3 startColor;
uniform vec3 endColor;
uniform float gradualOffset;
uniform bool enableForcePbr;
uniform float forceMetallic;
uniform float forceRoughness;
uniform float circleDataLength;
uniform vec4 circleData[8];
uniform float zbufferPriority;
uniform bool planView;
varying vec3 posMC;
#define TEXURTE_PBRMAT_VER 1

varying vec4 pbrMetallicRoughness;
varying vec3 pbrCheckColor;
varying vec4 pbrRectColor0;
#ifdef USE_IBL_LIGHTING 
    uniform vec2 gltf_iblFactor;
#endif 
#ifdef USE_CUSTOM_LIGHT_COLOR 
    uniform vec3 gltf_lightColor;
#endif 
const float M_PI = 3.1415926535897932384626433832795;
const vec3 LuminanceEncodeApprox = vec3(0.2126, 0.7152, 0.0722);
const float Epsilon = 0.0000001;
const mat4 sunlightDiffuseMatrix = mat4(0.1682, 0.0032, -0.0543, -0.2457, 0.0032, -0.0463, 0.0314, -0.0083, -0.0543, 0.0314, -0.1396, 0.1652, -0.2457, -0.0083, 0.1652, 0.6191);
#define saturate(x)    clamp(x, 0.0, 1.0)
#define absEps(x)      abs(x) + Epsilon
#define maxEps(x)      max(x, Epsilon)
#define saturateEps(x) clamp(x, Epsilon, 1.0)
#ifdef GL_OES_standard_derivatives
    
#endif
#ifdef GL_EXT_shader_texture_lod
    
#endif
vec3 lambertianDiffuse(vec3 diffuseColor) {
    return diffuseColor / M_PI;
}
vec3 fresnelSchlick2(vec3 f0, vec3 f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}
vec3 fresnelSchlick(float metalness, float VdotH) {
    return metalness + (vec3(1.0) - metalness) * pow(1.0 - VdotH, 5.0);
}
float smithVisibilityG1(float NdotV, float roughness) {
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
}
float smithVisibilityGGX(float roughness, float NdotL, float NdotV) {
    return smithVisibilityG1(NdotL, roughness) * smithVisibilityG1(NdotV, roughness);
}
float GGX(float roughness, float NdotH) {
    float roughnessSquared = roughness * roughness;
    float f = (NdotH * roughnessSquared - NdotH) * NdotH + 1.0;
    return roughnessSquared / (M_PI * f * f);
}
vec3 wgs84ToCartesian(vec3 p) {
    vec3 vn = vec3(cos(p.y) * cos(p.x), cos(p.y) * sin(p.x), sin(p.y));
    vn = normalize(vn);
    vec3 vk = vec3(40680631590769., 40680631590769., 40408299984661.445) * vn;
    float gamma = sqrt(dot(vn, vk));
    vk = vk / gamma;
    return vk;
}
vec3 SRGBtoLINEAR3(vec3 srgbIn) {
    return pow(srgbIn, vec3(2.2));
}
vec4 SRGBtoLINEAR4(vec4 srgbIn) {
    vec3 linearOut = pow(srgbIn.rgb, vec3(2.2));
    return vec4(linearOut, srgbIn.a);
}
vec3 applyTonemapping(vec3 linearIn) {
    #ifndef HDR
        return czm_acesTonemapping(linearIn);
    #else
        return linearIn;
    #endif
}
vec3 LINEARtoSRGB(vec3 linearIn) {
    #ifndef HDR
        return pow(linearIn, vec3(1.0 / 2.2));
    #else
        return linearIn;
    #endif
}
vec3 decode_pnghdr(const in vec4 color) {
    vec4 res = color * color;
    float ri = pow(2.0, res.w * 32.0 - 16.0);
    res.xyz = res.xyz * ri;
    return res.xyz;
}
vec4 calculateCircleColor(vec4 color, vec4 dimensions) {
    float circle = 0.0;
    vec3 cColor = color.xyz;
    float radius = color.w;
    vec2 lonlat = dimensions.xy;
    float width = dimensions.z;
    vec3 centerPos = wgs84ToCartesian(vec3(lonlat, 0.0));
    vec3 circlePos = (czm_inverseModel * vec4(centerPos, 1.0)).xyz;
    float time = mod(czm_frameNumber, radius) * 1.0;
    float innerTail = width;
    float frontierBorder = 1.0;
    float r1 = length(circlePos.xy - (posMC.xy));
    circle += smoothstep(time - innerTail, time, r1) * smoothstep(time + frontierBorder, time, r1);
    circle *= smoothstep(0.0, 0.0, distance(circlePos.xy, posMC.xy));
    return vec4(circle, circle, circle, circle) * vec4(cColor, 1.0);
}
float random(vec3 scale, float seed) {
    return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
}
vec2 computeTexCoord(vec2 texCoords, vec2 offset, float rotation, vec2 scale) {
    rotation = -rotation;
    mat3 transform = mat3(
    cos(rotation) * scale.x, sin(rotation) * scale.x, 0.0, -sin(rotation) * scale.y, cos(rotation) * scale.y, 0.0, offset.x, offset.y, 1.0);
    vec2 transformedTexCoords = (transform * vec3(fract(texCoords), 1.0)).xy;
    return transformedTexCoords;
}
vec3 addSaturation(vec3 color) {
    vec3 hsb = czm_RGBToHSB(color);
    hsb.y += 0.05;
    hsb.y = clamp(hsb.y, 0.0, 1.0);
    color = czm_HSBToRGB(hsb);
    return color;
}
vec3 addNoise(vec3 color) {
    float noise = 0.02 * (0.5 - random(vec3(1.0), length(gl_FragCoord)));
    color += vec3(noise);
    return color;
}
struct pbrColorStruct {
    vec3 lightColor;
    vec3 iblColor;
    float alpha;
};
pbrColorStruct pbrPointLight(czm_lightStruct lightInfo) {
    vec3 n = lightInfo.normal;
    vec3 v = -normalize(lightInfo.positionEC);
    float roughness = lightInfo.roughness;
    vec3 diffuseColor = lightInfo.diffuseColor;
    vec3 specularColor = lightInfo.specularColor;
    float distance = length(lightInfo.lightPosition - lightInfo.positionEC);
    float lightIntensity = lightInfo.lightFalloff.x;
    float range = lightInfo.lightFalloff.y;
    float attenuation = 1.0;
    if (range > 0.0) {
        attenuation = max(min(1.0 - pow(distance / range, 4.0), 1.0), 0.0) / (distance * distance);
    }
    else {
        attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);
    }
    vec3 lightColorHdr = lightInfo.lightColor * lightIntensity * attenuation;
    vec3 l = normalize(lightInfo.lightPosition - lightInfo.positionEC);
    vec3 h = normalize(v + l);
    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotV = abs(dot(n, v)) + 0.001;
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);
    float alpha = roughness * roughness;
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
    vec3 r90 = vec3(clamp(reflectance * 25.0, 0.0, 1.0));
    vec3 r0 = specularColor.rgb;
    vec3 F = fresnelSchlick2(r0, r90, VdotH);
    float G = smithVisibilityGGX(alpha, NdotL, NdotV);
    float D = GGX(alpha, NdotH);
    vec3 diffuseContribution = (1.0 - F) * lambertianDiffuse(diffuseColor);
    vec3 specularContribution = F * G * D / (4.0 * NdotL * NdotV);
    pbrColorStruct pbrColor;
    pbrColor.lightColor = NdotL * lightColorHdr * (diffuseContribution + specularContribution);
    return pbrColor;
}
pbrColorStruct pbrSpotLight(czm_lightStruct lightInfo) {
    vec3 l = normalize(lightInfo.lightPosition - lightInfo.positionEC);
    float cosAngle = max(0.0, dot(lightInfo.lightDirection.xyz, -l));
    pbrColorStruct pbrColor;
    if (cosAngle >= lightInfo.lightDirection.w) {
        vec3 n = lightInfo.normal;
        vec3 v = -normalize(lightInfo.positionEC);
        float roughness = lightInfo.roughness;
        vec3 diffuseColor = lightInfo.diffuseColor;
        vec3 specularColor = lightInfo.specularColor;
        float distance = length(lightInfo.lightPosition - lightInfo.positionEC);
        float lightIntensity = lightInfo.lightFalloff.x;
        float range = lightInfo.lightFalloff.y;
        float lightAngleScale = lightInfo.lightFalloff.z;
        float lightAngleOffset = lightInfo.lightFalloff.w;
        vec3 direction = normalize(lightInfo.lightDirection.xyz);
        float cd = dot(-direction, l);
        float attenuation = clamp(cd * lightAngleScale + lightAngleOffset, 0.0, 1.0);
        attenuation *= attenuation;
        vec3 lightColorHdr = lightInfo.lightColor * lightIntensity * attenuation;
        vec3 h = normalize(v + l);
        float NdotL = clamp(dot(n, l), 0.001, 1.0);
        float NdotV = abs(dot(n, v)) + 0.001;
        float NdotH = clamp(dot(n, h), 0.0, 1.0);
        float VdotH = clamp(dot(v, h), 0.0, 1.0);
        float alpha = roughness * roughness;
        float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
        vec3 r90 = vec3(clamp(reflectance * 25.0, 0.0, 1.0));
        vec3 r0 = specularColor.rgb;
        vec3 F = fresnelSchlick2(r0, r90, VdotH);
        float G = smithVisibilityGGX(alpha, NdotL, NdotV);
        float D = GGX(alpha, NdotH);
        vec3 diffuseContribution = (1.0 - F) * lambertianDiffuse(diffuseColor);
        vec3 specularContribution = F * G * D / (4.0 * NdotL * NdotV);
        pbrColor.lightColor = NdotL * lightColorHdr * (diffuseContribution + specularContribution);
    }
    else {
        pbrColor.lightColor = vec3(0.0);
    }
    return pbrColor;
}
pbrColorStruct pbrDirectionLight(czm_lightStruct lightInfo) {
    vec3 n = lightInfo.normal;
    vec3 v = -normalize(lightInfo.positionEC);
    float roughness = lightInfo.roughness;
    vec3 diffuseColor = lightInfo.diffuseColor;
    vec3 specularColor = lightInfo.specularColor;
    float lightIntensity = lightInfo.lightFalloff.x;
    vec3 lightColorHdr = lightInfo.lightColor * lightIntensity;
    vec3 l = normalize(-lightInfo.lightDirection.xyz);
    vec3 h = normalize(v + l);
    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotV = abs(dot(n, v)) + 0.001;
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);
    float alpha = roughness * roughness;
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
    vec3 r90 = vec3(clamp(reflectance * 25.0, 0.0, 1.0));
    vec3 r0 = specularColor.rgb;
    vec3 F = fresnelSchlick2(r0, r90, VdotH);
    float G = smithVisibilityGGX(alpha, NdotL, NdotV);
    float D = GGX(alpha, NdotH);
    vec3 diffuseContribution = (1.0 - F) * lambertianDiffuse(diffuseColor);
    vec3 specularContribution = F * G * D / (4.0 * NdotL * NdotV);
    pbrColorStruct pbrColor;
    pbrColor.lightColor = NdotL * lightColorHdr * (diffuseContribution + specularContribution);
    return pbrColor;
}
pbrColorStruct pbrCesiumjs(czm_lightStruct lightInfo) {
    vec3 n = lightInfo.normal;
    vec3 v = -normalize(lightInfo.positionEC);
    float roughness = lightInfo.roughness;
    vec3 diffuseColor = lightInfo.diffuseColor;
    vec3 specularColor = lightInfo.specularColor;
    vec3 positionWC = lightInfo.positionWC;
    #ifndef USE_CUSTOM_LIGHT_COLOR
        vec3 lightColorHdr = czm_lightColorHdr;
    #else
        vec3 lightColorHdr = gltf_lightColor;
    #endif
    lightColorHdr *= czm_lightScaleFactor;
    vec3 l = normalize(czm_lightDirectionEC);
    vec3 h = normalize(v + l);
    float NdotL = clamp(dot(n, l), 0.001, 1.0);
    float NdotV = abs(dot(n, v)) + 0.001;
    float NdotH = clamp(dot(n, h), 0.0, 1.0);
    float VdotH = clamp(dot(v, h), 0.0, 1.0);
    float alpha = roughness * roughness;
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
    vec3 r90 = vec3(clamp(reflectance * 25.0, 0.0, 1.0));
    vec3 r0 = specularColor.rgb;
    vec3 F = fresnelSchlick2(r0, r90, VdotH);
    float G = smithVisibilityGGX(alpha, NdotL, NdotV);
    float D = GGX(alpha, NdotH);
    vec3 diffuseContribution = (1.0 - F) * lambertianDiffuse(diffuseColor);
    vec3 specularContribution = F * G * D / (4.0 * NdotL * NdotV);
    pbrColorStruct pbrColor;
    pbrColor.lightColor = NdotL * lightColorHdr * (diffuseContribution + specularContribution);
    #if defined(USE_IBL_LIGHTING) && !defined(DIFFUSE_IBL) && !defined(SPECULAR_IBL)
        vec3 r = normalize(czm_inverseViewRotation * normalize(reflect(v, n)));
        float vertexRadius = length(positionWC);
        float horizonDotNadir = 1.0 - min(1.0, czm_ellipsoidRadii.x / vertexRadius);
        float reflectionDotNadir = dot(r, normalize(positionWC));
        r.x = -r.x;
        r = -normalize(czm_temeToPseudoFixed * r);
        r.x = -r.x;
        float inverseRoughness = 1.04 - roughness;
        inverseRoughness *= inverseRoughness;
        vec3 sceneSkyBox = textureCube(czm_environmentMap, r).rgb * inverseRoughness;
        float atmosphereHeight = 0.05;
        float blendRegionSize = 0.1 * ((1.0 - inverseRoughness) * 8.0 + 1.1 - horizonDotNadir);
        float blendRegionOffset = roughness * -1.0;
        float farAboveHorizon = clamp(horizonDotNadir - blendRegionSize * 0.5 + blendRegionOffset, 1.0e-10 - blendRegionSize, 0.99999);
        float aroundHorizon = clamp(horizonDotNadir + blendRegionSize * 0.5, 1.0e-10 - blendRegionSize, 0.99999);
        float farBelowHorizon = clamp(horizonDotNadir + blendRegionSize * 1.5, 1.0e-10 - blendRegionSize, 0.99999);
        float smoothstepHeight = smoothstep(0.0, atmosphereHeight, horizonDotNadir);
        vec3 belowHorizonColor = mix(vec3(0.1, 0.15, 0.25), vec3(0.4, 0.7, 0.9), smoothstepHeight);
        vec3 nadirColor = belowHorizonColor * 0.5;
        vec3 aboveHorizonColor = mix(vec3(0.9, 1.0, 1.2), belowHorizonColor, roughness * 0.5);
        vec3 blueSkyColor = mix(vec3(0.18, 0.26, 0.48), aboveHorizonColor, reflectionDotNadir * inverseRoughness * 0.5 + 0.75);
        vec3 zenithColor = mix(blueSkyColor, sceneSkyBox, smoothstepHeight);
        vec3 blueSkyDiffuseColor = vec3(0.7, 0.85, 0.9);
        float diffuseIrradianceFromEarth = (1.0 - horizonDotNadir) * (reflectionDotNadir * 0.25 + 0.75) * smoothstepHeight;
        float diffuseIrradianceFromSky = (1.0 - smoothstepHeight) * (1.0 - (reflectionDotNadir * 0.25 + 0.25));
        vec3 diffuseIrradiance = blueSkyDiffuseColor * clamp(diffuseIrradianceFromEarth + diffuseIrradianceFromSky, 0.0, 1.0);
        float notDistantRough = (1.0 - horizonDotNadir * roughness * 0.8);
        vec3 specularIrradiance = mix(zenithColor, aboveHorizonColor, smoothstep(farAboveHorizon, aroundHorizon, reflectionDotNadir) * notDistantRough);
        specularIrradiance = mix(specularIrradiance, belowHorizonColor, smoothstep(aroundHorizon, farBelowHorizon, reflectionDotNadir) * inverseRoughness);
        specularIrradiance = mix(specularIrradiance, nadirColor, smoothstep(farBelowHorizon, 1.0, reflectionDotNadir) * inverseRoughness);
        #ifdef USE_SUN_LUMINANCE
            float LdotZenith = clamp(dot(normalize(czm_inverseViewRotation * l), normalize(positionWC * -1.0)), 0.001, 1.0);
            float S = acos(LdotZenith);
            float NdotZenith = clamp(dot(normalize(czm_inverseViewRotation * n), normalize(positionWC * -1.0)), 0.001, 1.0);
            float gamma = acos(NdotL);
            float numerator = ((0.91 + 10.0 * exp(-3.0 * gamma) + 0.45 * pow(NdotL, 2.0)) * (1.0 - exp(-0.32 / NdotZenith)));
            float denominator = (0.91 + 10.0 * exp(-3.0 * S) + 0.45 * pow(LdotZenith, 2.0)) * (1.0 - exp(-0.32));
            float luminance = gltf_luminanceAtZenith * (numerator / denominator);
        #endif
        vec2 brdfLut = texture2D(czm_brdfLut, vec2(NdotV, roughness)).rg;
        vec3 IBLColor = (diffuseIrradiance * diffuseColor * gltf_iblFactor.x) + (specularIrradiance * SRGBtoLINEAR3(specularColor * brdfLut.x + brdfLut.y) * gltf_iblFactor.y);
        float maximumComponent = max(max(lightColorHdr.x, lightColorHdr.y), lightColorHdr.z);
        vec3 lightColor = lightColorHdr / max(maximumComponent, 1.0);
        IBLColor *= lightColor;
        #ifdef USE_SUN_LUMINANCE
            pbrColor.iblColor = IBLColor * luminance;
        #else
            pbrColor.iblColor = IBLColor;
        #endif
        #elif defined(DIFFUSE_IBL) || defined(SPECULAR_IBL)
        mat3 fixedToENU = mat3(gltf_clippingPlanesMatrix[0][0], gltf_clippingPlanesMatrix[1][0], gltf_clippingPlanesMatrix[2][0], gltf_clippingPlanesMatrix[0][1], gltf_clippingPlanesMatrix[1][1], gltf_clippingPlanesMatrix[2][1], gltf_clippingPlanesMatrix[0][2], gltf_clippingPlanesMatrix[1][2], gltf_clippingPlanesMatrix[2][2]);
        #ifdef PLANE_MODE
            const mat3 yUpToZUp = mat3(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0);
            const mat3 rotationZ = mat3(-1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0);
            vec3 cubeDir = normalize(rotationZ * yUpToZUp * czm_inverseViewRotation * normalize(reflect(-v, n)));
        #else
            const mat3 yUpToZUp = mat3(-1.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0);
            vec3 cubeDir = normalize(yUpToZUp * fixedToENU * normalize(reflect(-v, n)));
        #endif
        #ifdef DIFFUSE_IBL
            #ifdef CUSTOM_SPHERICAL_HARMONICS
                vec3 diffuseIrradiance = czm_sphericalHarmonics(cubeDir, gltf_sphericalHarmonicCoefficients);
            #else
                vec3 diffuseIrradiance = czm_sphericalHarmonics(cubeDir, czm_sphericalHarmonicCoefficients);
            #endif
        #else
            vec3 diffuseIrradiance = vec3(0.0);
        #endif
        #ifdef SPECULAR_IBL
            vec2 brdfLut = texture2D(czm_brdfLut, vec2(NdotV, roughness)).rg;
            #ifdef CUSTOM_SPECULAR_IBL
                vec3 specularIBL = czm_sampleOctahedralProjection(gltf_specularMap, gltf_specularMapSize, cubeDir, roughness * gltf_maxSpecularLOD, gltf_maxSpecularLOD);
            #else
                vec3 specularIBL = czm_sampleOctahedralProjection(czm_specularEnvironmentMaps, czm_specularEnvironmentMapSize, cubeDir, roughness * czm_specularEnvironmentMapsMaximumLOD, czm_specularEnvironmentMapsMaximumLOD);
            #endif
            specularIBL *= F * brdfLut.x + brdfLut.y;
        #else
            vec3 specularIBL = vec3(0.0);
        #endif
        pbrColor.iblColor = diffuseIrradiance * diffuseColor + specularColor * specularIBL;
    #endif
    return pbrColor;
}
float square(float value) {
    return value * value;
}
float pow5(float value) {
    float sq = value * value;
    return sq * sq * value;
}
vec3 fresnelSchlickGGX(float VdotH, vec3 reflectance0, vec3 reflectance90) {
    return reflectance0 + (reflectance90 - reflectance0) * pow5(1.0 - VdotH);
}
vec2 getAARoughnessFactors(vec3 normalVector) {
    #ifdef GL_OES_standard_derivatives
        vec3 nDfdx = dFdx(normalVector.xyz);
        vec3 nDfdy = dFdy(normalVector.xyz);
        float slopeSquare = max(dot(nDfdx, nDfdx), dot(nDfdy, nDfdy));
        float geometricRoughnessFactor = pow(saturate(slopeSquare), 0.333);
        float geometricAlphaGFactor = sqrt(slopeSquare);
        geometricAlphaGFactor *= 0.75;
        return vec2(geometricRoughnessFactor, geometricAlphaGFactor);
    #else
        return vec2(1.0, 1.0);
    #endif
}
#define MINIMUMVARIANCE 0.0005
float convertRoughnessToAverageSlope(float roughness) {
    return square(roughness) + MINIMUMVARIANCE;
}
float normalDistributionFunction_TrowbridgeReitzGGX(float NdotH, float alphaG) {
    float a2 = square(alphaG);
    float d = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (M_PI * d * d);
}
float smithVisibility_GGXCorrelated(float NdotL, float NdotV, float alphaG) {
    float a2 = alphaG * alphaG;
    float GGXV = NdotL * sqrt(NdotV * (NdotV - a2 * NdotV) + a2);
    float GGXL = NdotV * sqrt(NdotL * (NdotL - a2 * NdotL) + a2);
    return 0.5 / (GGXV + GGXL);
}
vec3 getEnergyConservationFactor(const vec3 specularEnvironmentR0, const vec3 environmentBrdf) {
    return 1.0 + specularEnvironmentR0 * (1.0 / environmentBrdf.y - 1.0);
}
vec3 toLinearSpace(vec3 color) {
    return pow(color, vec3(czm_gamma));
}
vec3 toGammaSpace(vec3 color) {
    return pow(color, vec3(1.0 / czm_gamma));
}
vec3 fromRGBD(vec4 rgbd) {
    rgbd.rgb = toLinearSpace(rgbd.rgb);
    return rgbd.rgb / rgbd.a;
}
vec3 getBRDFLookup(float NdotV, float perceptualRoughness, sampler2D brdfSampler) {
    vec2 UV = vec2(NdotV, perceptualRoughness);
    vec4 brdfLookup = texture2D(brdfSampler, UV);
    return brdfLookup.rgb;
}
vec3 applyImageProcessing(vec3 result) {
    result.rgb = toGammaSpace(result.rgb);
    result.rgb = saturate(result.rgb);
    return result;
}
float getLuminance(vec3 color) {
    return clamp(dot(color, LuminanceEncodeApprox), 0., 1.);
}
struct preLightingInfo {
    vec3 lightOffset;
    float lightDistanceSquared;
    float lightDistance;
    float attenuation;
    vec3 L;
    vec3 H;
    float NdotV;
    float NdotLUnclamped;
    float NdotL;
    float VdotH;
    float roughness;
};
preLightingInfo computeHemisphericPreLightingInfo(vec3 lightData, vec3 V, vec3 N) {
    preLightingInfo result;
    result.NdotL = dot(N, lightData.xyz) * 0.5 + 0.5;
    result.NdotL = saturateEps(result.NdotL);
    result.NdotLUnclamped = result.NdotL;
    result.L = normalize(lightData.xyz);
    result.H = normalize(V + result.L);
    result.VdotH = saturate(dot(V, result.H));
    return result;
}
vec3 computeHemisphericDiffuseLighting(preLightingInfo info, vec3 lightColor, vec3 groundColor) {
    return mix(groundColor, lightColor, info.NdotL);
}
vec3 computeSpecularLighting(preLightingInfo info, vec3 N, vec3 reflectance0, vec3 reflectance90, float geometricRoughnessFactor, vec3 lightColor) {
    float NdotH = saturateEps(dot(N, info.H));
    float roughness = max(info.roughness, geometricRoughnessFactor);
    float alphaG = convertRoughnessToAverageSlope(roughness);
    vec3 fresnel = fresnelSchlickGGX(info.VdotH, reflectance0, reflectance90);
    float distribution = normalDistributionFunction_TrowbridgeReitzGGX(NdotH, alphaG);
    float visibility = smithVisibility_GGXCorrelated(info.NdotL, info.NdotV, alphaG);
    vec3 specTerm = fresnel * distribution * visibility;
    return specTerm * info.attenuation * info.NdotL * lightColor;
}
pbrColorStruct pbrLuban(czm_lightStruct lightInfo) {
    vec3 n = lightInfo.normal;
    vec3 v = -normalize(lightInfo.positionEC);
    float roughness = lightInfo.roughness;
    vec3 baseColor = lightInfo.baseColor;
    vec3 diffuseColor = lightInfo.diffuseColor;
    vec3 specularColor = lightInfo.specularColor;
    vec3 positionWC = lightInfo.positionWC;
    float alpha = lightInfo.alpha;
    #ifndef USE_CUSTOM_LIGHT_COLOR
        vec3 lightColorHdr = czm_lightColorHdr;
    #else
        vec3 lightColorHdr = gltf_lightColor;
    #endif
    lightColorHdr *= czm_lightScaleFactor;
    vec3 l = normalize(czm_lightDirectionEC);
    vec3 h = normalize(v + l);
    float NdotVUnclamped = dot(n, v);
    float NdotV = absEps(NdotVUnclamped);
    float alphaG = convertRoughnessToAverageSlope(roughness);
    vec2 AARoughnessFactors = getAARoughnessFactors(n);
    alphaG += AARoughnessFactors.y;
    float reflectance = max(max(specularColor.r, specularColor.g), specularColor.b);
    vec3 reflectance90 = vec3(clamp(reflectance * 25.0, 0.0, 1.0));
    vec3 specularEnvironmentR0 = specularColor.rgb;
    vec3 specularEnvironmentR90 = vec3(1.0, 1.0, 1.0) * reflectance90;
    vec3 environmentBrdf = getBRDFLookup(NdotV, roughness, czm_environmentBrdfSampler);
    vec3 energyConservationFactor = getEnergyConservationFactor(specularColor, environmentBrdf);
    vec3 diffuseBase = vec3(0., 0., 0.);
    vec3 specularBase = vec3(0., 0., 0.);
    preLightingInfo preInfo;
    preInfo = computeHemisphericPreLightingInfo(l, v, n);
    preInfo.NdotV = NdotV;
    preInfo.attenuation = 1.0;
    preInfo.roughness = roughness;
    diffuseBase += computeHemisphericDiffuseLighting(preInfo, lightColorHdr, vec3(0.0, 0.0, 0.0));
    specularBase += computeSpecularLighting(preInfo, n, specularEnvironmentR0, specularEnvironmentR90, AARoughnessFactors.x, lightColorHdr);
    vec3 finalDiffuse = diffuseBase;
    finalDiffuse *= diffuseColor.rgb;
    finalDiffuse = max(finalDiffuse, 0.0);
    vec3 finalSpecular = specularBase;
    finalSpecular = max(finalSpecular, 0.0);
    vec3 finalSpecularScaled = finalSpecular;
    finalSpecularScaled *= energyConservationFactor;
    float luminanceOverAlpha = 0.0;
    luminanceOverAlpha += getLuminance(finalSpecularScaled);
    alpha = saturate(alpha + luminanceOverAlpha * luminanceOverAlpha);
    pbrColorStruct pbrColor;
    pbrColor.lightColor = finalDiffuse + finalSpecularScaled;
    pbrColor.alpha = alpha;
    #if defined(DIFFUSE_IBL) || defined(SPECULAR_IBL)
        mat3 fixedToENU = mat3(gltf_clippingPlanesMatrix[0][0], gltf_clippingPlanesMatrix[1][0], gltf_clippingPlanesMatrix[2][0], gltf_clippingPlanesMatrix[0][1], gltf_clippingPlanesMatrix[1][1], gltf_clippingPlanesMatrix[2][1], gltf_clippingPlanesMatrix[0][2], gltf_clippingPlanesMatrix[1][2], gltf_clippingPlanesMatrix[2][2]);
        #ifdef PLANE_MODE
            const mat3 yUpToZUp = mat3(1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, -1.0, 0.0);
            const mat3 rotationZ = mat3(-1.0, 0.0, 0.0, 0.0, -1.0, 0.0, 0.0, 0.0, 1.0);
            vec3 cubeDir = normalize(rotationZ * yUpToZUp * czm_inverseViewRotation * normalize(reflect(-v, n)));
        #else
            const mat3 yUpToZUp = mat3(-1.0, 0.0, 0.0, 0.0, 0.0, -1.0, 0.0, 1.0, 0.0);
            vec3 cubeDir = normalize(yUpToZUp * fixedToENU * normalize(reflect(-v, n)));
        #endif
        #ifdef DIFFUSE_IBL
            #ifdef CUSTOM_SPHERICAL_HARMONICS
                vec3 diffuseIrradiance = czm_sphericalHarmonics(cubeDir, gltf_sphericalHarmonicCoefficients);
            #else
                vec3 diffuseIrradiance = czm_sphericalHarmonics(cubeDir, czm_sphericalHarmonicCoefficients);
            #endif
        #else
            vec3 diffuseIrradiance = vec3(0.0);
        #endif
        #ifdef SPECULAR_IBL
            vec2 brdfLut = texture2D(czm_environmentBrdfSampler, vec2(NdotV, roughness)).rg;
            #ifdef CUSTOM_SPECULAR_IBL
                vec3 specularIBL = czm_sampleOctahedralProjection(gltf_specularMap, gltf_specularMapSize, cubeDir, roughness * gltf_maxSpecularLOD, gltf_maxSpecularLOD);
            #else
                vec3 specularIBL = czm_sampleOctahedralProjection(czm_specularEnvironmentMaps, czm_specularEnvironmentMapSize, cubeDir, roughness * czm_specularEnvironmentMapsMaximumLOD, czm_specularEnvironmentMapsMaximumLOD);
            #endif
            vec3 fresnel = fresnelSchlick2(specularEnvironmentR0, specularEnvironmentR90, preInfo.VdotH);
            specularIBL *= fresnel * brdfLut.x + brdfLut.y;
        #else
            vec3 specularIBL = vec3(0.0);
        #endif
        pbrColor.iblColor = diffuseIrradiance * diffuseColor + specularColor * specularIBL;
    #endif
    return pbrColor;
}
pbrColorStruct blinnPhong(czm_lightStruct lightInfo) {
    vec3 v = -normalize(lightInfo.positionEC);
    vec3 n = lightInfo.normal;
    #ifndef USE_CUSTOM_LIGHT_COLOR
        vec3 lightColor = czm_lightColorHdr;
    #else
        vec3 lightColor = gltf_lightColor;
    #endif
    vec3 l = normalize(czm_lightDirectionEC);
    vec3 h = normalize(v + l);
    vec3 diffuseColor = lightInfo.diffuseColor;
    vec3 specularColor = lightInfo.specularColor;
    float roughness = lightInfo.roughness;
    float diffuseTerm = dot(vec4(n, 1.0), sunlightDiffuseMatrix * vec4(n, 1.0));
    float nv = max(dot(n, v), 0.0);
    float vl = max(dot(v, l), 0.0);
    diffuseTerm = diffuseTerm + (nv * (1.0 - vl)) * 0.8;
    vec3 color = 1.05 * vec3(0.5, 0.497, 0.49) * (diffuseColor * diffuseTerm) + diffuseColor * 0.5;
    pbrColorStruct pbrColor;
    pbrColor.lightColor = color;
    return pbrColor;
}
float computeOutlineness(vec3 barycentric, float edgeWidthFactor) {
    vec3 d = fwidth(barycentric);
    vec3 a3 = smoothstep(vec3(0.0), d * edgeWidthFactor, barycentric);
    return 1.0 - min(min(a3.x, a3.y), a3.z);
}
vec4 textureAtlas(sampler2D texture, vec2 textureCoordinates, vec4 atlasRegion) {
    vec4 newRegion = atlasRegion;
    newRegion.y = 1.0 - atlasRegion.w;
    newRegion.w = 1.0 - atlasRegion.y;
    vec2 atlasScale = newRegion.zw - newRegion.xy;
    vec2 uvAtlas = fract(textureCoordinates) * atlasScale + newRegion.xy;
    vec2 dUVdx = dFdx(textureCoordinates) * atlasScale;
    vec2 dUVdy = dFdy(textureCoordinates) * atlasScale;
    #ifdef GL_EXT_shader_texture_lod
        return texture2DGradEXT(texture, uvAtlas, dUVdx, dUVdy);
    #else
        return vec4(1.0, 1.0, 1.0, 1.0);
    #endif
}
#if defined(SNOW) || defined(RAIN)
    
#endif

#if defined(SNOW) || defined(RAIN)
    float Hash(in vec2 p) {
        return fract(sin(dot(p, vec2(27.16898, 28.90563))) * 44549.5473453);
    }
    float Noise(in vec2 p) {
        vec2 f;
        f = fract(p);			// Separate integer from fractional
        
        p = floor(p);
        f = f*f*(3.0-2.0*f);	// Cosine interpolation approximation
        
        float res = mix(mix(Hash(p), Hash(p + vec2(1.0, 0.0)), f.x), mix(Hash(p + vec2(0.0, 1.0)), Hash(p + vec2(1.0, 1.0)), f.x), f.y);
        return res;
    }
#endif
void tile_main() {
    vec3 positionWC = vec3(czm_inverseView * vec4(v_positionEC, 1.0));
    normal = normalize(cross(dFdx(v_positionEC), dFdy(v_positionEC)));
    normal = normalize(czm_inverseViewRotation * normal);
    #ifdef GL_OES_standard_derivatives
        vec3 pos_dx = dFdx(v_positionEC);
        vec3 pos_dy = dFdy(v_positionEC);
        vec3 n = normalize(cross(pos_dx, pos_dy));
    #endif
    vec4 baseColorWithAlpha = tile_diffuse;
    vec3 baseColor = baseColorWithAlpha.rgb;
    vec3 color = vec3(0.0);
    float alpha = baseColorWithAlpha.a;
    float metalness = 1.0;
    float roughness = 1.0;
    if(enableForcePbr) {
        metalness = forceMetallic;
        roughness = forceRoughness;
    }
    else {
        metalness = clamp(pbrMetallicRoughness.x, 0.0, 1.0);
        roughness = clamp(pbrMetallicRoughness.y, 0.04, 1.0);
    }
    vec3 f0 = vec3(0.04);
    #ifdef USE_SPECGLOSS
        float roughness = 1.0 - glossiness;
        vec3 diffuseColor = diffuse.rgb * (1.0 - max(max(specular.r, specular.g), specular.b));
        vec3 specularColor = specular;
    #else
        vec3 diffuseColor = vec3(0.0);
        if (metalness > 0.95) {
            diffuseColor = baseColor * (1.0 - f0);
        }
        else {
            diffuseColor = baseColor * (1.0 - metalness) * (1.0 - f0);
        }
        vec3 specularColor = mix(f0, baseColor, metalness);
    #endif
    czm_lightStruct lightInfo;
    lightInfo.positionWC = positionWC;
    lightInfo.positionEC = v_positionEC;
    lightInfo.normal = n;
    lightInfo.baseColor = baseColor;
    lightInfo.diffuseColor = diffuseColor;
    lightInfo.specularColor = specularColor;
    lightInfo.roughness = roughness;
    lightInfo.alpha = baseColorWithAlpha.a;
    pbrColorStruct lightPbrColor;
    pbrColorStruct sunPbrColor = pbrLuban(lightInfo);
    color += sunPbrColor.lightColor;
    color += sunPbrColor.iblColor;
    alpha = sunPbrColor.alpha;
    color += u_emissiveFactor;
    color = max(color, 0.0);
    float eachHeight = clamp(posMC.z / gradualOffset, 0.0, 0.8);
    vec3 temp = mix(startColor, endColor, eachHeight);
    vec4 gradualColor = vec4(temp, 1.0)  + vec4(sunPbrColor.lightColor, 0.0);
    vec4 finalColor = vec4(0.0);
    finalColor = vec4(color, alpha);
    if(useGradual) {
        czm_gl_FragColor = gradualColor;
    }
    else {
        czm_gl_FragColor = finalColor;
    }
    if(planView && czm_cameraPicth<-1.4) {
        czm_gl_FragColor = vec4(mix(startColor, endColor, 0.5), 1.0);
    }
    #if defined(RAIN) || defined(SNOW)
        #ifdef RAIN
            // czm_gl_FragColor.rgb *= 0.6;
            
            vec3 cameraPosition = czm_encodedCameraPositionMCHigh + czm_encodedCameraPositionMCLow;
            vec3 dir = cameraPosition - positionWC;
            // 反射方向
            
            vec3 reflectDir = normalize(2.0 * dot(dir, normal) * normal - dir);
            // 在normal.z > 0.8的地方 反射方向做扰动
            
            float animate = fract(czm_time * 37.3918754) * 157.0;
            reflectDir += vec3(Noise(positionWC.xy * 37.0 + animate)-.5, 0.0, Noise(positionWC.xy * 37.0 + animate)-.5) * .1;
            vec3 reflectColor = textureCube(czm_environmentMap, normalize(reflectDir)).rgb;
            reflectColor *= smoothstep(0.7, 0.8, normal.z) * 0.5;
            czm_gl_FragColor.rgb += reflectColor;
        #endif
        #ifdef SNOW
            float ttt = (czm_time - czm_startSnowTime) / 10.;
            ttt = step(ttt, -0.1) + step(1.0, ttt) + fract(ttt);
            float heavy = Noise(positionWC.xy * 0.3 + floor((czm_time - czm_startSnowTime) * 0.1));
            float snowHeavy = smoothstep(0.0, heavy, ttt) * 0.5 + smoothstep(heavy, 1.0, ttt) * 0.5;
            snowHeavy *= smoothstep(0.5, 0.8, normal.z);
            czm_gl_FragColor.rgb = mix(czm_gl_FragColor.rgb, vec3(1.0), snowHeavy);
        #endif
    #endif
}
void tile_color(vec4 tile_featureColor) {
    vec4 source = pbrBaseColor;
    tile_diffuse = tile_diffuse_final(source, tile_featureColor);
    tile_main();
    tile_featureColor = czm_gammaCorrect(tile_featureColor);
    czm_gl_FragColor.a *= tile_featureColor.a;
    float highlight = ceil(tile_colorBlend);
    czm_gl_FragColor.rgb *= mix(tile_featureColor.rgb, vec3(1.0), highlight);
}
uniform sampler2D tile_pickTexture;
varying vec2 tile_featureSt;
varying vec4 tile_featureColor;
void czm_log_depth_main() {
    tile_color(tile_featureColor);
}
#ifdef GL_EXT_frag_depth 
    
#endif 


void czm_translucent_main() {
    czm_log_depth_main();
    czm_writeLogDepth();
}
void main() {
    czm_translucent_main();
    if (czm_discard) {
        discard;
    }
    vec3 Ci = czm_gl_FragColor.rgb * czm_gl_FragColor.a;
    float ai = czm_gl_FragColor.a;
    float wzi = czm_alphaWeight(ai);
    gl_FragData[0] = vec4(Ci * wzi, ai);
    gl_FragData[1] = vec4(ai * wzi);
}
