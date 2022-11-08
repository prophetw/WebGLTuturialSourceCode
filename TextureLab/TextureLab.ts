
import * as twgl from 'twgl.js'
import { DebugFrameBuffer } from '../src/utils/utils';
import MRTVS from  './MRT.vert'
import MRTFS from  './MRT.frag'
import DrawVS from  './Draw.vert'
import DrawFS from  './Draw.frag'

function main (){

  const canvas = document.getElementById('webgl') as HTMLCanvasElement;
  // Get the rendering context for WebGL
  const gl = canvas.getContext('webgl') as WebGLRenderingContext;
  const debugFBO = new DebugFrameBuffer(canvas, gl)
  console.log('  --- debgFBO ', debugFBO);

  const MRTProgInfo = twgl.createProgramInfo(gl, [MRTVS, MRTFS])
  console.log(' MRTPinfo', MRTProgInfo );

  const DrawProgInfo = twgl.createProgramInfo(gl, [DrawVS, DrawFS])
  console.log(' DrawPinfo', DrawProgInfo );

  // if (!gl.getExtension("EXT_color_buffer_float")) {
  //   console.error("FLOAT color buffer not available");
  //   document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
  // }
  // WEBGL_draw_buffers supply capbility to write tex to framebuffer multiple texture. This tech is called MRT(multiple render target)
  // without this  WEBGL_draw_buffers  default framebuffer can only write to Framebuffer COLOR_ATTACHMENT0 default renderbuffer
  const ext = gl.getExtension('WEBGL_draw_buffers');
	const cubeVert = twgl.primitives.createCubeVertices()
	console.log(' plane vert ', cubeVert);


}

export default main 