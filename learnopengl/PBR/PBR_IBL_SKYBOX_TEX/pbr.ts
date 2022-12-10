import BackgroundVS from './background.vert'
import BackgroundFS from './background.frag'
import PBRFS from './pbr.frag'
import PBRVS from './pbr.vert'
import CubeVS from './cubemap.vert'
import ECubeFS from './equirectangular_to_cubemap.frag'
import IrradConvolutionFS from './irradiance_convolution.frag'
import PrefilterFS from './prefilter.frag'
import BRDFFS from './brdf.frag'
import BRDFVS from './brdf.vert'
import * as twgl from 'twgl.js'
import { angleToRads } from '../../../lib/utils'
import { Camera } from '../../../src/utils/utils'
import { clamp } from '../simp/pbr'
import { VisualState } from '../../../src/utils/visualState'
import { EnvironmentMap } from '../../../WebglFundemental'

const Vector3 = twgl.v3

async function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.crossOrigin = ''
    img.src = src
    img.onload = () => {
      resolve(img)
    }
  })
}

async function loadHDR(hdrSrc: string): Promise<{
  dataFloat: Float32Array,
  dataRGBE: Uint8Array
  imageData: ImageData,
  canvas: HTMLCanvasElement
}> {
  return new Promise((resolve, reject) => {
    // https://enkimute.github.io/hdrpng.js/
    const hdrloader = new window.HDRImage()
    hdrloader.src = hdrSrc;
    hdrloader.onload = () => {
      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB9_E5, w, h, 0, gl.RGB, gl.FLOAT, new Float32Array(myHDR.dataRAW.buffer));
      const width = hdrloader.width
      const height = hdrloader.height
      const ctx = (hdrloader as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
      const imageData = ctx.createImageData(width, height)
      console.log(' dataFloat ', hdrloader.dataFloat);
      console.log(' dataRGBE ', hdrloader.dataRGBE);
      const dataFloat = hdrloader.dataFloat
      const dataRGBE = hdrloader.dataRGBE
      resolve({
        dataFloat,
        dataRGBE,
        imageData,
        canvas: hdrloader
      })
      // hdrloader.toHDRBlob(function (blob: Blob) {
      //   var a = document.createElement('a');
      //   a.href = URL.createObjectURL(blob);
      //   a.download = 'memorial.RGBE.PNG';
      //   a.innerHTML = 'click to save';
      //   document.body.appendChild(a); // or a.click()
      //   a.click()
      //   // resolve(blob)
      // })
    }
  })
}

async function createTextures(gl: WebGLRenderingContext, texinfo: {
  [key: string]: twgl.TextureOptions
}): Promise<{
  [key: string]: WebGLTexture;
}> {
  return new Promise((resolve, reject) => {
    twgl.createTextures(gl, texinfo, (err, textures: {
      [key: string]: WebGLTexture;
    }) => {
      if (err) {
        reject(err)
      }
      resolve(textures)
    })
  })
}
async function createTexture(gl: WebGLRenderingContext, texinfo: twgl.TextureOptions
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    console.log(' hhhhh ');
    twgl.createTexture(gl, texinfo, (err: any, tex: WebGLTexture) => {
      console.log(' _____ ', err, tex);
      if (err) {
        reject(err)
      }
      resolve(tex)
    })
  })
}

async function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;
  canvas.width = 512
  canvas.height = 512
  const gl = canvas.getContext('webgl2');
  if (gl === null) {
    console.log(' error ');
    return
  }
  const debugRt = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-top', 100)
  const debugRm = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-mid', 100)
  const debugRb = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-bottom', 100)

  gl.enable(gl.DEPTH_TEST)
  gl.depthFunc(gl.LEQUAL); // set depth function to less than AND equal for skybox depth trick.
  gl.clearColor(0.7, 0.7, 0.7, 1.0)


  let camPos = twgl.v3.create(0, 0, 20);
  // let camPos = twgl.v3.create(1, 1, 5);
  let camFront = twgl.v3.create(0, 0, -1)
  let camUp = twgl.v3.create(0, 1, 0)
  const perspectiveOptions = {
    fov: Math.PI / 3
  }
  // mvp

  // init program
  const pbrProgramInfo = twgl.createProgramInfo(gl, [PBRVS, PBRFS])
  const pbrProgram = pbrProgramInfo.program
  const eqToCubeProgramInfo = twgl.createProgramInfo(gl, [CubeVS, ECubeFS])
  const eqToCubeProgram = eqToCubeProgramInfo.program
  const irradianceProgramInfo = twgl.createProgramInfo(gl, [CubeVS, IrradConvolutionFS])
  const irradianceProgram = irradianceProgramInfo.program
  const bgProgramInfo = twgl.createProgramInfo(gl, [BackgroundVS, BackgroundFS])
  const bgProgram = bgProgramInfo.program
  const prefilterProgramInfo = twgl.createProgramInfo(gl, [CubeVS, PrefilterFS])
  const prefilterProgram = prefilterProgramInfo.program
  const brdfProgramInfo = twgl.createProgramInfo(gl, [BRDFVS, BRDFFS])
  const brdfProgram = brdfProgramInfo.program

  console.log(' program info ------ ');
  console.log(
    // pbrProgramInfo,
    // eqToCubeProgramInfo,
    // irradianceProgramInfo,
    // bgProgramInfo
    prefilterProgramInfo,
    brdfProgramInfo
  );

  // init
  const sphereBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 100, 100);
  const cubeBufferInfo = twgl.primitives.createCubeBufferInfo(gl)
  const quadBufferInfo = twgl.primitives.createXYQuadBufferInfo(gl)
  console.log(' sphere cube buffer info ', sphereBufferInfo, cubeBufferInfo);

  // pbr: setup framebuffer
  // ----------------------
  // window.spector.startCapture(canvas, 1000, false, false);
  const RBO = gl.createRenderbuffer() as WebGLRenderbuffer
  gl.bindRenderbuffer(gl.RENDERBUFFER, RBO)
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, 512, 512)
  const attachments: twgl.AttachmentOptions[] = [
    { attachmentPoint: gl.COLOR_ATTACHMENT0 },
    { attachment: RBO, attachmentPoint: gl.DEPTH_ATTACHMENT },
  ]
  const captureFbo = twgl.createFramebufferInfo(gl, attachments, 512, 512)
  console.log(' pbr fbo ', captureFbo);

  // pbr: load the HDR environment map
  // -----------------------------
  const hdrImageData = await loadHDR('./resources/hdr/newport_loft.hdr')
  // const hdrImageData = await loadHDR('./resources/pbr/clarens_midday_4k.hdr')
  // const hdrImageData = await loadHDR('./resources/pbr/fireplace_4k.hdr')

  // console.log(' ______ hdr ImageData _____ ', hdrImageData);
  // const imageData = await loadImg('./resources/pbr/footprint_court.jpg');
  // uniform sampler2D albedoMap;
  // uniform sampler2D normalMap;
  // uniform sampler2D metallicMap;
  // uniform sampler2D roughnessMap;
  // uniform sampler2D aoMap;

  const materialAry = ['gold', 'grass', 'plastic', 'rusted_iron', 'wall', 'space_cruiser', 'grey_granite_flecks_bl', 'paint_metal', 'silver']
  const materialName = materialAry[0]



  const textures = await createTextures(gl,
    {
      hdr: {
        // src: imageData,

        // src: hdrImageData.canvas,

        src: hdrImageData.dataFloat,
        internalFormat: gl.RGB32F,
        format: gl.RGB,
        type: gl.FLOAT,

        width: hdrImageData.canvas.width,
        height: hdrImageData.canvas.height,
        // type: gl.UNSIGNED_BYTE,
        flipY: true,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        min: gl.LINEAR,
        max: gl.LINEAR,
      },

      // pbr: setup cubemap to render to and attach to framebuffer
      // ---------------------------------------------------------
      envCubeMapTex: {
        src: undefined,
        width: 512,
        height: 512,
        // internalFormat: gl.RGB16F,
        // format: gl.RGB,
        // type: gl.FLOAT,
        // type: gl.UNSIGNED_BYTE,
        target: gl.TEXTURE_CUBE_MAP,
        wrapR: gl.CLAMP_TO_EDGE,
        wrapS: gl.CLAMP_TO_EDGE,
        wrapT: gl.CLAMP_TO_EDGE,
        min: gl.LINEAR_MIPMAP_LINEAR,
        max: gl.LINEAR,
      },

      albedoMap: {
        // level: 0,
        auto: true,
        src: `./resources/pbr/${materialName}/albedo.png`,
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
        src: `./resources/pbr/${materialName}/normal.png`,
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
        src: `./resources/pbr/${materialName}/metallic.png`,
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
        src: `./resources/pbr/${materialName}/roughness.png`,
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
        src: `./resources/pbr/${materialName}/ao.png`,
        // format: gl.RGBA,
        // internalFormat: gl.RGBA8,
        type: gl.UNSIGNED_BYTE,
        wrapS: gl.REPEAT,
        wrapT: gl.REPEAT,
        min: gl.LINEAR_MIPMAP_LINEAR,
        max: gl.LINEAR,
      },

    }
  )
  console.log(' ___ textues ___ ', textures);


  // pbr: set up projection and view matrices for capturing data onto the 6 cubemap face directions
  // ----------------------------------------------------------------------------------------------
  const captureProjection = twgl.m4.perspective(Math.PI / 2, 1, 0.1, 100);
  // 6个面的数据
  const captureViews = [
    twgl.m4.inverse(twgl.m4.lookAt(Vector3.create(0, 0, 0), Vector3.create(1, 0, 0), Vector3.create(0, -1, 0))),
    twgl.m4.inverse(twgl.m4.lookAt(Vector3.create(0, 0, 0), Vector3.create(-1, 0, 0), Vector3.create(0, -1, 0))),
    twgl.m4.inverse(twgl.m4.lookAt(Vector3.create(0, 0, 0), Vector3.create(0, 1, 0), Vector3.create(0, 0, 1))),
    twgl.m4.inverse(twgl.m4.lookAt(Vector3.create(0, 0, 0), Vector3.create(0, -1, 0), Vector3.create(0, 0, -1))),
    twgl.m4.inverse(twgl.m4.lookAt(Vector3.create(0, 0, 0), Vector3.create(0, 0, 1), Vector3.create(0, -1, 0))),
    twgl.m4.inverse(twgl.m4.lookAt(Vector3.create(0, 0, 0), Vector3.create(0, 0, -1), Vector3.create(0, -1, 0))),
  ]


  // window.spector.startCapture(canvas, 1000, false, true)
  // pbr: convert HDR equirectangular environment map to cubemap equivalent
  // ----------------------------------------------------------------------
  gl.useProgram(eqToCubeProgram)
  twgl.setUniforms(eqToCubeProgramInfo, {
    equirectangularMap: textures.hdr,
    projection: captureProjection
  })
  gl.viewport(0, 0, 512, 512)
  twgl.bindFramebufferInfo(gl, captureFbo, gl.FRAMEBUFFER)
  // gl.activeTexture(gl.TEXTURE0)
  // gl.bindTexture(gl.TEXTURE_2D, textures.hdr)
  twgl.setBuffersAndAttributes(gl, eqToCubeProgramInfo, cubeBufferInfo)
  for (let i = 0; i < 6; i++) {
    twgl.setUniforms(eqToCubeProgramInfo, {
      view: captureViews[i]
    })
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, textures.envCubeMapTex, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    console.log(' --- hahaha ');
    twgl.drawBufferInfo(gl, cubeBufferInfo)
    // debugRt.readFromContext('cubemap' + i)
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, textures.envCubeMapTex)
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP)


  gl.bindFramebuffer(gl.FRAMEBUFFER, null)





  // pbr: create an irradiance cubemap, and re-scale capture FBO to irradiance scale.
  // --------------------------------------------------------------------------------\
  const irradWidth = 32
  const irradHeight = 32
  const texObj = await createTextures(gl, {
    irradianceTexMap: {
      auto: true,
      src: undefined,
      target: gl.TEXTURE_CUBE_MAP,
      width: irradWidth,
      height: irradHeight,
      // internalFormat: gl.RGB16F,
      // format: gl.RGB,
      type: gl.UNSIGNED_BYTE,
      wrapR: gl.CLAMP_TO_EDGE,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      min: gl.LINEAR,
      max: gl.LINEAR,
    }
  })
  twgl.resizeFramebufferInfo(gl, captureFbo, attachments, irradWidth, irradHeight)
  gl.viewport(0, 0, irradWidth, irradHeight)


  // pbr: solve diffuse integral by convolution to create an irradiance (cube)map.
  // -----------------------------------------------------------------------------
  gl.useProgram(irradianceProgram)
  twgl.setUniforms(irradianceProgramInfo, {
    projection: captureProjection,
    environmentMap: textures.envCubeMapTex
  })
  twgl.bindFramebufferInfo(gl, captureFbo)
  twgl.setBuffersAndAttributes(gl, irradianceProgramInfo, cubeBufferInfo)
  for (let i = 0; i < 6; i++) {
    twgl.setUniforms(irradianceProgramInfo, {
      view: captureViews[i]
    })
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, texObj.irradianceTexMap, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    twgl.drawBufferInfo(gl, cubeBufferInfo)
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  // debug cube start
  // gl.viewport(0, 0, 512, 512)
  // const target = twgl.v3.add(camPos, camFront);
  // const cameraMat = twgl.m4.lookAt(camPos, target, camUp)
  // const view = twgl.m4.inverse(cameraMat)
  // const projection = twgl.m4.perspective(perspectiveOptions.fov, 1, 0.1, 100)
  // gl.useProgram(bgProgram)
  // twgl.setBuffersAndAttributes(gl, bgProgramInfo, cubeBufferInfo)
  // twgl.setUniforms(bgProgramInfo, {
  //   view,
  //   projection,
  //   // environmentMap: texObj.irradianceTexMap
  //   environmentMap: textures.envCubeMapTex
  //   // environmentMap: texs.prefilterMap
  // })
  // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  // twgl.drawBufferInfo(gl, cubeBufferInfo)
  // return
  // debug cube end

  // pbr: create a pre-filter cubemap, and re-scale capture FBO to pre-filter scale.
  // --------------------------------------------------------------------------------

  // window.spector.startCapture(canvas, 1000)
  const preWidth = 512
  const preHeight = 512
  const texs = await createTextures(gl, {
    prefilterMap: {
      // auto: true,
      src: undefined,
      type: gl.UNSIGNED_BYTE,
      target: gl.TEXTURE_CUBE_MAP,
      width: preWidth,
      height: preHeight,
      wrapR: gl.CLAMP_TO_EDGE,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    }
  })
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texs.prefilterMap)
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP)
  // pbr: run a quasi monte-carlo simulation on the environment lighting to create a prefilter (cube)map.
  // ----------------------------------------------------------------------------------------------------
  // window.spector.startCapture(canvas, 100, false, true)
  gl.useProgram(prefilterProgram)
  twgl.setUniforms(prefilterProgramInfo, {
    environmentMap: textures.envCubeMapTex,
    projection: captureProjection
  })
  const attachments1: twgl.AttachmentOptions[] = [
    { attachment: texs.prefilterMap, attachmentPoint: gl.COLOR_ATTACHMENT0 },
    { attachment: RBO, attachmentPoint: gl.DEPTH_ATTACHMENT },
  ]
  const fbo = twgl.createFramebufferInfo(gl, attachments1, preWidth, preHeight)
  twgl.bindFramebufferInfo(gl, fbo, gl.FRAMEBUFFER)
  const maxMipLeverls = 5
  twgl.setBuffersAndAttributes(gl, prefilterProgramInfo, cubeBufferInfo)
  for (let mip = 0; mip < maxMipLeverls; mip++) {
    const mipWidth = preWidth * Math.pow(0.5, mip)
    const mipHeight = preHeight * Math.pow(0.5, mip)
    twgl.resizeFramebufferInfo(gl, fbo, attachments1, mipWidth, mipHeight)
    gl.viewport(0, 0, mipWidth, mipHeight)
    const roughness = mip / (maxMipLeverls - 1)
    console.log('roughness', roughness);
    twgl.setUniforms(prefilterProgramInfo, {
      roughness
    })
    for (let i = 0; i < 6; i++) {
      twgl.setUniforms(prefilterProgramInfo, {
        view: captureViews[i]
      })
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, texs.prefilterMap, mip)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      twgl.drawBufferInfo(gl, cubeBufferInfo)
      // debugRm.readFromContext('prefilter_' + i)
    }
  }
  console.log(' goes here ');
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.viewport(0, 0, 512, 512);


  // pbr: generate a 2D LUT from the BRDF equations used.
  // ----------------------------------------------------
  console.log(' here ');
  const texs2 = await createTextures(gl, {
    brdfLUTTexture: {
      src: undefined,
      width: 512,
      height: 512,
      // internalFormat: gl.RG16F,
      // format: gl.RG,
      // type: gl.UNSIGNED_BYTE,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
      min: gl.LINEAR,
      max: gl.LINEAR,
    }
  })
  // then re-configure capture framebuffer object and render screen-space quad with BRDF shader.
  twgl.bindFramebufferInfo(gl, captureFbo)
  twgl.resizeFramebufferInfo(gl, captureFbo, attachments, 512, 512)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texs2.brdfLUTTexture, 0)

  gl.viewport(0, 0, 512, 512);

  gl.useProgram(brdfProgram)
  twgl.setBuffersAndAttributes(gl, brdfProgramInfo, quadBufferInfo)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  twgl.drawBufferInfo(gl, quadBufferInfo)
  // debugRb.readFromContext('2d_lut')

  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  console.log(' here ___ ');

  // return

  const cameraChange = (canvas: HTMLCanvasElement, callback = () => {
    //
  }) => {

    document.addEventListener('keydown', e => {
      console.log(e);
      const speed = 0.1
      const { key } = e
      if (key === 'w' || key === 'ArrowUp') {
        const frontVec = twgl.v3.mulScalar(camFront, speed)
        camPos = twgl.v3.add(camPos, frontVec)
        callback()
      }
      if (key === 's' || key === 'ArrowDown') {
        const backVec = twgl.v3.negate(twgl.v3.mulScalar(camFront, speed))
        camPos = twgl.v3.add(camPos, backVec)
        callback()
      }
      if (key === 'a' || key === 'ArrowLeft') {
        const rightVec = twgl.v3.negate(twgl.v3.cross(camFront, camUp))
        twgl.v3.mulScalar(rightVec, speed, rightVec)
        camPos = twgl.v3.add(camPos, rightVec)
        callback()
      }
      if (key === 'd' || key === 'ArrowRight') {
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
      const { which } = e

      const isLeftClick = which === 1
      const isMiddleClick = which === 2
      const isRightClick = which === 3
      if (isMiddleClick) {
        return
      }
      if (isRightClick) {

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
      canvas.removeEventListener('mousemove', onMousemove)
      canvas.removeEventListener('mouseup', onMouseUp)
    }
    const onMousedown = (e: MouseEvent) => {
      const { offsetX, offsetY, which } = e
      const isLeftClick = which === 1
      const isMiddleClick = which === 2
      const isRightClick = which === 3
      startMove = true
      lastX = offsetX
      lastY = offsetY
      canvas.addEventListener('mousemove', onMousemove)
      canvas.addEventListener('mouseup', onMouseUp)
    }

    canvas.oncontextmenu = function (e) {
      return false
    }
    canvas.addEventListener('mousedown', onMousedown)
    // mousemove
    // camera front  vector3
  }

  // light info
  const lightPositions = [
    -10, 10, 10,
    10, 10, 10,
    -10, -10, 10,
    10, -10, 10,
  ]
  const lightColors = [
    300, 300, 300,
    300, 300, 300,
    300, 300, 300,
    300, 300, 300,
  ]


  // const cube = twgl.primitives.createCubeBufferInfo(gl)
  // console.log(cube);

  let draw = () => {
    //
  }

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

      albedoMap: textures.albedoMap,
      normalMap: textures.normalMap,
      metallicMap: textures.metallicMap,
      roughnessMap: textures.roughnessMap,
      aoMap: textures.aoMap,

      irradianceMap: texObj.irradianceTexMap,
      brdfLUT: texs2.brdfLUTTexture,
      prefilterMap: texs.prefilterMap,
    })

    // draw para
    const nrRows = 7;
    const nrColumns = 7;
    const spacing = 2.5;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    twgl.setBuffersAndAttributes(gl, pbrProgramInfo, sphereBufferInfo)

    // render rows*column number of spheres with varying metallic/roughness values scaled by rows and columns respectively
    for (let row = 0; row < nrRows; ++row) {
      const metallic = row / nrRows;
      // console.log(' --- 金属度 ', metallic);
      twgl.setUniforms(pbrProgramInfo, {
        metallic
      })
      for (let col = 0; col < nrColumns; ++col) {
        const model = twgl.m4.identity()
        twgl.m4.translate(model, twgl.v3.create(
          (col - (nrColumns / 2)) * spacing,
          (row - (nrRows / 2)) * spacing,
          0
        ), model);
        const roughness = clamp(col / nrColumns, 0.05, 1)
        // console.log( ' 粗糙度', roughness );
        twgl.setUniforms(pbrProgramInfo, {
          model,
          roughness,
        })
        twgl.drawBufferInfo(gl, sphereBufferInfo)
      }
    }

    // render light source (simply re-render sphere at light positions)
    // this looks a bit off as we use the same shader, but it'll make their positions obvious and
    // keeps the codeprint small.
    for (let i = 0; i < lightPositions.length / 3; ++i) {
      const newPos = lightPositions.slice(i * 3, i * 3 + 3);
      const color = lightColors[i];
      let model = twgl.m4.identity()
      model = twgl.m4.translate(model, newPos);
      model = twgl.m4.scale(model, [0.5, 0.5, 0.5]);
      twgl.setUniforms(pbrProgramInfo, {
        model,
      })
      twgl.drawBufferInfo(gl, sphereBufferInfo)
    }

    // render skybox (render as last to prevent overdraw)
    gl.useProgram(bgProgram)
    twgl.setBuffersAndAttributes(gl, bgProgramInfo, cubeBufferInfo)
    twgl.setUniforms(bgProgramInfo, {
      view,
      projection,
      // environmentMap: texObj.irradianceTexMap
      // environmentMap: texs.prefilterMap,
      environmentMap: textures.envCubeMapTex
    })
    twgl.drawBufferInfo(gl, cubeBufferInfo)


  }
  draw = drawFn
  draw()

  cameraChange(canvas, () => {
    draw()
  })

}
export default main;
