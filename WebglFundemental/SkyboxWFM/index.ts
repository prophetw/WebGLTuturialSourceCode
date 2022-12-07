import SkyboxVS from './skybox.vert'
import SkyboxFS from './skybox.frag'
import EnvmapVS from './envmap.vert'
import EnvmapFS from './envmap.frag'
import * as twgl from 'twgl.js'
import { CustomBtn } from '../../src/utils/utils';
import { VisualState } from '../../src/utils/visualState'

const m4 = twgl.m4
const primitives = twgl.primitives

function main() {
  var canvas = document.getElementById("webgl") as HTMLCanvasElement;
  var gl = canvas.getContext("webgl");
  if (gl === null) {
    return;
  }
  const debugRT = new VisualState({
    context: gl,
    contextVersion: 1
  }, 'right-top', 10)
  const debugRM = new VisualState({
    context: gl,
    contextVersion: 1
  }, 'right-mid', 10)

  // setup GLSL programs and lookup locations
  // const envmapProgramInfo = webglUtils.createProgramInfo(
  //     gl, ["envmap-vertex-shader", "envmap-fragment-shader"]);
  const pInfo1 = twgl.createProgramInfo(gl, [EnvmapVS, EnvmapFS])
  console.log(' envmap ', pInfo1);
  const envmapProgramInfo = pInfo1

  // const skyboxProgramInfo = webglUtils.createProgramInfo(
  //     gl, ["skybox-vertex-shader", "skybox-fragment-shader"]);
  var pInfo = twgl.createProgramInfo(gl, [SkyboxVS, SkyboxFS])
  console.log(' skybox ', pInfo);
  const skyboxProgramInfo = pInfo

  // create buffers and fill with vertex data
  const cubeBufferInfo = primitives.createCubeBufferInfo(gl, 1);
  const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);
  console.log(' cube ', cubeBufferInfo);
  console.log(' quad ', quadBufferInfo);

  // Create a texture.
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-x.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-x.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-y.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-y.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/pos-z.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: 'https://webglfundamentals.org/webgl/resources/images/computer-history-museum/neg-z.jpg',
    },
  ];
  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;

    if (gl === null) return
    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.crossOrigin = '';
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      if (gl === null) return
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  function radToDeg(r: number) {
    return r * 180 / Math.PI;
  }

  function degToRad(d: number) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);
  var cameraYRotationRadians = degToRad(0);

  var spinCamera = true;
  // Get the starting time.
  var then = 0;

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time: number) {
    // convert to seconds
    time *= 0.001;
    // Subtract the previous time from the current time
    var deltaTime = time - then;
    // Remember the current time for the next frame.
    then = time;

    if (gl === null) return
    // webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // camera going in circle 2 units from origin looking at origin
    var cameraPosition = [Math.cos(time * .1) * 2, 0, Math.sin(time * .1) * 2];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    // Rotate the cube around the x axis
    var worldMatrix = m4.rotateX(m4.identity(), time * 0.11);

    // We only care about direciton so remove the translation
    var viewDirectionMatrix = m4.copy(viewMatrix);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(
        projectionMatrix, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix =
        m4.inverse(viewDirectionProjectionMatrix);

    // draw the cube
    // gl.depthFunc(gl.LESS);  // use the default depth test
    // gl.useProgram(envmapProgramInfo.program);
    // twgl.setBuffersAndAttributes(gl, envmapProgramInfo, cubeBufferInfo);
    // twgl.setUniforms(envmapProgramInfo, {
    //   u_world: worldMatrix,
    //   u_view: viewMatrix,
    //   u_projection: projectionMatrix,
    //   u_texture: texture,
    //   u_worldCameraPosition: cameraPosition,
    // });
    // twgl.drawBufferInfo(gl, cubeBufferInfo);
    // debugRT.readFromContext('cube')

    // draw the skybox

    // let our quad pass the depth test at 1.0
    gl.depthFunc(gl.LEQUAL);

    gl.useProgram(skyboxProgramInfo.program);
    twgl.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
    twgl.setUniforms(skyboxProgramInfo, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: texture,
    });
    twgl.drawBufferInfo(gl, quadBufferInfo);
    debugRM.readFromContext('quad')

    requestAnimationFrame(drawScene);
  }
}

export default main;
