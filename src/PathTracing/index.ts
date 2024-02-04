import * as twgl from 'twgl.js'
import PathTracingFS from './pathTracing.frag'
import quadVS from './quad.vert'
import Scene from '../Core/Scene'
import { OrthographicFrustum, PerspectiveFrustum } from '../Core/Camera'
import Model3D from '../Core/Model'
import shaderProgramCache from '../Core/ShaderProgram'

function toRadias(angle: number) {
  // 360 = 2PI
  return Math.PI / 180 * angle
}
function toAngle(radias: number) {
  // 360 = 2PI
  return 180 / Math.PI * radias
}


function PathTracing() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  canvas.width = 500
  canvas.height = 500
  const gl = canvas.getContext('webgl2')
  if (gl === null) {
    console.error(' gl is null ');
    return
  }
  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)

  // twgl.setAttributePrefix('a_')
  // const pInfo = quadVS, PathTracingFS
  const pInfo = shaderProgramCache.getProgramInfo(gl, quadVS, PathTracingFS)

  console.log(' program info ', pInfo);
  const quadBufInfo = twgl.primitives.createXYQuadBufferInfo(gl, 1)
  console.log(' triBufInfo  ', quadBufInfo);
  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.BLEND)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)
  gl.clearDepth(1.0)

  const quadBufInfo2 = twgl.primitives.createXYQuadBufferInfo(gl)
  const vertics1 = twgl.primitives.createSphereVertices(1, 32, 32)
  const vertics2 = twgl.primitives.createPlaneVertices(10, 10, 10, 10)

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


  const scene = new Scene(gl, canvas);
  scene.enableMSAA = false;
  const camera = scene.camera;

  camera.position = [0, 0, 10];
  camera.target = [0, 0, 0];
  camera.up = [0, 1, 0];
  // camera.frustum.near = 0.1
  // camera.frustum.far = 100
  const perspectiveFrustum = new PerspectiveFrustum(60, 1, 0.1, 1000000000.0)
  perspectiveFrustum.initWireframe(gl);
  const orthFrustum = new OrthographicFrustum(-3, 3, -3, 3, 0.1, 5000.0)
  orthFrustum.initWireframe(gl);

  camera.frustum = perspectiveFrustum
  // camera.frustum = orthFrustum

  const initEvt = () => {
    canvas.addEventListener('click', e => {
      console.log(' click ', e);
      const pickRes = scene.pick([e.offsetX, e.offsetY]);
      console.log(' pickRes ', pickRes);
    })
  }

  initEvt()


  const draw = () => {
    scene.render()
  }

  const render = (time: number) => {
    time *= 0.001
    draw();
    requestAnimationFrame(render)
  }

  render(1);

}

export default PathTracing
