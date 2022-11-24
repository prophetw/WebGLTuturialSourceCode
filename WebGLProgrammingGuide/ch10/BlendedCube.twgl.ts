import FSHADER_SOURCE from './BlendedCube.frag.glsl'
import VSHADER_SOURCE from './BlendedCube.vert.glsl'
import * as twgl from 'twgl.js';
import { angleToRads } from '../../lib/utils';
const Matrix4 = twgl.m4
const Vector3 = twgl.v3

const dftPos = Vector3.normalize(Vector3.create(5, 5, 5))
let cameraPos = Vector3.create(dftPos[0] * 5, dftPos[1] * 5, dftPos[2] * 5)

function main() {
  // Retrieve <canvas> element
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  var gl = twgl.getContext(canvas);
  const pInfo = twgl.createProgramInfo(gl, [VSHADER_SOURCE, FSHADER_SOURCE])
  console.log(' pInfo --- ', pInfo);
  // Set the clear color and enable the depth test
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  // Enable alpha blending
  gl.enable(gl.BLEND);
  // Set blending function
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  const bufInfo = initVertexBuffers(gl)

  // window.spector.startCapture(canvas, 100)
  draw(pInfo, gl, bufInfo)
  enableCamera(canvas, gl, (campos)=>{
    draw(pInfo, gl, bufInfo)
  })
}

function updateCam (){
  const model = Matrix4.identity()
  const perspective = Matrix4.perspective(30, 1, 0.1, 1000)
  const target = Vector3.create(0,0,0)
  const camUp = Vector3.create(0, 1, 0)
  const camPos = Matrix4.lookAt(cameraPos, target, camUp)
  const v = Matrix4.inverse(camPos)
  const vm = Matrix4.multiply(v, model)
  const mvp = Matrix4.multiply(perspective, vm)
  const uniformData = {
    u_MvpMatrix: mvp
  }
  return uniformData
}
function draw(pInfo: twgl.ProgramInfo, gl: WebGLRenderingContext, bufInfo: twgl.BufferInfo){
  gl.useProgram(pInfo.program)
  twgl.setBuffersAndAttributes(gl, pInfo, bufInfo)
  const mvp = updateCam()
  twgl.setUniforms(pInfo, mvp)
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  // gl.clear(gl.COLOR_BUFFER_BIT );
  // lock depth
  gl.depthMask(false)
  // Draw the cube
  twgl.drawBufferInfo(gl, bufInfo)
  gl.depthMask(true)

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

  var vertices = [   // Vertex coordinates
    1.0, 1.0, 1.0,      -1.0, 1.0, 1.0,     -1.0, -1.0, 1.0,      1.0, -1.0, 1.0,    // v0-v1-v2-v3 front
    1.0, 1.0, 1.0,      1.0, -1.0, 1.0,     1.0, -1.0, -1.0,      1.0, 1.0, -1.0,    // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,      1.0, 1.0, -1.0,     -1.0, 1.0, -1.0,      -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
    -1.0, 1.0, 1.0,     -1.0, 1.0, -1.0,    -1.0, -1.0, -1.0,     -1.0, -1.0, 1.0,    // v1-v6-v7-v2 left
    -1.0, -1.0, -1.0,   1.0, -1.0, -1.0,    1.0, -1.0, 1.0,       -1.0, -1.0, 1.0,    // v7-v4-v3-v2 down
    1.0, -1.0, -1.0,    -1.0, -1.0, -1.0,   -1.0, 1.0, -1.0,      1.0, 1.0, -1.0     // v4-v7-v6-v5 back
  ];

  var colors = [     // Colors
    0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  0.5, 0.5, 1.0, 0.4,  // v0-v1-v2-v3 front(blue)
    0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  0.5, 1.0, 0.5, 0.4,  // v0-v3-v4-v5 right(green)
    1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  1.0, 0.5, 0.5, 0.4,  // v0-v5-v6-v1 up(red)
    1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  1.0, 1.0, 0.5, 0.4,  // v1-v6-v7-v2 left
    1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  1.0, 1.0, 1.0, 0.4,  // v7-v4-v3-v2 down
    0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4,  0.5, 1.0, 1.0, 0.4   // v4-v7-v6-v5 back
  ];

  var indices = ([       // Indices of the vertices
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // right
    8, 9, 10, 8, 10, 11,    // up
    12, 13, 14, 12, 14, 15,    // left
    16, 17, 18, 16, 18, 19,    // down
    20, 21, 22, 20, 22, 23     // back
  ]);
  const bufData: twgl.Arrays = {
    a_Color: {
      data: colors,
    },
    a_Position: {
      data: vertices
    },
    indices,
  }
  const bufInfo: twgl.BufferInfo = twgl.createBufferInfoFromArrays(gl, bufData)
  return bufInfo
}

function enableCamera(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  callback = (camPos: twgl.v3.Vec3) => {
    //
  }
) {
  console.log(' enable came');
  let startMove = false
  let lastX: number
  let lastY: number
  let yaw = -90
  let pitch = -45

  const onMousemove = (e: MouseEvent) => {
    if (startMove) {
      const sensitivity = 0.5
      const { offsetX, offsetY } = e
      const offsetXx = (offsetX - lastX)
      const offsetYy = (offsetY - lastY) // 往上是正
      lastX = offsetX
      lastY = offsetY
      const xoffset = offsetXx * sensitivity
      const yoffset = offsetYy * sensitivity
      yaw += xoffset;
      pitch += yoffset;
      // NOTE: 仅绕圆环平面旋转
      // pitch += 0;

      if (pitch > 89)
        pitch = 89;
      if (pitch < -89)
        pitch = -89;
      //  绕圆心
      const frontCamX = Math.cos(angleToRads(yaw)) * Math.cos(angleToRads(pitch)) * 5
      const frontCamY = Math.sin(angleToRads(pitch)) * 5
      const frontCamZ = Math.sin(angleToRads(yaw)) * Math.cos(angleToRads(pitch)) * 5

      const frontCamVec3 = Vector3.create(frontCamX, frontCamY, frontCamZ)
      cameraPos = frontCamVec3
      callback(cameraPos)
    } else {
      return
    }
  }
  const onMouseUp = (e: MouseEvent) => {
    startMove = false
    document.removeEventListener('mousemove', onMousemove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  const onMousedown = (e: MouseEvent) => {
    startMove = true
    const { offsetX, offsetY } = e
    lastX = offsetX
    lastY = offsetY
    document.addEventListener('mousemove', onMousemove)
    document.addEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousedown', onMousedown)
}


export default main
