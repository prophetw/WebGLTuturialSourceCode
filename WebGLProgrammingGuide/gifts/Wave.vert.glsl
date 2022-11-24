
  uniform mat4 u_perspectiveMatrix; 
  uniform mat4 u_modelMatrix; 
  uniform mat4 u_viewMatrix; 
  uniform float u_time; 
   
  attribute vec4 a_Position; 
     
  varying vec4 v_Color; 
     
  void main() { 
    vec4 position = a_Position; 
    float dist = length( vec3(position)); 
    float y = sin(dist*20.0  u_time); 
    position.y = y * 0.05; 
    mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix; 
    gl_Position = u_perspectiveMatrix * modelViewMatrix * position; 
   
    float c = (y1.0) * 0.5 * 0.80.2; 
    v_Color = vec4(c, c, c, 1.0); 
  }