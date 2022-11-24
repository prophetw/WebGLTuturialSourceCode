import FSHADER_SOURCE from './LookAtRotatedTriangles.frag.glsl'
import VSHADER_SOURCE from './LookAtRotatedTriangles.vert.glsl'
// LookAtRotatedTriangles.js (c) 2012 matsuda
// Vertex shader program
interface ViewModelType {
  eyeX: number;
  eyeY: number;
  eyeZ: number;
  x: number;
  y: number;
  z: number;
  upX: number;
  upY: number;
  upZ: number;
  angleX: number;
  angleY: number;
  angleZ: number;
}
const viewModel: ViewModelType = {
  eyeX: 0.2,
  eyeY: 0.25,
  eyeZ: 0.25,
  x: 0,
  y: 0,
  z: 0,
  upX: 0,
  upY: 1,
  upZ: 0,
  angleX: 0,
  angleY: 0,
  angleZ: 0,
}
type Keysss = keyof ViewModelType

export function renderViewModelValue (viewModel: ViewModelType){
  let str = ''
  Object.keys(viewModel).map((key)=>{
    const theKey = key as Keysss
    str+=`${theKey}: ${viewModel[theKey]} <br />`
  })
  const div = document.getElementById('render_view')
  if(div){
    div.style.position='absolute'
    div.style.right='0px'
    div.style.top='0px'
    div.innerHTML = str
  }
}
function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

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
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Get the storage location of u_ViewMatrix and u_ModelMatrix
  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if(!u_ViewMatrix || !u_ModelMatrix) {
    console.log('Failed to get the storage location of u_viewMatrix or u_ModelMatrix');
    return;
  }

  // Set the matrix to be used for to set the camera view
  var viewMatrix = new Matrix4();
  viewMatrix.setLookAt(0.20, 0.25, 0.25, 0, 0, 0, 0, 1, 0);

  // Calculate matrix for rotate
  var modelMatrix = new Matrix4();
  modelMatrix.setRotate(0, 0, 0, 1); // Rotate around z-axis

  // Pass the view projection matrix and model matrix
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  injectOptions(gl, n)
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gl.drawArrays(gl.TRIANGLES, 0, n);
  // Draw 坐标轴
  gl.drawArrays(gl.LINES, 9, 6);

}

function redraw  (gl:WebGLRenderingContext, n: number){
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, n);
  // Draw 坐标轴
  gl.drawArrays(gl.LINES, 9, 6);
  renderViewModelValue(viewModel)
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

type AxisName = 'X' | 'Y' | 'Z'
function changeAngle(gl:WebGLRenderingContext, axis: AxisName){

  // Get the storage location of u_ViewMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage locations of u_ViewMatrix');
    return;
  }

  // Set the matrix to be used for to set the camera view
  var modelMatrix = new Matrix4();
  const {angleX, angleY, angleZ} = viewModel
  if(axis === 'X'){
    modelMatrix.setRotate(angleX, 1, 0, 0); // Rotate around z-axis
  }
  if(axis === 'Y'){
    modelMatrix.setRotate(angleY, 0, 1, 0); // Rotate around z-axis
  }
  if(axis === 'Z'){
    modelMatrix.setRotate(angleZ, 0, 0, 1); // Rotate around z-axis
  }

  // Pass the view projection matrix and model matrix
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Set the view matrix
}


function injectOptions (gl:WebGLRenderingContext, n: number){
  const html = `
      <label for="eyeX" class="form-label">eyeX click to active then use arrowup arrowdown to adjust</label>
      <input type="range" class="form-range" value="${viewModel.eyeX}" step="0.1" min="-10" max="10" id="eyeX">
      <label for="eyeY" class="form-label">eyeY</label>
      <input type="range" class="form-range" value="${viewModel.eyeY}" step="0.1" min="-10" max="10" id="eyeY">
      <label for="eyeZ" class="form-label">eyeZ</label>
      <input type="range" class="form-range" value="${viewModel.eyeZ}" step="0.1" min="-10" max="10" id="eyeZ">
      <label for="angleX" class="form-label">angleX</label>
      <input type="range" class="form-range" value="${viewModel.angleX}" step="1" min="-360" max="360" id="angleX">
      <label for="angleY" class="form-label">angleY</label>
      <input type="range" class="form-range" value="${viewModel.angleY}" step="1" min="-360" max="360" id="angleY">
      <label for="angleZ" class="form-label">angleZ</label>
      <input type="range" class="form-range" value="${viewModel.angleZ}" step="1" min="-360" max="360" id="angleZ">
  `
  const div = document.createElement('div')
  div.innerHTML = html
  div.style.position = 'absolute'
  div.style.top = '410px'
  div.style.right = '0px'
  const result = document.createElement('div')
  result.id = 'render_view'
  document.body.appendChild(div)
  document.body.appendChild(result)
  renderViewModelValue(viewModel)

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
  const angleX = document.getElementById('angleX')
  if(angleX){
    angleX.addEventListener('change', e=>{
      console.log(e.target.value);
        viewModel.angleX=e.target.value
        viewModel.angleY=0
        viewModel.angleZ=0
        changeAngle(gl, 'X')
        redraw(gl, n)
    })
  }
  const angleY = document.getElementById('angleY')
  if(angleY){
    angleY.addEventListener('change', e=>{
      console.log(e.target.value);
        viewModel.angleY=e.target.value
        viewModel.angleX=0
        viewModel.angleZ=0
        changeAngle(gl, 'Y')
        redraw(gl, n)
    })
  }
  const angleZ = document.getElementById('angleZ')
  if(angleZ){
    angleZ.addEventListener('change', e=>{
      console.log(e.target.value);
        viewModel.angleZ=e.target.value
        viewModel.angleX=0
        viewModel.angleY=0
        changeAngle(gl, 'Z')
        redraw(gl, n)
    })
  }
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
     0.0,  0.5,  -0.4,  0.4,  1.0,  0.4, // The back green one
    -0.5, -0.5,  -0.4,  0.4,  1.0,  0.4,
     0.5, -0.5,  -0.4,  1.0,  0.4,  0.4,

     0.5,  0.4,  -0.2,  1.0,  0.4,  0.4, // The middle yellow one
    -0.5,  0.4,  -0.2,  1.0,  1.0,  0.4,
     0.0, -0.6,  -0.2,  1.0,  1.0,  0.4,

     0.0,  0.5,   0.0,  0.4,  0.4,  1.0,  // The front blue one
    -0.5, -0.5,   0.0,  0.4,  0.4,  1.0,
     0.5, -0.5,   0.0,  1.0,  0.4,  0.4,
    // 坐标线
     0.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // X
     1.0,  0.0,   0.0,  0.0,  0.0,  0.0,
     0.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // Y
     0.0,  1.0,   0.0,  0.0,  0.0,  0.0,
     0.0,  0.0,   0.0,  1.0,  1.0,  1.0,  // Z
     0.0,  0.0,   1.0,  0.0,  0.0,  0.0,
  ]);
  var n = 9;

  // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  if (!vertexColorBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Write vertex information to buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Color and enable the assignment
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
