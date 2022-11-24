
  uniform mat4 u_perspectiveMatrix; 
  uniform mat4 u_modelMatrix; 
  uniform mat4 u_viewMatrix; 
  uniform vec3 u_lightDir; 
   
  attribute vec4 a_Position; 
  attribute vec2 a_TexCoord; 
     
  varying vec4 v_Color; 
  varying vec2 v_TexCoord; 
     
  void main() { 
    mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix; 
    gl_Position = u_perspectiveMatrix * modelViewMatrix * a_Position; 
   
    v_TexCoord = a_TexCoord; 
  }