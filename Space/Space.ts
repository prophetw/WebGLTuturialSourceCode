import * as twgl from 'twgl.js'
import FS from './FS.frag'
import ViewSpaceVS from './ViewSpaceFS.vert'
import WorldSpaceVS from './WorldSpaceFS.vert'
import VS from './VS.vert'

function Space() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement

  const gl = canvas.getContext('webgl2')

  if (gl === null) {
    console.error(' gl is null ');
    return
  }

  // @ts-ignore
  const pInfo = twgl.createProgramInfo(gl, [VS, FS])
  const worldpInfo = twgl.createProgramInfo(gl, [WorldSpaceVS, FS])
  const viewpInfo = twgl.createProgramInfo(gl, [ViewSpaceVS, FS])
  const bufferInfo = twgl.primitives.createPlaneBufferInfo(gl)
  const vertics = twgl.primitives.createPlaneVertices()
  console.log(vertics);
  console.log(pInfo, bufferInfo);
  console.log('w', worldpInfo);
  console.log('view', viewpInfo);
  const modelMat4 = twgl.m4.identity()
  console.log(modelMat4);
  const viewMat4 = twgl.m4.lookAt(twgl.v3.create(0, 0, 0), twgl.v3.create(1, 1, 1), twgl.v3.create(0, 1, 0))
  console.log(viewMat4);
  twgl.m4.inverse(viewMat4, viewMat4)
  const projMat4 = twgl.m4.perspective(60, 1, 0.1, 1000)
  let mvpMat4 = twgl.m4.multiply(viewMat4, modelMat4);
  mvpMat4 = twgl.m4.multiply(projMat4, mvpMat4);
  console.log(' mvp ', mvpMat4);
  const unif = {
    u_ModelMatrix: modelMat4,
    u_ViewMatrix: viewMat4,
    u_ProjMatrix: projMat4,
    u_MvpMatrix: mvpMat4
  }
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST)
  const draw = () => {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(pInfo.program)
    twgl.setUniforms(pInfo, unif)
    twgl.setBuffersAndAttributes(gl, pInfo, bufferInfo)
    twgl.drawBufferInfo(gl, bufferInfo)
  }
  draw()

}

export default Space
