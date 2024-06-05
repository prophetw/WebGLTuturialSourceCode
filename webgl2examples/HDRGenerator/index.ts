import { CustomBtn } from "../../src/utils/utils";
import { createShader, gEnvMap, prepareEnvMapDrawCall } from "./IBLRendering";
import { mat4 } from 'gl-matrix'

function HDRGenerator() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  const gl = canvas.getContext('webgl2', {
    antialias: true,
    alpha: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    preferLowPowerToHighPerformance: false,
    failIfMajorPerformanceCaveat: false,

  }) as WebGL2RenderingContext;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  // gl.depthMask(false);

  if (!gl.getExtension("EXT_color_buffer_float")) {
    console.error("FLOAT color buffer not available");
    document.body.innerHTML = "This example requires EXT_color_buffer_float which is unavailable on this system."
  }

  // 定义纹理的大小
  const width = 512;
  const height = 512;

  // 创建一个浮点纹理用于存储HDR数据
  const hdrTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // 生成蓝色渐变色HDR数据
  const hdrData = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const t = y / height;
      hdrData[index] = 0.0;  // Red
      hdrData[index + 1] = 0.0;  // Green
      hdrData[index + 2] = t;  // Blue
      hdrData[index + 3] = 1.0;  // Alpha
    }
  }

  // 将数据传递给纹理
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.FLOAT, hdrData);

  // 创建并配置帧缓冲对象（FBO）
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, hdrTexture, 0);

  // 检查FBO状态
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer not complete');
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  // 创建一个简单的WebGL场景进行渲染
  const vertexShaderSource = `
  attribute vec3 aPosition;
  varying vec2 vUV;
  void main() {
    vUV = (aPosition.xy + vec2(1.0)) * 0.5;
    gl_Position = vec4(aPosition, 1.0);
  }
`;

  const fragmentShaderSource = `
  precision highp float;
  uniform sampler2D uHDRTexture;
  varying vec2 vUV;

   vec3 toneMapping(vec3 color) {
    // 使用简单的Reinhard色调映射
    return color / (color + vec3(1.0));
  }

  vec3 gammaCorrection(vec3 color) {
    // 伽马校正，假设伽马值为2.2
    return pow(color, vec3(1.0 / 2.2));
  }

  void main() {
    vec4 hdrColor = texture2D(uHDRTexture, vUV); // 线性空间颜色
    vec3 toneMappedColor = toneMapping(hdrColor.rgb);
    vec3 finalColor = gammaCorrection(toneMappedColor);
    gl_FragColor = vec4(finalColor, 1.0); // 输出到屏幕
    // gl_FragColor = hdrColor;
  }
`;


  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  if (!vertexShader || !fragmentShader) {
    console.error('fragmentShader vertexShader --null');
    return
  }

  const program = gl.createProgram();
  if (program === null) {
    console.error(' programe --null ');
    return
  }
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }

  // 设置顶点数据
  const vertices = new Float32Array([
    -1.0, -1.0, 0.0,
    1.0, -1.0, 0.0,
    -1.0, 1.0, 0.0,
    1.0, 1.0, 0.0
  ]);

  const vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // 获取attribute和uniform位置
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  const uHDRTexture = gl.getUniformLocation(program, 'uHDRTexture');

  gl.useProgram(program);
  gl.enableVertexAttribArray(aPosition);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);

  // 设置纹理
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
  gl.uniform1i(uHDRTexture, 0);



  let envMapTexture: WebGLTexture | null | undefined = null;

  new CustomBtn('gEnvMap', () => {
    if (hdrTexture) {
      envMapTexture = gEnvMap(hdrTexture, gl, 512)
    }
  })

  let isRenderEnvMap = false;
  new CustomBtn('drawEnvMap', () => {
    isRenderEnvMap = !isRenderEnvMap;
  })


  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // 渲染
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    if (isRenderEnvMap) {
      if (hdrTexture) {
        if(!envMapTexture){
          envMapTexture = gEnvMap(hdrTexture, gl, 512)
        }
        if (envMapTexture) {
          console.log(' here --- ');
          const {
          // @ts-ignore
            programInfo,
          // @ts-ignore
            positionBuffer,
          // @ts-ignore
            indices,
          // @ts-ignore
            normalBuffer,
          // @ts-ignore
            indexBuffer } = prepareEnvMapDrawCall(gl, envMapTexture)

          gl.useProgram(programInfo.program);

          // 设置顶点属性
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

          gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
          gl.vertexAttribPointer(programInfo.attribLocations.vertexNormal, 3, gl.FLOAT, false, 0, 0);
          gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

          // 设置矩阵和纹理
          const projectionMatrix = mat4.perspective(mat4.create(), Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);
          const viewMatrix = mat4.lookAt(mat4.create(), [3, 3, 3], [0, 0, 0], [0, 1, 0]);
          const modelMatrix = mat4.create();

          gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, projectionMatrix);
          gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, viewMatrix);
          gl.uniformMatrix4fv(programInfo.uniformLocations.modelMatrix, false, modelMatrix);

          gl.uniform3fv(programInfo.uniformLocations.cameraPosition, [3, 3, 3]);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_CUBE_MAP, envMapTexture);
          gl.uniform1i(programInfo.uniformLocations.envMap, 0);

          // 渲染模型
          gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        }
      }
    }

    requestAnimationFrame(render);
  }

  render();


}

export default HDRGenerator;
