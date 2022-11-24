
import VSHADER_SOURCE from './CoordinateSystem.vert.glsl'
import FSHADER_SOURCE from './CoordinateSystem.frag.glsl'

function main() {
  var canvas = document.getElementById('webgl') as HTMLCanvasElement; // Retrieve <canvas> element
  var gl = window.getWebGLContext(canvas);              // Get the rendering context for WebGL
  initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);   // Initialize shaders
  var n = initVertexBuffers(gl);      // Set vertex coordinates and colors

  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Specify the color for clearing <canvas>
  gl.enable(gl.DEPTH_TEST)
  // gl.clear(gl.COLOR_BUFFER_BIT);      // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);      // Clear <canvas>
  gl.drawArrays(gl.TRIANGLES, 0, n);  // Draw the triangles
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  var pc = new Float32Array([ // Vertex coordinates and color
     0.0,  0.5,  -0.1,  0.0,  0.0,  1.0,  // The front blue one
    -0.5, -0.5,  -0.1,  0.0,  0.0,  1.0,
     0.5, -0.5,  -0.1,  1.0,  1.0,  0.0,

     0.5,  0.4,  -0.5,  1.0,  1.0,  0.0,  // The red triangle is behind
    -0.5,  0.4,  -0.5,  1.0,  0.0,  0.0,
     0.0, -0.6,  -0.5,  1.0,  0.0,  0.0,
  ]);
  var numVertex = 3; var numColor = 3; var n = 6;

  // Create a buffer object and write data to it
  var pcbuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, pcbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pc, gl.STATIC_DRAW);

  var FSIZE = pc.BYTES_PER_ELEMENT;   // The number of byte
  var STRIDE = numVertex + numColor;　// Stride

  // Assign the vertex coordinates to attribute variable and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  gl.vertexAttribPointer(a_Position, numVertex, gl.FLOAT, false, FSIZE * STRIDE, 0);
  gl.enableVertexAttribArray(a_Position);

  // Assign the vertex colors to attribute variable and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  gl.vertexAttribPointer(a_Color, numColor, gl.FLOAT, false, FSIZE * STRIDE, FSIZE * numVertex);
  gl.enableVertexAttribArray(a_Color);

  return n;
}

export default main
