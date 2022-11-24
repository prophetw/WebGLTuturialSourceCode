
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  attribute float a_Face;    // Surface number (Cannot use int for attribute variable)
  uniform mat4 u_MvpMatrix;
  uniform int u_PickedFace;  // Surface number of selected face
  varying vec4 v_Color;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    int face = int(a_Face);  // Convert to int
    vec3 color = (face == u_PickedFace) ? vec3(1.0) : a_Color.rgb;
    if(u_PickedFace == 0) {  // In case of 0, insert the face number into alpha
      v_Color = vec4(color, a_Face/255.0);
    }else {
      v_Color = vec4(color, a_Color.a);
    }
  }
