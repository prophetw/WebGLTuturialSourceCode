import PBRFS from './pbr.frag'
import PBRVS from './pbr.vert'
import * as twgl from 'twgl.js'
import { angleToRads } from '../../../lib/utils'

export function clamp(val: number, min: number, max: number){
  let result = Math.max(val, min)
  result = Math.min(result, max)
  return result
}

function main() {
  const canvas = document.getElementById('webgl') as HTMLCanvasElement;

  const gl = canvas.getContext('webgl2');
  if (gl === null) {
    console.log(' error ');
    return
  }

  gl.enable(gl.DEPTH_TEST)
  gl.clearColor(0.1, 0.1, 0.1, 1.0)

  // init program
  const pbrProgramInfo = twgl.createProgramInfo(gl, [PBRVS, PBRFS])
  const pbrProgram = pbrProgramInfo.program
  // const eqToCubeProgramInfo = twgl.createProgramInfo(gl, [CubeVS, ECubeFS])
  // const eqToCubeProgram = eqToCubeProgramInfo.program
  // const irradianceProgramInfo = twgl.createProgramInfo(gl, [CubeVS, IrradConvolutionFS])
  // const irradianceProgram = irradianceProgramInfo.program
  // const bgProgramInfo = twgl.createProgramInfo(gl, [BackgroundVS, BackgroundFS])
  // const bgProgram = bgProgramInfo.program

  console.log(' program info ------ ');
  console.log(
    pbrProgramInfo,
    // eqToCubeProgramInfo, irradianceProgramInfo, bgProgramInfo
  );

  const perspectiveOptions = {
    fov: Math.PI / 2
  }
  // mvp
  const camPos = twgl.v3.create(0, 0, 15);
  const cameraMat = twgl.m4.lookAt(camPos, [0, 0, 0], [0, 1, 0])
  const view = twgl.m4.inverse(cameraMat)
  const projection = twgl.m4.perspective(perspectiveOptions.fov, 1, 0.1, 100)

  // light info
  const lightPositions = [
    -10, 10, 10,
    10, 10, 10,
    -10, -10, 10,
    10, -10, 10,
  ]
  const lightColors = [
    300, 300, 300,
    300, 300, 300,
    300, 300, 300,
    300, 300, 300,
  ]

  // init
  const sphereBufferInfo = twgl.primitives.createSphereBufferInfo(gl, 1, 100, 100);
  console.log(' sphere buffer info ', sphereBufferInfo);

  // const cube = twgl.primitives.createCubeBufferInfo(gl)
  // console.log(cube);

  // https://enkimute.github.io/hdrpng.js/
  // const hdrloader = new window.HDRImage()
  // console.log(' hdrloader here ', hdrloader);
  // hdrloader.src = './resources/pbr/footprint_court.hdr'
  // hdrloader.onload = ()=>{
  //   // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB9_E5, w, h, 0, gl.RGB, gl.FLOAT, new Float32Array(myHDR.dataRAW.buffer));
  //   console.log(hdrloader);
  // }
  let draw = () => {
    //
  }

  // console.log(hdrloader.dataRAW);

  const drawFn = () => {
    gl.useProgram(pbrProgram)

    twgl.setUniforms(pbrProgramInfo, {
      view,
      projection,
      camPos,
      lightPositions,
      lightColors,
      ao: 1.0,
      albedo: twgl.v3.create(0.5, 0.0, 0.0)
    })

    // draw para
    const nrRows = 7;
    const nrColumns = 7;
    const spacing = 2.5;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    twgl.setBuffersAndAttributes(gl, pbrProgramInfo, sphereBufferInfo)

    // render sphere
    for (let row = 0; row < nrRows; ++row) {
        const metallic = row/nrRows;
        console.log(' --- 金属度 ', metallic);
        twgl.setUniforms(pbrProgramInfo, {
          metallic
        })
      for (let col = 0; col < nrColumns; ++col) {
        const model = twgl.m4.identity()
        twgl.m4.translate(model, twgl.v3.create(
          (col - (nrColumns / 2)) * spacing,
          (row - (nrRows / 2)) * spacing,
          0
        ), model);
        // console.log('  modeMat',model);
        const roughness = clamp(col/nrColumns, 0.05, 1)
        console.log( ' 粗糙度', roughness );
        twgl.setUniforms(pbrProgramInfo, {
          model,
          roughness,
        })
        twgl.drawBufferInfo(gl, sphereBufferInfo)
      }
    }

    // render light
    for (let i = 0; i < lightPositions.length / 3; ++i) {
      const newPos = lightPositions.slice(i * 3, i*3+3);
      let model = twgl.m4.identity()
      model = twgl.m4.translate(model, newPos);
      model = twgl.m4.scale(model, [0.5, 0.5, 0.5]);
      twgl.setUniforms(pbrProgramInfo, {
        model,
      })
      twgl.drawBufferInfo(gl, sphereBufferInfo)
    }
  }
  draw = drawFn
  draw()
}

export default main;
