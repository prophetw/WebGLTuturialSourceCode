precision mediump float;

varying vec2 v_texcoord;
varying vec4 v_projectedTexcoord;
varying vec4 v_posEC;

uniform vec4 u_colorMult;
uniform sampler2D u_texture; 
uniform sampler2D u_projectedTexture; 

void main() {
  // NDC is 0~1
  vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
  bool inRange =
      projectedTexcoord.x >= 0.0 &&
      projectedTexcoord.x <= 1.0 &&
      projectedTexcoord.y >= 0.0 &&
      projectedTexcoord.y <= 1.0 &&
      projectedTexcoord.z >= 0.0 &&
      projectedTexcoord.z <= 1.0;

  vec4 projectedTexColor = texture2D(u_projectedTexture, projectedTexcoord.xy);
  vec4 texColor = texture2D(u_texture, v_texcoord) * u_colorMult;
  float projectedAmount = inRange ? 1.0 : 0.0;
  gl_FragColor = mix(texColor, projectedTexColor, projectedAmount);
}
