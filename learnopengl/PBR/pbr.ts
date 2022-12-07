import BackgroundVS from './background.vert'
import BackgroundFS from './background.frag'
import PBRFS from './pbr.frag'
import PBRVS from './pbr.vert'
import CubeVS from './cube.vert'
import ECubeFS from './equirectangular_to_cubemap.frag'
import IrradConvolutionFS from './irradiance_convolution.frag'
import * as twgl from 'twgl.js'

function main (){
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  const gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
  if(gl === null){
    console.log(' error ');
    return
  }

  const pbrProgramInfo = twgl.createProgramInfo(gl, [PBRVS, PBRFS])
  const pbrProgram = pbrProgramInfo.program
  const eqToCubeProgramInfo = twgl.createProgramInfo(gl, [CubeVS, ECubeFS])
  const eqToCubeProgram = eqToCubeProgramInfo.program
  const irradianceProgramInfo = twgl.createProgramInfo(gl, [CubeVS, IrradConvolutionFS])
  const irradianceProgram = irradianceProgramInfo.program
  const bgProgramInfo = twgl.createProgramInfo(gl, [BackgroundVS, BackgroundFS])
  const bgProgram = bgProgramInfo.program

  console.log(' program info ------ ');
  console.log(
    pbrProgramInfo, eqToCubeProgramInfo, irradianceProgramInfo, bgProgramInfo
  );


}

export default main;
