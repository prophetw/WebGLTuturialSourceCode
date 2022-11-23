
import * as twgl from 'twgl.js'
import FSPeeling from './peeling.frag'
import VSPeeling from './peeling.vert'
import FSFinal from './final.frag'
import FSBLENDBACK from './blendBack.frag'
import VSDRAW from './draw.vert'
import * as utils from '../../src/utils/utils'

const mat4 = twgl.m4
const vec3 = twgl.v3

function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  const debugFBO = new utils.DebugFrameBuffer(canvas, gl)
  console.log('  --- debgFBO ', debugFBO);

  gl.enable(gl.BLEND);
  gl.depthMask(false);
  gl.disable(gl.CULL_FACE);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    console.error("FLOAT color buffer not available");
    document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
  }

  /////////////////////////
  // OBJECT DESCRIPTIONS
  /////////////////////////

  var NUM_SPHERES = 2;
  var NUM_PER_ROW = 1;
  var RADIUS = 0.6;
  var spheres = new Array(NUM_SPHERES);

  var colorData = new Float32Array(NUM_SPHERES * 4);
  var modelMatrixData = new Float32Array(NUM_SPHERES * 16);

  const getColor = (index:number)=>{
    const id = index%3
    if(id === 0){
      return [1.0, 0.0, 0.0]
    }
    if(id === 1){
      return [0.0, 1.0, 0.0]
    }
    if(id === 2){
      return [0.0, 0.0, 1.0]
    }
    return [1.0, 0.0,0.0]

  }
  for (var i = 0; i < NUM_SPHERES; ++i) {
    var angle = 2 * Math.PI * (i % NUM_PER_ROW) / NUM_PER_ROW;
    var x = Math.sin(angle) * RADIUS;
    var y = Math.floor(i / NUM_PER_ROW) / (NUM_PER_ROW / 4) - 0.75;
    var z = Math.cos(angle) * RADIUS;
    console.log(x);
    spheres[i] = {
      scale: [1,1,1],
      rotate: [0, 0, 0], // Will be used for global rotation
      // translate: [x, y, z],
      translate: [i*0.1,i*0.1,0],
      modelMatrix: mat4.identity()
    };

    const color = getColor(i)
    colorData.set([
      // Math.sqrt(Math.random()),
      // Math.sqrt(Math.random()),
      // Math.sqrt(Math.random()),
      ...color,
      0.5
    ], i * 4);
  }

  ///////////////////////////////
  // DUAL DEPTH PEELING PROGRAM
  //////////////////////////////

  const dualDepthPeelingProgramInfo = twgl.createProgramInfo(gl, [VSPeeling, FSPeeling])
  var dualDepthPeelingProgram = dualDepthPeelingProgramInfo.program
  ////////////////////////////
  // FULL SCREEN QUAD PROGRAMS
  ////////////////////////////
  var finalProgramInf = twgl.createProgramInfo(gl, [VSDRAW, FSFinal])
  const finalProgram = finalProgramInf.program
  var blendBackProgramInfo = twgl.createProgramInfo(gl, [VSDRAW, FSBLENDBACK])
  var blendBackProgram = blendBackProgramInfo.program

  console.log(' --- dualDepthPeelingProgramInfo', dualDepthPeelingProgramInfo);
  console.log(' --- finalProgramInf ', finalProgramInf);
  console.log(' --- blendBackProgramInfo ', blendBackProgramInfo);

  console.log(' =======debugFBO======= ', debugFBO);
  /////////////////////////
  // GET UNIFORM LOCATIONS
  /////////////////////////

  var sceneUniformsLocation = gl.getUniformBlockIndex(dualDepthPeelingProgram, "SceneUniforms");
  gl.uniformBlockBinding(dualDepthPeelingProgram, sceneUniformsLocation, 0);

  var dualDepthPeelingTextureLocation = gl.getUniformLocation(dualDepthPeelingProgram, "uTexture");
  var dualDepthPeelingModelLocation = gl.getUniformLocation(dualDepthPeelingProgram, "uModel");
  var dualDepthPeelingDepthLocation = gl.getUniformLocation(dualDepthPeelingProgram, "uDepth");
  var dualDepthPeelingFrontColorLocation = gl.getUniformLocation(dualDepthPeelingProgram, "uFrontColor");

  var finalFrontColorLocation = gl.getUniformLocation(finalProgram, "uFrontColor");
  var finalBackColorLocation = gl.getUniformLocation(finalProgram, "uBackColor");

  var blendBackColorLocation = gl.getUniformLocation(blendBackProgram, "uBackColor");

  ////////////////////////////////
  //  SET UP FRAMEBUFFERS
  ////////////////////////////////

  const texAry: WebGLTexture[] = []
  // 2 for ping-pong
  // COLOR_ATTACHMENT0 - depth
  // COLOR_ATTACHMENT1 - front color
  // COLOR_ATTACHMENT2 - back color
  const allTextureAry: WebGLTexture[] = []
  var allBuffers = [gl.createFramebuffer(), gl.createFramebuffer()];  // Frame buffer 0 1
  // 2 for ping-pong
  // COLOR_ATTACHMENT0 - front color
  // COLOR_ATTACHMENT1 - back color
  var colorBuffers = [gl.createFramebuffer(), gl.createFramebuffer()]; // Frame buffer 2 3
  var blendBackBuffer = gl.createFramebuffer(); // Frame buffer 4
  blendBackBuffer.__SPECTOR_Metadata = { name: 'blendBackBuffer' }

  for (let i = 0; i < 2; i++) {
    const allBuf = allBuffers[i]
    allBuf.__SPECTOR_Metadata = { name: 'allBuffer' + i }
    gl.bindFramebuffer(gl.FRAMEBUFFER, allBuffers[i]);
    let o = i * 3;

    let depthTarget = gl.createTexture();
    depthTarget && allTextureAry.push(depthTarget)
    depthTarget.__SPECTOR_Metadata = {name: 'depthTexture'+(0+o)}
    gl.activeTexture(gl.TEXTURE0 + o);
    gl.bindTexture(gl.TEXTURE_2D, depthTarget);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.FLOAT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthTarget, 0);

    let frontColorTarget = gl.createTexture();
    frontColorTarget.__SPECTOR_Metadata = {name: 'frontColorTexture'+(1+o)}
    frontColorTarget && allTextureAry.push(frontColorTarget)
    gl.activeTexture(gl.TEXTURE1 + o);
    gl.bindTexture(gl.TEXTURE_2D, frontColorTarget);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, frontColorTarget, 0);

    let backColorTarget = gl.createTexture();
    backColorTarget.__SPECTOR_Metadata = { name: 'backColorTexture' + (2 + o) }
    backColorTarget && allTextureAry.push(backColorTarget)
    gl.activeTexture(gl.TEXTURE2 + o);
    gl.bindTexture(gl.TEXTURE_2D, backColorTarget);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, backColorTarget, 0);

    const colorBuf = colorBuffers[i]
    colorBuf.__SPECTOR_Metadata = { name: 'colorBuffer' + i }
    gl.bindFramebuffer(gl.FRAMEBUFFER, colorBuffers[i]);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, frontColorTarget, 0);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, backColorTarget, 0);
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, blendBackBuffer);

  var blendBackTarget = gl.createTexture();
  blendBackTarget.__SPECTOR_Metadata = { name: 'blendBackTexture' }
  blendBackTarget && allTextureAry.push(blendBackTarget)
  gl.activeTexture(gl.TEXTURE6);
  gl.bindTexture(gl.TEXTURE_2D, blendBackTarget);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, gl.RGBA, gl.HALF_FLOAT, null);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, blendBackTarget, 0);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  /////////////////////
  // SET UP GEOMETRY
  /////////////////////

  var plane = twgl.primitives.createPlaneVertices()
  const sphere = plane
  console.log(' plane ---- ', plane);

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

  var color = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color);
  gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(3, 1);
  gl.enableVertexAttribArray(3);

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

  // Quad for draw pass
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

  var projMatrix = mat4.perspective(Math.PI / 2, canvas.width / canvas.height, 0.1, 10.0);

  var eyePosition = vec3.create(0, 2, 2);
  // var eyePosition = vec3.create(1, 1, 1);
  var cameraMat = mat4.lookAt(eyePosition, vec3.create(0, 0, 0), vec3.create(0, 1, 0));
  const viewMatrix = mat4.inverse(cameraMat)
  console.log(viewMatrix);

  var viewProjMatrix = mat4.multiply(projMatrix, viewMatrix);
  console.log(viewProjMatrix);

  var lightPosition = vec3.create(1, 1, 2);

  var sceneUniformData = new Float32Array(24);
  sceneUniformData.set(viewProjMatrix);
  sceneUniformData.set(eyePosition, 16);
  sceneUniformData.set(lightPosition, 20);

  var sceneUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, sceneUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, sceneUniformData, gl.STATIC_DRAW);

  var image = new Image();

  // window.spector.startCapture(canvas, 1000)
  image.onload = function () {
    console.log('image load succ ');

    ///////////////////////
    // BIND TEXTURES
    ///////////////////////

    var texture = gl.createTexture();
    texture.__SPECTOR_Metadata = { name: "imageTexture " }
    texture && allTextureAry.push(texture)
    gl.activeTexture(gl.TEXTURE9);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);// Flip the image's y-axis
    // @ts-ignore
    var levels = levels = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    // window.spector.startCapture(canvas, 1000)

    gl.useProgram(finalProgram);
    gl.uniform1i(finalBackColorLocation, 6);

    gl.useProgram(dualDepthPeelingProgram);
    gl.uniform1i(dualDepthPeelingTextureLocation, 9);

    var rotationMatrix = mat4.identity();

    var DEPTH_CLEAR_VALUE = -99999.0;
    var MAX_DEPTH = 1.0;
    var MIN_DEPTH = 0.0;

    var NUM_PASS = 4;   // maximum rendered layer number = NUM_PASS * 2
    window.spector.startCapture(canvas, 1000)

    function draw() {

      //////////////////////////////////
      // 1. Initialize min-max depth buffer
      //////////////////////////////////

      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, blendBackBuffer);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // init depth allBuf0  tex0
      gl.bindFramebuffer(gl.FRAMEBUFFER, allBuffers[0]);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.clearColor(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0); // allbuf0 depth 初始化
      gl.clear(gl.COLOR_BUFFER_BIT);

      // init depth  allBuf1  tex3
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, allBuffers[1]); // depth gl.RG32F 只有 RG 通道
      // 未使用 drawBuffers 指定通道 默认就是通道0 ？ allBuffers1 通道0是  depth gl.RG32F
      gl.clearColor(-MIN_DEPTH, MAX_DEPTH, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // init frontColor backColor colorBuf0  tex1 tex2
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorBuffers[0]);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // init frontColor colorBuf1  tex4
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorBuffers[1]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);


      // set depth to allBuf0 start
      //  draw depth for first pass to peel tex0 接下来的绘制会保存图形的深度信息
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, allBuffers[0]);
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      gl.blendEquation(gl.MAX);

      gl.useProgram(dualDepthPeelingProgram); // spector program 0
      gl.uniform1i(dualDepthPeelingDepthLocation, 3);  // allBuf1 tex3 depth  初始化 gl.RG32F (0,1) 绿色
      gl.uniform1i(dualDepthPeelingFrontColorLocation, 4); // colorBuf1 tex4 backColor
      gl.bindVertexArray(sphereArray);

      for (var i = 0, len = spheres.length; i < len; ++i) {
        spheres[i].rotate[1] += 0.002;

        utils.xformMatrix(spheres[i].modelMatrix, spheres[i].translate, undefined, spheres[i].scale);
        mat4.rotationY(spheres[i].rotate[1], rotationMatrix);
        mat4.multiply(rotationMatrix, spheres[i].modelMatrix, spheres[i].modelMatrix);

        modelMatrixData.set(spheres[i].modelMatrix, i * 16);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, modelMatrixData);

      gl.drawElementsInstanced(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0, spheres.length);
      // set depth to allBuf0 end

      ////////////////////////////////////
      // 2. Dual Depth Peeling Ping-Pong
      ////////////////////////////////////
      let readId, writeId;
      let offsetRead, offsetBack;

      for (let pass = 0; pass < NUM_PASS; pass++) {
        readId = pass % 2;
        writeId = 1 - readId;  // ping-pong: 0 or 1

        // NOTE: init 深度值到 depth 通道
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, allBuffers[writeId]);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.clearColor(DEPTH_CLEAR_VALUE, DEPTH_CLEAR_VALUE, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // NOTE: 清空 frontcolor backcolor 通道
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorBuffers[writeId]);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // NOTE: 开启绘制 到 depth frontColor backColor 通道  start
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, allBuffers[writeId]);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2]);
        gl.blendEquation(gl.MAX);

        // update texture uniform
        offsetRead = readId * 3;
        gl.useProgram(dualDepthPeelingProgram); // ddpProgram 从 allBuf depth frontColor 通道 读取texture
        gl.uniform1i(dualDepthPeelingDepthLocation, offsetRead); //offsetRead 3 => allBuf1 depth      0 => allBuf0 depth
        gl.uniform1i(dualDepthPeelingFrontColorLocation, offsetRead + 1); // offsetRead 4 => allBuf1 frontColor    1=> allBuf0 frontColor

        // draw geometry 第一次 writeId = 1   readId=0
        gl.bindVertexArray(sphereArray);
        gl.drawElementsInstanced(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0, spheres.length);
        // debugFBO.drawFramebuffer(allTextureAry[5])
        // return
        //                      偶数次  / 奇数次                  偶数次  / 奇数次
        // NOTE: 开启绘制 out => tex345 / tex012 通道  end   in => tex01 / tex34

        // blend back color separately
        offsetBack = writeId * 3;
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, blendBackBuffer);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        gl.blendEquation(gl.FUNC_ADD);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(blendBackProgram);
        gl.uniform1i(blendBackColorLocation, offsetBack + 2);
        gl.bindVertexArray(quadArray);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }

      //////////////////////////
      // 3. Final
      //////////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(finalProgram);
      gl.uniform1i(finalFrontColorLocation, offsetBack + 1);

      gl.bindVertexArray(quadArray);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // requestAnimationFrame(draw);
    }
    draw()
    // requestAnimationFrame(draw);

  }
  image.src = "./resources/khronos_webgl.png";
}

export default main
