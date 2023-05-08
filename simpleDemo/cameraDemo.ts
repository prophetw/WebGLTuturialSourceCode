

import * as twgl from 'twgl.js'
import { BoundingBox, Camera, ScreenSpaceEventHandler } from '../src/Core/Camera'
import { CustomBtn } from '../src/utils/utils'

const cubeFS = `
  precision mediump float;
  varying vec4 v_Color;
	uniform vec3 u_color;
  void main() {
    gl_FragColor = vec4(u_color.xyz, 1.0);
    // gl_FragColor = vec4(1.0);
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

function toRadias(angle: number) {
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number) {
  // 360 = 2PI
  return 180 / Math.PI * radias
}

function CameraDemo() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl2', {
    antialias: true,
  })
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

  const vertices = [
    -5, -5, 0, // 左下角
    5, -5, 0, // 右下角
    5, 5, 0, // 右上角
    -5, 5, 0  // 左上角
  ];

  const indices = [
    0, 1, 2, // 第一个三角形
    0, 2, 3  // 第二个三角形
  ];

  const quadBufInfo3 = twgl.createBufferInfoFromArrays(gl, {
    position: { numComponents: 3, data: vertices },
    indices: { numComponents: 3, data: indices }
  });

  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl)


  console.log(' quadBufInfo2 ', quadBufInfo2);
  console.log(' triBufInfo  ', quadBufInfo);

  // window.spector.startCapture(canvas, 100)
  console.log(twgl.primitives.createCubeVertices());
  console.log(twgl.primitives.createXYQuadVertices());

  const camera = new Camera(canvas);
  const screenSpaceEvt = new ScreenSpaceEventHandler(canvas, camera);
  camera.position = [10, 10, 10];
  camera.direction = [0, 0, -1];
  camera.up = [0, 1, 0];
  camera.frustum.near = 0.1
  camera.frustum.far = 10

  const boundingBox = new BoundingBox([-1, -1, 0], [1,1,0]);
  camera.setViewToBoundingBox(boundingBox);

  // const cc = twgl.m4.perspective(toRadias(60), 1, 0.1, 100)
  const cam = twgl.m4.lookAt([0, 0, 10], [0, 0, 0], [0, 1, 0])
  console.log(cam);

  const resetViewBtn = new CustomBtn('reset view', () => {
    camera.setViewToBoundingBox(boundingBox);
  })

  const switchOrthOrPers = new CustomBtn('orth', () => {
    camera.switchToOrthographicFrustum();
  })

  const switchPers = new CustomBtn('pers', () => {
    camera.switchToPerspectiveFrustum();
  })

  const render = (time: number) => {
    // console.log(' r ');
    time *= 0.001
    // window.spector.startCapture(canvas, 1000)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    gl.enable(gl.POLYGON_OFFSET_FILL)
    gl.useProgram(pInfo.program)

    // set uniforms
    twgl.setUniforms(pInfo, {
      view: camera.viewMatrix,
      projection: camera.frustum.projectionMatrix
    })

    // set attributes
    // twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo);

    const model1 = twgl.m4.translate(twgl.m4.identity(), [0.3, 0, 0.0])
    const model = twgl.m4.identity()

    twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo);
    twgl.setUniforms(pInfo, {
      u_color: twgl.v3.create(1.0, 0.0, 0.0),
      model: model,
    })

    gl.polygonOffset(1.0, 0.1);

    twgl.drawBufferInfo(gl, quadBufInfo)


    gl.polygonOffset(1.0, 0.2);
    twgl.setUniforms(pInfo, {
      u_color: twgl.v3.create(0.0, 1.0, 0.0),
      model: model1,
    })
    twgl.setBuffersAndAttributes(gl, pInfo, quadBufInfo2);
    twgl.drawBufferInfo(gl, quadBufInfo2)

    requestAnimationFrame(render)

  }
  requestAnimationFrame(render)
  // render(1);


}

export default CameraDemo
