import BackgroundVS from './background.vert'
import BackgroundFS from './background.frag'
import PBRFS from './pbr.frag'
import PBRVS from './pbr.vert'
import CubeVS from './cube.vert'
import ECubeFS from './equirectangular_to_cubemap.frag'
import IrradConvolutionFS from './irradiance_convolution.frag'
import * as twgl from 'twgl.js'
import { angleToRads } from '../../lib/utils'
import { Camera } from '../../src/utils/utils'
import { clamp } from './simp/pbr'


function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  const gl = canvas.getContext('webgl2');
  if (gl === null) {
    console.log(' error ');
    return
  }

  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0, 0, 0, 1.0)

  // init program
  const pbrProgramInfo = twgl.createProgramInfo(gl, [PBRVS, PBRFS])
  const pbrProgram = pbrProgramInfo.program
  // const eqToCubeProgramInfo = twgl.createProgramInfo(gl, [CubeVS, ECubeFS])
  // const eqToCubeProgram = eqToCubeProgramInfo.program
  // const irradianceProgramInfo = twgl.createProgramInfo(gl, [CubeVS, IrradConvolutionFS])
  // const irradianceProgram = irradianceProgramInfo.program
  // const bgProgramInfo = twgl.createProgramInfo(gl, [BackgroundVS, BackgroundFS])
  // const bgProgram = bgProgramInfo.program

  console.log(' program info ------ ');
  console.log(
    pbrProgramInfo,
    // eqToCubeProgramInfo, irradianceProgramInfo, bgProgramInfo
  );

  const perspectiveOptions = {
    fov: Math.PI / 3
  }
  // mvp


  let camPos = twgl.v3.create(0, 0, 20);
  let camFront = twgl.v3.create(0, 0, -1)
  let camUp = twgl.v3.create(0,1,0)

  const cameraChange = (canvas: HTMLCanvasElement, callback = () => {
    //
  }) => {

    document.addEventListener('keydown', e=>{
      console.log(e);
      const speed = 0.1
      const {key} = e
      if(key === 'w' || key === 'ArrowUp'){
        const frontVec = twgl.v3.mulScalar(camFront, speed)
        camPos = twgl.v3.add(camPos, frontVec)
        callback()
      }
      if(key === 's' || key === 'ArrowDown'){
        const backVec = twgl.v3.negate(twgl.v3.mulScalar(camFront, speed))
        camPos = twgl.v3.add(camPos, backVec)
        callback()
      }
      if(key === 'a' || key === 'ArrowLeft'){
        const rightVec = twgl.v3.negate(twgl.v3.cross(camFront, camUp))
        twgl.v3.mulScalar(rightVec, speed, rightVec)
        camPos = twgl.v3.add(camPos, rightVec)
        callback()
      }
      if(key === 'd' || key === 'ArrowRight'){
        const leftVec = twgl.v3.cross(camFront, camUp)
        twgl.v3.mulScalar(leftVec, speed, leftVec)
        camPos = twgl.v3.add(camPos, leftVec)
        callback()
      }
      return
    })

    // wheel 拉近 拉远
    // change fov angle
    canvas.addEventListener('wheel', (e) => {
      console.log('wheel');
      const { deltaY } = e
      const step = 0.05
      let newFov = 0;
      if (deltaY > 0) {
        // zoom out
        // defaultCameraPosition.z += 0.1
        camPos = twgl.v3.add(camPos, twgl.v3.negate(camFront))
        // newFov = perspectiveOptions.fov + step
      } else {
        // zoom in
        // defaultCameraPosition.z -= 0.1
        camPos = twgl.v3.add(camPos, camFront)
        // newFov = perspectiveOptions.fov - step
      }
      // perspectiveOptions.fov = clamp(newFov, Math.PI / 180 * 30, Math.PI / 180 * 80)
      callback()
    })

    let startMove = false
    let lastX: number
    let lastY: number
    let yaw = -90
    let pitch = 0

    const onMousemove = (e: MouseEvent) => {
      // 左键 上下左右 平移
      // 右键 旋转 基于当前的 camPos 进行旋转
      const {which} = e

      const isLeftClick = which === 1
      const isMiddleClick = which === 2
      const isRightClick = which === 3
      if(isMiddleClick){
        return
      }
      if(isRightClick){

        return
      }
      if (startMove) {
        const sensitivity = 0.5
        const { offsetX, offsetY } = e
        const offsetXx = offsetX - lastX
        const offsetYy = -(offsetY - lastY) // 往上是正
        lastX = offsetX
        lastY = offsetY
        const xoffset = offsetXx * sensitivity
        const yoffset = offsetYy * sensitivity
        yaw += xoffset;
        pitch += yoffset;

        if (pitch > 89)
          pitch = 89;
        if (pitch < -89)
          pitch = -89;

        const frontCamX = Math.cos(angleToRads(yaw)) * Math.cos(angleToRads(pitch))
        const frontCamY = Math.sin(angleToRads(pitch))
        const frontCamZ = Math.sin(angleToRads(yaw)) * Math.cos(angleToRads(pitch))

        const frontCamVec3 = twgl.v3.create(frontCamX, frontCamY, frontCamZ)
        camFront = twgl.v3.normalize(frontCamVec3)
        // camFront
        // console.log(' ', frontCamVec3);
        // camPos = twgl.v3.add(camPos, camFront, camPos)
        // camPos = frontCamVec3
        // console.log(' camFront ', camFront);
        callback()
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
      console.log(e);
      const { offsetX, offsetY, which } = e
      const isLeftClick = which === 1
      const isMiddleClick = which === 2
      const isRightClick = which === 3
      startMove = true
      lastX = offsetX
      lastY = offsetY
      document.addEventListener('mousemove', onMousemove)
      document.addEventListener('mouseup', onMouseUp)
    }

    document.oncontextmenu = function(e){
      return false
    }
    document.addEventListener('mousedown', onMousedown)
    // mousemove
    // camera front  vector3
  }

  // light info
  const lightPositions = [
    0, 0, 10,
    // 10, 10, 10,
    // -10, -10, 10,
    // 10, -10, 10,
  ]
  const lightColors = [
    // 150, 150, 150,
    // 300, 300, 300,
    // 300, 300, 300,
    500, 500, 500,
  ]

  // init
  const sphereBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 100, 100);
  console.log(' sphere buffer info ', sphereBufferInfo);

  // const cube = twgl.primitives.createCubeBufferInfo(gl)
  // console.log(cube);

  // https://enkimute.github.io/hdrpng.js/
  // const hdrloader = new window.HDRImage()
  // console.log(' hdrloader here ', hdrloader);
  // hdrloader.src = './resources/pbr/footprint_court.hdr'
  // hdrloader.onload = ()=>{
  //   // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB9_E5, w, h, 0, gl.RGB, gl.FLOAT, new Float32Array(myHDR.dataRAW.buffer));
  //   console.log(hdrloader);
  // }
  let draw = () => {
    //
  }

  // console.log(hdrloader.dataRAW);
  twgl.createTextures(gl, {
    albedoMap: {
      // level: 0,
      auto: true,
      src: './resources/pbr/rusted_iron/albedo.png',
      // format: gl.RED,
      // internalFormat: gl.R8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
    normalMap: {
      // level: 0,
      auto: true,
      src: './resources/pbr/rusted_iron/normal.png',
      // format: gl.RED,
      // internalFormat: gl.R8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
    metallicMap: {
      // level: 0,
      auto: true,
      src: './resources/pbr/rusted_iron/metallic.png',
      // format: gl.FLOAT,
      // internalFormat: gl.RGBA16F,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
    roughnessMap: {
      auto: true,
      // level: 0,
      src: './resources/pbr/rusted_iron/roughness.png',
      // format: gl.RGB,
      // internalFormat: gl.RGB8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
    aoMap: {
      // level: 0,
      auto: true,
      target: gl.TEXTURE_2D,
      src: './resources/pbr/rusted_iron/ao.png',
      // format: gl.RGBA,
      // internalFormat: gl.RGBA8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
  }, (err: any, texObj: {
    [key: string]: WebGLTexture;
  }, texSrcs: {
    [key: string]: twgl.TextureSrc;
  }) => {
    if (err) {
      console.error(' ---err ', err);
      return
    }
    console.log(' ____ hello ____ ', texObj, texSrcs);


    const drawFn = () => {

      const target = twgl.v3.add(camPos, camFront);
      const cameraMat = twgl.m4.lookAt(camPos, target, camUp)
      const view = twgl.m4.inverse(cameraMat)
      const projection = twgl.m4.perspective(perspectiveOptions.fov, 1, 0.1, 100)
      gl.useProgram(pbrProgram)

      twgl.setUniforms(pbrProgramInfo, {
        view,
        projection,
        camPos,
        lightPositions,
        lightColors,
        albedoMap: texObj.albedoMap,
        normalMap: texObj.normalMap,
        metallicMap: texObj.metallicMap,
        roughnessMap: texObj.roughnessMap,
        aoMap: texObj.aoMap
      })

      // draw para
      const nrRows = 7;
      const nrColumns = 7;
      const spacing = 2.5;
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


      twgl.setBuffersAndAttributes(gl, pbrProgramInfo, sphereBufferInfo)

      // render sphere
      for (let row = 0; row < nrRows; ++row) {
        for (let col = 0; col < nrColumns; ++col) {
          const model = twgl.m4.identity()
          twgl.m4.translate(model, twgl.v3.create(
            (col - (nrColumns / 2)) * spacing,
            (row - (nrRows / 2)) * spacing,
            0
          ), model);
          // console.log('  modeMat',model);
          twgl.setUniforms(pbrProgramInfo, {
            model
          })
          twgl.drawBufferInfo(gl, sphereBufferInfo)
        }
      }

      // render light
      for (let i = 0; i < lightPositions.length / 3; ++i) {
        const newPos = lightPositions.slice(i * 3, i * 3 + 3);
        console.log(' newPos ', newPos);
        const color = lightColors[i];
        let model = twgl.m4.identity()
        model = twgl.m4.translate(model, newPos);
        model = twgl.m4.scale(model, [0.5, 0.5, 0.5]);
        twgl.setUniforms(pbrProgramInfo, {
          model,
        })
        twgl.drawBufferInfo(gl, sphereBufferInfo)
      }
    }
    draw = drawFn
    draw()

    cameraChange(canvas, () => {
      draw()
    })
  })

}
export default main;
