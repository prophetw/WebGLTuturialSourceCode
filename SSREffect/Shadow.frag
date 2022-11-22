precision mediump float;

struct Light{
  vec3 position;
  vec3 diffuse;
  vec3 ambient;
  float specular;
};

uniform Light light;
void main(){
  gl_FragColor = vec4(1.0);
}
