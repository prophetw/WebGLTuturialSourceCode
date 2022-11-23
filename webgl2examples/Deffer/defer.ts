import * as twgl from 'twgl.js'
import FS_TEX from './tex.frag'
import VS_TEX from './tex.vert'
import FS_Draw from './draw.frag'
import VS_Draw from './draw.vert'
import { createBox, createSphere } from '../../src/utils/utils'
import { VisualState } from '../../src/utils/visualState'

const vec3 = twgl.v3
const mat4 = twgl.m4

// xformMatrix: function xformMatrix(xform, translate, rotate, scale) {
//     translate = translate || zeros;
//     rotate = rotate || zeros;
//     scale = scale || ones;

//     mat4.fromTranslation(translateMat, translate);
//     mat4.fromXRotation(rotateXMat, rotate[0]);
//     mat4.fromYRotation(rotateYMat, rotate[1]);
//     mat4.fromZRotation(rotateZMat, rotate[2]);
//     mat4.fromScaling(scaleMat, scale);

//     mat4.multiply(xform, rotateXMat, scaleMat);
//     mat4.multiply(xform, rotateYMat, xform);
//     mat4.multiply(xform, rotateZMat, xform);
//     mat4.multiply(xform, translateMat, xform);
// },
const utils = {
  xformMatrix: (
    resultMat4: twgl.m4.Mat4,
    translate?: [number, number, number],
    rotate?: [number, number, number],
    scale?: [number, number, number]
  ) => {
    translate = translate || [0, 0, 0]
    rotate = rotate || [0, 0, 0]
    scale = scale || [1, 1, 1]
    const translateMat = mat4.translation(translate)
    const rotateX = mat4.rotationX(rotate[0])
    const rotateY = mat4.rotationX(rotate[1])
    const rotateZ = mat4.rotationX(rotate[2])
    const scaleMat = mat4.scale(mat4.identity(), scale)

    mat4.multiply(rotateX, scaleMat, resultMat4)
    mat4.multiply(rotateY, resultMat4, resultMat4)
    mat4.multiply(rotateZ, resultMat4, resultMat4)
    mat4.multiply(translateMat, resultMat4, resultMat4)
  }
}



function main() {

  var canvas = document.getElementById("webgl") as HTMLCanvasElement;

  var gl = canvas.getContext("webgl2") as WebGL2RenderingContext;
  const debugRT = new VisualState({
    context: gl,
    contextVersion: 2,
  }, 'right-top', 100)
  const debugRM = new VisualState({
    context: gl,
    contextVersion: 2,
  }, 'right-mid', 100)
  console.log(' debugRT ', debugRT);
  if (!gl) {
    console.error("WebGL 2 not available");
    document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.blendFunc(gl.ONE, gl.ONE);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    console.error("FLOAT color buffer not available");
    document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
  }

  ////////////////////////////
  // GBUFFER PROGRAM SETUP
  ////////////////////////////

  const texProgramInfo = twgl.createProgramInfo(gl, [VS_TEX, FS_TEX])
  const geoProgram = texProgramInfo.program

  //////////////////////////////////////////
  // GET GBUFFFER PROGRAM UNIFORM LOCATIONS
  //////////////////////////////////////////

  var matrixUniformLocation = gl.getUniformBlockIndex(geoProgram, "Matrices");
  gl.uniformBlockBinding(geoProgram, matrixUniformLocation, 0);


  ////////////////////////////
  // GBUFFER SETUP
  ////////////////////////////

  var gBuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer);

  gl.activeTexture(gl.TEXTURE0);

  var positionTarget = gl.createTexture();
  // @ts-ignore
  positionTarget.__SPECTOR_Metadata = {
    name: 'pos'
  }
  gl.bindTexture(gl.TEXTURE_2D, positionTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, positionTarget, 0);

  var normalTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, normalTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, normalTarget, 0);

  var uvTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, uvTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, uvTarget, 0);
  console.log(uvTarget);

  var depthTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTexture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT16, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0,
    gl.COLOR_ATTACHMENT1,
    gl.COLOR_ATTACHMENT2
  ]);


  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  /////////////////////////////
  // MAIN PROGRAM SETUP
  /////////////////////////////

  const drawProgramInfo = twgl.createProgramInfo(gl, [VS_Draw, FS_Draw])
  const mainProgram = drawProgramInfo.program

  //////////////////////////////////////////////
  // GET MAIN PROGRAM UNIFORM LOCATIONS
  //////////////////////////////////////////////

  var lightUniformsLocation = gl.getUniformBlockIndex(mainProgram, "LightUniforms");
  gl.uniformBlockBinding(mainProgram, lightUniformsLocation, 0);

  var eyePositionLocation = gl.getUniformLocation(mainProgram, "uEyePosition");

  var positionBufferLocation = gl.getUniformLocation(mainProgram, "uPositionBuffer");
  var normalBufferLocation = gl.getUniformLocation(mainProgram, "uNormalBuffer");
  var uVBufferLocation = gl.getUniformLocation(mainProgram, "uUVBuffer");
  var textureMapLocation = gl.getUniformLocation(mainProgram, "uTextureMap");

  ///////////////////////
  // GEOMETRY SET UP
  ///////////////////////

  var cubeVertexArray = gl.createVertexArray();
  gl.bindVertexArray(cubeVertexArray);

  // var box = twgl.primitives.createCubeVertices();
  var box = createBox()
  console.log(' ---- box --- vertex ', box);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, box.position, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, box.normal, gl.STATIC_DRAW);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(1);

  var uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, box.texcoord, gl.STATIC_DRAW);
  gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(2);

  var sphereVertexArray = gl.createVertexArray();
  gl.bindVertexArray(sphereVertexArray);

  var numCubeVertices = box.position.length / 3;

  // var sphere = twgl.primitives.createSphereVertices(1, 100, 100)
  var sphere = createSphere()
  console.log(' sphere --- vertex', sphere);

  positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.position, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  var indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

  var numSphereElements = sphere.indices.length;

  gl.bindVertexArray(null);


  ////////////////////
  // UNIFORM DATA
  ////////////////////

  const projMatrix = mat4.perspective(Math.PI / 3, 1, 0.1, 100.0);

  var eyePosition = vec3.create(1, 1, 1);
  const camera = mat4.lookAt(eyePosition, vec3.create(0, 0, 0), vec3.create(0, 1, 0));
  const viewMatrix = mat4.inverse(camera)

  const viewProjMatrix = mat4.multiply(projMatrix, viewMatrix);

  var boxes = [
    {
      scale: [0.8, 0.8, 0.8],
      rotate: [0, 0, 0],
      translate: [0, 0, 0],
      modelMatrix: mat4.identity(),
      mvpMatrix: mat4.identity(),
    },
    {
      scale: [0.1, 0.1, 0.1],
      rotate: [0, 0, Math.PI / 3],
      translate: [0.8, 0.8, 0.4],
      modelMatrix: mat4.identity(),
      mvpMatrix: mat4.identity(),
    }
  ];

  var matrixUniformData = new Float32Array(32);
  var matrixUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, matrixUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, 128, gl.DYNAMIC_DRAW);

  var lights = [
    {
      position: vec3.create(0, 1, 0.5),
      color: vec3.create(0.8, 0.0, 0.0),
      uniformData: new Float32Array(24),
      uniformBuffer: gl.createBuffer()
    },
    {
      position: vec3.create(1, 1, 0.5),
      color: vec3.create(0.0, 0.0, 0.8),
      uniformData: new Float32Array(24),
      uniformBuffer: gl.createBuffer()
    },
    {
      position: vec3.create(1, 0, 0.5),
      color: vec3.create(0.0, 0.8, 0.0),
      uniformData: new Float32Array(24),
      uniformBuffer: gl.createBuffer()
    },
    {
      position: vec3.create(0.5, 0, 1),
      color: vec3.create(0.0, 0.8, 0.8),
      uniformData: new Float32Array(24),
      uniformBuffer: gl.createBuffer()
    }
  ];

  var mvpMatrix = mat4.identity();
  for (var i = 0, len = lights.length; i < len; ++i) {
    utils.xformMatrix(mvpMatrix, lights[i].position);
    // const trans = mat4.translation(lights[i].position)
    // mat4.multiply(trans, mvpMatrix, mvpMatrix)
    mat4.multiply(viewProjMatrix, mvpMatrix, mvpMatrix);
    lights[i].uniformData.set(mvpMatrix);
    lights[i].uniformData.set(lights[i].position, 16);
    lights[i].uniformData.set(lights[i].color, 20);

    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, lights[i].uniformBuffer);
    gl.bufferData(gl.UNIFORM_BUFFER, lights[i].uniformData, gl.STATIC_DRAW);
  }

  var image = new Image();

  // window.spector.startCapture(canvas, 1000)
  image.onload = function () {
    var colorTexture = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    // @ts-ignore
    var levels = levels = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
    console.log(' --- levels --- ', levels);
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    //////////////////
    // BIND TEXTURES
    //////////////////

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, positionTarget);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normalTarget);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, uvTarget);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, colorTexture);

    //////////////////////////////
    // SET MAIN PROGRAM UNIFORMS
    //////////////////////////////

    gl.useProgram(mainProgram);
    gl.uniform3fv(eyePositionLocation, eyePosition);
    gl.uniform1i(positionBufferLocation, 0);
    gl.uniform1i(normalBufferLocation, 1);
    gl.uniform1i(uVBufferLocation, 2);
    gl.uniform1i(textureMapLocation, 3);


    // window.spector.startCapture(canvas, 1000)
    function draw() {

      /////////////////////////
      // DRAW TO GBUFFER
      /////////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer);
      gl.useProgram(geoProgram);
      gl.bindVertexArray(cubeVertexArray);
      gl.depthMask(true);
      gl.disable(gl.BLEND);

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      for (var i = 0, len = boxes.length; i < len; ++i) {
        boxes[i].rotate[0] += 0.01;
        boxes[i].rotate[1] += 0.02;

        // const trans = mat4.translation(boxes[i].translate)
        // mat4.scale()
        // const scale = mat4.scale(boxes[i].scale)
        // mat4.multiply(trans, mvpMatrix, mvpMatrix)
        utils.xformMatrix(boxes[i].modelMatrix, boxes[i].translate, boxes[i].rotate, boxes[i].scale);
        mat4.multiply(viewProjMatrix, boxes[i].modelMatrix, boxes[i].mvpMatrix);

        matrixUniformData.set(boxes[i].modelMatrix);
        matrixUniformData.set(boxes[i].mvpMatrix, 16);

        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, matrixUniformBuffer);
        gl.bufferSubData(gl.UNIFORM_BUFFER, 0, matrixUniformData);

        gl.drawArrays(gl.TRIANGLES, 0, numCubeVertices);
      }
      debugRT.readFromContext('boxInfo_pos_norm_uv')

      /////////////////////////
      // MAIN DRAW PASS
      /////////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(mainProgram);
      gl.bindVertexArray(sphereVertexArray);
      gl.depthMask(false);
      gl.enable(gl.BLEND);


      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      for (var i = 0, len = lights.length; i < len; ++i) {
        gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, lights[i].uniformBuffer);
        gl.drawElements(gl.TRIANGLES, numSphereElements, gl.UNSIGNED_SHORT, 0);
      }
      debugRM.readFromContext()


      // requestAnimationFrame(draw);
    }

    draw()
    // requestAnimationFrame(draw);

  }

  image.src = "./resources/khronos_webgl.png";


}

export default main
