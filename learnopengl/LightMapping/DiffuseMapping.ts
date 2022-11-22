import FSHADER_SOURCE from './cube.frag'
import VSHADER_SOURCE from './cube.vert'

import LightSourceFS from './lightSource.frag'
import LightSourceVS from './lightSource.vert'


// material params  http://devernay.free.fr/cours/opengl/materials.html

enum AngelType {
  'X','Y','Z'
}
type Angle = number
type ColorRGB = [number, number, number]
type TranslateXYZ = [number, number, number]
type VertexOptions = [...TranslateXYZ, Angle, AngelType, ...ColorRGB]

// cube transform  [x,y,z,angle,angelType]
// const lightColor: ColorRGB = [Math.sin(Date.now()*2.0), Math.sin(Date.now()*0.7), Math.sin(Date.now()*1.3)]
const lightColor: ColorRGB = [1.0, 1.0,1.0]

const lightDiffuse: ColorRGB = [lightColor[0]*0.5,lightColor[1]*0.5,lightColor[2]*0.5]
const lightAmbient: ColorRGB = [lightDiffuse[0]*0.2,lightDiffuse[1]*0.2,lightDiffuse[2]*0.2]
const lightPosi: TranslateXYZ = [-1.2, -1.0, -20.0]
const cubePosition: TranslateXYZ = [0.0,0.0,-0.0]
const cubeColor: ColorRGB = [1.0, 0.5, 1.0]

/**
 *
struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};
struct Light {
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};
 */

// green plastic
const material: {
  // ambient: [number, number, number]
  diffuse: [number, number, number]
  specular: [number, number, number]
  shininess: number
} = {
  // ambient: [0.19225,0.19225,0.19225],
  diffuse: [0.50754 ,0.50754, 0.50754],
  specular: [0.508273, 0.508273 ,0.508273],
  shininess: 0.4
}
// const material: {
//   ambient: [number, number, number]
//   diffuse: [number, number, number]
//   specular: [number, number, number]
//   shininess: number
// } = {
// }
const lightSource: {
  ambient: [number, number, number]
  diffuse: [number, number, number]
  specular: [number, number, number]
  position: [number, number, number]
} = {
  ambient: [...lightAmbient],
  diffuse: [...lightDiffuse],
  specular: [1.0,1.0,1.0],
  position: lightPosi
}



const cubePosi: VertexOptions[] = [
  [ ...cubePosition, 0, AngelType.X, ...cubeColor],
  [...lightPosi, 0, AngelType.X, ...lightColor], // this is the light source
]
const defaultCameraPosition = {
  x: 0.8,
  y: -1.0,
  z: 5
}

// perspective options
const perspectiveOptions = {
  fov: 45,
  aspect: 1,
  near: 0.1,
  far: 100
}


let program1: WebGLProgram
let program2: WebGLProgram

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl') as HTMLCanvasElement;

  // Get the rendering context for WebGL
  var gl = window.getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders

  program1 = createProgram(gl, VSHADER_SOURCE, FSHADER_SOURCE);
  if (!program1) {
    console.log('Failed to create program');
    return false;
  }
  gl.useProgram(program1)
  gl.program = program1


  program2 = createProgram(gl, LightSourceVS, LightSourceFS);
  if (!program2) {
    console.log('Failed to create program');
    return false;
  }

  // if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  //   console.log('Failed to intialize shaders.');
  //   return;
  // }

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set texture

  // boxWood and smileface
  const imagesSrcAry = ['./resources/container2.png']

  let count = 0
  // window.spector.startCapture(canvas, 150)
  imagesSrcAry.map((src, index)=>{
    const initResult = initTextures(gl, index, 'material.diffuse',  src, ()=>{
      count +=1
      if(count === imagesSrcAry.length){
        startDraw(gl, 36)
      }
    })
    return initResult
  })



  gl.clearColor(0.1, 0.1, 0.15, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // scroll event   => change camera z
  canvas.addEventListener('wheel', (e)=>{
    const {deltaY} = e
    const step = 1
    if(deltaY>0){
      // zoom out
      // defaultCameraPosition.z += 0.1
      const newFov = perspectiveOptions.fov + step
      perspectiveOptions.fov = Math.min(45, newFov)
      updateAll(gl, cubePosi, defaultCameraPosition, perspectiveOptions)
    }else{
      // zoom in
      // defaultCameraPosition.z -= 0.1
      const newFov = perspectiveOptions.fov-step
      perspectiveOptions.fov = Math.max(1, newFov)
      updateAll(gl, cubePosi, defaultCameraPosition, perspectiveOptions)
    }
  })
  // arrow left right up down
  document.addEventListener('keyup', (e: KeyboardEvent)=>{
    const {key} = e
    switch(key){
      case 'ArrowLeft': defaultCameraPosition.x -= 0.1; updateAll(gl, cubePosi, defaultCameraPosition, perspectiveOptions); break;
      case 'ArrowRight': defaultCameraPosition.x += 0.1; updateAll(gl, cubePosi, defaultCameraPosition, perspectiveOptions); break;
      case 'ArrowUp': defaultCameraPosition.y += 0.1; updateAll(gl, cubePosi, defaultCameraPosition, perspectiveOptions); break;
      case 'ArrowDown': defaultCameraPosition.y -= 0.1; updateAll(gl, cubePosi, defaultCameraPosition, perspectiveOptions); break;
      default: break;
    }
  })

  // if (!initTextures(gl, n, sr)) {
  //   console.log('Failed to intialize the texture.');
  //   return;
  // }
  injectUI(gl)
  resetCameraPosition(gl, cubePosi)

}


function resetCameraPosition(gl: WebGLRenderingContext, cubePosi: VertexOptions[]){
  defaultCameraPosition.x = 0.8
  defaultCameraPosition.y = -1.0
  defaultCameraPosition.z = 5
  perspectiveOptions.fov = 45
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
  for(let i=0; i<cubePosi.length; i++){
    if(i===0){
      gl.useProgram(program1)
      gl.program = program1
    }else{
      gl.useProgram(program2)
      gl.program = program2
    }
    updateMVPMatrix(gl, cubePosi[i], defaultCameraPosition, undefined)
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}
function updateAll(gl: WebGLRenderingContext,
  cubePosi: VertexOptions[],
  cameraPosition: {x: number,y: number,z: number}, perspectiveOptions: {
  fov: number;
  aspect: number;
  near: number;
  far: number;
}){
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT)
  for(let i=0; i<cubePosi.length; i++){
    if(i===0){
      gl.useProgram(program1)
      gl.program = program1
    }else{
      gl.useProgram(program2)
      gl.program = program2
    }
    updateMVPMatrix(gl, cubePosi[i], cameraPosition, perspectiveOptions)
    gl.drawArrays(gl.TRIANGLES, 0, 36);
  }
}

function injectUI(gl: WebGLRenderingContext){
  const div = document.createElement('div')
  const html = `
    <button id="resetCamera">resetCamera</button>
  `
  div.innerHTML = html
  document.body.appendChild(div)
  document.getElementById('resetCamera')?.addEventListener('click', ()=>{
    resetCameraPosition(gl, cubePosi)
  })
}


function initVertexBuffers(gl: WebGLRenderingContext) {
  var verticesTexCoords = new Float32Array([
   // positions          // normals           // texture coords
   -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,  0.0,  0.0,
   0.5, -0.5, -0.5,  0.0,  0.0, -1.0,  1.0,  0.0,
   0.5,  0.5, -0.5,  0.0,  0.0, -1.0,  1.0,  1.0,
   0.5,  0.5, -0.5,  0.0,  0.0, -1.0,  1.0,  1.0,
  -0.5,  0.5, -0.5,  0.0,  0.0, -1.0,  0.0,  1.0,
  -0.5, -0.5, -0.5,  0.0,  0.0, -1.0,  0.0,  0.0,

  -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  0.0,  0.0,
   0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  1.0,  0.0,
   0.5,  0.5,  0.5,  0.0,  0.0,  1.0,  1.0,  1.0,
   0.5,  0.5,  0.5,  0.0,  0.0,  1.0,  1.0,  1.0,
  -0.5,  0.5,  0.5,  0.0,  0.0,  1.0,  0.0,  1.0,
  -0.5, -0.5,  0.5,  0.0,  0.0,  1.0,  0.0,  0.0,

  -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,  1.0,  0.0,
  -0.5,  0.5, -0.5, -1.0,  0.0,  0.0,  1.0,  1.0,
  -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,  0.0,  1.0,
  -0.5, -0.5, -0.5, -1.0,  0.0,  0.0,  0.0,  1.0,
  -0.5, -0.5,  0.5, -1.0,  0.0,  0.0,  0.0,  0.0,
  -0.5,  0.5,  0.5, -1.0,  0.0,  0.0,  1.0,  0.0,

   0.5,  0.5,  0.5,  1.0,  0.0,  0.0,  1.0,  0.0,
   0.5,  0.5, -0.5,  1.0,  0.0,  0.0,  1.0,  1.0,
   0.5, -0.5, -0.5,  1.0,  0.0,  0.0,  0.0,  1.0,
   0.5, -0.5, -0.5,  1.0,  0.0,  0.0,  0.0,  1.0,
   0.5, -0.5,  0.5,  1.0,  0.0,  0.0,  0.0,  0.0,
   0.5,  0.5,  0.5,  1.0,  0.0,  0.0,  1.0,  0.0,

  -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,  0.0,  1.0,
   0.5, -0.5, -0.5,  0.0, -1.0,  0.0,  1.0,  1.0,
   0.5, -0.5,  0.5,  0.0, -1.0,  0.0,  1.0,  0.0,
   0.5, -0.5,  0.5,  0.0, -1.0,  0.0,  1.0,  0.0,
  -0.5, -0.5,  0.5,  0.0, -1.0,  0.0,  0.0,  0.0,
  -0.5, -0.5, -0.5,  0.0, -1.0,  0.0,  0.0,  1.0,

  -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,  0.0,  1.0,
   0.5,  0.5, -0.5,  0.0,  1.0,  0.0,  1.0,  1.0,
   0.5,  0.5,  0.5,  0.0,  1.0,  0.0,  1.0,  0.0,
   0.5,  0.5,  0.5,  0.0,  1.0,  0.0,  1.0,  0.0,
  -0.5,  0.5,  0.5,  0.0,  1.0,  0.0,  0.0,  0.0,
  -0.5,  0.5, -0.5,  0.0,  1.0,  0.0,  0.0,  1.0
  ]);
  var n = 36; // The number of vertices

  // Create the buffer object
  var vertexTexCoordBuffer = gl.createBuffer();
  if (!vertexTexCoordBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // Bind the buffer object to target
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexTexCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesTexCoords, gl.STATIC_DRAW);

  var FSIZE = verticesTexCoords.BYTES_PER_ELEMENT;
  //Get the storage location of a_Position, assign and enable buffer
  var a_Position = gl.getAttribLocation(gl.program, 'aPos');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of aPos');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 8, 0);
  gl.enableVertexAttribArray(a_Position);  // Enable the assignment of the buffer object

  if(gl.program === program1){
    var a_Normal = gl.getAttribLocation(gl.program, 'aNormal');
    if (a_Normal < 0) {
      console.log('Failed to get the storage location of aNormal');
      return -1;
    }
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
    gl.enableVertexAttribArray(a_Normal);  // Enable the assignment of the buffer object

    // Get the storage location of a_TexCoord
    var a_TexCoord = gl.getAttribLocation(gl.program, 'aTexCoords');
    if (a_TexCoord < 0) {
      console.log('Failed to get the storage location of aTexCoords');
      return -1;
    }
    // Assign the buffer object to a_TexCoord variable
    gl.vertexAttribPointer(a_TexCoord, 2, gl.FLOAT, false, FSIZE * 8, FSIZE * 6);
    gl.enableVertexAttribArray(a_TexCoord);
  }


  // gl.enableVertexAttribArray(a_LightColor);
  // Get the storage location of a_Color
  // var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  // if (a_Color < 0) {
  //   console.log('Failed to get the storage location of a_TexCoord');
  //   return -1;
  // }
  // // Assign the buffer object to a_Color variable
  // gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 8, FSIZE * 3);
  // gl.enableVertexAttribArray(a_Color);  // Enable the assignment of the buffer object

  return n;
}

function startDraw(gl: WebGLRenderingContext, n: number){
  console.log(' draw ');
  gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);   // Clear <canvas>
  gl.drawArrays(gl.TRIANGLES, 0, n); // Draw the rectangle
}


function updateMVPMatrix(gl: WebGLRenderingContext,
  translate: VertexOptions,
  cameraPosition={
    x: 0,
    y: 0,
    z: 5
  },
  perspectiveOptions = {
    fov: 45,
    aspect: 1,
    near: 0.1,
    far: 100
  }
  ){

  var modelMatrix = new window.Matrix4(); // Model matrix
  var viewMatrix = new window.Matrix4();  // View matrix
  var projMatrix = new window.Matrix4();  // Projection matrix
  // Calculate the model, view and projection matrices
  const [x, y, z, angle, angleType, r, g, b ] = translate
  switch(angleType){
    case AngelType.X: modelMatrix.rotate(angle, 1, 0, 0); break;
    case AngelType.Y: modelMatrix.rotate(angle, 0, 1, 0); break;
    case AngelType.Z: modelMatrix.rotate(angle, 0, 0, 1); break;
    default: break;
  }
  modelMatrix.translate(x, y, z);
  console.log('cameraPosition', cameraPosition);
  console.log('pers', perspectiveOptions);
  viewMatrix.setLookAt(cameraPosition.x, cameraPosition.y, cameraPosition.z, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(perspectiveOptions.fov, perspectiveOptions.aspect, perspectiveOptions.near, perspectiveOptions.far);
  // Calculate the model view projection matrix
  // mvpMatrix.set(projMatrix).multiply(viewMatrix).multiply(modelMatrix);

  var u_model = gl.getUniformLocation(gl.program, 'model');
  if (!u_model) {
    console.log('Failed to get the storage location of u_MvpMatrix4', u_model);
    return -1;
  }
  gl.uniformMatrix4fv(u_model, false, modelMatrix.elements)




  var u_view = gl.getUniformLocation(gl.program, 'view');
  if (!u_view) {
    console.log('Failed to get the storage location of u_view', u_view);
    return -1;
  }
  gl.uniformMatrix4fv(u_view, false, viewMatrix.elements)

  var u_projection = gl.getUniformLocation(gl.program, 'projection');
  if (!u_projection) {
    console.log('Failed to get the storage location of u_projection', u_projection);
    return -1;
  }
  gl.uniformMatrix4fv(u_projection, false, projMatrix.elements)

  if(gl.program === program1){
/**
 *
 struct Material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
};
uniform Material material;
 */

    var u_model = gl.getUniformLocation(gl.program, 'transposeInversModel');
    if (!u_model) {
      console.log('Failed to get the storage location of u_MvpMatrix4', u_model);
      return -1;
    }
    const newMat = new Matrix4(modelMatrix)
    newMat.invert()
    newMat.transpose()
    gl.uniformMatrix4fv(u_model, false, newMat.elements)


    // var materialambient = gl.getUniformLocation(gl.program, 'material.ambient');
    // if (!materialambient) {
    //   console.log('Failed to get the storage location of materialambient');
    //   return -1;
    // }
    // gl.uniform3f(materialambient, ...material.ambient)

    var materialspecular = gl.getUniformLocation(gl.program, 'material.specular');
    if (!materialspecular) {
      console.log('Failed to get the storage location of materialspecular');
      return -1;
    }
    gl.uniform3f(materialspecular, ...material.specular)

    var materialshininess = gl.getUniformLocation(gl.program, 'material.shininess');
    if (!materialshininess) {
      console.log('Failed to get the storage location of materialshininess');
      return -1;
    }
    gl.uniform1f(materialshininess, material.shininess)

    var lightambient = gl.getUniformLocation(gl.program, 'light.ambient');
    if (!lightambient) {
      console.log('Failed to get the storage location of lightambient');
      return -1;
    }
    gl.uniform3f(lightambient, ...lightSource.ambient)

    var lightdiffuse = gl.getUniformLocation(gl.program, 'light.diffuse');
    if (!lightdiffuse) {
      console.log('Failed to get the storage location of lightdiffuse');
      return -1;
    }
    gl.uniform3f(lightdiffuse, ...lightSource.diffuse)

    var lightspecular = gl.getUniformLocation(gl.program, 'light.specular');
    if (!lightspecular) {
      console.log('Failed to get the storage location of lightspecular');
      return -1;
    }
    gl.uniform3f(lightspecular, ...lightSource.specular)

    var lightposition = gl.getUniformLocation(gl.program, 'light.position');
    if (!lightposition) {
      console.log('Failed to get the storage location of lightposition');
      return -1;
    }
    gl.uniform3f(lightposition, ...lightSource.position)

    var u_viewPos = gl.getUniformLocation(gl.program, 'u_viewPos');
    if (!u_viewPos) {
      console.log('Failed to get the storage location of u_viewPos');
      return -1;
    }
    gl.uniform3f(u_viewPos, cameraPosition.x, cameraPosition.y, cameraPosition.z)

  }
  //Get the storage location of a_Position, assign and enable buffer
}

function initTextures(
  gl: WebGLRenderingContext,
  textIndex: number,
  sampleNameInShader: string,
  src: string,
  loadEndCallback = ()=>{
  //
}) {
  var texture = gl.createTexture();   // Create a texture object
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }
  // Get the storage location of u_Sampler
  var u_Sampler = gl.getUniformLocation(gl.program, sampleNameInShader);
  console.log('u_Sampler', u_Sampler);
  if (!u_Sampler) {
    console.log('Failed to get the storage location of u_Sampler: ' + sampleNameInShader);
    return false;
  }
  var image = new Image();  // Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function () { loadTexture(gl, textIndex, texture, u_Sampler, image, loadEndCallback); };
  // Tell the browser to load an image
  image.src = src;

  return true;
}
function loadTexture(
  gl: WebGLRenderingContext,
  textIndex: number, texture: WebGLTexture | null,
  u_Sampler: WebGLUniformLocation | null ,
  image: HTMLImageElement,
  loadEndCallback=()=>{
  //
}) {
  console.log(' image ', image, u_Sampler);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
  // Enable texture unit0
  gl.activeTexture(gl.TEXTURE0 + textIndex);
  // Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);
  /** second texture
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, texture1);
   * */

//
//  // set the texture wrapping parameters
//  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // note that we set the container wrapping method to gl.CLAMP_TO_EDGE
//  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//  // set texture filtering parameters
//  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); // set texture filtering to nearest neighbor to clearly see the texels/pixels
//  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

// 图片纹理的宽高尺寸必须是 2的幂  不是的话必须用下面的设置
// 否则的话 返回的是纯黑图片纹理 并且多级纹理 不支持 非2的幂

// gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
// Prevents s-coordinate wrapping (repeating).
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
// Prevents t-coordinate wrapping (repeating).
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  // Set the texture parameters
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // // s t direction  repeat
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  // Set the texture image

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 500, 500, 0, gl.RGBA, gl.UNSIGNED_BYTE, );
  // gl.generateMipmap(gl.TEXTURE_2D);
  // Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler, textIndex);
  console.log(gl.getError());
  console.log(' cool ');
  loadEndCallback()
}


export default main
