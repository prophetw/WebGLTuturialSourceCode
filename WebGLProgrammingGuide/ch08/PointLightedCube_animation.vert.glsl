
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;     // Model matrix
  uniform mat4 u_NormalMatrix;    // Coordinate transformation matrix of the normal
  uniform vec3 u_LightColor;      // Light color
  uniform vec3 u_LightPosition;   // Position of the light source
  uniform vec3 u_AmbientLight;    // Ambient light color
  varying vec4 v_Color;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
     // Recalculate the normal based on the model matrix and make its length 1.
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));
     // Calculate world coordinate of vertex
    vec4 vertexPosition = u_ModelMatrix * a_Position;
     // Calculate the light direction and make it 1.0 in length
    vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));
     // Calculate the dot product of the normal and light direction
    float nDotL = max(dot(normal, lightDirection), 0.0);
     // Calculate the color due to diffuse reflection
    vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;
     // Calculate the color due to ambient reflection
    vec3 ambient = u_AmbientLight * a_Color.rgb;
     // Add the surface colors due to diffuse reflection and ambient reflection
    v_Color = vec4(diffuse + ambient, a_Color.a);
  }
