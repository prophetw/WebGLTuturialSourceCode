import * as twgl from 'twgl.js';
import AutomaticUniforms, {AutomaticUniform, AutomaticUniformsType} from './AutomaticUniforms';


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
  globalUniforms: Map<string, AutomaticUniform>;
	constructor(vertexShader: string, fragmentShader: string, globalUniforms: Map<string, AutomaticUniform>){
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.globalUniforms = globalUniforms;
  }

  addPrecision(){

  }

  public static compileShaderSource(vs: string, fs: string, defines: string[]){
		const definedStr = defines.map(define => `#define ${define}`).join('\n');
    // add defines
    vs = definedStr + vs;
    fs = definedStr + fs;

    // import other shader source code
    // support import util functions

    // add uniform and attribute declaration
    const globalRegExp = /glb_\w+/g;
    const vsmatches = vs.match(globalRegExp);
    const fsmatches = fs.match(globalRegExp);
    const globalUniforms = new Map();
    if(vsmatches !== null){
      const uniq = [...new Set()];
      vsmatches.map((str) => {
        const key = str as keyof AutomaticUniformsType;
        const unifInfo = AutomaticUniforms[key]
        if(unifInfo){
          const unifStr = unifInfo.getDeclaration(key);
          if(uniq.includes(key)){
            return;
          }
          uniq.push(key);
          globalUniforms.set(key, unifInfo);
          vs = `
${unifStr}
${vs}
`
        }
      })
    }
    if(fsmatches !== null){
      const uniq = [...new Set()];
      fsmatches.map(str => {
        const key = str as keyof AutomaticUniformsType;
        const unifInfo = AutomaticUniforms[key]
        if(uniq.includes(key)){
          return;
        }
        uniq.push(key);
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
    const shaderSource = new ShaderSource(vs, fs, globalUniforms);
    return shaderSource;
  }

}

export default ShaderSource
