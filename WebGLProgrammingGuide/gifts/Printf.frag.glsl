
  #ifdef GL_ES 
  precision mediump float; 
  #endif 
  uniform sampler2D u_Sampler; 
  varying vec2 v_TexCoord; 

  // Get the number at the specified digit
  float getNumber(float value, float digit) {  
    int thisDigit = int(value / digit); 
    int upperDigit = int(thisDigit / 10) * 10; 
    return float(thisDigit - upperDigit); 
  }