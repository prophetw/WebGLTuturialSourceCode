import ColorVS from './color.vert'
import ColorFS from './color.frag'
import Shader3DVS from './shader3d.vert'
import Shader3DFS from './shader3d.frag'
import QuadVS from './quad.vert'
import QuadFS from './quad.frag'
import * as twgl from 'twgl.js'

const m4 = twgl.m4
const primitives = twgl.primitives


var zDepth = 50;

async function main() {
  var canvas = document.getElementById("webgl") as HTMLCanvasElement;

  document.title = 'Projection'
  canvas.width = 800
  canvas.height = 800
  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    return;
  }

  twgl.setAttributePrefix('a_')


  // setup GLSL programs
  const textureProgramInfo = twgl.createProgramInfo(gl, [Shader3DVS, Shader3DFS]);
  const colorProgramInfo = twgl.createProgramInfo(gl, [ColorVS, ColorFS]);
  const quadProgramInfo = twgl.createProgramInfo(gl, [QuadVS, QuadFS]);

  const sphereBufferInfo = primitives.createSphereBufferInfo(
      gl,
      1,  // radius
      12, // subdivisions around
      6,  // subdivisions down
  );
  const planeBufferInfo = primitives.createPlaneBufferInfo(
      gl,
      20,  // width
      20,  // height
      1,   // subdivisions across
      1,   // subdivisions down
  );

  const planeBufferInfo3 = primitives.createPlaneBufferInfo(
      gl,
      2,  // width
      2,  // height
      1,   // subdivisions across
      1,   // subdivisions down
  );
  // twgl.createVertexArrayInfo
  const farPlaneBufInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [
      -1, -1, 1,
       1, -1, 1,
      -1,  1, 1,
       1,  1, 1,
    ],
    indices: [
      0, 1, 2,
      2, 1, 3
    ],
  })
  console.log(' farPlane', farPlaneBufInfo);


  const plane2BufferInfo = primitives.createXYQuadBufferInfo(
      gl
  );
  console.log(' plane ', primitives.createPlaneVertices());
  console.log(' XYQuad ', primitives.createXYQuadVertices());

  // 线框 立方体 绘制12条边 每条边两个顶点
  const cubeLinesBufferInfo = twgl.createBufferInfoFromArrays(gl, {
    position: [
      -1, -1, -1,
       1, -1, -1,
      -1,  1, -1,
       1,  1, -1,
      -1, -1,  1,
       1, -1,  1,
      -1,  1,  1,
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
  });

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
    if(!gl) return
    // Create a texture.
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Fill the texture with a 1x1 blue pixel.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([0, 0, 255, 255]));
    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.crossOrigin = '';
    image.addEventListener('load', function() {
      if(!gl) return
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, image);
      // assumes this texture is a power of 2
      gl.generateMipmap(gl.TEXTURE_2D);
      render();
    });
    return texture;
  }

  const imageTexture = loadImageTexture('https://webglfundamentals.org/webgl/resources/f-texture.png');

  function degToRad(d: number) {
    return d * Math.PI / 180;
  }

  const settings = {
    cameraX: 2.75,
    cameraY: 5,
    posX: 2.5,
    posY: 4.8,
    posZ: 4.3,
    targetX: 2.5,
    targetY: 0,
    targetZ: 3.5,
    projWidth: 4,
    projHeight: 10,
    perspective: true,
    fieldOfView: 45,
  };
  window.webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
    { type: 'slider',   key: 'cameraX',    min: -10, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'cameraY',    min:   1, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'posX',       min: -10, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'posY',       min:   1, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'posZ',       min:   1, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'targetX',    min: -10, max: 10, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'targetY',    min:   0, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'targetZ',    min: -10, max: 20, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'projWidth',  min:   0, max:  2, change: render, precision: 2, step: 0.001, },
    { type: 'slider',   key: 'projHeight', min:   0, max:  2, change: render, precision: 2, step: 0.001, },
    { type: 'checkbox', key: 'perspective', change: render, },
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
  const quadUniforms = {
    u_texture: checkerboardTexture,
  }

  function drawScene(projectionMatrix: twgl.m4.Mat4, cameraMatrix: twgl.m4.Mat4) {

      if(!gl) return
    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix);

    // camera matrix
    const textureWorldMatrix = m4.lookAt(
        [settings.posX, settings.posY, settings.posZ],          // position
        [settings.targetX, settings.targetY, settings.targetZ], // target
        [0, 1, 0],                                              // up
    );
    const textureProjectionMatrix = settings.perspective
        ? m4.perspective(
            degToRad(settings.fieldOfView),
            settings.projWidth / settings.projHeight,
            0.1,  // near
            10)  // far
        : m4.ortho(
            -settings.projWidth / 2,   // left
             settings.projWidth / 2,   // right
            -settings.projHeight / 2,  // bottom
             settings.projHeight / 2,  // top
             0.1,                      // near
             10);                     // far

    let textureMatrix = m4.identity();

    // Converts from NDC space to texture space
    textureMatrix = m4.translate(textureMatrix, [0.5, 0.5, 0.5]);
    textureMatrix = m4.scale(textureMatrix, [0.5, 0.5, 0.5]);

    textureMatrix = m4.multiply(textureMatrix, textureProjectionMatrix);
    // use the inverse of this world matrix to make
    // a matrix that will transform other positions
    // to be relative this world space.
    textureMatrix = m4.multiply(
        textureMatrix,
        m4.inverse(textureWorldMatrix));

    gl.useProgram(textureProgramInfo.program);

    // set uniforms that are the same for both the sphere and plane
    twgl.setUniforms(textureProgramInfo, {
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_textureMatrix: textureMatrix,
      u_projectedTexture: imageTexture,
    });

    // ------ Draw the sphere --------

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, textureProgramInfo, sphereBufferInfo);

    // Set the uniforms unique to the sphere
    twgl.setUniforms(textureProgramInfo, sphereUniforms);

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, sphereBufferInfo);

    // ------ Draw the plane --------

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, textureProgramInfo, planeBufferInfo);

    // Set the uniforms we just computed
    twgl.setUniforms(textureProgramInfo, planeUniforms);

    // calls gl.drawArrays or gl.drawElements
    twgl.drawBufferInfo(gl, planeBufferInfo);

    // ------ Draw the cube ------

    gl.useProgram(colorProgramInfo.program);

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, colorProgramInfo, cubeLinesBufferInfo);

    // scale the cube in Z so it's really long
    // to represent the texture is being projected to
    // infinity
    // transform to world matrix
    // projectPosition = p * v * m * pos
    // v^-1 * p^-1 * p * v * m * pos = worldPos
    // textureWorldMatrix = cameraMatrix
    const mat = m4.multiply(
        textureWorldMatrix, m4.inverse(textureProjectionMatrix));
    // const mat = m4.identity();

    // Set the uniforms we just computed
    twgl.setUniforms(colorProgramInfo, {
      u_color: [0, 0, 0, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,  // projection space to world space
    });

    // calls gl.drawArrays or gl.drawElements
    // twgl.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);
    twgl.drawBufferInfo(gl, cubeLinesBufferInfo, gl.LINES);


    // ------- Draw the frustum far plane ------

    gl.useProgram(quadProgramInfo.program);

    // twgl.setBuffersAndAttributes(gl, quadProgramInfo, plane2BufferInfo);
    twgl.setBuffersAndAttributes(gl, quadProgramInfo, farPlaneBufInfo);

    // const mat2 = m4.multiply(
    //     textureWorldMatrix, m4.inverse(textureProjectionMatrix));

    twgl.setUniforms(quadProgramInfo, {
      // u_color: [0, 0, 0, 1],
      u_view: viewMatrix,
      u_projection: projectionMatrix,
      u_world: mat,  // projection space to world space
      u_texture: imageTexture,
    });

    // twgl.drawBufferInfo(gl, plane2BufferInfo, gl.TRIANGLES);
    twgl.drawBufferInfo(gl, farPlaneBufInfo, gl.TRIANGLES);


  }

  // Draw the scene.
  function render() {
    if(!gl) return
    const canvas = gl.canvas as HTMLCanvasElement
    twgl.resizeCanvasToDisplaySize(canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    const aspect = canvas.clientWidth / canvas.clientHeight;
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
