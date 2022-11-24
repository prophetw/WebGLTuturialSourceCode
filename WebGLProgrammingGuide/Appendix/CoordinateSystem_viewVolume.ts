
function main() {
  var canvas = document.getElementById('webgl') as HTMLCanvasElement; // Retrieve <canvas> element
  var gl = window.getWebGLContext(canvas);              // Get the rendering context for WebGL
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);   // Initialize shaders
  var n = initVertexBuffers(gl);   // Set vertex coordinates and colors

  gl.enable(gl.DEPTH_TEST);           // Enable the hidden surface removal function
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Set the clear color for <canvas>
  // Get the storage location of u_MvpMatrix
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');

  var mvpMatrix = new Matrix4();
  mvpMatrix.setOrtho(-1, 1, -1, 1, 0, 1);   // Set the viewing volume
  // Pass the view matrix to u_MvpMatrix
  gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear the color buffer
  gl.drawArrays(gl.TRIANGLES, 0, n);  // Draw the triangles
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  var verticesColors = new Float32Array([ // Vertex coordinates and color
     0.0,  0.5,  -0.1,  0.0,  0.0,  1.0,  // The front blue one
    -0.5, -0.5,  -0.1,  0.0,  0.0,  1.0,
     0.5, -0.5,  -0.1,  1.0,  1.0,  0.0,

     0.5,  0.4,  -0.5,  1.0,  1.0,  0.0,  // The red one is behind
    -0.5,  0.4,  -0.5,  1.0,  0.0,  0.0,
     0.0, -0.6,  -0.5,  1.0,  0.0,  0.0,
  ]);
  var numVertex = 3; var numColor = 3; var n = 6;

  // Create a buffer object and write data to it
  var vertexPositionbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;  // The number of byte
  var STRIDE = numVertex + numColor;　　　　　　 // Stride

  // Write the vertex information and enable it
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, numVertex, gl.FLOAT, false, FSIZE * STRIDE, 0);
  gl.enableVertexAttribArray(a_Position);

  // 頂点の色を設定し、有効化する
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  gl.vertexAttribPointer(a_Color, numColor, gl.FLOAT, false, FSIZE * STRIDE, FSIZE * numVertex);
  gl.enableVertexAttribArray(a_Color);

  return n;
}
