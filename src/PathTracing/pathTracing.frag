
precision highp float;

uniform float u_time; // 动画时间
// uniform vec2 u_resolution; // 画布大小
uniform sampler2D brdfLUT; // 画布大小

const float PI = 3.14159265359;
// ----------------------------------------------------------------------------
float DistributionGGX(vec3 N, vec3 H, float roughness)
{
    float a = roughness*roughness;
    float a2 = a*a;
    float NdotH = max(dot(N, H), 0.0);
    float NdotH2 = NdotH*NdotH;

    float nom   = a2;
    float denom = (NdotH2 * (a2 - 1.0) + 1.0);
    denom = PI * denom * denom;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySchlickGGX(float NdotV, float roughness)
{
    float r = (roughness + 1.0);
    float k = (r*r) / 8.0;

    float nom   = NdotV;
    float denom = NdotV * (1.0 - k) + k;

    return nom / denom;
}
// ----------------------------------------------------------------------------
float GeometrySmith(vec3 N, vec3 V, vec3 L, float roughness)
{
    float NdotV = max(dot(N, V), 0.0);
    float NdotL = max(dot(N, L), 0.0);
    float ggx2 = GeometrySchlickGGX(NdotV, roughness);
    float ggx1 = GeometrySchlickGGX(NdotL, roughness);

    return ggx1 * ggx2;
}
// ----------------------------------------------------------------------------
vec3 fresnelSchlick(float cosTheta, vec3 F0)
{
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}
// ----------------------------------------------------------------------------
vec3 fresnelSchlickRoughness(float cosTheta, vec3 F0, float roughness)
{
    return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
}

vec2 u_resolution = vec2(500.0, 500.0);

// 简单的光线与球体相交测试
bool intersectSphere(vec3 rayOrigin, vec3 rayDir, vec3 sphereCenter, float sphereRadius, out float t) {
    vec3 oc = rayOrigin - sphereCenter;
    float b = dot(oc, rayDir);
    float c = dot(oc, oc) - sphereRadius * sphereRadius;
    float h = b * b - c;
    if (h < 0.0) return false;
    h = sqrt(h);
    t = -b - h;
    if (t < 0.0) t = -b + h;
    return t > 0.0;
}

// 生成光线方向
vec3 getRayDir(float fov, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fov) / 2.0);
    return normalize(vec3(xy, -z));
}

void main() {
    // vec3 rayOrigin = glb_cameraPosition; // 相机位置
    vec3 rayOrigin = vec3(0.0, 0.0, 5.0); // 相机位置
    float fov = 45.0; // 视场角度
    vec3 rayDir = getRayDir(fov, u_resolution, gl_FragCoord.xy);

    float t;
    vec3 sphereCenter = vec3(0.0, 0.0, -5.0); // 球心位置
    float sphereRadius = 0.8; // 球半径
    float metallic = 0.0; // 金属度
    float roughness = 0.5; // 粗糙度
    vec3 baseColor = vec3(0.4, 0.7, 1.0); // 球体颜色
    vec3 albedo = baseColor;
    vec3 lightColor = vec3(3.0, 3.0, 3.0); // 光源颜色



    if (intersectSphere(rayOrigin, rayDir, sphereCenter, sphereRadius, t)) {
        // 光线击中球体，计算简单的光照效果
        vec3 hitPoint = rayOrigin + rayDir * t;
        vec3 normal = normalize(hitPoint - sphereCenter);
        vec3 lightPos = vec3(5.0, 8.0, -6.0); // 假设光源方向
        vec3 lightDir = normalize(lightPos); // 假设光源方向
        // vec3 lightDir = normalize(vec3(0.0039, 0.0039, 0.0039)); // 假设光源方向

        // PBR brdf
        vec3 N = normal;
        vec3 V = normalize(rayOrigin - hitPoint);
        vec3 R = reflect(-V, N);

        // calculate reflectance at normal incidence; if dia-electric (like plastic) use F0
        // of 0.04 and if it's a metal, use the albedo color as F0 (metallic workflow)
        vec3 F0 = vec3(0.04);
        F0 = mix(F0, albedo, metallic);

        // reflectance equation
        vec3 Lo = vec3(0.0);
    // for(int i = 0; i < 4; ++i)
    // {
        // calculate per-light radiance
        vec3 L = normalize(lightDir);
        vec3 H = normalize(V + L);
        float distance = length(lightPos - hitPoint);
        // float attenuation = 1.0 / (distance * distance);
        float attenuation = 1.0;
        vec3 radiance = lightColor * attenuation;

        // Cook-Torrance BRDF
        float NDF = DistributionGGX(N, H, roughness);
        float G   = GeometrySmith(N, V, L, roughness);
        vec3 F    = fresnelSchlick(max(dot(H, V), 0.0), F0);

        vec3 numerator    = NDF * G * F;
        float denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001; // + 0.0001 to prevent divide by zero
        vec3 specular = numerator / denominator;

         // kS is equal to Fresnel
        vec3 kS = F;
        // for energy conservation, the diffuse and specular light can't
        // be above 1.0 (unless the surface emits light); to preserve this
        // relationship the diffuse component (kD) should equal 1.0 - kS.
        vec3 kD = vec3(1.0) - kS;
        // multiply kD by the inverse metalness such that only non-metals
        // have diffuse lighting, or a linear blend if partly metal (pure metals
        // have no diffuse light).
        kD *= 1.0 - metallic;

        // scale light by NdotL
        float NdotL = max(dot(N, L), 0.0);

        // add to outgoing radiance Lo
        vec3 diffuseColor1 = (kD * albedo / PI ) * radiance * NdotL;
        vec3 specularColor1 = specular  * radiance * NdotL;
        Lo += diffuseColor1 + specularColor1; // note that we already multiplied the BRDF by the Fresnel (kS) so we won't multiply by kS again
    // }

        // gl_FragColor = vec4(vec3(attenuation), 1.0);


        // 通用算法
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuseColor = baseColor * diff; // 简单漫反射
        vec3 specularColor = vec3(1.0, 1.0, 1.0) * pow(max(dot(reflect(-lightDir, normal), V), 0.0), 64.0); // 镜面反射
        vec3 finalColor = diffuseColor + specularColor;

        gl_FragColor = vec4(Lo, 1.0);
        // gl_FragColor = vec4(specularColor1, 1.0);
        // gl_FragColor = vec4(diffuseColor1, 1.0);
        // gl_FragColor = vec4(finalColor, 1.0);

    } else {
        // 光线未击中球体，显示背景色
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
