import BoxFS from './box.frag'
import BoxVS from './box.vert'
import QuadFS from './quad.frag'
import QuadVS from './quad.vert'

import * as utils from '../../src/utils/utils'
import { VisualState } from '../../src/utils/visualState'
import * as twgl from 'twgl.js'
console.log(twgl);
const mat4 = twgl.m4
const vec3 = twgl.v3
// @ts-ignore
vec3.fromValues = vec3.create


const vec2 = {
  fromValues: function(a: number, b: number){
    return [a, b]

  }
}
function main() {

  var canvas = document.getElementById("webgl") as HTMLCanvasElement
  canvas.width = 800
  canvas.height = 800

  var gl = canvas.getContext("webgl2") as WebGL2RenderingContext
  const debugRT = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-top', 100)
  const debugRM = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-mid', 100)
  const debugRB = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-bottom', 100)

  if (!gl) {
    console.error("WebGL 2 not available");
    document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  var resolution = vec2.fromValues(gl.drawingBufferWidth, gl.drawingBufferHeight);

  /////////////////////
  // DOF CONSTANTS
  /////////////////////

  var NEAR = 0.1;
  var FAR = 10.0;
  var FOCAL_LENGTH = 1.0;
  var FOCUS_DISTANCE = 2.0;
  var MAGNIFICATION = FOCAL_LENGTH / Math.abs(FOCUS_DISTANCE - FOCAL_LENGTH);
  var FSTOP = 2.8;
  var BLUR_COEFFICIENT = FOCAL_LENGTH * MAGNIFICATION / FSTOP;
  var PPM = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height) / 35;
  var DEPTH_RANGE = vec2.fromValues(NEAR, FAR);

  /////////////////////////
  // OBJECT DESCRIPTIONS
  /////////////////////////

  var NUM_ROWS = 5;
  var BOXES_PER_ROW = 20;
  var NUM_BOXES = BOXES_PER_ROW * NUM_ROWS;
  var boxes = new Array(NUM_BOXES);

  var boxI = 0;
  for (var j = 0; j < NUM_ROWS; ++j) {
    var rowOffset = (j - Math.floor(NUM_ROWS / 2));
    for (var i = 0; i < BOXES_PER_ROW; ++i) {
      boxes[boxI] = {
        scale: [0.9, 0.9, 0.9],
        rotate: [-boxI / Math.PI, 0, boxI / Math.PI],
        translate: [-i + 2 - rowOffset, 0, -i + 2 + rowOffset],
        modelMatrix: mat4.identity(),
      };

      ++boxI;
    }
  }

  var modelMatrixData = new Float32Array(NUM_BOXES * 16);

  /////////////////////
  // MAIN PROGRAM
  /////////////////////
  // @ts-ignore
  const boxPInfo = twgl.createProgramInfo(gl, [BoxVS, BoxFS])
  const boxProgram = boxPInfo.program


  // var boxVsSource = document.getElementById("vertex-boxes").text.trim();
  // var boxFsSource = document.getElementById("fragment-boxes").text.trim();

  // var boxVertexShader = gl.createShader(gl.VERTEX_SHADER);
  // gl.shaderSource(boxVertexShader, boxVsSource);
  // gl.compileShader(boxVertexShader);

  // if (!gl.getShaderParameter(boxVertexShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(boxVertexShader));
  // }

  // var boxFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(boxFragmentShader, boxFsSource);
  // gl.compileShader(boxFragmentShader);

  // if (!gl.getShaderParameter(boxFragmentShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(boxFragmentShader));
  // }

  // var boxProgram = gl.createProgram();
  // gl.attachShader(boxProgram, boxVertexShader);
  // gl.attachShader(boxProgram, boxFragmentShader);
  // gl.linkProgram(boxProgram);

  // if (!gl.getProgramParameter(boxProgram, gl.LINK_STATUS)) {
  //   console.error(gl.getProgramInfoLog(boxProgram));
  // }

  /////////////////////
  // DOF PROGRAM
  /////////////////////
  // @ts-ignore
  const quadPinfo = twgl.createProgramInfo(gl, [QuadVS, QuadFS])
  const blurProgram = quadPinfo.program
  // var quadVsSource = document.getElementById("vertex-quad").text.trim();
  // var blurFsSource = document.getElementById("fragment-blur").text.trim();

  // var blurVertexShader = gl.createShader(gl.VERTEX_SHADER);
  // gl.shaderSource(blurVertexShader, quadVsSource);
  // gl.compileShader(blurVertexShader);

  // if (!gl.getShaderParameter(blurVertexShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(blurVertexShader));
  // }

  // var blurFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(blurFragmentShader, blurFsSource);
  // gl.compileShader(blurFragmentShader);

  // if (!gl.getShaderParameter(blurFragmentShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(blurFragmentShader));
  // }

  // var blurProgram = gl.createProgram();
  // gl.attachShader(blurProgram, blurVertexShader);
  // gl.attachShader(blurProgram, blurFragmentShader);
  // gl.linkProgram(blurProgram);

  // if (!gl.getProgramParameter(blurProgram, gl.LINK_STATUS)) {
  //   console.error(gl.getProgramInfoLog(blurProgram));
  // }

  /////////////////////////
  // GET UNIFORM LOCATIONS
  /////////////////////////

  var sceneUniformsLocation = gl.getUniformBlockIndex(boxProgram, "SceneUniforms");
  gl.uniformBlockBinding(boxProgram, sceneUniformsLocation, 0);

  var modelMatrixLocation = gl.getUniformLocation(boxProgram, "uModel");
  var texLocation = gl.getUniformLocation(boxProgram, "uTexture");

  var dofUniformsLocation = gl.getUniformBlockIndex(blurProgram, "DOFUniforms");
  gl.uniformBlockBinding(blurProgram, dofUniformsLocation, 1);

  var texelOffsetLocation = gl.getUniformLocation(blurProgram, "uTexelOffset");

  var textureLocation = gl.getUniformLocation(blurProgram, "uColor");
  var depthLocation = gl.getUniformLocation(blurProgram, "uDepth");

  ////////////////////////////////
  //  SET UP FRAMEBUFFERS
  ////////////////////////////////

  var boxBuffer = gl.createFramebuffer();
  var hblurBuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, boxBuffer);
  gl.activeTexture(gl.TEXTURE0);

  var colorTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTarget, 0);

  var depthTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH24_STENCIL8, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.FLOAT, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);

  // gl.drawBuffers([
  //   gl.COLOR_ATTACHMENT0
  // ])

  gl.bindFramebuffer(gl.FRAMEBUFFER, hblurBuffer);

  var hblurTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, hblurTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hblurTarget, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);


  /////////////////////
  // SET UP GEOMETRY
  /////////////////////

  var box = utils.createBox({ dimensions: [1.0, 1.0, 1.0] });
  var numVertices = box.position.length / 3;

  var boxArray = gl.createVertexArray();
  gl.bindVertexArray(boxArray);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, box.position, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  var uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, box.texcoord, gl.STATIC_DRAW);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(1);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, box.normal, gl.STATIC_DRAW);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(2);

  // Columns of matrix as separate attributes for instancing
  var matrixBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelMatrixData, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 64, 0);
  gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 64, 16);
  gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 64, 32);
  gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 64, 48);

  gl.vertexAttribDivisor(3, 1);
  gl.vertexAttribDivisor(4, 1);
  gl.vertexAttribDivisor(5, 1);
  gl.vertexAttribDivisor(6, 1);

  gl.enableVertexAttribArray(3);
  gl.enableVertexAttribArray(4);
  gl.enableVertexAttribArray(5);
  gl.enableVertexAttribArray(6);

  var quadArray = gl.createVertexArray();
  gl.bindVertexArray(quadArray);

  var quadPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, 1,
    -1, -1,
    1, -1,
    -1, 1,
    1, -1,
    1, 1,
  ]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);


  //////////////////////
  // SET UP UNIFORMS
  //////////////////////

  var projMatrix = mat4.identity();
  mat4.perspective(Math.PI / 2, canvas.width / canvas.height, NEAR, FAR, projMatrix);
  // mat4.perspective(30, 1, 0.1, 100)

  var viewMatrix = mat4.identity();
  var eyePosition = vec3.create(1, 1.5, 1);
  mat4.lookAt(eyePosition, vec3.create(0, 0, 0), vec3.create(0, 1, 0), viewMatrix);
  mat4.inverse(viewMatrix, viewMatrix)

  var viewProjMatrix = mat4.identity();
  mat4.multiply(projMatrix, viewMatrix, viewProjMatrix);

  var lightPosition = vec3.create(1, 1, 0.5);
  var hTexelOffset = vec2.fromValues(1.0, 0.0);
  var vTexelOffset = vec2.fromValues(0.0, 1.0);

  var sceneUniformData = new Float32Array(24);
  sceneUniformData.set(viewProjMatrix);
  sceneUniformData.set(eyePosition, 16);
  sceneUniformData.set(lightPosition, 20);

  var sceneUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, sceneUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, sceneUniformData, gl.STATIC_DRAW);

  var dofUniformData = new Float32Array(8);
  dofUniformData[0] = FOCUS_DISTANCE;
  dofUniformData[1] = BLUR_COEFFICIENT;
  dofUniformData[2] = PPM;
  dofUniformData.set(DEPTH_RANGE, 4);
  dofUniformData.set(resolution, 6);

  var dofUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, dofUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, dofUniformData, gl.STATIC_DRAW);

  var image = new Image();
  window.spector.startCapture(canvas, 1000)

  image.onload = function () {

    ///////////////////////
    // BIND TEXTURES
    ///////////////////////

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    var levels = levels = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, colorTarget);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, depthTarget);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, hblurTarget);

    gl.useProgram(boxProgram);
    gl.uniform1i(texLocation, 0);

    gl.useProgram(blurProgram);
    gl.uniform1i(depthLocation, 2);

    function draw() {

      ////////////////////
      // DRAW BOXES
      ////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, boxBuffer);
      gl.useProgram(boxProgram);
      gl.bindVertexArray(boxArray);

      for (var i = 0, len = boxes.length; i < len; ++i) {
        boxes[i].rotate[0] += 0.01;
        boxes[i].rotate[1] += 0.02;

        utils.xformMatrix(boxes[i].modelMatrix, boxes[i].translate, boxes[i].rotate, boxes[i].scale);

        modelMatrixData.set(boxes[i].modelMatrix, i * 16);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, modelMatrixData);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, numVertices, boxes.length);
      debugRT.readFromContext('box')


      ////////////////////
      // HORIZONTAL BLUR
      ////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, hblurBuffer);
      gl.useProgram(blurProgram);
      gl.bindVertexArray(quadArray);
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, dofUniformBuffer);

      gl.uniform1i(textureLocation, 1);
      gl.uniform2fv(texelOffsetLocation, hTexelOffset);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      debugRB.readFromContext('h_blur')

      ////////////////////
      // VERTICAL BLUR
      ////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindVertexArray(quadArray);
      gl.uniform1i(textureLocation, 3);
      gl.uniform2fv(texelOffsetLocation, vTexelOffset);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      debugRM.readFromContext('v_blur')

      // requestAnimationFrame(draw);
    }
    draw()

    // requestAnimationFrame(draw);

  }

  image.src = "resources/khronos_webgl.png";

}

export default main
