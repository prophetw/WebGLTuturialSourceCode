import * as twgl from 'twgl.js'
import PathTracingFS1 from './pathTracingDirectLightOnly.frag'
import PathTracingFS from './pathTracingDirectAndIndirect.frag'
import quadVS from './quad.vert'
import Scene from '../Core/Scene'
import { OrthographicFrustum, PerspectiveFrustum } from '../Core/Camera'
import Model3D from '../Core/Model'
import shaderProgramCache from '../Core/ShaderProgram'
import { createTextures } from '../utils/AllUtils'

function toRadias(angle: number) {
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number) {
  // 360 = 2PI
  return 180 / Math.PI * radias
}


async function PathTracing() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  canvas.width = 500
  canvas.height = 500
  const gl = canvas.getContext('webgl2')
  gl.viewport(0, 0, canvas.width, canvas.height);
  if (gl === null) {
    console.error(' gl is null ');
    return
  }
  // twgl.setAttributePrefix('a_')
  // const pInfo = quadVS, PathTracingFS
  const pInfo = shaderProgramCache.getProgramInfo(gl, quadVS, PathTracingFS)

  console.log(' program info ', pInfo);
  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl, 2)
  console.log(' triBufInfo  ', quadBufInfo);
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)
  gl.clearDepth(1.0)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  const textureObj = await createTextures(gl, {
    brdfLUT: {
      // level: 0,
      auto: true,
      src: `./resources/pbr/brdfLUTTexture.png`,
      format: gl.RGBA8,
      // internalFormat: gl.R8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
  })
  console.log(' texObj ', textureObj);

  gl.useProgram(pInfo.program)
  twgl.setUniforms(pInfo, {
    brdfLUT: textureObj.brdfLUT,
  })
  twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo)
  const render = () => {
    twgl.drawBufferInfo(gl, quadBufInfo)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)

}

export default PathTracing
