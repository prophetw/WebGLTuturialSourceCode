#extension GL_EXT_draw_buffers : enable
precision highp float;

uniform sampler2D texture0; // read tex
varying vec2 v_Texcoord;

// out gl_FragData []  0, 1, 2 ,3
void main() {
  vec4 color = texture2D(texture0, v_Texcoord);
  gl_FragData[0] = color; 
  gl_FragData[1] = vec4(color.x, 0.0, 0.0, color.a);
  gl_FragData[2] = vec4(0.0, color.y, 0.0, color.a);
  gl_FragData[3] = vec4(0.0, 0.0, color.z, color.a);
}
