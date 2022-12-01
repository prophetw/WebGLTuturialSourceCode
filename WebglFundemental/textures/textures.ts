import VS from './texVS.vert'
import FS from './texFS.frag'
import * as twgl from 'twgl.js'
import { CustomBtn } from '../../src/utils/utils';

const m4 = twgl.m4


var zDepth = 50;

function main() {
  var canvas = document.getElementById("webgl") as HTMLCanvasElement;

  var gl = canvas.getContext("webgl2", {antialias: false});
  if (!gl) {
    return;
  }

  // Use our boilerplate utils to compile the shaders and link into a program
  var pInfo = twgl.createProgramInfo(gl, [VS, FS]).program
  console.log(pInfo);
  const program = pInfo

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var texcoordAttributeLocation = gl.getAttribLocation(program, "a_texcoord");

  // look up uniform locations
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  // Create a buffer
  var positionBuffer = gl.createBuffer();

  // Create a vertex array object (attribute state)
  var vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Set Geometry.
  setGeometry(gl);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 3;          // 3 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      positionAttributeLocation, size, type, normalize, stride, offset);

  // create the texcoord buffer, make it the current ARRAY_BUFFER
  // and copy in the texcoord values
  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  setTexcoords(gl);

  // Turn on the attribute
  gl.enableVertexAttribArray(texcoordAttributeLocation);

  // Tell the attribute how to get data out of texcoordBuffer (ARRAY_BUFFER)
  var size = 2;          // 2 components per iteration
  var type = gl.FLOAT;   // the data is 32bit floating point values
  var normalize = true;  // convert from 0-255 to 0.0-1.0
  var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next color
  var offset = 0;        // start at the beginning of the buffer
  gl.vertexAttribPointer(
      texcoordAttributeLocation, size, type, normalize, stride, offset);

  // Create a texture with different colored mips
  var mipTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, mipTexture);
  var c = document.createElement("canvas");
  var ctx = c.getContext("2d") as CanvasRenderingContext2D;
  var mips = [
    { size: 64, color: "rgb(128,0,255)", },
    { size: 32, color: "rgb(0,0,255)", },
    { size: 16, color: "rgb(255,0,0)", },
    { size:  8, color: "rgb(255,255,0)", },
    { size:  4, color: "rgb(0,255,0)", },
    { size:  2, color: "rgb(0,255,255)", },
    { size:  1, color: "rgb(255,0,255)", },
  ];
  mips.forEach(function(s, level) {
     var size = s.size;
     c.width = size;
     c.height = size;
     ctx.fillStyle = "rgb(255,255,255)";
     ctx.fillRect(0, 0, size, size);
     ctx.fillStyle = s.color;
     ctx.fillRect(0, 0, size / 2, size / 2);
     ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
     gl && gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
  });


  // Create a texture.
  var texture = gl.createTexture();

  // use texture unit 0
  gl.activeTexture(gl.TEXTURE0 + 0);

  // bind to the TEXTURE_2D bind point of texture unit 0
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));

  // Asynchronously load an image
  var image = new Image();
  image.crossOrigin = ''
  image.src = "https://webgl2fundamentals.org/webgl/resources/mip-low-res-example.png";
  image.addEventListener('load', function() {
    // Now that the image has loaded make copy it to the texture.
    if(gl){
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);
    drawScene();

    }
  });

  function degToRad(d: number) {
    return d * Math.PI / 180;
  }

  var textures = [
    texture,
    mipTexture,
  ];
  var textureIndex = 0;

  new CustomBtn('Click to switch texture', ()=>{
    textureIndex = (textureIndex + 1) % textures.length;
    drawScene();
  })

  // First let's make some variables
  // to hold the translation,
  var fieldOfViewRadians = degToRad(60);

  drawScene();

  // Draw the scene.
  function drawScene() {
    if(gl === null){
      return
    }
    // webglUtils.resizeCanvasToDisplaySize(gl.canvas, window.devicePixelRatio);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // turn on depth testing
    gl.enable(gl.DEPTH_TEST);

    // tell webgl to cull faces
    gl.enable(gl.CULL_FACE);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Compute the matrix
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    var cameraPosition = [0, 0, 2];
    var up = [0, 1, 0];
    var target = [0, 0, 0];

    // Compute the camera's matrix using look at.
    var cameraMatrix = m4.lookAt(cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    var viewMatrix = m4.inverse(cameraMatrix);

    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    var settings = [
      { x: -1, y:  1, zRot: 0, magFilter: gl.NEAREST, minFilter: gl.NEAREST,                 },
      { x:  0, y:  1, zRot: 0, magFilter: gl.LINEAR,  minFilter: gl.LINEAR,                  },
      { x:  1, y:  1, zRot: 0, magFilter: gl.LINEAR,  minFilter: gl.NEAREST_MIPMAP_NEAREST,  },
      { x: -1, y: -1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR_MIPMAP_NEAREST,   },
      { x:  0, y: -1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.NEAREST_MIPMAP_LINEAR,   },
      { x:  1, y: -1, zRot: 1, magFilter: gl.LINEAR,  minFilter: gl.LINEAR_MIPMAP_LINEAR,    },
    ];
    var xSpacing = 1.2;
    var ySpacing = 0.7;
    settings.forEach(function(s) {
      if(gl===null) return
      gl.bindTexture(gl.TEXTURE_2D, textures[textureIndex]);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, s.minFilter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, s.magFilter);

      var matrix = m4.translate(viewProjectionMatrix, twgl.v3.create(s.x * xSpacing, s.y * ySpacing, -zDepth * 0.5));
      matrix = m4.rotateZ(matrix, s.zRot * Math.PI);
      matrix = m4.scale(matrix, twgl.v3.create(1, 1, zDepth));

      // Set the matrix.
      gl.uniformMatrix4fv(matrixLocation, false, matrix);

      // Draw the geometry.
      gl.drawArrays(gl.TRIANGLES, 0, 1 * 6);
    });
  }
}

// Fill the current ARRAY_BUFFER buffer
// with the values that define a plane.
function setGeometry(gl: WebGL2RenderingContext) {
  var positions = new Float32Array([
      -0.5, 0.5, -0.5,
       0.5, 0.5, -0.5,
      -0.5, 0.5,  0.5,
      -0.5, 0.5,  0.5,
       0.5, 0.5, -0.5,
       0.5, 0.5,  0.5,
  ]);

  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

// Fill the current ARRAY_BUFFER buffer
// with texture coordinates for a plane
function setTexcoords(gl: WebGL2RenderingContext) {
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
          0, 0,
          1, 0,
          0, zDepth,
          0, zDepth,
          1, 0,
          1, zDepth,
      ]),
      gl.STATIC_DRAW);
}


export default main;
