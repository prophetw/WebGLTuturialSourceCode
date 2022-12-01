
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute vec4 a_Normal;

  uniform mat4 u_mMatrix;
  uniform mat4 u_vMatrix;
  uniform mat4 u_mvpMatrix;
  uniform vec3 u_LightDir;

  varying vec4 v_Color;
  varying float v_Dot;

  void main() {
    gl_Position = u_mvpMatrix * a_Position;
    v_Color = a_Color;
    vec4 normal = u_vMatrix * u_mMatrix * a_Normal;
    vec4 u_LightDir_eye = normalize(u_vMatrix * vec4(u_LightDir, 1.0));
    v_Dot = max(dot(normalize(normal.xyz), vec3(u_LightDir_eye.xyz)), 0.0);
  }
