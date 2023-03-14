import * as twgl from 'twgl.js'

const cubeFS = `
  precision mediump float;
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
  }
`
const cubeVS = `
  attribute vec4 a_position;
  varying vec4 v_Color;

  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  void main() {
    gl_Position =  projection * view * model * a_position;
    // gl_Position =  view * model * a_position;
    // gl_Position =  model * a_position;
    // gl_Position =  a_position;
    v_Color = a_position;
  }
`

function toRadias(angle: number){
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number){
  // 360 = 2PI
  return 180 / Math.PI * radias
}

function SimpleDemoMain (){

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl')
  if (gl === null) {
    console.error(' gl is null ');
    return
  }
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)

  twgl.setAttributePrefix('a_')
  const pInfo = twgl.createProgramInfo(gl, [cubeVS, cubeFS])
  console.log(' program info ', pInfo);
  const cubeBufInfo = twgl.primitives.createCubeBufferInfo(gl)
  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl)
  console.log(' cubeBuf ', cubeBufInfo);
  console.log(' triBufInfo  ', quadBufInfo );

  // window.spector.startCapture(canvas, 100)
  console.log(twgl.primitives.createCubeVertices());
  console.log(twgl.primitives.createXYQuadVertices());

  const camera = twgl.m4.lookAt([1, 1, 1], [0, 0, -1], [0, 1, 0])
  // const camera = twgl.m4.lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0])
  const view = twgl.m4.inverse(camera)
  const model = twgl.m4.identity()
  const projection = twgl.m4.perspective(toRadias(120), 1, 0.1, 2)


  gl.useProgram(pInfo.program)

  // set uniforms
  twgl.setUniforms(pInfo, {
    view,
    model,
    projection
  })

  // set attributes
  twgl.setBuffersAndAttributes(gl, pInfo, cubeBufInfo);
  // twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  twgl.drawBufferInfo(gl, cubeBufInfo)
  // twgl.drawBufferInfo(gl, quadBufInfo)

}

export default SimpleDemoMain
