declare module '*.glsl'
declare module '*.vert'
declare module '*.frag'
declare module '*.vs'
declare module '*.fs'
interface Window {
  getWebGLContext: (htmlDomEle: HTMLCanvasElement)=> WebGLRenderingContext
  initShaders: (gl: WebGLRenderingContext, VSHADER_SOURCE: string, FSHADER_SOURCE: string)=>boolean
  createProgram: (gl: WebGLRenderingContext, VSHADER_SOURCE: string, FSHADER_SOURCE: string)=>WebGLProgram
  Matrix4: new (value?: any) => Matrix4
  HDRImage: new () => any
  webglLessonsUI: WebglLessonsUI
}
interface WebglLessonsUI{
  setupUI: (ele: HTMLElement|null, settings: any, changes: any)=>void
}
interface WebGLRenderingContext{
  program: WebGLProgram
}
interface WebGLProgram{
  a_Position?: number
  a_Normal?: number
  u_MvpMatrix?: WebGLUniformLocation
  u_NormalMatrix?: WebGLUniformLocation
  a_TexCoord?: number
  u_Sampler?: WebGLUniformLocation
}


interface WebGLBuffer{
  num: number
  type: number
}

declare type OffscreenCanvas = HTMLCanvasElement;
declare var OffscreenCanvas: {
    prototype: OffscreenCanvas;
    new(): OffscreenCanvas;
};

declare type WebGLObject = {};

interface Window {
	OffscreenCanvas: OffscreenCanvas;
}

interface Navigator {
	msSaveBlob?: (blob: Blob, fileName: string) => boolean;
}
