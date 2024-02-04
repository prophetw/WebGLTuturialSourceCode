import * as twgl from 'twgl.js';
import AutomaticUniforms, {AutomaticUniform, AutomaticUniformsType} from './AutomaticUniforms';
import LogDepthVertex from './Shaders/logDepth.vert'
import LogDepthFrag from './Shaders/logDepth.frag'


type WebGLPrecision = 'highp' | 'mediump' | 'lowp';

function injectCodeToMain(shaderCode: string, injectedCode: string): string{
  const mainIndex = shaderCode.indexOf('main');
  const mainIndexStart = shaderCode.indexOf('{', mainIndex);
  const mainIndexEnd = shaderCode.indexOf('}', mainIndexStart);
  const mainCode = shaderCode.slice(mainIndexStart + 1, mainIndexEnd);
  const newMainCode = `
${mainCode}
${injectedCode}
`
  return shaderCode.slice(0, mainIndexStart + 1) + newMainCode + shaderCode.slice(mainIndexEnd);
}

function addWebGL2Adaptor(shaderCode: string, isFragmentShader: boolean): string{
  if(isFragmentShader){
    shaderCode = `#version 300 es
// #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp sampler2D;
// #else
//     precision mediump float;
//     precision mediump sampler2D;
// #endif

layout(location = 0) out vec4 FragColor;
layout(location = 1) out vec4 NormalEC;
// layout(location = 1) out float FragDepth;

#define attribute in
#define varying in
#define texture2D texture
#define gl_FragColor FragColor
// #define gl_FragDepth FragDepth
// #define gl_FragCoord FragCoord
#define gl_FragData FragData

${shaderCode}
`
  }else{

    shaderCode = `#version 300 es

// #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    precision highp sampler2D;
// #else
//     precision mediump float;
//     precision mediump sampler2D;
// #endif
out float FragDepth;

#define attribute in
#define varying out
#define texture2D texture
#define gl_FragDepth FragDepth

${shaderCode}
`
  }


  return shaderCode;
}

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

function handleGlobalVariables(fs: string, vs: string, automaticUnif: AutomaticUniformsType){
    const globalRegExp = /glb_\w+/g;
    const vsmatches = vs.match(globalRegExp);
    const fsmatches = fs.match(globalRegExp);
    const globalUniforms = new Map();

    console.log(' ---- auto matic ', automaticUnif);
    if(vsmatches !== null){
      const uniq = [...new Set()];
      vsmatches.map((str) => {
        const key = str as keyof AutomaticUniformsType;
        const unifInfo = automaticUnif[key]
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
        const unifInfo = automaticUnif[key]
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
    return {fs, vs, globalUniforms};

  }
class ShaderSource{

  vertexShader: string;
  fragmentShader: string;
  globalUniforms: Map<string, AutomaticUniform>;
	constructor(vertexShader: string, fragmentShader: string, globalUniforms: Map<string, AutomaticUniform>){
    this.vertexShader = vertexShader;
    this.fragmentShader = fragmentShader;
    this.globalUniforms = globalUniforms;
  }

  public static compileShaderSource(vs: string, fs: string, defines: string[]){

		const definedStr = defines.filter(def=>!!def).map(define => `#define ${define}`).join('\n');

    // add defines
    vs = definedStr + vs;
    fs = definedStr + fs;

    if(defines.includes('LOG_DEPTH')){
      const logDepthShaderObj = handleGlobalVariables(LogDepthVertex, LogDepthFrag, AutomaticUniforms);
      console.log(' logDepth ', logDepthShaderObj);
      // const logDepthVertexShader = logDepthShaderObj.vs;
      // const logDepthFragmentShader = logDepthShaderObj.fs;
      const logDepthVertexShader = LogDepthVertex;
      const logDepthFragmentShader = LogDepthFrag;
      vs = `
${logDepthVertexShader}
${vs}
`
fs = `
${logDepthFragmentShader}
${fs}
`
      // 需要把 方法插入到  main function 里面执行。
      const vsExecuteCode = `
vertex_logDepth(gl_Position);
`
      const fsExecuteCode = `
 write_logDepth();
`
      vs = injectCodeToMain(vs, vsExecuteCode);
      fs = injectCodeToMain(fs, fsExecuteCode);
      // executeLogDepthInMain(vs, fs);
    }

    // import other shader source code
    // support import util functions

    // add uniform and attribute declaration
    const result = handleGlobalVariables(fs, vs, AutomaticUniforms);
    fs = result.fs
    vs = result.vs
    const globalUniforms = result.globalUniforms;

    fs = addWebGL2Adaptor(fs, true);
    vs = addWebGL2Adaptor(vs, false);
    const shaderSource = new ShaderSource(vs, fs, globalUniforms);
    return shaderSource;
  }

}

export default ShaderSource
