attribute vec4 aPosition;

struct LightStruct{
  vec3 position;
  vec3 diffuse;
  vec3 ambient;
  float specular;
};

void main(){
  gl_Position = aPosition;
}
