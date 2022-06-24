// #ifdef GL_ES
precision mediump float;
// #endif
uniform sampler2D u_Sampler0;
uniform sampler2D u_Sampler1;

varying vec2 v_TexCoord;
varying float v_MixVal;

void main() {
  vec2 texCood = vec2(-v_TexCoord.x, v_TexCoord.y);
  gl_FragColor = mix(texture2D(u_Sampler0, v_TexCoord), texture2D(u_Sampler1, texCood), 0.2);
}
