
  attribute vec4 a_Position;
  attribute float a_Face;    // Surface number (Cannot use int for attribute variable)
  attribute vec4 a_color;
  uniform mat4 u_MvpMatrix;
  uniform int u_PickedFace;  // Surface number of selected face

  varying vec4 v_Point;
  varying vec4 v_Color;

  void main() {
    v_Point = a_Position;
    vec4 point = u_MvpMatrix * a_Position;
    gl_Position = point;
    int face = int(a_Face);  // Convert to int
    vec3 color = a_color.rgb;
    if(
      face == u_PickedFace
    ){
      color = vec3(0.17, 0.48, 0.97);
    }
    if(u_PickedFace == 0) {  // In case of 0, insert the face number into alpha
      v_Color = vec4(color, a_Face/255.0);
    }else {
      v_Color = vec4(color, 0.3);
    }
  }
