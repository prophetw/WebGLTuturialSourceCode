
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_NormalMatrix;    // Transformation matrix of the normal
  uniform vec3 u_LightColor;      // Light color
  uniform vec3 u_LightDirection;  // Light direction (in the world coordinate, normalized)
  uniform vec3 u_AmbientLight;    // Ambient light color
  varying vec4 v_Color;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
     // Recalculate the normal based on the model matrix and make its length 1.
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
     // Calculate the dot product of the light direction and the orientation of a surface (the normal)
    float nDotL = max(dot(u_LightDirection, normal), 0.0);
     // Calculate the color due to diffuse reflection
    vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
     // Calculate the color due to ambient reflection
    vec3 ambient = u_AmbientLight * a_Color.rgb;
     // Add the surface colors due to diffuse reflection and ambient reflection
    v_Color = vec4(diffuse + ambient, a_Color.a);
  }
