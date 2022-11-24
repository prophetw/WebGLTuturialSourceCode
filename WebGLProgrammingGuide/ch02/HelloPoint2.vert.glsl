 
  attribute vec4 a_Position;  // attribute variable
  void main() { 
    gl_Position = a_Position; 
    gl_PointSize = 10.0; 
  }