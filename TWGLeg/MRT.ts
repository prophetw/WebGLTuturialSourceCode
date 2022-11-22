
import FSMRT from './MRT.frag'
import VSMRT from './MRT.vert'
import FSMRTDraw from './MRTDraw.frag'
import VSMRTDraw from './MRTDraw.vert'



import * as twgl from 'twgl.js';
import { angleToRads } from '../lib/utils';
import { Camera, Frustum } from '../src/utils/utils';
const Matrix4 = twgl.m4
const Vector3 = twgl.v3

const dftPos = Vector3.normalize(Vector3.create(1, 1, 1))
let cameraPos = Vector3.create(dftPos[0] * 5, dftPos[1] * 5, dftPos[2] * 5)

function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  const gl = canvas.getContext('webgl') as WebGLRenderingContext
  const ext = gl.getExtension("ANGLE_instanced_arrays");
  const m4 = twgl.m4;
  twgl.addExtensionsToContext(gl);
  if (ext !== null) {
    // @ts-ignore
    gl.drawArraysInstanced = ext?.drawArraysInstancedANGLE
  }
  const drawBuffers = gl.getExtension("WEBGL_draw_buffers");
  console.log(' --- drawBuffers', drawBuffers);
  if (drawBuffers !== null) {
    // @ts-ignore
    gl.drawBuffers = drawBuffers.drawBuffersWEBGL
  }
  // @ts-ignore
  if (!gl.drawArraysInstanced || !gl.createVertexArray) {
    alert("need drawArraysInstanced and createVertexArray"); // eslint-disable-line
    return;
  }
  const MRTInfo = twgl.createProgramInfo(gl, [VSMRT, FSMRT]);
  const MRTDrawpInfo = twgl.createProgramInfo(gl, [VSMRTDraw, FSMRTDraw]);
  console.log(' MRT ', MRTInfo);
  console.log(" draw ", MRTDrawpInfo);
  // window.spector.startCapture(canvas, 1000)
  const arrays = twgl.primitives.createPlaneVertices()
  console.log('plane vertics ', arrays);


  const perspective = new Frustum(30, 0.01, 100, 1).getVal()
  const cameraObj = new Camera({
    eye: [1, 1, 0], target: [0, 0, 0], cameraUp: [0, 1, 0]
  }, canvas)

  cameraObj.enableMove(() => {
    // const pv = cameraObj.calcPV()
  })
  cameraObj.setFrustum(perspective)
  const pv = cameraObj.calcPV()
  const modelMat4 = Matrix4.identity()
  const u_MvpMatrix = Matrix4.multiply(pv, modelMat4)
  const uniforms = {
    u_MvpMatrix
  }

  Object.assign(arrays, {
    color: {
      data: [
        1.0, 0.0, 0.0,
      ],
      numComponents: 3,
      divisor: 1
    }
  })
  const bInfo = twgl.createBufferInfoFromArrays(gl, arrays)

  const screenAry = { // 这个是 canvas的
    position: {
      data: [
        0.25, 1,
        0.25, 0.25,
        1, 0.25,
        0.25, 1,
        1, 0.25,
        1, 1,
      ],
      size: 2,
    },
    uv: {
      data: [
        0, 1,
        0,0,
        1,0,
        0,1,
        1,0,
        1, 1
      ],
      size: 2,
    }
  }
  const aBufInfo = twgl.createBufferInfoFromArrays(gl, screenAry)

  const { RGBA, UNSIGNED_BYTE, LINEAR, NEAREST, DEPTH_STENCIL, CLAMP_TO_EDGE } = gl
  const attachments = [
    { format: gl.RGBA, type: UNSIGNED_BYTE, min: NEAREST, wrap: gl.CLAMP_TO_EDGE },
    { format: RGBA, type: UNSIGNED_BYTE, min: NEAREST, wrap: CLAMP_TO_EDGE },
    { format: RGBA, type: UNSIGNED_BYTE, min: NEAREST, wrap: CLAMP_TO_EDGE },
    { format: RGBA, type: UNSIGNED_BYTE, min: NEAREST, wrap: CLAMP_TO_EDGE },
    { format: DEPTH_STENCIL, },
  ];
  const fbi = twgl.createFramebufferInfo(gl, attachments);
  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0,
    gl.COLOR_ATTACHMENT1,
    gl.COLOR_ATTACHMENT2,
    gl.COLOR_ATTACHMENT3,
  ]);
  gl.clearColor(0.0, 0.0, 0.0, 1.0)
  gl.activeTexture(gl.TEXTURE1)
  gl.bindTexture(gl.TEXTURE_2D, fbi.attachments[0]); // frameBuffer COLOR_ATTACHMENT0)
  gl.activeTexture(gl.TEXTURE2)
  gl.bindTexture(gl.TEXTURE_2D, fbi.attachments[1]); // frameBuffer COLOR_ATTACHMENT0)
  gl.activeTexture(gl.TEXTURE3)
  gl.bindTexture(gl.TEXTURE_2D, fbi.attachments[2]); // frameBuffer COLOR_ATTACHMENT0)
  gl.activeTexture(gl.TEXTURE4)
  gl.bindTexture(gl.TEXTURE_2D, fbi.attachments[3]); // frameBuffer COLOR_ATTACHMENT0)

  uniforms.tex0 = fbi.attachments[0]
  uniforms.tex1 = fbi.attachments[1]
  uniforms.tex2 = fbi.attachments[2]
  uniforms.tex3 = fbi.attachments[3]

  const render = () => {

    //////////////////////
    // draw in framebuffer
    //////////////////////


    // 写入到 fragshader gl_FragData[0,1,2,3]
    twgl.bindFramebufferInfo(gl, fbi)
    twgl.resizeCanvasToDisplaySize(canvas)
    console.log(' fbi ', fbi);
    gl.useProgram(MRTInfo.program)

    twgl.setBuffersAndAttributes(gl, MRTInfo, bInfo)
    twgl.setUniforms(MRTInfo, uniforms)
    gl.clear(gl.COLOR_BUFFER_BIT)
    twgl.drawBufferInfo(gl, bInfo, gl.TRIANGLES, bInfo.numElements, undefined, 1)

    /////////////////
    // draw in canvas
    /////////////////
    // const vertexArrayInfo = twgl.createVertexArrayInfo(gl, MRTDrawpInfo, bInfo);
    // console.log('vertexArrayInfo', vertexArrayInfo);
    twgl.bindFramebufferInfo(gl, null)
    twgl.resizeCanvasToDisplaySize(canvas)
    gl.useProgram(MRTDrawpInfo.program)
    twgl.setBuffersAndAttributes(gl, MRTDrawpInfo, aBufInfo )
    twgl.setUniforms(MRTDrawpInfo, uniforms)
    gl.clear(gl.COLOR_BUFFER_BIT)
    twgl.drawBufferInfo(gl, aBufInfo , gl.TRIANGLES, aBufInfo.numElements, undefined, 1)

  }

  window.spector.startCapture(canvas, 1000)
  twgl.createTextures(gl, {
    face: {
      src: 'https://th.bing.com/th/id/OIP.Russj_ScHRzeGEodKscxEgHaEo?pid=ImgDet&rs=1',
      flipY: 1,
      min: gl.NEAREST,
      mag: gl.NEAREST,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      // level: 1,
    }
  }, (err, data) => {
    console.log(' data ', data);
    const tex = data.face
    uniforms.texture0 = tex
    render()
    cameraObj.enableMove(() => {
      const mvp = cameraObj.calcPV(Matrix4.identity())
      uniforms.u_MvpMatrix = mvp
      render()
    })
  })
  // const vertBufferInf = twgl.createBu



}
export default main
