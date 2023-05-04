#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;

uniform sampler2D texture; // r - water depth  g - water foam  b - water detail
uniform sampler2D waterNormal;
uniform float time;

varying vec2 v_texCoord;
varying vec3 WorldPos;

vec3 unpackNormal(vec4 packedNormal) {
  return packedNormal.xyz * 2.0 - 1.0;
}

vec3 getNormalFromMap(vec3 tangentNormal)
{
    // vec3 tangentNormal = texture2D(waterNormal, v_texCoord).xyz * 2.0 - 1.0;

    vec3 Q1  = dFdx(WorldPos);
    vec3 Q2  = dFdy(WorldPos);
    vec2 st1 = dFdx(v_texCoord);
    vec2 st2 = dFdy(v_texCoord);

    // vec3 N   = normalize(Normal);
    vec3 N   = vec3(0.0, 0.0, 1.0);
    vec3 T  = normalize(Q1*st2.t - Q2*st1.t);
    vec3 B  = -normalize(cross(N, T));
    mat3 TBN = mat3(T, B, N);

    return normalize(TBN * tangentNormal);
    // return tangentNormal;
}

float saturate(float val) {
  return clamp(val, 0.0, 1.0);
}

vec3 blendNormals(vec3 normal1, vec3 normal2, float alpha) {
  vec3 blendedNormal;
  blendedNormal.xy = normal1.xy * alpha + normal2.xy * (1.0 - alpha);
  blendedNormal.z = normal1.z * normal2.z;
  return normalize(blendedNormal);
}

void main() {
  vec4 deepColor = vec4(8.0 / 255.0, 92.0 / 255.0, 128.0 / 255.0, 1.0);
  vec4 shalowColor = vec4(40.0 / 255.0, 252.0 / 255.0, 1.0, 1.0);
  float depth = texture2D(texture, v_texCoord).r;
  vec4 waterColor = mix(shalowColor, deepColor , depth);
  // vec3 tangentNormal = texture2D(waterNormal, v_texCoord).rgb; // normal in tangent space

  float time = time * 0.05;
  // vec2 texCoord1 = v_texCoord + vec2(time * 0.00, time * 0.03); // offset 1
  // vec2 texCoord2 = v_texCoord + vec2(time * 0.01, time * 0.02); // offset 2

  vec2 panner1 = (time * vec2(0.03, 0.05) + v_texCoord);
  vec2 panner2 = (time * vec2(0.25, 0.5) + v_texCoord);

  vec3 normal1 = unpackNormal(texture2D(waterNormal, panner1));
  vec3 normal2 = unpackNormal(texture2D(waterNormal, panner2));

  vec3 normal = blendNormals(normal1, normal2, 0.5);
  normal = mix(normal, vec3(0.0, 0.0, 1.0), 0.5);

  vec3 worldNormal = getNormalFromMap(normal);
  worldNormal = mix(worldNormal, vec3(0.0, 0.0, 1.0), 0.5);

  vec3 worldPos = WorldPos;

// calculate eye vector
  vec3 eyePos = vec3(0.0, 0.0, -3.0);
  vec3 eyeVec = normalize(eyePos - worldPos);

  float NdotV = saturate(dot(worldNormal, eyeVec));


  // Blinn-Phong
  vec3 lightPos = vec3(0.0, 0.0, 3.0);
  vec3 lightVec = normalize(lightPos - worldPos);
  vec3 halfVec = normalize(lightVec + eyeVec);

  float NdotL = saturate(dot(worldNormal, lightVec));
  float NdotH = saturate(dot(worldNormal, halfVec));

  float specularFactor = pow(NdotH, 10.0);
  specularFactor = NdotL > 0.0 ? specularFactor : 0.0;
  specularFactor = NdotV > 0.0 ? specularFactor : 0.0;

  // calculate fresnel
  float fresnel = pow(1.0 - NdotV, 3.0);
  fresnel = NdotV > 0.0 ? fresnel : 0.0;

  // calculate diffuse
  vec4 diffuse = vec4(0.0, 0.0, 0.0, 1.0);
  // diffuse += vec4(1.0, 1.0, 1.0, 1.0) * NdotL;
  diffuse += waterColor * NdotL;

  // calculate specular
  vec4 specularColor = vec4(1.0, 1.0, 1.0, 1.0);
  vec4 specular = specularColor * specularFactor;


  vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
  // mix diffuse and specular
  // color = mix(diffuse, specular, 0.5);
  color += diffuse;
  color += specular;

  // mix color with fresnel
  // color = mix(color, vec4(1.0, 1.0, 1.0, 1.0), fresnel);
  color = mix(color, waterColor, fresnel);

  // add ambient
  color += vec4(0.2, 0.2, 0.2, 1.0);


  // calculate reflection vector
  vec3 reflectionVec = reflect(eyeVec, worldNormal);
  // calculate reflection texture coords
  vec3 reflectionTexCoords = reflectionVec * 0.5 + 0.5;
  // get reflection color
  vec4 reflectionColor = texture2D(texture, reflectionTexCoords.xy);

  // mix reflection color with water color
  waterColor = mix(waterColor, reflectionColor, 0.5);
  // add foam
  float foam = texture2D(texture, v_texCoord).g;
  // waterColor = mix(waterColor, vec4(1.0, 1.0, 1.0, 1.0), foam);
  // add detail
  float detail = texture2D(texture, v_texCoord).b;
  // waterColor = mix(waterColor, vec4(0.0, 0.0, 0.0, 1.0), detail);
  // add water surface



    // vec4 waterColor = texture2D(texture, texCoord);

    // float wave = sin(texCoord.x * 20.0 + time * 3.0) * 0.1;
    // gl_FragColor = vec4(waterColor.rgb, waterColor.r + wave);

  // mix water color with lighting
  waterColor = mix(waterColor, color, 0.5);
  gl_FragColor = vec4(waterColor.xyz, 0.9);
}
