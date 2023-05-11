import * as twgl from 'twgl.js'
import { LookAtTrianglesWithKeys } from '../../ch07'
import { angleToRads } from '../../lib/utils'
import { IContextInformation } from './contextInformation'
import { ReadPixelsHelper } from './readPixelsHelper'
import { WebGlConstant, WebGlConstants, WebGlConstantsByValue } from './webglConstants'
import axios from 'axios'
import * as png from 'fast-png'
const Vector3 = twgl.v3
const Matrix4 = twgl.m4

class GraphicEngine {
  bufferInfo: twgl.BufferInfo
  gl: WebGLRenderingContext
  programInfo: twgl.ProgramInfo
  program: WebGLProgram
  modelMatrix: twgl.m4.Mat4
  viewMatrix: twgl.m4.Mat4
  projectMatrix: twgl.m4.Mat4
  textureAry?: WebGLTexture[]
  dftUniform: {
    [key: string]: any;
  }
  constructor(
    gl: WebGLRenderingContext,
    vertData: twgl.Arrays,
    VShaderSource: string,
    FShaderSource: string,
    options?: {
      modelMatrix?: twgl.m4.Mat4
      viewMatrix?: twgl.m4.Mat4
      projectMatrix?: twgl.m4.Mat4
      uniformData?: {
        [key: string]: any;
      },
      textureAry?: WebGLTexture[]
    }) {
    this.gl = gl
    this.programInfo = twgl.createProgramInfo(gl, [VShaderSource, FShaderSource])
    this.program = this.programInfo.program
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, vertData)
    this.modelMatrix = options && options.modelMatrix || twgl.m4.identity()
    this.viewMatrix = options && options.viewMatrix || twgl.m4.identity()
    this.projectMatrix = options && options.projectMatrix || twgl.m4.identity()
    this.dftUniform = options && options.uniformData || {}
    this.textureAry = options && options.textureAry || undefined
    this.init()
  }
  setUniform(unif: {
    [key: string]: any;
  }): void {
    // first time set will record dft Uniform
    this.gl.useProgram(this.program)
    this.dftUniform = unif
    twgl.setUniforms(this.programInfo, unif)
  }
  updateUniform(unif: {
    [key: string]: any;
  }) {
    this.gl.useProgram(this.program)
    twgl.setUniforms(this.programInfo, unif)
  }
  reApplyUniform() {
    this.gl.useProgram(this.program)
    twgl.setUniforms(this.programInfo, this.dftUniform)
  }
  updateTexture() {
    if (this.textureAry) {
      twgl.setUniforms(this.programInfo, {
        u_texture: this.textureAry[0]
      })
    }
  }
  draw(beforeDraw = () => {
    //
  }) {
    this.gl.useProgram(this.program)
    beforeDraw()
    this.updateTexture()
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo)
    twgl.drawBufferInfo(this.gl, this.bufferInfo)
  }
  updateCamera(cameraPos: twgl.v3.Vec3) {
    const cameraUp = Vector3.create(0, 1, 0)
    const camera = Matrix4.lookAt(cameraPos, Vector3.create(0, 0, 0), cameraUp);
    const viewMatrix = Matrix4.inverse(camera)
    this.updateMVP(undefined, viewMatrix, undefined)
  }
  updateMVP(
    modelMatrix?: twgl.m4.Mat4,
    viewMatrix?: twgl.m4.Mat4,
    projMatrix?: twgl.m4.Mat4
  ) {
    const mvpMatrix = twgl.m4.identity()
    const projMat4 = projMatrix || this.projectMatrix
    const modelMat4 = modelMatrix || this.modelMatrix
    const viewMat4 = viewMatrix || this.viewMatrix
    if (viewMatrix) {
      this.viewMatrix = viewMatrix
    }
    if (modelMatrix) {
      this.viewMatrix = modelMatrix
    }
    if (projMatrix) {
      this.projectMatrix = projMatrix
    }
    twgl.m4.multiply(viewMat4, modelMat4, mvpMatrix)
    twgl.m4.multiply(projMat4, mvpMatrix, mvpMatrix)
    // console.log('viewMat4, modelMat4, mvpMatrix');
    // console.log(viewMat4, modelMat4, mvpMatrix);
    this.setUniform({
      model: modelMat4,
      view: viewMat4,
      project: projMat4,
      u_MvpMatrix: mvpMatrix
    })
  }
  init() {
    //
  }
}

type Num3Ary = [number, number, number]

class Frustum {
  // 截锥体 透视 正交
  fov: number
  near: number
  far: number
  aspect: number
  constructor(
    fov: number, // degree
    near = 0.1,
    far = 100,
    aspect = 1,
    mode = 'perspective'
  ) {
    this.fov = fov
    this.near = near
    this.far = far
    this.aspect = aspect
  }
  radianToDegree(rad: number) {
    // 弧度转角度
    return 180 / Math.PI * rad
  }
  degreeToRadian(deg: number) {
    // 角度转弧度
    // pi = 180
    return Math.PI / 180 * deg
  }
  getVal() {
    const rad = this.degreeToRadian(this.fov)
    // Matrix4.perspective() // 透视
    // Matrix4.ortho() // 正交
    // Matrix4.frustum()
    const res = Matrix4.perspective(rad, this.aspect, this.near, this.far)
    return res
  }
  updateVal(opt: {
    fov?: number, // degree
    near?: number,
    far?: number,
    aspect?: number,
  }) {
    const { fov, near, far, aspect } = opt
    if (fov !== undefined) {
      this.fov = fov
    }
    if (near !== undefined) {
      this.near = near
    }
    if (far !== undefined) {
      this.far = far
    }
    if (aspect !== undefined) {
      this.aspect = aspect
    }
    return this.getVal()
  }
}
class Camera {
  eye: Num3Ary
  target: Num3Ary
  cameraUp: Num3Ary
  camera: twgl.m4.Mat4
  canvas?: HTMLCanvasElement
  frustum?: twgl.m4.Mat4
  constructor(
    cameraOpt: {
      eye: Num3Ary,
      target: Num3Ary,
      cameraUp: Num3Ary,
    },
    canvas?: HTMLCanvasElement) {
    const { eye, target, cameraUp } = cameraOpt
    this.eye = eye
    this.target = target
    this.cameraUp = cameraUp
    this.camera = Matrix4.identity()
    this.canvas = canvas
  }
  getCamera() {
    this.camera = Matrix4.lookAt(this.eye, this.target, this.cameraUp)
  }
  getView() {
    this.getCamera()
    const inverseCamera = Matrix4.inverse(this.camera)
    return inverseCamera
  }
  setFrustum(frustum: twgl.m4.Mat4) {
    this.frustum = frustum
  }
  updateView(opt: {
    eye?: Num3Ary
    target?: Num3Ary
    cameraUp?: Num3Ary
  }) {
    const { eye, target, cameraUp } = opt
    if (eye !== undefined) {
      this.eye = eye
    }
    if (target !== undefined) {
      this.target = target
    }
    if (cameraUp !== undefined) {
      this.cameraUp = cameraUp
    }
    return this.getView()
  }
  calcPV(modelMat4?: twgl.m4.Mat4) {
    // frag final pos = perspective * view * model * position
    const view = this.getView()
    if (this.frustum !== undefined) {
      const pv = Matrix4.multiply(this.frustum, view)
      if (modelMat4 !== undefined) {
        const pvm = Matrix4.multiply(pv, modelMat4)
        return pvm
      }
      return pv
    } else {
      throw new Error("frustum can not be undefined")
    }
  }
  enableMove(moveEndCallback = () => {
    //
  }) {
    let startMove = false
    let lastX: number
    let lastY: number
    let yaw = -90
    let pitch = -45
    const dom = this.canvas || document
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
        // const frontCamVec3 = Vector3.create(frontCamX, frontCamY, frontCamZ)
        this.updateView({
          eye: [frontCamX, frontCamY, frontCamZ]
        })
        moveEndCallback()
      } else {
        return
      }
    }
    const onMouseUp = (e: MouseEvent) => {
      startMove = false
      dom.removeEventListener('mousemove', onMousemove)
      dom.removeEventListener('mouseup', onMouseUp)
    }
    const onMousedown = (e: MouseEvent) => {
      startMove = true
      const { offsetX, offsetY } = e
      lastX = offsetX
      lastY = offsetY
      dom.addEventListener('mousemove', onMousemove)
      dom.addEventListener('mouseup', onMouseUp)
    }
    dom.addEventListener('mousedown', onMousedown)
  }
  destroy() {

  }
}
const xformMatrix = (
  resultMat4: twgl.m4.Mat4,
  translate?: [number, number, number],
  rotate?: [number, number, number],
  scale?: [number, number, number]
) => {
  translate = translate || [0, 0, 0]
  rotate = rotate || [0, 0, 0]
  scale = scale || [1, 1, 1]
  const translateMat = Matrix4.translation(translate)
  const rotateX = Matrix4.rotationX(rotate[0])
  const rotateY = Matrix4.rotationX(rotate[1])
  const rotateZ = Matrix4.rotationX(rotate[2])
  const scaleMat = Matrix4.scale(Matrix4.identity(), scale)
  Matrix4.multiply(rotateX, scaleMat, resultMat4)
  Matrix4.multiply(rotateY, resultMat4, resultMat4)
  Matrix4.multiply(rotateZ, resultMat4, resultMat4)
  Matrix4.multiply(translateMat, resultMat4, resultMat4)
}
const createBox = (options?: {
  dimensions?: [number, number, number]
  position?: [number, number, number]
}) => {
  options = options || {};

  var dimensions = options.dimensions || [1, 1, 1];
  var position = options.position || [-dimensions[0] / 2, -dimensions[1] / 2, -dimensions[2] / 2];
  var x = position[0];
  var y = position[1];
  var z = position[2];
  var width = dimensions[0];
  var height = dimensions[1];
  var depth = dimensions[2];

  var fbl = { x: x, y: y, z: z + depth };
  var fbr = { x: x + width, y: y, z: z + depth };
  var ftl = { x: x, y: y + height, z: z + depth };
  var ftr = { x: x + width, y: y + height, z: z + depth };
  var bbl = { x: x, y: y, z: z };
  var bbr = { x: x + width, y: y, z: z };
  var btl = { x: x, y: y + height, z: z };
  var btr = { x: x + width, y: y + height, z: z };

  var positions = new Float32Array([
    //front
    fbl.x, fbl.y, fbl.z,
    fbr.x, fbr.y, fbr.z,
    ftl.x, ftl.y, ftl.z,
    ftl.x, ftl.y, ftl.z,
    fbr.x, fbr.y, fbr.z,
    ftr.x, ftr.y, ftr.z,

    //right
    fbr.x, fbr.y, fbr.z,
    bbr.x, bbr.y, bbr.z,
    ftr.x, ftr.y, ftr.z,
    ftr.x, ftr.y, ftr.z,
    bbr.x, bbr.y, bbr.z,
    btr.x, btr.y, btr.z,

    //back
    fbr.x, bbr.y, bbr.z,
    bbl.x, bbl.y, bbl.z,
    btr.x, btr.y, btr.z,
    btr.x, btr.y, btr.z,
    bbl.x, bbl.y, bbl.z,
    btl.x, btl.y, btl.z,

    //left
    bbl.x, bbl.y, bbl.z,
    fbl.x, fbl.y, fbl.z,
    btl.x, btl.y, btl.z,
    btl.x, btl.y, btl.z,
    fbl.x, fbl.y, fbl.z,
    ftl.x, ftl.y, ftl.z,

    //top
    ftl.x, ftl.y, ftl.z,
    ftr.x, ftr.y, ftr.z,
    btl.x, btl.y, btl.z,
    btl.x, btl.y, btl.z,
    ftr.x, ftr.y, ftr.z,
    btr.x, btr.y, btr.z,

    //bottom
    bbl.x, bbl.y, bbl.z,
    bbr.x, bbr.y, bbr.z,
    fbl.x, fbl.y, fbl.z,
    fbl.x, fbl.y, fbl.z,
    bbr.x, bbr.y, bbr.z,
    fbr.x, fbr.y, fbr.z,
  ]);

  var uvs = new Float32Array([
    //front
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    //right
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    //back
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    //left
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    //top
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1,

    //bottom
    0, 0,
    1, 0,
    0, 1,
    0, 1,
    1, 0,
    1, 1
  ]);

  var normals = new Float32Array(positions.length);
  var i, count;
  var ni;

  for (i = 0, count = positions.length / 3; i < count; i++) {
    ni = i * 3;

    normals[ni] = parseInt(i / 6, 10) === 1 ? 1 :
      parseInt(i / 6, 10) === 3 ? -1 : 0;

    normals[ni + 1] = parseInt(i / 6, 10) === 4 ? 1 :
      parseInt(i / 6, 10) === 5 ? -1 : 0;

    normals[ni + 2] = parseInt(i / 6, 10) === 0 ? 1 :
      parseInt(i / 6, 10) === 2 ? -1 : 0;

  }

  return {
    position: positions,
    normal: normals,
    texcoord: uvs
  };

}


const createSphere = (options?: {
  long_bands?: number
  lat_bands?: number
  radius?: number
}) => {
  options = options || {};

  var long_bands = options.long_bands || 32;
  var lat_bands = options.lat_bands || 32;
  var radius = options.radius || 1;
  var lat_step = Math.PI / lat_bands;
  var long_step = 2 * Math.PI / long_bands;
  var num_positions = long_bands * lat_bands * 4;
  var num_indices = long_bands * lat_bands * 6;
  var lat_angle, long_angle;
  var positions = new Float32Array(num_positions * 3);
  var normals = new Float32Array(num_positions * 3);
  var uvs = new Float32Array(num_positions * 2);
  var indices = new Uint16Array(num_indices);
  var x1, x2, x3, x4,
    y1, y2,
    z1, z2, z3, z4,
    u1, u2,
    v1, v2;
  var i, j;
  var k = 0, l = 0;
  var vi, ti;

  for (i = 0; i < lat_bands; i++) {
    lat_angle = i * lat_step;
    y1 = Math.cos(lat_angle);
    y2 = Math.cos(lat_angle + lat_step);
    for (j = 0; j < long_bands; j++) {
      long_angle = j * long_step;
      x1 = Math.sin(lat_angle) * Math.cos(long_angle);
      x2 = Math.sin(lat_angle) * Math.cos(long_angle + long_step);
      x3 = Math.sin(lat_angle + lat_step) * Math.cos(long_angle);
      x4 = Math.sin(lat_angle + lat_step) * Math.cos(long_angle + long_step);
      z1 = Math.sin(lat_angle) * Math.sin(long_angle);
      z2 = Math.sin(lat_angle) * Math.sin(long_angle + long_step);
      z3 = Math.sin(lat_angle + lat_step) * Math.sin(long_angle);
      z4 = Math.sin(lat_angle + lat_step) * Math.sin(long_angle + long_step);
      u1 = 1 - j / long_bands;
      u2 = 1 - (j + 1) / long_bands;
      v1 = 1 - i / lat_bands;
      v2 = 1 - (i + 1) / lat_bands;
      vi = k * 3;
      ti = k * 2;

      positions[vi] = x1 * radius;
      positions[vi + 1] = y1 * radius;
      positions[vi + 2] = z1 * radius; //v0

      positions[vi + 3] = x2 * radius;
      positions[vi + 4] = y1 * radius;
      positions[vi + 5] = z2 * radius; //v1

      positions[vi + 6] = x3 * radius;
      positions[vi + 7] = y2 * radius;
      positions[vi + 8] = z3 * radius; // v2


      positions[vi + 9] = x4 * radius;
      positions[vi + 10] = y2 * radius;
      positions[vi + 11] = z4 * radius; // v3

      normals[vi] = x1;
      normals[vi + 1] = y1;
      normals[vi + 2] = z1;

      normals[vi + 3] = x2;
      normals[vi + 4] = y1;
      normals[vi + 5] = z2;

      normals[vi + 6] = x3;
      normals[vi + 7] = y2;
      normals[vi + 8] = z3;

      normals[vi + 9] = x4;
      normals[vi + 10] = y2;
      normals[vi + 11] = z4;

      uvs[ti] = u1;
      uvs[ti + 1] = v1;

      uvs[ti + 2] = u2;
      uvs[ti + 3] = v1;

      uvs[ti + 4] = u1;
      uvs[ti + 5] = v2;

      uvs[ti + 6] = u2;
      uvs[ti + 7] = v2;

      indices[l] = k;
      indices[l + 1] = k + 1;
      indices[l + 2] = k + 2;
      indices[l + 3] = k + 2;
      indices[l + 4] = k + 1;
      indices[l + 5] = k + 3;

      k += 4;
      l += 6;
    }
  }

  return {
    position: positions,
    normal: normals,
    texcoord: uvs,
    indices: indices
  };
}

class DebugFrameBuffer {
  gl: WebGLRenderingContext
  canvas: HTMLCanvasElement
  programInfo: twgl.ProgramInfo
  bufferInfo: twgl.BufferInfo
  uniforms: {
    [key: string]: any
  }
  constructor(canvas?: HTMLCanvasElement, gl?: WebGL2RenderingContext | WebGLRenderingContext) {
    const VShader = `
attribute vec4 position;
attribute vec2 uv;

varying vec2 v_UV;
void main() {
  gl_Position = position;
  v_UV = uv;
}
    `
    const FShader = `
precision mediump float;
uniform sampler2D tex0;
varying vec2 v_UV;
void main() {
  vec2 v_Texcoord = v_UV;
  vec4 color = texture2D(tex0, v_Texcoord);
  gl_FragColor = color;
  // gl_FragColor = vec4(v_UV, 0.0, 1.0);
}
    `
    const vertAry = {
      position: {
        data: [ // canvans 的完整区域
          0.5, 1,
          0.5, 0.5,
          1, 0.5,
          0.5, 1,
          1, 0.5,
          1, 1,
        ],
        size: 2,
      },
      uv: {
        data: [
          0, 1,
          0, 0,
          1, 0,
          0, 1,
          1, 0,
          1, 1
        ],
        size: 2,
      }
    }
    if (canvas && gl) {
      this.canvas = canvas
      this.gl = gl as WebGLRenderingContext
    } else {
      this.canvas = document.createElement('canvas')
      this.canvas.width = 800
      this.canvas.height = 800
      document.body.appendChild(this.canvas)
      this.gl = this.canvas.getContext('webgl') as WebGLRenderingContext
    }
    this.programInfo = twgl.createProgramInfo(this.gl, [VShader, FShader])
    this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, vertAry)
    this.uniforms = {}
  }
  drawFramebuffer(tex: WebGLTexture) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    // this.gl.clear(this.gl.COLOR_BUFFER_BIT)
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.useProgram(this.programInfo.program)
    twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo)
    twgl.setUniforms(this.programInfo, {
      tex0: tex
    })
    twgl.drawBufferInfo(this.gl, this.bufferInfo)
  }
  readFromFramebuffer(fbo: WebGLFramebuffer, originFbo?: WebGLFramebuffer) {
    const gl = this.gl
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    if (originFbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, originFbo)
    }
    console.log(pixels);
  }
}
class CustomBtn {
  button: HTMLButtonElement
  constructor(btnName: string, btnOnClick: (e: MouseEvent) => void) {
    const button = this.button = document.createElement('button');
    button.addEventListener('click', btnOnClick);
    button.innerHTML = btnName;
    const container = document.getElementById('btn_container') as HTMLTableRowElement
    container.append(button);
  }
  updateTex(btnTxt: string) {
    this.button.innerHTML = btnTxt
  }
}

async function loadImgArrayBuffer(src: string): Promise<ArrayBuffer> {
  return axios.get(src, {
    responseType: 'arraybuffer'
  }).then(res=>{
    return res.data
  })
}
async function loadImgBlob(src: string): Promise<Blob> {
  return axios.get(src, {
    responseType: 'arraybuffer'
  }).then(res=>{
    const result = res.data as ArrayBuffer
    const blob = new Blob([result])
    return blob
  })
}

// async function testPng(){
//   const png1 = await loadImgBlob('http://localhost:5000/TextureEncodingTest/glTF/0_136_0.png')
//   console.log(png1);
//   const pngicc = await loadImgBlob('http://localhost:5000/TextureEncodingTest/glTF/0_136_0_icc.png')
//   console.log(pngicc);
//   const decode1 = png.decode(png1)
//   const decode2 = png.decode(pngicc)
//   console.log(' _______ result ');
//   console.log(decode1);
//   console.log(decode2);


// }

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.crossOrigin = ''
    img.src = src
    img.onload = () => {
      resolve(img)
    }
  })
}

async function loadHDR(hdrSrc: string): Promise<{
  dataFloat: Float32Array,
  dataRGBE: Uint8Array
  imageData: ImageData,
  canvas: HTMLCanvasElement
}> {
  return new Promise((resolve, reject) => {
    // https://enkimute.github.io/hdrpng.js/
    const hdrloader = new window.HDRImage()
    hdrloader.src = hdrSrc;
    hdrloader.onload = () => {
      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB9_E5, w, h, 0, gl.RGB, gl.FLOAT, new Float32Array(myHDR.dataRAW.buffer));
      const width = hdrloader.width
      const height = hdrloader.height
      const ctx = (hdrloader as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
      const imageData = ctx.createImageData(width, height)
      console.log(' dataFloat ', hdrloader.dataFloat);
      console.log(' dataRGBE ', hdrloader.dataRGBE);
      const dataFloat = hdrloader.dataFloat
      const dataRGBE = hdrloader.dataRGBE
      resolve({
        dataFloat,
        dataRGBE,
        imageData,
        canvas: hdrloader
      })
      // hdrloader.toHDRBlob(function (blob: Blob) {
      //   var a = document.createElement('a');
      //   a.href = URL.createObjectURL(blob);
      //   a.download = 'memorial.RGBE.PNG';
      //   a.innerHTML = 'click to save';
      //   document.body.appendChild(a); // or a.click()
      //   a.click()
      //   // resolve(blob)
      // })
    }
  })
}

async function createTextures(gl: WebGLRenderingContext, texinfo: {
  [key: string]: twgl.TextureOptions
}): Promise<{
  [key: string]: WebGLTexture;
}> {
  return new Promise((resolve, reject) => {
    twgl.createTextures(gl, texinfo, (err, textures: {
      [key: string]: WebGLTexture;
    }) => {
      if (err) {
        reject(err)
      }
      resolve(textures)
    })
  })
}
async function createTexture(gl: WebGLRenderingContext, texinfo: twgl.TextureOptions
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    twgl.createTexture(gl, texinfo, (err: any, tex: WebGLTexture) => {
      console.log(' qqq here ~~~ ');
      if (err) {
        reject(err)
      }
      resolve(tex)
    })
  })
}


function toRadias(angle: number) {
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number) {
  // 360 = 2PI
  return 180 / Math.PI * radias
}

function clamp(value: any, min: number, max: number, defaultValue: number) {
  const numValue = Number(value);
  if(value === undefined || value === null){
    if(defaultValue!==undefined){
        return defaultValue;
    }
  }
  if (isNaN(numValue)) {
    return min;
  }
  return Math.min(Math.max(numValue, min), max);
}

export {
  GraphicEngine,
  Camera,
  Frustum,
  xformMatrix,
  createBox,
  createSphere,
  DebugFrameBuffer,
  CustomBtn,
  loadHDR,
  loadImgArrayBuffer,
  loadImgBlob,
  loadImg,
  createTexture,
  createTextures,
  toRadias,
  toAngle,
  clamp,
}
