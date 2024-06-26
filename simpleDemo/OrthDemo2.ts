
import * as twgl from 'twgl.js'
import { Camera, OrthographicFrustum, PerspectiveFrustum, ScreenSpaceEventHandler } from '../src/Core/Camera'
import BoundingBox from '../src/Core/BoundingBox'
import { CustomBtn, toRadias } from '../src/utils/utils'
import { VisualState } from '../src/utils/visualState'
import Model3D from '../src/Core/Model'
import Scene from '../src/Core/Scene'
import Ray from '../src/Core/Ray'
import Vector4 from '../src/Core/Vector4'

// 透视相机 + 正交相机

// 正交相机 用于输出俯视图 正交相机的 近平面是可移动

function CameraDemo() {

  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl2')
  if (gl === null) {
    console.error(' gl is null ');
    return
  }

  const debugRT = new VisualState({
    context: gl,
    contextVersion: 2,
  }, 'right-top', 30)
  const debugRM = new VisualState({
    context: gl,
    contextVersion: 2,
  }, 'right-mid', 30)
  const debugRB = new VisualState({
    context: gl,
    contextVersion: 2,
  }, 'right-bottom', 30)

  gl.enable(gl.DEPTH_TEST)
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

  const model = twgl.m4.identity()
  // const model = twgl.m4.translate(twgl.m4.identity(), [0.0, 0.0, -1.000001])
  const model1 = twgl.m4.translate(twgl.m4.identity(), [0.3, 0.4, 0.000001])
  const model2 = twgl.m4.rotationY(toRadias(45))
  twgl.m4.translate(model2, [1, 1, 1], model2)
  const quadVerticsInfo = twgl.primitives.createXYQuadVertices();

  const quadModel1 = new Model3D({
    scene,
    camera,
    vertics: quadVerticsInfo,
    modelMatrix: model,
    context: gl,
  });
  const quadModel2 = new Model3D({
    scene,
    camera,
    vertics: quadVerticsInfo,
    modelMatrix: model1,
    context: gl,
  });
  const cubeVertics = twgl.primitives.createCubeVertices();
  const cubeModel = new Model3D({
    scene,
    camera,
    vertics: quadVerticsInfo,
    modelMatrix: model1,
    context: gl,
  });

  // scene.add(quadModel1);
  // scene.add(quadModel2);
  scene.add(cubeModel);

  // window.spector.startCapture(canvas, 100)

  camera.position = [3, 3, 3];
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

  const boundingBox = cubeModel.worldBox
  // const bbx = quadModel1.worldBox
  // console.log(bbx);
  // camera.setViewToBoundingBox(boundingBox);


  let isRenderOrth1FrameInFbo = false;
  let isDebugDepth = false;
  let isShowFrustum = false;

  const initBtnOptions = () => {
    new CustomBtn('reset view', () => {
      camera.setViewToBoundingBox(boundingBox);
    })
    new CustomBtn('orth', () => {
      // camera.switchToOrthographicFrustum();
      camera.frustum = orthFrustum
    })
    new CustomBtn('pers', () => {
      // camera.switchToPerspectiveFrustum();
      camera.frustum = perspectiveFrustum
    })
    new CustomBtn('print Scene', () => {
      console.log(' scene ', scene);
    })
    new CustomBtn('printcamera', () => {
      console.log(' camera ', camera);
    })
    new CustomBtn('msaa', () => {
      scene.enableMSAA = !scene.enableMSAA;
    })
    new CustomBtn("渲染1frame", () => {
      camera.frustum = orthFrustum;
      isRenderOrth1FrameInFbo = true;
      render1Frame()
      camera.frustum = perspectiveFrustum;
      isRenderOrth1FrameInFbo = false;
    })
    new CustomBtn("debugDepth", () => {
      isDebugDepth = true;
      render1Frame()
      isDebugDepth = false;
    })
    new CustomBtn('frus线框', () => {
      isShowFrustum = !isShowFrustum;
    })
    new CustomBtn('twgl', () => {
      console.log(twgl);
    })

    const vec4 = new Vector4(0, 0, 1, 1)
    new CustomBtn('mvP', () => {
      const mvp = Vector4.transformMat4(vec4, camera.viewMatrix)
      console.log('  point, pointInEye ', vec4, mvp);
      console.log(' viewMatxix ', camera.viewMatrix);
    })
    new CustomBtn('mvpP', () => {
      console.log(' viewMatxix ', camera.viewMatrix);
      console.log(' projectionMatrix ', camera.frustum.projectionMatrix);
      console.log(' projectionViewMatrix ', camera.projectionViewMatrix);
      const mvp = Vector4.transformMat4(vec4, camera.projectionViewMatrix)
      const ndc = Vector4.scale(mvp, 1 / mvp.w) // 归一化
      console.log(' point, pointInClip ', vec4, mvp);
      console.log(' 透视除法 ndc ', ndc);
      const vec42 = new Vector4(1, 1, 1, 1);
      const mvp2 = Vector4.transformMat4(vec42, camera.projectionViewMatrix)
      const vp2 = Vector4.transformMat4(vec42, camera.viewMatrix)
      const ndc2 = Vector4.scale(mvp2, 1 / mvp2.w) // 归一化
      console.log(' point, pointInClip ', vec42, vp2, mvp2);
      console.log(' 透视除法 ndc ', ndc2);
      const vec43 = new Vector4(0, 0, -1, 1);
      const mvp3 = Vector4.transformMat4(vec43, camera.projectionViewMatrix)
      const ndc3 = Vector4.scale(mvp3, 1 / mvp3.w) // 归一化
      console.log(' point, pointInClip ', vec43, mvp3);
      console.log(' 透视除法 ndc ', ndc3);
      const vec44 = new Vector4(0, 0, 2.5, 1);
      const mvp4 = Vector4.transformMat4(vec44, camera.projectionViewMatrix)
      const ndc4 = Vector4.scale(mvp4, 1 / mvp4.w) // 归一化
      console.log(' point, pointInClip ', vec44, mvp4);
      console.log(' 透视除法 ndc ', ndc4);
      const vec45 = new Vector4(4, 4, 4, 1);
      const mvp5 = Vector4.transformMat4(vec45, camera.projectionViewMatrix)
      const ndc5 = Vector4.scale(mvp5, 1 / mvp5.w) // 归一化
      console.log(' point, pointInClip ', vec45, mvp5);
      console.log(' 透视除法 ndc ', ndc5);

      console.log(twgl.v3.distance([1, 1, 1], [0, 0, 3]));

    })

  }

  const initEvt = () => {
    canvas.addEventListener('click', e => {
      console.log(' click ', e);
      const pickRes = scene.pick([e.offsetX, e.offsetY]);
      console.log(' pickRes ', pickRes);
    })
  }



  initBtnOptions()
  initEvt()

  const fbo = twgl.createFramebufferInfo(gl, [
    { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST },
    { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST },
    // depth component
    { internalFormat: gl.DEPTH_COMPONENT16, format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT, minMag: gl.NEAREST }
  ], canvas.width, canvas.height)

  console.log(' ---- fbo ---- ', fbo);


  const screenFbo = twgl.createFramebufferInfo(gl,
    [
      { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST, },
      { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST, },
      { internalFormat: gl.DEPTH_COMPONENT16, format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT, minMag: gl.NEAREST, }
    ],
    canvas.width, canvas.height)

  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER))
    console.log(" fbo 帧缓冲不完整");
  }

  const screenTexture = screenFbo.attachments[0];
  const screenNormal = screenFbo.attachments[1];
  const screenDepthTexture = screenFbo.attachments[2];
  console.log(' screenFbo ----- ', screenFbo);

  const draw = () => {
    let currentFbo = screenFbo;
    if (isRenderOrth1FrameInFbo) {
      currentFbo = fbo;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, currentFbo.framebuffer)

    scene.render(currentFbo)

    if (isRenderOrth1FrameInFbo) {
      debugRT.readFromContext('orthFbo')
      const depthTexture = fbo.attachments[2]
      // print depth texture
      console.log(' depthTexture ', depthTexture);
      const fbo2 = twgl.createFramebufferInfo(gl, [
        { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST },], canvas.width, canvas.height)
      scene.debugDepthTex(depthTexture, fbo2.framebuffer);
      debugRM.readFromContext('orthDepth');

    }
    if (isDebugDepth) {

      const fbo3 = twgl.createFramebufferInfo(gl, [
        { internalFormat: gl.RGBA, format: gl.RGBA, type: gl.UNSIGNED_BYTE, minMag: gl.NEAREST },], canvas.width, canvas.height)
      scene.debugDepthTex(screenDepthTexture, fbo3.framebuffer);
      debugRB.readFromContext('persDepth');
    }


    if (isShowFrustum) {
      // camera.frustum.debugWireframe(camera.viewMatrix);
      // const inverseViewProjectionMatrix = twgl.m4.inverse(twgl.m4.multiply(camera.frustum.projectionMatrix, camera.viewMatrix))
      camera.frustum.debugWireframe(camera.viewMatrix, camera.frustum.projectionMatrix);
      // orthFrustum.debugWireframe(camera.viewMatrix, camera.frustum.projectionMatrix);
    }
    // scene.printTexToScreen(screenTexture)
    scene.printTexToScreen(screenNormal)
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
