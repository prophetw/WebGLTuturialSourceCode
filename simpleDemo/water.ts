import * as twgl from 'twgl.js'
import cubeFS from './waterFS.glsl'
import cubeVS from './waterVS.glsl'

function toRadias(angle: number) {
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number) {
  // 360 = 2PI
  return 180 / Math.PI * radias
}


function WaterDemo() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl')
  if (gl === null) {
    console.error(' gl is null ');
    return
  }
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)

  // twgl.setAttributePrefix('a_')
  const pInfo = twgl.createProgramInfo(gl, [cubeVS, cubeFS])
  console.log(' program info ', pInfo);
  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl)
  console.log(' triBufInfo  ', quadBufInfo);


  const camera = twgl.m4.lookAt([0, 0, -3], [0, 0, 0], [0, 1, 0])
  const view = twgl.m4.inverse(camera)
  const model = twgl.m4.identity()
  const projection = twgl.m4.perspective(toRadias(60), 1, 0.1, 10)

  const waterSrc = './resources/water/Foam.png'
  const waterNormal = './resources/water/water.jpg'




  twgl.createTextures(gl, {
    foam: {
      src: waterSrc,
    },
    normal: {
      src: waterNormal,
    }
  }, (err, texture, source) => {
    if (err) {
      return console.error(' create texture error ', err);
    }

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
        texture: texture.foam,
        waterNormal: texture.normal,
        time,
      })

      twgl.drawBufferInfo(gl, quadBufInfo);

      requestAnimationFrame(render);
    }


    requestAnimationFrame(render);


  })


  // render(1);





}

export default WaterDemo
