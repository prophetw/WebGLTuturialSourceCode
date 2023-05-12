import * as twgl from 'twgl.js';
import AutomaticUniforms from './AutomaticUniforms';


type WebGLPrecision = 'highp' | 'mediump' | 'lowp';

function addPrecision(shaderCode: string, precision: WebGLPrecision = 'mediump'){

  if(shaderCode.includes('precision')){
    return shaderCode;
}
  if(precision === 'highp'){
      return `
precision highp float;
${shaderCode}
`
  }
  if(precision === 'lowp'){
    return `
precision lowp float;
${shaderCode}
`
  }
  if(precision === 'mediump'){
    return `
precision mediump float;
${shaderCode}
`
  }

  return `
precision mediump float;
${shaderCode}
`
}

// handle shader source code with some helper functions
// like import other shader source code
// automatic add uniform and attribute declaration
class ShaderSource{

  vertexShader: string;
  fragmentShader: string;
	constructor(vertexShader: string, fragmentShader: string){
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
  }

  addPrecision(){

  }

  public static compileShaderSource(vs: string, fs: string, defines: string[]){
		const definedStr = defines.map(define => `#define ${define}`).join('\n');
    // add defines
    vs = definedStr + vs;
    fs = definedStr + fs;

    // import other shader source code

    // add uniform and attribute declaration
    const globalRegExp = /glb_\w+/g;
    const vsmatches = vs.match(globalRegExp);
    const fsmatches = fs.match(globalRegExp);
    if(vsmatches !== null){
      vsmatches.map(str => {
        // @ts-ignore
        const unifInfo = AutomaticUniforms[str]
        if(unifInfo){
          const unifStr = unifInfo.getDeclaration(str);
          vs = `
${unifStr}
${vs}
`
        }
      })
    }
    if(fsmatches !== null){
      fsmatches.map(str => {
        // @ts-ignore
        const unifInfo = AutomaticUniforms[str]
        if(unifInfo){
          const unifStr = unifInfo.getDeclaration(str);
          fs = `
${unifStr}
${fs}
`
        }
      })
    }

    fs = addPrecision(fs, 'mediump');
    const shaderSource = new ShaderSource(vs, fs);
    console.log(' shader source ----- ', shaderSource);
    return shaderSource;
  }

}

export default ShaderSource
