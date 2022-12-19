
import * as twgl from 'twgl.js'
import { createTexture, DebugFrameBuffer, loadImg } from '../src/utils/utils';
import DrawVS from './Draw.vert'
import DrawFS from './Draw.frag'

async function main() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement;
  // Get the rendering context for WebGL
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  gl.clearColor(0.1, 0.1, 0.1, 1)
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  const debugFBO = new DebugFrameBuffer(canvas, gl)
  console.log('  --- debgFBO ', debugFBO);

  const DrawProgInfo = twgl.createProgramInfo(gl, [DrawVS, DrawFS])
  console.log(' DrawPinfo', DrawProgInfo);

  const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl)
  console.log(' plane vert ', cubeBufferInfo);

  const model = twgl.m4.identity()
  const camera = twgl.m4.lookAt([0, 0, 3], [0, 0, 0], [0, 1, 0])
  const view = twgl.m4.inverse(camera)
  const proj = twgl.m4.perspective(Math.PI / 3, 1, 0.01, 100)

  const mvp = twgl.m4.identity()
  const mv = twgl.m4.multiply(view, model)
  twgl.m4.multiply(proj, mv, mvp)

  gl.useProgram(DrawProgInfo.program)
  window.spector.startCapture(canvas, 100)
  twgl.setBuffersAndAttributes(gl, DrawProgInfo, cubeBufferInfo)
  try {
    // const pngImg = await loadImg('./resources/sRGB/0_136_0_icc.png')
    // console.log(pngImg);
    const sRGBpng = await createTexture(gl, {
      src: './resources/sRGB/0_136_0_icc.png',
      // src: pngImg,
      internalFormat: gl.SRGB8_ALPHA8,
      min: gl.LINEAR_MIPMAP_LINEAR,
    })
    gl.texParameterf(gl.TEXTURE_2D, 34046, 16)
    twgl.setUniforms(DrawProgInfo, {
      texture0: sRGBpng,
      u_MvpMatrix: mvp
    })

    gl.clear(gl.COLOR_BUFFER_BIT)
    twgl.drawBufferInfo(gl, cubeBufferInfo)
    console.log('dsjkajdsa', sRGBpng);
  } catch (error) {
    console.error(error);
  }


}

export default main
