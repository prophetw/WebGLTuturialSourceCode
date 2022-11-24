import FSHADER_SOURCE from './LookAtTriangles.frag.glsl'
import VSHADER_SOURCE from './LookAtTriangles.vert.glsl'
// LookAtTriangles.js (c) 2012 matsuda
// Vertex shader program
// var VSHADER_SOURCE =
//   'attribute vec4 a_Position;\n' +
//   'attribute vec4 a_Color;\n' +
//   'uniform mat4 u_ViewMatrix;\n' +
//   'varying vec4 v_Color;\n' +
//   'void main() {\n' +
//   '  gl_Position = u_ViewMatrix * a_Position;\n' +
//   '  v_Color = a_Color;\n' +
//   '}\n';

// // Fragment shader program
// var FSHADER_SOURCE =
//   '#ifdef GL_ES\n' +
//   'precision mediump float;\n' +
//   '#endif\n' +
//   'varying vec4 v_Color;\n' +
//   'void main() {\n' +
//   '  gl_FragColor = v_Color;\n' +
//   '}\n';
const viewModel = {
  eyeX: 0.2,
  eyeY: 0.25,
  eyeZ: 0.25,
  x: 0,
  y: 0,
  z: 0,
  upX: 0,
  upY: 1,
  upZ: 0,
}
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

  // Set the vertex coordinates and color (the blue triangle is in the front)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  changeViewModel(gl)

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
  injectOptions(gl, n)
}

function redraw  (gl:WebGLRenderingContext, n: number){

  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function changeViewModel(gl:WebGLRenderingContext){

  // Get the storage location of u_ViewMatrix
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage locations of u_ViewMatrix');
    return;
  }

  // Set the matrix to be used for to set the camera view
  var viewMatrix = new Matrix4();
  const {eyeX, eyeY, eyeZ, x,y,z,upX,upY,upZ} = viewModel
  viewMatrix.setLookAt(eyeX, eyeY, eyeZ, x,y,z,upX,upY,upZ);

  // Set the view matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
}


function injectOptions (gl:WebGLRenderingContext, n: number){
  const html = `
      <label for="eyeX" class="form-label">eyeX click to active then use arrowup arrowdown to adjust</label>
      <input type="range" class="form-range" value="0.2" step="0.1" min="-10" max="10" id="eyeX">
      <label for="eyeY" class="form-label">eyeY</label>
      <input type="range" class="form-range" value="0.25" step="0.1" min="-10" max="10" id="eyeY">
      <label for="eyeZ" class="form-label">eyeZ</label>
      <input type="range" class="form-range" value="0.25" step="0.1" min="-10" max="10" id="eyeZ">
  `
  const div = document.createElement('div')
  div.innerHTML = html
  div.style.position = 'absolute'
  div.style.top = '410px'
  div.style.right = '0px'
  document.body.appendChild(div)
  const eyeX = document.getElementById('eyeX')
  if(eyeX){
    eyeX.addEventListener('change', e=>{
      if(e && e.target && e.target.value){
        console.log(e.target.value);
        viewModel.eyeX=e.target.value
        changeViewModel(gl)
        redraw(gl, n)
      }
    })
  }
  const eyeY = document.getElementById('eyeY')
  if(eyeY){
    eyeY.addEventListener('change', e=>{
      console.log(e.target.value);
        viewModel.eyeY=e.target.value
        changeViewModel(gl)
        redraw(gl, n)
    })
  }
  const eyeZ = document.getElementById('eyeZ')
  if(eyeZ){
    eyeZ.addEventListener('change', e=>{
      console.log(e.target.value);
        viewModel.eyeZ=e.target.value
        changeViewModel(gl)
        redraw(gl, n)
    })
  }
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  var verticesColors = new Float32Array([
    // Vertex coordinates and color(RGBA)
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4,

     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4,

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4,
  ]);
  var n = 9;

  // Create a buffer object
  var vertexColorbuffer = gl.createBuffer();
  if (!vertexColorbuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write the vertex coordinates and color to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorbuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);

  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return n;
}

export default main
