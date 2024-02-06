
precision highp float;

uniform float u_time; // 动画时间
// uniform vec2 u_resolution; // 画布大小

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
    highp float z = size.y / tan(radians(fov) / 2.0);
    return normalize(vec3(xy, -z));
}

void main() {
    // vec3 rayOrigin = glb_cameraPosition; // 相机位置
    vec3 rayOrigin = vec3(0.0, 0.0, 5.0); // 相机位置
    float fov = 45.0; // 视场角度
    vec3 rayDir = getRayDir(fov, u_resolution, gl_FragCoord.xy);

    float t;
    vec3 sphereCenter = vec3(0.0, 0.0, -5.0); // 球心位置
    float sphereRadius = 1.0; // 球半径

    if (intersectSphere(rayOrigin, rayDir, sphereCenter, sphereRadius, t)) {
        // 光线击中球体，计算简单的光照效果
        vec3 hitPoint = rayOrigin + rayDir * t;
        vec3 normal = normalize(hitPoint - sphereCenter);
        vec3 lightDir = normalize(vec3(0.5, 0.8, -0.6)); // 假设光源方向
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 baseColor = vec3(0.4, 0.7, 1.0); // 球体颜色
        vec3 color = baseColor * diff; // 简单漫反射
        gl_FragColor = vec4(color, 1.0);
    } else {
        // 光线未击中球体，显示背景色
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}
