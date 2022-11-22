
import FSHADER_SOURCE from './BlendedPlane.frag.glsl'
import VSHADER_SOURCE from './BlendedPlane.vert.glsl'
import * as twgl from 'twgl.js';
import { angleToRads } from '../lib/utils';
const Matrix4 = twgl.m4
const Vector3 = twgl.v3

const dftPos = Vector3.normalize(Vector3.create(1, 1, 1))
let cameraPos = Vector3.create(dftPos[0] * 5, dftPos[1] * 5, dftPos[2] * 5)

function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  const gl = twgl.getContext(canvas, {
    alpha: false,
  });
  const ext = gl.getExtension("ANGLE_instanced_arrays");
  const m4 = twgl.m4;
  twgl.addExtensionsToContext(gl);
  if (ext !== null) {
    // @ts-ignore
    gl.drawArraysInstanced = ext?.drawArraysInstancedANGLE
  }
  // @ts-ignore
  if (!gl.drawArraysInstanced || !gl.createVertexArray) {
    alert("need drawArraysInstanced and createVertexArray"); // eslint-disable-line
    return;
  }
  const programInfo = twgl.createProgramInfo(gl, [VSHADER_SOURCE, FSHADER_SOURCE]);

  function rand(min: number, max?: number) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return min + Math.random() * (max - min);
  }
  const numInstances = 3; // 3 planes
  const instanceWorlds = new Float32Array(numInstances * 16); // 分配存储所有的 modelMatrix
  const instanceColors = [
    1.0, 0.0, 0.0, 0.3,
    0.0, 1.0, 0.0, 0.3,
    0.0, 0.0, 1.0, 0.3,
  ];
  const r = 1;
  for (let i = 0; i < numInstances; ++i) {
    // 设置每一个 model 的 matrix 位移 旋转属性
    const mat = new Float32Array(instanceWorlds.buffer, i * 16 * 4, 16);
    m4.translation([rand(-r, r), rand(-r, r), rand(-r, r)], mat);
    // m4.rotateZ(mat, rand(0, Math.PI * 2), mat);
    // m4.rotateX(mat, rand(0, Math.PI * 2), mat);
    // 设置 每一个 model 的
    // instanceColors.push(rand(1), rand(1), rand(1), 0.5);
  }
  // const arrays = twgl.primitives.createPlaneVertices()
  // const arrays = twgl.primitives.createSphereVertices(0.5, 100, 100)
  const arrays = twgl.primitives.createCubeVertices()

  Object.assign(arrays, {
    instanceWorld: {
      numComponents: 16,
      data: instanceWorlds,
      divisor: 1,
    },
    instanceColor: {
      numComponents: 4,
      data: instanceColors,
      divisor: 1,
    },
  });
  console.log(' ---- vert ', arrays);

  const vertexArrayInfo = twgl.createBufferInfoFromArrays(gl, arrays)

  const uniforms = {
    u_lightWorldPos: [1, 8, -30],
    u_lightColor: [1, 1, 1, 1],
    u_ambient: [0, 0, 0, 1],
    u_specular: [1, 1, 1, 1],
    u_shininess: 50,
    u_specularFactor: 1,
  };


  function render(time: number) {
    time *= 0.001;
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND)
    gl.depthMask(false)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    // gl.enable(gl.CULL_FACE);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const fov = 30 * Math.PI / 180;
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100;
    const projection = m4.perspective(fov, aspect, zNear, zFar);
    const radius = 25;
    const speed = time * .1;
    // const eye = [Math.sin(speed) * radius, Math.sin(speed * .7) * 10, Math.cos(speed) * radius];
    const eye = cameraPos
    // console.log(eye);
    const target = [0, 0, 0];
    const up = [0, 1, 0];

    const camera = m4.lookAt(eye, target, up);
    const view = m4.inverse(camera);
    uniforms.u_viewProjection = m4.multiply(projection, view);
    uniforms.u_viewInverse = camera;

    gl.useProgram(programInfo.program);
    twgl.setBuffersAndAttributes(gl, programInfo, vertexArrayInfo);
    twgl.setUniforms(programInfo, uniforms);
    twgl.drawBufferInfo(gl, vertexArrayInfo, gl.TRIANGLES, vertexArrayInfo.numelements, 0, numInstances);

    // requestAnimationFrame(render);
  }
  // requestAnimationFrame(render);
  render(1)
  enableCamera(canvas, gl, ()=>{
    render(1)
  })
}

function updateCam() {
  const model = Matrix4.identity()
  const perspective = Matrix4.perspective(20, 1, 0.1, 1000)
  const target = Vector3.create(0, 0, 0)
  const camUp = Vector3.create(0, 1, 0)
  const camPos = Matrix4.lookAt(cameraPos, target, camUp)
  const v = Matrix4.inverse(camPos)
  const vm = Matrix4.multiply(v, model)
  const mvp = Matrix4.multiply(perspective, vm)
  const uniformData = {
    u_MvpMatrix: mvp
  }
  return uniformData
}

function enableCamera(
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  callback = (camPos: twgl.v3.Vec3) => {
    //
  }
) {
  let startMove = false
  let lastX: number
  let lastY: number
  let yaw = -90
  let pitch = -45

  const onMousemove = (e: MouseEvent) => {
    if (startMove) {
      const sensitivity = 0.5
      const { offsetX, offsetY } = e
      const offsetXx = (offsetX - lastX)
      const offsetYy = (offsetY - lastY) // 往上是正
      lastX = offsetX
      lastY = offsetY
      const xoffset = offsetXx * sensitivity
      const yoffset = offsetYy * sensitivity
      yaw += xoffset;
      pitch += yoffset;
      // NOTE: 仅绕圆环平面旋转
      // pitch += 0;

      if (pitch > 89)
        pitch = 89;
      if (pitch < -89)
        pitch = -89;
      //  绕圆心
      const frontCamX = Math.cos(angleToRads(yaw)) * Math.cos(angleToRads(pitch)) * 5
      const frontCamY = Math.sin(angleToRads(pitch)) * 5
      const frontCamZ = Math.sin(angleToRads(yaw)) * Math.cos(angleToRads(pitch)) * 5

      const frontCamVec3 = Vector3.create(frontCamX, frontCamY, frontCamZ)
      cameraPos = frontCamVec3
      callback(cameraPos)
    } else {
      return
    }
  }
  const onMouseUp = (e: MouseEvent) => {
    startMove = false
    document.removeEventListener('mousemove', onMousemove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  const onMousedown = (e: MouseEvent) => {
    startMove = true
    const { offsetX, offsetY } = e
    lastX = offsetX
    lastY = offsetY
    document.addEventListener('mousemove', onMousemove)
    document.addEventListener('mouseup', onMouseUp)
  }
  document.addEventListener('mousedown', onMousedown)
}


export default main
