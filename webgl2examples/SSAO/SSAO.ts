import ColorGEOFS from './colorgeo.frag'
import ColorGEOVS from './colorgeo.vert'
import NOSSAOFS from './nossao.frag'
import QuadVS from './quad.vert'
import AoblendFS from './aoblend.frag'
import SSAOFS from './ssao.frag'

import * as utils from '../../src/utils/utils'
import { VisualState } from '../../src/utils/visualState'
import * as twgl from 'twgl.js'
console.log(twgl);
const mat4 = twgl.m4
const vec3 = twgl.v3
// @ts-ignore
vec3.create = vec3.create
const vec2 = {
  fromValues: function(a: number, b: number){
    return [a, b]

  }
}



function main() {

  var ssaoEnabled = true;

  // document.getElementById("ssao-toggle").addEventListener("change", function () {
  //   ssaoEnabled = this.checked;
  // });

  var canvas = document.getElementById("webgl") as HTMLCanvasElement;
  // canvas.width = window.innerWidth;
  // canvas.height = window.innerHeight;

  var gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

  const debugRT = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-top', 3)
  const debugRM = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-mid', 3)
  const debugRB = new VisualState({
    context: gl,
    contextVersion: 2
  }, 'right-bottom', 3)
  // const debugLB = new VisualState({
  //   context: gl,
  //   contextVersion: 2
  // }, 'left-bottom', 100)


  if (!gl) {
    console.error("WebGL 2 not available");
    document.body.innerHTML = "This example requires WebGL 2 which is unavailable on this system."
  }

  if (!gl.getExtension("EXT_color_buffer_float")) {
    console.error("FLOAT color buffer not available");
    document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
  }

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  /////////////////////////
  // SCENE DATA
  /////////////////////////

  var NEAR = 0.1;
  var FAR = 10.0;

  var NUM_SPHERES = 32;
  var NUM_PER_ROW = 8;
  var RADIUS = 0.6;
  var spheres = new Array(NUM_SPHERES);

  var modelMatrixData = new Float32Array(NUM_SPHERES * 16);

  for (var i = 0; i < NUM_SPHERES; ++i) {
    var angle = 2 * Math.PI * (i % NUM_PER_ROW) / NUM_PER_ROW;
    var x = Math.sin(angle) * RADIUS;
    var y = Math.floor(i / NUM_PER_ROW) / (NUM_PER_ROW / 4) - 0.75;
    var z = Math.cos(angle) * RADIUS;
    spheres[i] = {
      scale: [0.8, 0.8, 0.8],
      rotate: [0, 0, 0], // Will be used for global rotation
      translate: [x, y, z],
      modelMatrix: mat4.identity()
    };
  }

  var numNoisePixels = gl.drawingBufferWidth * gl.drawingBufferHeight;
  var noiseTextureData = new Float32Array(numNoisePixels * 2);

  for (var i = 0; i < numNoisePixels; ++i) {
    var index = i * 2;
    noiseTextureData[index] = Math.random() * 2.0 - 1.0;
    noiseTextureData[index + 1] = Math.random() * 2.0 - 1.0;
  }

  var depthRange = vec2.fromValues(NEAR, FAR);

  /////////////////////////
  // COLOR/GEO PROGRAM
  /////////////////////////
  // @ts-ignore
  const colorgeoPinfo = twgl.createProgramInfo(gl, [ColorGEOVS, ColorGEOFS])
  const colorGeoProgram = colorgeoPinfo.program

  // var colorgeoVsSource = document.getElementById("vertex-colorgeo").text.trim();
  // var colorgeoFsSource = document.getElementById("fragment-colorgeo").text.trim();

  // var colorgeoVertexShader = gl.createShader(gl.VERTEX_SHADER);
  // gl.shaderSource(colorgeoVertexShader, colorgeoVsSource);
  // gl.compileShader(colorgeoVertexShader);

  // if (!gl.getShaderParameter(colorgeoVertexShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(colorgeoVertexShader));
  // }

  // var colorgeoFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(colorgeoFragmentShader, colorgeoFsSource);
  // gl.compileShader(colorgeoFragmentShader);

  // if (!gl.getShaderParameter(colorgeoFragmentShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(colorgeoFragmentShader));
  // }

  // var colorGeoProgram = gl.createProgram();
  // gl.attachShader(colorGeoProgram, colorgeoVertexShader);
  // gl.attachShader(colorGeoProgram, colorgeoFragmentShader);
  // gl.linkProgram(colorGeoProgram);

  // if (!gl.getProgramParameter(colorGeoProgram, gl.LINK_STATUS)) {
  //   console.error(gl.getProgramInfoLog(colorGeoProgram));
  // }

  /////////////////////
  // SSAO PROGRAMS
  /////////////////////

  // var quadVsSource = document.getElementById("vertex-quad").text.trim();
  // var ssaoFsSource = document.getElementById("fragment-ssao").text.trim();
  // var aoBlendFsSource = document.getElementById("fragment-aoblend").text.trim();
  // var noSSAOFsSource = document.getElementById("fragment-color").text.trim();

  // var quadVertexShader = gl.createShader(gl.VERTEX_SHADER);
  // gl.shaderSource(quadVertexShader, quadVsSource);
  // gl.compileShader(quadVertexShader);

  // if (!gl.getShaderParameter(quadVertexShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(quadVertexShader));
  // }

  // var ssaoFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(ssaoFragmentShader, ssaoFsSource);
  // gl.compileShader(ssaoFragmentShader);

  // if (!gl.getShaderParameter(ssaoFragmentShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(ssaoFragmentShader));
  // }

  // var aoBlendFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(aoBlendFragmentShader, aoBlendFsSource);
  // gl.compileShader(aoBlendFragmentShader);

  // if (!gl.getShaderParameter(aoBlendFragmentShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(aoBlendFragmentShader));
  // }

  // var noSSAOFragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  // gl.shaderSource(noSSAOFragmentShader, noSSAOFsSource);
  // gl.compileShader(noSSAOFragmentShader);

  // if (!gl.getShaderParameter(noSSAOFragmentShader, gl.COMPILE_STATUS)) {
  //   console.error(gl.getShaderInfoLog(noSSAOFragmentShader));
  // }

  // Calculate occlusion
  // var ssaoProgram = gl.createProgram();

  // @ts-ignore
  const ssaoProgram = twgl.createProgramInfo(gl, [QuadVS, SSAOFS]).program
  // gl.attachShader(ssaoProgram, quadVertexShader);
  // gl.attachShader(ssaoProgram, ssaoFragmentShader);
  // gl.linkProgram(ssaoProgram);

  // if (!gl.getProgramParameter(ssaoProgram, gl.LINK_STATUS)) {
  //   console.error(gl.getProgramInfoLog(ssaoProgram));
  // }

  // Blend color/occlusion
  // var aoBlendProgram = gl.createProgram();
  // @ts-ignore
  const aoBlendProgram = twgl.createProgramInfo(gl, [QuadVS, AoblendFS]).program
  // gl.attachShader(aoBlendProgram, quadVertexShader);
  // gl.attachShader(aoBlendProgram, aoBlendFragmentShader);
  // gl.linkProgram(aoBlendProgram);

  // if (!gl.getProgramParameter(aoBlendProgram, gl.LINK_STATUS)) {
  //   console.error(gl.getProgramInfoLog(aoBlendProgram));
  // }

  // SSAO disabled
  // var noSSAOProgram = gl.createProgram();
  // @ts-ignore
  const noSSAOProgram = twgl.createProgramInfo(gl, [QuadVS, NOSSAOFS]).program
  // gl.attachShader(noSSAOProgram, quadVertexShader);
  // gl.attachShader(noSSAOProgram, noSSAOFragmentShader);
  // gl.linkProgram(noSSAOProgram);

  // if (!gl.getProgramParameter(noSSAOProgram, gl.LINK_STATUS)) {
  //   console.error(gl.getProgramInfoLog(noSSAOProgram));
  // }

  /////////////////////////
  // GET UNIFORM LOCATIONS
  /////////////////////////

  var sceneUniformsLocation = gl.getUniformBlockIndex(colorGeoProgram, "SceneUniforms");
  gl.uniformBlockBinding(colorGeoProgram, sceneUniformsLocation, 0);

  var modelMatrixLocation = gl.getUniformLocation(colorGeoProgram, "uModel");
  var textureLocation = gl.getUniformLocation(colorGeoProgram, "uTexture");

  var ssaoUniformsLocation = gl.getUniformBlockIndex(ssaoProgram, "SSAOUniforms");
  gl.uniformBlockBinding(ssaoProgram, ssaoUniformsLocation, 1);

  var positionBufferLocation = gl.getUniformLocation(ssaoProgram, "uPositionBuffer");
  var normalBufferLocation = gl.getUniformLocation(ssaoProgram, "uNormalBuffer");
  var noiseBufferLocation = gl.getUniformLocation(ssaoProgram, "uNoiseBuffer");

  var colorBufferLocation = gl.getUniformLocation(aoBlendProgram, "uColorBuffer");
  var occlustionBufferLocation = gl.getUniformLocation(aoBlendProgram, "uocclusionFBO");

  var noSSAOColorBufferLocation = gl.getUniformLocation(noSSAOProgram, "uColorBuffer");

  ////////////////////////////////
  //  SET UP FRAMEBUFFERS
  ////////////////////////////////

  var colorGeoFBO = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, colorGeoFBO);
  gl.activeTexture(gl.TEXTURE0);

  var colorTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, colorTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTarget, 0);

  var positionTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, positionTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, positionTarget, 0);

  var normalTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, normalTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, normalTarget, 0);

  var depthTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, depthTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT16, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTarget, 0);

  gl.drawBuffers([
    gl.COLOR_ATTACHMENT0,
    gl.COLOR_ATTACHMENT1,
    gl.COLOR_ATTACHMENT2
  ]);

  var occlusionFBO = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, occlusionFBO);

  var occlusionTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, occlusionTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, occlusionTarget, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  /////////////////////
  // SET UP GEOMETRY
  /////////////////////

  var sphere = utils.createSphere({ radius: 0.5 });
  var numVertices = sphere.position.length / 3;

  var sphereArray = gl.createVertexArray();
  gl.bindVertexArray(sphereArray);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.position, gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  var uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.texcoord, gl.STATIC_DRAW);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(1);

  var normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, sphere.normal, gl.STATIC_DRAW);
  gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(2);

  // Columns of matrix as separate attributes for instancing
  var matrixBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, modelMatrixData, gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 64, 0);
  gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 64, 16);
  gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 64, 32);
  gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 64, 48);

  gl.vertexAttribDivisor(4, 1);
  gl.vertexAttribDivisor(5, 1);
  gl.vertexAttribDivisor(6, 1);
  gl.vertexAttribDivisor(7, 1);

  gl.enableVertexAttribArray(4);
  gl.enableVertexAttribArray(5);
  gl.enableVertexAttribArray(6);
  gl.enableVertexAttribArray(7);

  var indices = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

  // Quad for screen-space passes
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

  var viewMatrix = mat4.identity();
  var eyePosition = vec3.create(0, 0.8, 2);
  mat4.lookAt(eyePosition, vec3.create(0, 0, 0), vec3.create(0, 1, 0), viewMatrix);
  mat4.inverse(viewMatrix, viewMatrix)

  var viewProjMatrix = mat4.identity();
  mat4.multiply(projMatrix, viewMatrix, viewProjMatrix);

  var lightPosition = vec3.create(1, 1, 2);

  var sceneUniformData = new Float32Array(40);
  sceneUniformData.set(viewMatrix);
  sceneUniformData.set(projMatrix, 16);
  sceneUniformData.set(eyePosition, 32);
  sceneUniformData.set(lightPosition, 36);

  var sceneUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, sceneUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, sceneUniformData, gl.STATIC_DRAW);

  var ssaoUniformData = new Float32Array(8);
  ssaoUniformData[0] = 16.0; // sample radius
  ssaoUniformData[1] = 0.04; // bias
  ssaoUniformData.set(vec2.fromValues(1, 1), 2); // attenuation
  ssaoUniformData.set(depthRange, 4);

  var ssaoUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 1, ssaoUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, ssaoUniformData, gl.STATIC_DRAW);

  var image = new Image();

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

    var noiseTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RG, gl.FLOAT, noiseTextureData);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, colorTarget);

    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, positionTarget);

    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, normalTarget);

    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, occlusionTarget);

    gl.useProgram(colorGeoProgram);
    gl.uniform1i(textureLocation, 0);

    gl.useProgram(ssaoProgram);
    gl.uniform1i(positionBufferLocation, 3);
    gl.uniform1i(normalBufferLocation, 4);
    gl.uniform1i(noiseBufferLocation, 1);

    gl.useProgram(aoBlendProgram);
    gl.uniform1i(colorBufferLocation, 2);
    gl.uniform1i(occlustionBufferLocation, 5);

    gl.useProgram(noSSAOProgram);
    gl.uniform1i(noSSAOColorBufferLocation, 2);

    var rotationMatrix = mat4.identity();

    // window.spector.startCapture(canvas, 500)
    function draw() {

      ////////////////////
      // DRAW BOXES
      ////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, colorGeoFBO);
      gl.useProgram(colorGeoProgram);
      gl.bindVertexArray(sphereArray);

      for (var i = 0, len = spheres.length; i < len; ++i) {
        spheres[i].rotate[1] += 0.002;

        utils.xformMatrix(spheres[i].modelMatrix, spheres[i].translate, undefined, spheres[i].scale);
        // mat4.fromYRotation(rotationMatrix, spheres[i].rotate[1]);
        mat4.rotationY(spheres[i].rotate[1], rotationMatrix);
        mat4.multiply(spheres[i].modelMatrix, rotationMatrix, spheres[i].modelMatrix);

        modelMatrixData.set(spheres[i].modelMatrix, i * 16);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, modelMatrixData);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawElementsInstanced(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0, spheres.length);
      debugRT.readFromContext('box')

      gl.bindVertexArray(quadArray);

      if (ssaoEnabled) {
        //////////////////
        // OCCLUSION PASS
        //////////////////

        gl.bindFramebuffer(gl.FRAMEBUFFER, occlusionFBO);
        gl.useProgram(ssaoProgram);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        debugRM.readFromContext('occlusion')

        //////////////////
        // BLEND PASS
        //////////////////

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(aoBlendProgram);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        debugRB.readFromContext('blendOccusion')
      } else {
        ///////////////////////
        // DRAW W/O OCCLUSION
        ///////////////////////

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.useProgram(noSSAOProgram);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // debugLB.readFromContext('nossao')
      }

      requestAnimationFrame(draw);
    }
    draw()

    requestAnimationFrame(draw);

  }
    new utils.CustomBtn('ssaoToggle', ()=>{
      ssaoEnabled = !ssaoEnabled
      // draw()
    })

  image.src = "resources/khronos_webgl.png";

}

export default main
