import { mat4 } from 'gl-matrix';
// import * as twgl from 'twgl.js';

// const mat4 = twgl.m4;

const shaderCache = new Map<string, WebGLShader>();
const shaderProgramCache = new Map<string, WebGLProgram>();


function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  if (shaderCache.has(source)) {
    return shaderCache.get(source);
  }
  const shader = gl.createShader(type);
  if (!shader) {
    console.error('Error creating shader' + type);
    return null;
  }
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  shaderCache.set(source, shader);
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vertexShader: string, fragmentShader: string) {
  const key = vertexShader + fragmentShader;
  if (shaderProgramCache.has(key)) {
    return shaderProgramCache.get(key);
  }
  const program = gl.createProgram();
  if (!program) {
    console.error('Error creating shader program');
    return null;
  }
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexShader);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentShader);
  if (!vs || !fs) {
    console.error('Error creating vertex or fragment shader');
    return null;
  }
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
    return null;
  }
  shaderProgramCache.set(key, program);
  return program;
}


function gEnvMap(hdrTexture: WebGLTexture, gl: WebGL2RenderingContext, size: number = 256) {
  // 创建一个立方体贴图用于环境贴图
  const envMap = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, envMap);
  for (let i = 0; i < 6; i++) {
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F, size, size, 0, gl.RGBA, gl.FLOAT, null);
  }
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const fbo = gl.createFramebuffer();
  const rbo = gl.createRenderbuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, size, size);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rbo);

  const captureViews = [
    mat4.lookAt(mat4.create(), [0, 0, 0], [1, 0, 0], [0, -1, 0]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [-1, 0, 0], [0, -1, 0]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, 1, 0], [0, 0, 1]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, -1, 0], [0, 0, -1]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, 1], [0, -1, 0]),
    mat4.lookAt(mat4.create(), [0, 0, 0], [0, 0, -1], [0, -1, 0])
  ];

  const captureProjection = mat4.perspective(mat4.create(), Math.PI / 2, 1.0, 0.1, 10.0);



  const vsSource = `
  attribute vec3 aPosition;
  varying vec3 vPosition;
  uniform mat4 uProjectionMatrix;
  uniform mat4 uViewMatrix;
  void main() {
    vPosition = aPosition;
    gl_Position = uProjectionMatrix * uViewMatrix * vec4(aPosition, 1.0);
  }
`;

  const fsSource = `
  precision highp float;
  varying vec3 vPosition;
  uniform sampler2D uHDRTexture;
  void main() {
    vec3 envColor = texture2D(uHDRTexture, vPosition.xy * 0.5 + 0.5).rgb;
    gl_FragColor = vec4(envColor, 1.0);
  }
`;

  const shaderProgram = createProgram(gl, vsSource, fsSource)
  if (!shaderProgram) {
    console.error('Error creating shader program');
    return;
  }

  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition')
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
      hdrTexture: gl.getUniformLocation(shaderProgram, 'uHDRTexture')
    }
  };

  const positions = new Float32Array([
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    -1.0, 1.0, -1.0
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 2, 3, 0, // front
    4, 5, 6, 6, 7, 4, // back
    4, 5, 1, 1, 0, 4, // bottom
    7, 6, 2, 2, 3, 7, // top
    4, 7, 3, 3, 0, 4, // left
    5, 6, 2, 2, 1, 5  // right
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  function renderFace(faceIndex: number) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, envMap, 0);

    gl.viewport(0, 0, size, size);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(programInfo.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    gl.uniformMatrix4fv(programInfo.uniformLocations.projectionMatrix, false, captureProjection);
    gl.uniformMatrix4fv(programInfo.uniformLocations.viewMatrix, false, captureViews[faceIndex]);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
    gl.uniform1i(programInfo.uniformLocations.hdrTexture, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  for (let i = 0; i < 6; i++) {
    renderFace(i);
  }

  gl.bindTexture(gl.TEXTURE_CUBE_MAP, envMap);
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  return envMap;
}

const prepareEnvMapDrawCall = (gl: WebGL2RenderingContext, envMap: WebGLTexture) => {
  const canvas = gl.canvas as HTMLCanvasElement;

  const vsSource = `
  attribute vec3 aPosition;
  attribute vec3 aNormal;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform mat4 uModelMatrix;
  uniform mat4 uViewMatrix;
  uniform mat4 uProjectionMatrix;
  void main() {
    vNormal = mat3(uModelMatrix) * aNormal;
    vPosition = vec3(uModelMatrix * vec4(aPosition, 1.0));
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1.0);
  }
`;

  const fsSource = `
  precision highp float;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform samplerCube uEnvMap;
  uniform vec3 uCameraPosition;

  vec3 toneMapping(vec3 color) {
    return color / (color + vec3(1.0));
  }

  vec3 gammaCorrection(vec3 color) {
    return pow(color, vec3(1.0 / 2.2));
  }

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(uCameraPosition - vPosition);
    vec3 reflectDir = reflect(-viewDir, normal);
    vec3 envColor = textureCube(uEnvMap, reflectDir).rgb;

    // 进行色调映射和伽马校正
    envColor = toneMapping(envColor);
    envColor = gammaCorrection(envColor);

    gl_FragColor = vec4(envColor, 1.0);
  }
`;

  const shaderProgram = createProgram(gl, vsSource, fsSource);
  if (!shaderProgram) {
    console.error('Error creating shader program');
    return;
  }
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
      envMap: gl.getUniformLocation(shaderProgram, 'uEnvMap'),
      cameraPosition: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
    },
  };


  // 创建一个简单的立方体模型
  const positions = new Float32Array([
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,  // front
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0,  // back
    -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0,  // top
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,  // bottom
    1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,  // right
    -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0,  // left
  ]);

  const normals = new Float32Array([
    0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,  // front
    0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,  // back
    0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,  // top
    0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,  // bottom
    1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,  // right
    -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,  // left
  ]);

  const indices = new Uint16Array([
    0, 1, 2, 2, 3, 0,  // front
    4, 5, 6, 6, 7, 4,  // back
    8, 9, 10, 10, 11, 8,  // top
    12, 13, 14, 14, 15, 12,  // bottom
    16, 17, 18, 18, 19, 16,  // right
    20, 21, 22, 22, 23, 20,  // left
  ]);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return {
    programInfo,
    positionBuffer,
    normalBuffer,
    indexBuffer,
    indices,
  }
}


export {
  gEnvMap,
  createShader,
  prepareEnvMapDrawCall,
}
