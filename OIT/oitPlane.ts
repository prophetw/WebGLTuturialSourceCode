
import * as twgl from 'twgl.js'
import FS_Accum from './oitAccum.frag'
import VS_Accum from './oitAccum.vert'
import FS_Draw from './oitDraw.frag'
import VS_Quad from './oitQuad.vert'
import * as utils from '../src/utils/utils'

const mat4 = twgl.m4
const vec3 = twgl.v3

function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.BLEND);
  gl.depthMask(false);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    console.error("FLOAT color buffer not available");
    document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
  }

  /////////////////////////
  // OBJECT DESCRIPTIONS
  /////////////////////////

  var NUM_SPHERES = 4;
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
      return [0.0, 0.0, 1.0]
    }
    if(id === 2){
      return [0.0, 1.0, 0.0]
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

  console.log(' spheres ', spheres);

  /////////////////////////
  // ACCUMULATION PROGRAM
  /////////////////////////
  var accumProgram = twgl.createProgramInfo(gl, [VS_Accum, FS_Accum]).program
  /////////////////////
  // DRAW PROGRAM
  /////////////////////
  var drawProgram = twgl.createProgramInfo(gl, [VS_Quad, FS_Draw]).program

  /////////////////////////
  // GET UNIFORM LOCATIONS
  /////////////////////////

  var sceneUniformsLocation = gl.getUniformBlockIndex(accumProgram, "SceneUniforms");
  gl.uniformBlockBinding(accumProgram, sceneUniformsLocation, 0);

  var modelMatrixLocation = gl.getUniformLocation(accumProgram, "uModel");
  var textureLocation = gl.getUniformLocation(accumProgram, "uTexture");

  var accumLocation = gl.getUniformLocation(drawProgram, "uAccumulate");
  var accumAlphaLocation = gl.getUniformLocation(drawProgram, "uAccumulateAlpha");

  ////////////////////////////////
  //  SET UP FRAMEBUFFERS
  ////////////////////////////////

  window.spector.startCapture(canvas, 1000)
  var accumBuffer = gl.createFramebuffer();

  gl.bindFramebuffer(gl.FRAMEBUFFER, accumBuffer);
  gl.activeTexture(gl.TEXTURE0);

  var accumTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, accumTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, accumTarget, 0);

  var accumAlphaTarget = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, accumAlphaTarget);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, accumAlphaTarget, 0);

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
    gl.COLOR_ATTACHMENT1
  ]);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  /////////////////////
  // SET UP GEOMETRY
  /////////////////////

  // var sphere = utils.createSphere({ radius: 0.5 });
  var sphere = twgl.primitives.createPlaneVertices();
  console.log(' geometry ', sphere);
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


  var color = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, color);
  gl.bufferData(gl.ARRAY_BUFFER, colorData, gl.STATIC_DRAW);
  gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(3, 1);
  gl.enableVertexAttribArray(3);

  // Columns of matrix as separate attributes for instancing
  var matrixBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer); // 绑定到 ARRAY_BUFFER 上 准备写入数据
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

  const projMatrix = mat4.perspective(Math.PI / 2, canvas.width / canvas.height, 0.1, 10.0);

  var eyePosition = vec3.create(0, 0.8, 2);
  const cameraMat4 = mat4.lookAt(eyePosition, vec3.create(0, 0, 0), vec3.create(0, 1, 0));

  const viewMatrix = mat4.inverse(cameraMat4)

  const viewProjMatrix  = mat4.multiply(projMatrix, viewMatrix);

  var lightPosition = vec3.create(1, 1, 2);

  var sceneUniformData = new Float32Array(24);
  sceneUniformData.set(viewProjMatrix);
  sceneUniformData.set(eyePosition, 16);
  sceneUniformData.set(lightPosition, 20);

  var sceneUniformBuffer = gl.createBuffer();
  gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, sceneUniformBuffer);
  gl.bufferData(gl.UNIFORM_BUFFER, sceneUniformData, gl.STATIC_DRAW);

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

    // @ts-ignore
    var levels = levels = Math.floor(Math.log2(Math.max(this.width, this.height))) + 1;
    gl.texStorage2D(gl.TEXTURE_2D, levels, gl.RGBA8, image.width, image.height);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, image.width, image.height, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);

    // texture 1 accumTarget
    gl.activeTexture(gl.TEXTURE1);  // 开启 作为 下一阶段的 texture 输入
    gl.bindTexture(gl.TEXTURE_2D, accumTarget); // frameBuffer COLOR_ATTACHMENT0
    /*

        shader  oitAccum.frag  片元对外输出
        layout(location = 0) out vec4 accumColor;
        layout(location = 1) out float accumAlpha;

        ...
        color.rgb *= color.a;
        float w = weight(gl_FragCoord.z, color.a);
        accumColor = vec4(color.rgb * w, color.a);
        accumAlpha = color.a * w;
    */

    // texture 2 accumAlphaTarget
    gl.activeTexture(gl.TEXTURE2);  // 开启 作为 下一阶段的 texture 输入
    gl.bindTexture(gl.TEXTURE_2D, accumAlphaTarget); // frameBuffer COLOR_ATTACHMENT1

    gl.useProgram(accumProgram);
    gl.uniform1i(textureLocation, 0); // apply texture

    gl.useProgram(drawProgram);
    gl.uniform1i(accumLocation, 1); // apply texture
    gl.uniform1i(accumAlphaLocation, 2); // apply texture

    var rotationMatrix = mat4.identity();

    function draw() {

      ////////////////////
      // DRAW BOXES
      ////////////////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, accumBuffer);
      gl.useProgram(accumProgram);
      gl.bindVertexArray(sphereArray); // draw sphere Vertex

      for (var i = 0, len = spheres.length; i < len; ++i) {
        spheres[i].rotate[1] += 0.002;

        utils.xformMatrix(spheres[i].modelMatrix, spheres[i].translate, undefined, spheres[i].scale);
        mat4.rotateY(rotationMatrix, spheres[i].rotate[1], rotationMatrix);
        mat4.multiply(rotationMatrix, spheres[i].modelMatrix, spheres[i].modelMatrix);

        modelMatrixData.set(spheres[i].modelMatrix, i * 16);
      }

      gl.bindBuffer(gl.ARRAY_BUFFER, matrixBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, modelMatrixData);
      gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA)
      gl.clear(gl.COLOR_BUFFER_BIT);
      // draw all spheres[] to frameBuffer
      gl.drawElementsInstanced(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0, spheres.length);


      /////////
      // DRAW
      /////////

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(drawProgram);
      gl.bindVertexArray(quadArray);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // requestAnimationFrame(draw);
    }

    draw()
    // requestAnimationFrame(draw);

  }

  image.src = "./resources/khronos_webgl.png";


}

export default main
