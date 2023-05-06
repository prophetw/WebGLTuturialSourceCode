
import * as twgl from 'twgl.js'

const cubeFS = `
  precision mediump float;
  varying vec4 v_Color;
	uniform vec3 u_color;
  void main() {
    gl_FragColor = vec4(u_color.xyz, 1.0);
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

function ZFighting (){

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
  const quadBufInfo2 = twgl.primitives.createXYQuadBufferInfo(gl)
  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl)
  console.log(' quadBufInfo2 ', quadBufInfo2);
  console.log(' triBufInfo  ', quadBufInfo );

  // window.spector.startCapture(canvas, 100)
  console.log(twgl.primitives.createCubeVertices());
  console.log(twgl.primitives.createXYQuadVertices());

  const camera = twgl.m4.lookAt([0, 0,  5], [0, 0, 0], [0, 1, 0])
  // const camera = twgl.m4.lookAt([0, 0, 1], [0, 0, 0], [0, 1, 0])
  const view = twgl.m4.inverse(camera)
	// model1 z add offset can solve z-fighting
  const model1 = twgl.m4.translate(twgl.m4.identity(), [0.3, 0, 0.0])
  const model = twgl.m4.identity()
  const projection = twgl.m4.perspective(toRadias(60), 1, 0.1, 100)


	// window.spector.startCapture(canvas, 1000)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	// gl.enable(gl.POLYGON_OFFSET_FILL)
  gl.useProgram(pInfo.program)

  // set uniforms
  twgl.setUniforms(pInfo, {
    view,
    projection
  })

  // set attributes
  // twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo);

  twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo);
	twgl.setUniforms(pInfo, {
		u_color: twgl.v3.create(1.0, 0.0, 0.0),
    model: model,
	})

	// gl.polygonOffset(1.0, 0.1);

  twgl.drawBufferInfo(gl, quadBufInfo)


	// gl.polygonOffset(1.0, 0.2);
	twgl.setUniforms(pInfo, {
		u_color: twgl.v3.create(0.0, 1.0, 0.0),
    model: model1,
	})
  twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo2);
  twgl.drawBufferInfo(gl, quadBufInfo2)

}

export default ZFighting
