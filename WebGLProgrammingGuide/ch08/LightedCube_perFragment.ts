import FSHADER_SOURCE from './LightedCube_perFragment.frag'
import VSHADER_SOURCE from './LightedCube_perFragment.vert'
import * as twgl from 'twgl.js'
const Matrix4 = twgl.m4;
const Vector3 = twgl.v3;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl') as HTMLCanvasElement;

  document.title = 'lightedcube_perfragment'

  // canvas.width = 400
  // canvas.height = 400
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

  //
  // window.spector.startCapture(canvas, 150)
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to initialize buffers');
    return;
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0, 0, 0, 1);
  gl.enable(gl.DEPTH_TEST);

  // Get the storage locations of uniform variables and so on
  var u_mMatrix = gl.getUniformLocation(gl.program, 'u_mMatrix');
  var u_vMatrix = gl.getUniformLocation(gl.program, 'u_vMatrix');
  // var u_normalMatrix = gl.getUniformLocation(gl.program, 'u_normalMatrix');
  var u_mvpMatrix = gl.getUniformLocation(gl.program, 'u_mvpMatrix');
  var u_LightDir = gl.getUniformLocation(gl.program, 'u_LightDir');
  if (!u_mvpMatrix || !u_LightDir) {
    console.log('Failed to get the storage location');
    return;
  }

  // Set the viewing volume
  var viewMatrix = Matrix4.identity();   // View matrix
  var mvpMatrix = Matrix4.identity();    // Model view projection matrix
  var mvMatrix = Matrix4.identity();     // Model matrix
  var normalMatrix = Matrix4.identity(); // Transformation matrix for normals
  let modelMat4 = Matrix4.identity()

  // Calculate the view matrix
  viewMatrix = Matrix4.lookAt(Vector3.create(2, 2, 2), Vector3.create(0, 0, 0), Vector3.create(0, 1, 0));
  viewMatrix = Matrix4.inverse(viewMatrix);
  // modelMat4 = Matrix4.rotateY(modelMat4, Math.PI/3)
  // mvMatrix.set(viewMatrix).rotate(60, 0, 1, 0); // Rotate 60 degree around the y-axis
  // Calculate the model view projection matrix
  const projMat = Matrix4.perspective(Math.PI/2, 1, 1, 100);
  mvMatrix = Matrix4.multiply(projMat, viewMatrix);
  mvpMatrix = Matrix4.multiply(mvMatrix, modelMat4);

  normalMatrix = viewMatrix
  // Calculate the matrix to transform the normal based on the model matrix

  gl.uniformMatrix4fv(u_mMatrix, false, modelMat4);
  gl.uniformMatrix4fv(u_vMatrix, false, viewMatrix);

  // Pass the model view matrix to u_mvpMatrix
  gl.uniformMatrix4fv(u_mvpMatrix, false, mvpMatrix);

  // Pass the normal matrixu_normalMatrix
  // gl.uniformMatrix4fv(u_normalMatrix, false, normalMatrix);

  // Pass the direction of the diffuse light(world coordinate, normalized)
  var lightDir = Vector3.create(4.0, 4.0, 3.0);
  gl.uniform3fv(u_LightDir, lightDir);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Draw the cube
  gl.drawElements(gl.TRIANGLE_FAN, n, gl.UNSIGNED_BYTE, 0);
}

function initVertexBuffers(gl: WebGLRenderingContext) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  // Coordinates
  var vertices = new Float32Array([
    1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, // v0-v1-v2-v3 front
    1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, // v0-v3-v4-v5 right
    1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, // v1-v6-v7-v2 left
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, // v7-v4-v3-v2 down
    1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0  // v4-v7-v6-v5 back
  ]);

  // Colors
  var colors = new Float32Array([
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0　    // v4-v7-v6-v5 back
  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // right
    8, 9, 10, 8, 10, 11,    // up
    12, 13, 14, 12, 14, 15,    // left
    16, 17, 18, 16, 18, 19,    // down
    20, 21, 22, 20, 22, 23     // back
  ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  initArrayBuffer(gl, vertices, 3, 'a_Position');
  initArrayBuffer(gl, colors, 3, 'a_Color');
  initArrayBuffer(gl, normals, 3, 'a_Normal');

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(
  gl: WebGLRenderingContext,
  data: BufferSource,
  num: number,
  attribute: string) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW );
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, 3, gl.FLOAT, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

export default main
