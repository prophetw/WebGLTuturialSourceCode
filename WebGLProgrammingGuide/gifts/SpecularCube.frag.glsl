
  #ifdef GL_ES 
  precision mediump float; 
  #endif 
  uniform mat4 u_fViewMatrix; 
  uniform vec3 u_lightPosition; 

  varying vec4 v_Position; 
  varying vec3 v_Normal; 
  void main() { 
    vec3 normal = normalize(v_Normal); 
    vec3 lightPosition = vec3(u_fViewMatrix * vec4(u_lightPosition, 1) - v_Position); 
    vec3 lightDir = normalize(lightPosition); 
    float lightDist = length(lightPosition); 

    float specular = 0.0; 
    float d = max(dot(v_Normal, lightDir), 0.0); 
    if (d > 0.0) { 
      vec3 viewVec = vec3(0,0,1.0); 
      vec3 reflectVec = reflect(-lightDir, normal); 
      specular = pow(max(dot(reflectVec, viewVec), 0.0), 120.0); 
    }