
import * as twgl from 'twgl.js'
import { Camera, OrthographicFrustum, PerspectiveFrustum, ScreenSpaceEventHandler } from '../src/Core/Camera'
import BoundingBox from '../src/Core/BoundingBox'
import { CustomBtn, toRadias } from '../src/utils/utils'
import { VisualState } from '../src/utils/visualState'
import Model3D from '../src/Core/Model'
import Scene from '../src/Core/Scene'
import Ray from '../src/Core/Ray'

// 透视相机 + 正交相机

// 正交相机 用于输出俯视图 正交相机的 近平面是可移动

function CameraDemo() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl2', {
    antialias: true,
  })
  if (gl === null) {
    console.error(' gl is null ');
    return
  }

  const debugRT = new VisualState({
    context: gl,
    contextVersion: 2,
  }, 'right-top', 30)

  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.2, 0.2, 0.2, 1.0)

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
  const camera = scene.camera;

  const model = twgl.m4.identity()
  // const model = twgl.m4.translate(twgl.m4.identity(), [0.0, 0.0, -1.000001])
  const model1 = twgl.m4.translate(twgl.m4.identity(), [0.3, 0.4, 0.000001])
  const model2 = twgl.m4.rotationY(toRadias(45))
  twgl.m4.translate(model2, [1, 1, 1], model2)
  const quadVerticsInfo = twgl.primitives.createXYQuadVertices();

  const quadModel1 = new Model3D(gl, camera, quadVerticsInfo, model);
  const quadModel2 = new Model3D(gl, camera, quadVerticsInfo, model1);
  const cubeVertics = twgl.primitives.createCubeVertices();
  const cubeModel = new Model3D(gl, camera, cubeVertics, model2);

  // scene.add(quadModel1);
  // scene.add(quadModel2);
  scene.add(cubeModel);

  // window.spector.startCapture(canvas, 100)

  camera.position = [0, 0, 10];
  camera.target = [0, 0, 0];
  camera.up = [0, 1, 0];
  // camera.frustum.near = 0.1
  // camera.frustum.far = 100
  const perspectiveFrustum = new PerspectiveFrustum(60, 1, 0.1, 100)
  perspectiveFrustum.initWireframe(gl);
  const orthFrustum = new OrthographicFrustum(-3, 3, -3, 3, 0.1, 100)
  orthFrustum.initWireframe(gl);

  camera.frustum = perspectiveFrustum

  const boundingBox = new BoundingBox([-1, -1, 0], [1, 1, 0]);
  // const bbx = quadModel1.worldBox
  // console.log(bbx);
  camera.setViewToBoundingBox(cubeModel.worldBox);


  const initBtnOptions = ()=>{
    const resetViewBtn = new CustomBtn('reset view', () => {
      camera.setViewToBoundingBox(boundingBox);
    })

    const switchOrthOrPers = new CustomBtn('orth', () => {
      // camera.switchToOrthographicFrustum();
      camera.frustum = orthFrustum
    })

    const switchPers = new CustomBtn('pers', () => {
      // camera.switchToPerspectiveFrustum();
      camera.frustum = perspectiveFrustum
    })

    new CustomBtn('print Scene', () => {
      console.log(' scene ', scene);
    })

  }

  const initEvt = ()=>{
    canvas.addEventListener('click', e=>{
      console.log(' click ', e);

    })
  }



  initBtnOptions()
  initEvt()

  let isShowFrustum = false;
  new CustomBtn('toggleFrustumWireframe', () => {
    isShowFrustum = !isShowFrustum;
  })

  const fbo = twgl.createFramebufferInfo(gl, [
    { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST },
  ], canvas.width, canvas.height)

  let isShowFbo = false;

  new CustomBtn("渲染1frame", () => {
    camera.frustum = orthFrustum;
    isShowFbo = true;
    render1Frame()
    camera.frustum = perspectiveFrustum;
    isShowFbo = false;
  })


  const draw = () => {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.POLYGON_OFFSET_FILL)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (isShowFbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer)
    }

    scene.render()

    if (isShowFbo) {
      debugRT.readFromContext('fbo')
    }
    if (isShowFrustum) {
      // camera.frustum.debugWireframe(camera.viewMatrix);
      // const inverseViewProjectionMatrix = twgl.m4.inverse(twgl.m4.multiply(camera.frustum.projectionMatrix, camera.viewMatrix))
      camera.frustum.debugWireframe(camera.viewMatrix, camera.frustum.projectionMatrix);
      // orthFrustum.debugWireframe(camera.viewMatrix, camera.frustum.projectionMatrix);
    }
  }

  const render1Frame = () => {
    draw();
  }

  const render = (time: number) => {
    time *= 0.001
    draw();
    requestAnimationFrame(render)
  }

  render(1);

}

export default CameraDemo
