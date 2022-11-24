
  uniform mat4 u_perspectiveMatrix; 
  uniform mat4 u_modelMatrix; 
  uniform mat4 u_viewMatrix; 

  attribute vec4 a_Position; 
  attribute vec3 a_Normal; 

  varying vec4 v_Position; 
  varying vec3 v_Normal; 

  void main() { 
    mat4 modelViewMatrix = u_viewMatrix * u_modelMatrix; 
    v_Position = modelViewMatrix * a_Position; 
    gl_Position = u_perspectiveMatrix * v_Position; 
    v_Normal = normalize( mat3(modelViewMatrix) * a_Normal);  
  }