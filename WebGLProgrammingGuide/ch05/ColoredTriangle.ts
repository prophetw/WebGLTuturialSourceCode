import FSHADER_SOURCE from './ColoredTriangle.frag.glsl'
import VSHADER_SOURCE from './ColoredTriangle.vert.glsl'
// ColoredTriangle.js (c) 2012 matsuda
// Vertex shader program
// var VSHADER_SOURCE =
//   'attribute vec4 a_Position;\n' +
//   'attribute vec4 a_Color;\n' +
//   'varying vec4 v_Color;\n' +
//   'void main() {\n' +
//   '  gl_Position = a_Position;\n' +
//   '  v_Color = a_Color;\n' +
//   '}\n';

// // Fragment shader program
// var FSHADER_SOURCE =
//   '#ifdef GL_ES\n' +
//   'precision mediump float;\n' +
//   '#endif GL_ES\n' +
//   'varying vec4 v_Color;\n' +
//   'void main() {\n' +
//   '  gl_FragColor = v_Color;\n' +
//   '}\n';

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  var gl = window.getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  window.spector.startCapture(canvas, 100)
  //
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  // gl.drawArrays(gl.LINE, 0, n);
  gl.drawArrays(gl.TRIANGLES, 0, n);
  // gl.drawArrays(gl.LINE_LOOP, 0, n);
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
    0.0, 0.5,    0.0, 1.0, 0.0,
    -0.5, -0.5,  1.0, 0.0, 0.0,
    0.5, -0.5,   0.0, 0.0, 1.0,
  ]);
  var n = 3;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);
  console.log(' -----  ARRAY_BUFFER  ', gl.getParameter(gl.ARRAY_BUFFER_BINDING));
  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  console.log(FSIZE);
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  console.log(' -------- a_Position ',a_Position);
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }

  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, FSIZE * 5, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  // Get the storage location of a_Position, assign buffer and enable
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  console.log(' -------- a_color ',a_Color);
  if (a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 5, FSIZE * 2);
  gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  console.log(' -----  ARRAY_BUFFER  ', gl.getParameter(gl.ARRAY_BUFFER_BINDING));
  return n;
}

export default main
