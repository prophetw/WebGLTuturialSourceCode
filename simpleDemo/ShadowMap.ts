import * as twgl from 'twgl.js'
import cubeFS from './ShadowMapFS.glsl'
import cubeVS from './ShadowMapVS.glsl'
import quadFS from './quadFS.glsl'
import quadVS from './quadVS.glsl'

function toRadias(angle: number) {
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number) {
  // 360 = 2PI
  return 180 / Math.PI * radias
}


function ShadowMap() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl2')
  if (gl === null) {
    console.error(' gl is null ');
    return
  }
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)

  // twgl.setAttributePrefix('a_')
  const pInfo = twgl.createProgramInfo(gl, [cubeVS, cubeFS])

  const colorProgramInfo = twgl.createProgramInfo(gl, [quadVS, quadFS])

  console.log(' program info ', pInfo);
  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl, 10)
  console.log(' triBufInfo  ', quadBufInfo);

  const sphereBufInf = twgl.primitives.createSphereBufferInfo(gl, 1, 24, 12)

  const lightPos = twgl.v3.create(10, 10, 10);
  const lightDir = twgl.v3.create(-1, -1, -1);

  const camPos = twgl.v3.create(0, 0, -10);
  const camDir = twgl.v3.create(0, 0, 0);

  const cameraFromLight = twgl.m4.lookAt(lightPos, lightDir, [0, 1, 0]);
  const viewFromLight = twgl.m4.inverse(cameraFromLight);
  const projectionFromLight = twgl.m4.perspective(toRadias(60), 1, 0.1, 100);

  const camera = twgl.m4.lookAt(camPos, camDir, [0, 1, 0]);
  const view = twgl.m4.inverse(camera)
  const projection = twgl.m4.perspective(toRadias(60), 1, 0.1, 100)

  const model = twgl.m4.identity()



  const render = (time: number) => {
    time *= 0.001;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.useProgram(pInfo.program)

    twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo);
    // set uniforms
    twgl.setUniforms(pInfo, {
      view,
      model,
      projection,
      time,
    })


    // print quad
    twgl.drawBufferInfo(gl, quadBufInfo);

    // print sphere

    requestAnimationFrame(render);
  }


  requestAnimationFrame(render);


}

export default ShadowMap
