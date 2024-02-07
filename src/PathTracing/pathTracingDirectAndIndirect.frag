
precision highp float;

uniform float u_time; // 动画时间
// uniform vec2 u_resolution; // 画布大小
uniform sampler2D brdfLUT; // 画布大小


const float PI = 3.14159265359;

struct Light {
    vec3 position;
    vec3 color;
};

struct Material {
    vec3 albedo;
    float metallic;
    float roughness;
};

struct Sphere {
    vec3 center;
    float radius;
    Material material;
};

struct Ray {
    vec3 origin;
    vec3 direction;
};

struct Hit {
    float t;
    vec3 position;
    vec3 normal;
    Material material;
};


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

bool intersectBox(vec3 rayOrigin, vec3 rayDir, vec3 boxMin, vec3 boxMax, out float t) {
    vec3 invDir = 1.0 / rayDir;
    vec3 tMin = (boxMin - rayOrigin) * invDir;
    vec3 tMax = (boxMax - rayOrigin) * invDir;

    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);

    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);

    if (tNear > tFar || tFar < 0.0) {
        return false;
    }

    t = tNear > 0.0 ? tNear : tFar;
    return true;
}

vec3 calculateNormal(vec3 rayOrigin, vec3 rayDir, float t, vec3 boxMin, vec3 boxMax) {
    vec3 hitPoint = rayOrigin + t * rayDir; // 计算交点
    vec3 normal = vec3(0.0);

    float bias = 1e-4; // 用于避免浮点精度问题的小偏移量
    if (abs(hitPoint.x - boxMin.x) < bias) normal = vec3(-1.0, 0.0, 0.0);
    else if (abs(hitPoint.x - boxMax.x) < bias) normal = vec3(1.0, 0.0, 0.0);
    else if (abs(hitPoint.y - boxMin.y) < bias) normal = vec3(0.0, -1.0, 0.0);
    else if (abs(hitPoint.y - boxMax.y) < bias) normal = vec3(0.0, 1.0, 0.0);
    else if (abs(hitPoint.z - boxMin.z) < bias) normal = vec3(0.0, 0.0, -1.0);
    else if (abs(hitPoint.z - boxMax.z) < bias) normal = vec3(0.0, 0.0, 1.0);

    return normal;
}

// ray = O + tD
// (P-C)·(P-C) = r^2
//
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

     // 将 fragCoord 从 [0, width] 和 [0, height] 映射到 [-1, 1]
    vec2 ndc = (fragCoord / size) * 2.0 - 1.0; // 归一化设备坐标
    ndc.x *= size.x / size.y; // 考虑纵横比
    float z = -1.0 / tan(radians(fov) / 2.0);
    return normalize(vec3(ndc, z));
}

vec3 blindsPhong(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 albedo, vec3 lightColor) {
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuseColor = albedo * diff; // 简单漫反射
    vec3 specularColor = vec3(1.0, 1.0, 1.0) * pow(max(dot(reflect(-lightDir, normal), viewDir), 0.0), 64.0); // 镜面反射
    return diffuseColor + specularColor;
}

vec3 pbr(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 albedo, vec3 lightColor, float metallic, float roughness) {
    vec3 F0 = vec3(0.04);
    F0 = mix(F0, albedo, metallic);

    vec3 H = normalize(viewDir + lightDir);
    float NDF = DistributionGGX(normal, H, roughness);
    float G = GeometrySmith(normal, viewDir, lightDir, roughness);
    vec3 F = fresnelSchlick(max(dot(H, viewDir), 0.0), F0);

    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metallic;

    float NdotL = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = (kD * albedo / PI) * lightColor * NdotL;
    vec3 specular = (NDF * G * F) / (4.0 * max(dot(normal, viewDir), 0.0) * max(dot(normal, lightDir), 0.0) + 0.001) * lightColor * NdotL;

    return diffuse + specular;
}

struct PreCalcLightParams {
    vec3 viewDir;
    vec3 lightDir;
    vec3 lightColor;

    vec3 point;
    vec3 albedo;
    float metallic;
    float roughness;
    vec3 normal;
};


// 计算反射射线
Ray reflectRay(vec3 hitPoint, vec3 normal, vec3 incidentRay) {
    vec3 reflectDir = reflect(incidentRay, normal);
    return Ray(hitPoint + normal * 0.001, reflectDir); // 避免自相交
}

struct FragLightColor {
  vec3 directColor;
  vec3 indirectColor;
};

const int MAX_RECURSION_DEPTH = 3;
FragLightColor pathTrace(Ray ray){
     FragLightColor fragLightColor;
    vec3 rayOrigin = ray.origin;
    vec3 rayDir = ray.direction;

    vec3 sphereCenter = vec3(1.0, 0.0, 0.0); // 球心位置
    float sphereRadius = 0.8; // 球半径

    vec3 boxMin = vec3(-1.5, -0.5, -0.5);
    vec3 boxMax = vec3(-0.5, 0.5, 0.5);

    float metallic = 0.0; // 金属度
    float roughness = 0.4; // 粗糙度
    vec3 baseColor = vec3(0.4, 0.7, 1.0); // 球体颜色
    vec3 sphereColor = baseColor;
    vec3 boxColor = vec3(1.0, 0.0, 0.0); // 箱子颜色
    vec3 lightColor = vec3(3.0, 3.0, 3.0); // 光源颜色
    vec3 lightPos = vec3(10.0, 10.0, 10.0); // 假设光源方向

    vec3 finalColor = vec3(0.0);
    vec3 accumulatorFactor = vec3(1.0); // 初始贡献因子

    for (int i = 0; i < MAX_RECURSION_DEPTH; i++){
      float tSphere;
      float tBox;
      bool hitSphere = intersectSphere(ray.origin, ray.direction, sphereCenter, sphereRadius, tSphere);
      bool hitBox = intersectBox(rayOrigin, rayDir, boxMin, boxMax, tBox);
      if (hitSphere && (!hitBox || tSphere < tBox)) {
          // 光线击中球体，计算简单的光照效果
          vec3 hitPoint = rayOrigin + rayDir * tSphere;
          vec3 lightDir = normalize(lightPos - hitPoint); // 假设光源方向
          vec3 normal = normalize(hitPoint - sphereCenter);

          // direct lighting
          // PBR brdf
          vec3 N = normal;
          vec3 V = normalize(rayOrigin - hitPoint);
          vec3 pbrColor = pbr(N, lightDir, V, sphereColor, lightColor, metallic, roughness);
          finalColor += accumulatorFactor * pbrColor;
          if(i == 0){
            fragLightColor.directColor = finalColor;
          }else{
            fragLightColor.indirectColor += accumulatorFactor * pbrColor;
          }
          accumulatorFactor *= 0.5;
          // indirect lighting
          Ray reflectedRay = reflectRay(hitPoint, normal, -ray.direction);
          ray.direction = reflectedRay.direction;
          ray.origin = reflectedRay.origin;
      } else if( hitBox) {

          vec3 hitPoint = rayOrigin + rayDir * tBox;
          vec3 lightDir = normalize(lightPos - hitPoint); // 假设光源方向
          vec3 normal = calculateNormal(rayOrigin, rayDir, tBox, boxMin, boxMax);

          // direct lighting
          // PBR brdf
          vec3 N = normal;
          vec3 V = normalize(rayOrigin - hitPoint);
          // PBR
          vec3 pbrColor = pbr(N, lightDir, V, boxColor, lightColor, metallic, roughness);
          finalColor += accumulatorFactor * pbrColor;
          if(i == 0){
            fragLightColor.directColor = finalColor;
          }else{
            fragLightColor.indirectColor += accumulatorFactor * pbrColor;
          }
          accumulatorFactor *= 0.5;

          // indirect lighting
          Ray reflectedRay = reflectRay(hitPoint, normal, -ray.direction);
          ray.direction = reflectedRay.direction;
          ray.origin = reflectedRay.origin;
      } else{
        break;
      }

    }


    return fragLightColor;
}

void main() {

    vec3 rayOrigin = vec3(0.0, 0.0, 5.0); // 相机位置
    float fov = 45.0; // 视场角度
    vec3 rayDir = getRayDir(fov, u_resolution, gl_FragCoord.xy);
    // vec3 rayOrigin = glb_cameraPosition; // 相机位置
    Ray ray = Ray(rayOrigin, rayDir);
    FragLightColor fragColor = pathTrace(ray);
    gl_FragColor = vec4(fragColor.directColor, 1.0);
    gl_FragColor = vec4(fragColor.indirectColor, 1.0);
}
