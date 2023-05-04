
import * as twgl from 'twgl.js'
import VS from './shader.vert'
import FS from './shader.frag'
const m4 = twgl.m4
const primitives = twgl.primitives

function main() {

  var canvas = document.getElementById("webgl") as HTMLCanvasElement;

  document.title = 'Multi view'
  canvas.width = 800
  canvas.height = 800
  var gl = canvas.getContext("webgl", {antialias: false});
  if (!gl) {
    return;
  }

  // setup GLSL programs
  // compiles shaders, links program, looks up locations
  const programInfo = twgl.createProgramInfo(gl, [VS, FS]);

  // create buffers and fill with data for a 3D 'F'
  const bufferInfo = primitives.create3DFBufferInfo(gl);

  function degToRad(d: number) {
    return d * Math.PI / 180;
  }

  const settings = {
    rotation: 150,  // in degrees
  };
  window.webglLessonsUI.setupUI(document.querySelector('#ui'), settings, [
    { type: 'slider',   key: 'rotation',   min: 0, max: 360, change: render, precision: 2, step: 0.001, },
  ]);

  const fieldOfViewRadians = degToRad(120);

  function drawScene(projectionMatrix: twgl.m4.Mat4, cameraMatrix: twgl.m4.Mat4, worldMatrix: twgl.m4.Mat4) {
    if(gl === null) return
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Make a view matrix from the camera matrix.
    const viewMatrix = m4.inverse(cameraMatrix);

    let mat = m4.multiply(projectionMatrix, viewMatrix);
    mat = m4.multiply(mat, worldMatrix);

    gl.useProgram(programInfo.program);

    // ------ Draw the F --------

    // Setup all the needed attributes.
    twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);

    // Set the uniforms
    twgl.setUniforms(programInfo, {
      u_matrix: mat,
    });

    twgl.drawBufferInfo(gl, bufferInfo);
  }

  function render() {
    if(gl === null) return

    twgl.resizeCanvasToDisplaySize(canvas);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.SCISSOR_TEST);

    // we're going to split the view in 2
    const effectiveWidth = gl.canvas.clientWidth / 2;
    const aspect = effectiveWidth / gl.canvas.clientHeight;
    const near = 1;
    const far = 2000;

    // Compute a perspective projection matrix
    const perspectiveProjectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, near, far);

    // Compute an orthographic projection matrix
    const halfHeightUnits = 120;
    const orthographicProjectionMatrix = m4.ortho(
        -halfHeightUnits * aspect,  // left
         halfHeightUnits * aspect,  // right
        -halfHeightUnits,           // bottom
         halfHeightUnits,           // top
         -75,                       // near
         2000);                     // far


    // Compute the camera's matrix using look at.
    const cameraPosition = [0, 0, -75];
    const target = [0, 0, 0];
    const up = [0, 1, 0];
    const cameraMatrix = m4.lookAt(cameraPosition, target, up);

    let worldMatrix = m4.rotationY(degToRad(settings.rotation));
    worldMatrix = m4.rotateX(worldMatrix, degToRad(settings.rotation));
    // center the 'F' around its origin
    worldMatrix = m4.translate(worldMatrix, [-35, -75, -5]);

    const {width, height} = gl.canvas;
    const leftWidth = width / 2 | 0;

    // draw on the left with orthographic camera
    gl.viewport(0, 0, leftWidth, height);
    gl.scissor(0, 0, leftWidth, height);
    gl.clearColor(1, 0, 0, 1);  // red

    drawScene(orthographicProjectionMatrix, cameraMatrix, worldMatrix);

    // draw on right with perspective camera
    const rightWidth = width - leftWidth;
    gl.viewport(leftWidth, 0, rightWidth, height);
    gl.scissor(leftWidth, 0, rightWidth, height);
    gl.clearColor(0, 0, 1, 1);  // blue

    drawScene(perspectiveProjectionMatrix, cameraMatrix, worldMatrix);
  }
  render();
}

export default main;
