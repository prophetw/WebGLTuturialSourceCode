import ColorVS from './color.vert'
import ColorFS from './color.frag'
import Shader3DVS from './shader3d.vert'
import Shader3DFS from './shader3d.frag'
import * as twgl from 'twgl.js'
import { CustomBtn } from '../../src/utils/utils';

const m4 = twgl.m4
const primitives = twgl.primitives


var zDepth = 50;

async function main() {
  var canvas = document.getElementById("webgl") as HTMLCanvasElement;

  document.title = 'Projection'
  canvas.width = 800
  canvas.height = 800
  var gl = canvas.getContext("webgl2", {antialias: false});
  if (!gl) {
    return;
  }

  // Use our boilerplate utils to compile the shaders and link into a program
  var colorInfo = twgl.createProgramInfo(gl, [ColorVS, ColorFS])
  var shader3DInfo = twgl.createProgramInfo(gl, [Shader3DVS, Shader3DFS])
  console.log(colorInfo);
  console.log(shader3DInfo);

  twgl.setAttributePrefix('a_')

  const sphereBufInfo = primitives.createSphereBufferInfo(gl, 1, 12, 6)
  const planeBufInfo = primitives.createPlaneBufferInfo(gl, 20, 20, 1, 1)

  console.log(sphereBufInfo);
  console.log(planeBufInfo);

  const cubeLinesBufInfo = twgl.createBufferInfoFromArrays(gl, {
     position: [
       0,  0, -1,
       1,  0, -1,
       0,  1, -1,
       1,  1, -1,
       0,  0,  1,
       1,  0,  1,
       0,  1,  1,
       1,  1,  1,
    ],
    indices: [
      0, 1,
      1, 3,
      3, 2,
      2, 0,

      4, 5,
      5, 7,
      7, 6,
      6, 4,

      0, 4,
      1, 5,
      3, 7,
      2, 6,
    ],
  })

  function degToRad(d: number) {
    return d * Math.PI / 180;
  }
 // make a 8x8 checkerboard texture
  const checkerboardTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, checkerboardTexture);
  gl.texImage2D(
      gl.TEXTURE_2D,
      0,                // mip level
      gl.LUMINANCE,     // internal format
      8,                // width
      8,                // height
      0,                // border
      gl.LUMINANCE,     // format
      gl.UNSIGNED_BYTE, // type
      new Uint8Array([  // data
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
        0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC,
        0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF, 0xCC, 0xFF,
      ]));
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  function loadImageTexture(url: string) {
    // Create a texture.
    let res: (val: any)=>void, rej;
    const promise = new Promise((resolve, reject)=>{
      res = resolve;
      rej = reject;

    })
    if(gl === null) return;
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    const image = new Image();
    image.crossOrigin = '';
    image.src = url;
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      if(gl === null) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
      // assumes this texture is a power of 2
      gl.generateMipmap(gl.TEXTURE_2D);
      // render();
      res(texture)
    });
    return promise;
  }

  const imageTexture = await loadImageTexture('https://webglfundamentals.org/webgl/resources/f-texture.png');


  const settings = {
    cameraX: 2.75,
    cameraY: 5,
    posX: 2.5,
    posY: 4.8,
    posZ: 4.3,
    targetX: 2.5,
    targetY: 0,
    targetZ: 3.5,
    projWidth: 1,
    projHeight: 1,
    perspective: true,
    fieldOfView: 45,
  };


  console.log(' setupUI ', webglLessonsUI.setupUI);
   webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
    { type: 'slider',   key: 'cameraX',    min: -10, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'cameraY',    min:   1, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'posX',       min: -10, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'posY',       min:   1, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'posZ',       min:   1, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'targetX',    min: -10, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'targetY',    min:   0, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'targetZ',    min: -10, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'projWidth',  min:   0, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'projHeight', min:   0, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'checkbox', key: 'perspective', },
    { type: 'slider',   key: 'fieldOfView', min:  1, max: 179, change: render, },
  ]);

  const fieldOfViewRadians = degToRad(60);

  // Uniforms for each object.
  const planeUniforms = {
    u_colorMult: [0.5, 0.5, 1, 1],  // lightblue
    u_texture: checkerboardTexture,
    u_world: m4.translation([0, 0, 0]),
  };
  const sphereUniforms = {
    u_colorMult: [1, 0.5, 0.5, 1],  // pink
    u_texture: checkerboardTexture,
    u_world: m4.translation([2, 3, 4]),
  };
 function drawScene(projectionMatrix: twgl.m4, cameraMatrix: m4) {
  // window.spector.startCapture(canvas, 2000);
    // Make a view matrix from the camera matrix.
    console.log(' drawScene ');
    const viewMatrix = m4.inverse(cameraMatrix);


    // 待投影的 img 所在的 view 以及 projection
    // camera
    const textureWorldMatrix = m4.lookAt(
        [settings.posX, settings.posY, settings.posZ],          // position
        [settings.targetX, settings.targetY, settings.targetZ], // target
        [0, 1, 0],                                              // up
    );
    // projection
    const textureProjectionMatrix = settings.perspective
        ? m4.perspective(
            degToRad(settings.fieldOfView),
            settings.projWidth / settings.projHeight,
            0.1,  // near
            200)  // far
        : m4.ortho(
            -settings.projWidth / 2,   // left
             settings.projWidth / 2,   // right
            -settings.projHeight / 2,  // bottom
             settings.projHeight / 2,  // top
             0.1,                      // near
             200);                     // far

    // use the inverse of this world matrix to make
    // a matrix that will transform other positions
    // to be relative this world space.
    // mvp  texture matrix
    const textureMatrix = m4.multiply(
        textureProjectionMatrix,
        m4.inverse(textureWorldMatrix));

    gl.useProgram(shader3DInfo.program);

    // set uniforms that are the same for both the sphere and plane
    twgl.setUniforms(shader3DInfo, {
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_textureMatrix: textureMatrix,
      u_projectedTexture: imageTexture,
    });

    // ------ Draw the sphere --------

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, shader3DInfo, sphereBufInfo);

    // Set the uniforms unique to the sphere
    twgl.setUniforms(shader3DInfo, sphereUniforms);

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, sphereBufInfo);

    // ------ Draw the plane --------

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, shader3DInfo, planeBufInfo);

    // Set the uniforms we just computed
    twgl.setUniforms(shader3DInfo, planeUniforms);

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, planeBufInfo);

    // ------ Draw the cube ------

    gl.useProgram(colorInfo.program);

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, colorInfo, cubeLinesBufInfo);

    // orient the cube to match the projection.
    const mat = m4.multiply(
        textureWorldMatrix, m4.inverse(textureProjectionMatrix));

    // Set the uniforms we just computed
    twgl.setUniforms(colorInfo, {
      u_color: [0, 0, 0, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,
    });

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, cubeLinesBufInfo, gl.LINES);
    console.log(' drawScene end ');
  }

  // Draw the scene.
  function render() {
    if(gl === null) return
    twgl.resizeCanvasToDisplaySize(canvas);


    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    const cameraPosition = [settings.cameraX, settings.cameraY, 7];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    drawScene(projectionMatrix, cameraMatrix);
  }
  render();
}



export default main;
