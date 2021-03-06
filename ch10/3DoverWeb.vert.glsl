
  attribute vec4 a_Position;
  attribute vec4 a_Color;
  uniform mat4 u_MvpMatrix;
  uniform bool u_Clicked;  // Mouse is pressed
  varying vec4 v_Color;
  void main() {
    gl_Position = u_MvpMatrix * a_Position;
    if (u_Clicked) {  //  Draw in red if mouse is pressed
      v_Color = vec4(1.0, 0.0, 0.0, 1.0);
    }
    else {
      v_Color = vec4(a_Color.rgb, 1.0);
    }
  }
