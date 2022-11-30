
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;         // Normal
  uniform mat4 u_MvpMatrix;
  uniform vec3 u_LightColor;      // Light color
  uniform vec3 u_LightDirection;  // Light direction (in the world coordinate, normalized)
  varying vec4 v_Color;
  void main() {
    gl_Position = u_MvpMatrix * a_Position ;
  // Make the length of the normal 1.0
    vec3 normal = normalize(a_Normal.xyz);
  // Dot product of the light direction and the orientation of a surface (the normal)
    float nDotL = max(dot(u_LightDirection, normal), 0.0);
  // Calculate the color due to diffuse reflection
    vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
    v_Color = vec4(diffuse, a_Color.a);
  }
