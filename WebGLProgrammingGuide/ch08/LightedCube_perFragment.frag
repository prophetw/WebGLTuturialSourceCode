
  precision mediump float;
  varying vec4 v_Color;
  varying float v_Dot;
  void main() {
    gl_FragColor = vec4(v_Color.xyz * v_Dot, v_Color.a);
    // gl_FragColor = vec4(1.0);
    gl_FragColor = vec4(v_Dot);
  }
