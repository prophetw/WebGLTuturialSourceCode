import { Camera, ScreenSpaceEventHandler } from "./Camera";
import Model3D from "./Model";
import * as twgl from "twgl.js";
import shaderProgramCache from "./ShaderProgram";
import VertexBuffer from "./VertexBuffer";
import unifromState from "./UniformState";

class Scene {
	objects: Array<Model3D>;
	gl: WebGL2RenderingContext;
	canvas: HTMLCanvasElement;
	camera: Camera
	screenSpaceEvt: ScreenSpaceEventHandler
  msaaFbo?: twgl.FramebufferInfo
  _msaaSamples: number
  _enableMSAA: boolean
  _useLogDepth: boolean
	constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
		this.gl = gl;
		this.canvas = canvas;
		this.objects = [];
		this.camera = new Camera(canvas, this)
  	this.screenSpaceEvt = new ScreenSpaceEventHandler(canvas, this.camera)
    this._msaaSamples = 8;
    this._enableMSAA = false;
    this._useLogDepth = false;
    this.createMSAAFbo();
	}

  get useLogDepth(){
    return this._useLogDepth;
  }
  set useLogDepth(use: boolean){
    this._useLogDepth = use;
  }

  get enableMSAA(){
    return this._enableMSAA;
  }

  set enableMSAA(enable: boolean){
    this._enableMSAA = enable;
    if(enable){
      this.msaaSamples = this._msaaSamples;
    }else{
      this.msaaSamples = 1;
    }
  }

  get msaaSamples(){
    return this._msaaSamples;
  }

  set msaaSamples(samples: number){
    this._msaaSamples = samples;
    if(samples > 1){
      this.createMSAAFbo();
    }
  }

  createMSAAFbo(){
    // if(this.msaaFbo){
    //   return this.msaaFbo;
    // }
    if(this._msaaSamples === 1){
      return
    }
    const gl = this.gl as WebGL2RenderingContext;

    // 创建并绑定帧缓冲
    // let framebuffer = gl.createFramebuffer();
    // gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // // 定义样本数，这将开启 MSAA
    // let samples = 4;

    // // 创建颜色渲染缓冲对象
    // let colorRenderbuffer = gl.createRenderbuffer();
    // gl.bindRenderbuffer(gl.RENDERBUFFER, colorRenderbuffer);
    // gl.renderbufferStorageMultisample(
    //   gl.RENDERBUFFER,
    //   samples,
    //   gl.RGBA8,
    //   gl.drawingBufferWidth,
    //   gl.drawingBufferHeight
    // );
    // gl.framebufferRenderbuffer(
    //   gl.FRAMEBUFFER,
    //   gl.COLOR_ATTACHMENT0,
    //   gl.RENDERBUFFER,
    //   colorRenderbuffer
    // );

    // // 创建深度渲染缓冲对象
    // let depthRenderbuffer = gl.createRenderbuffer();
    // gl.bindRenderbuffer(gl.RENDERBUFFER, depthRenderbuffer);
    // gl.renderbufferStorageMultisample(
    //   gl.RENDERBUFFER,
    //   samples,
    //   gl.DEPTH_COMPONENT16, // 对于深度缓冲，常用的是 gl.DEPTH_COMPONENT16 或 gl.DEPTH_COMPONENT24
    //   gl.drawingBufferWidth,
    //   gl.drawingBufferHeight
    // );
    // gl.framebufferRenderbuffer(
    //   gl.FRAMEBUFFER,
    //   gl.DEPTH_ATTACHMENT, // 注意这里使用的是 gl.DEPTH_ATTACHMENT
    //   gl.RENDERBUFFER,
    //   depthRenderbuffer
    // );

    const attachments: twgl.AttachmentOptions[] = [
      {
        format: this.gl.RGBA8, // internal format must be  gl.RGBA8 not gl.RGBA not same
        type: this.gl.UNSIGNED_BYTE,
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        target: this.gl.RENDERBUFFER,
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight,
        samples: this.msaaSamples,
      },
      {
        // format: this.gl.RGBA8, // internal format must be  gl.RGBA8 not gl.RGBA not same
        type: this.gl.UNSIGNED_BYTE,
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        // target: this.gl.RENDERBUFFER,
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight,
        samples: this.msaaSamples,
      },
      {
        format: this.gl.DEPTH_COMPONENT16,
        // internalFormat: this.gl.DEPTH_COMPONENT16,
        type: this.gl.UNSIGNED_INT,
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        target: this.gl.RENDERBUFFER,
        // target: this.gl.TEXTURE_2D,
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight,
        samples: this.msaaSamples,
      }
    ]
    if(this.msaaFbo){
      this.msaaFbo = undefined;
    }
    const fbo = twgl.createFramebufferInfo(gl, attachments, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
    // // 检查帧缓冲的状态
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      console.log(gl.checkFramebufferStatus(gl.FRAMEBUFFER))
      console.log("帧缓冲不完整");
    }
    // this.gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    // // const rbo = twgl.createRenderBuffer
    this.msaaFbo = fbo;
    return fbo;
  }

  msaaToFbo(msaaFbo: twgl.FramebufferInfo, colorFbo: twgl.FramebufferInfo){
    const gl = this.gl as WebGL2RenderingContext;
    const canvas = this.canvas;
    const isMultipleRenderTargerts = false; // color_attachment > 1

    if ( isMultipleRenderTargerts ) {

      for ( let i = 0; i < msaaFbo.attachments.length-1; i ++ ) {

        gl.bindFramebuffer( gl.FRAMEBUFFER, msaaFbo.framebuffer );
        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, null );

        gl.bindFramebuffer( gl.FRAMEBUFFER, colorFbo.framebuffer );
        gl.framebufferTexture2D( gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0 );

      }

      for(let i=0; i<msaaFbo.attachments.length-1; i++){

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaaFbo.framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorFbo.framebuffer);

        if (isMultipleRenderTargerts ) {
          gl.framebufferRenderbuffer( gl.READ_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msaaFbo.attachments[i] );
          gl.framebufferTexture2D( gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorFbo.attachments[i] , 0 );
        }
        gl.blitFramebuffer(
          0, 0, canvas.width, canvas.height,
          0, 0, canvas.width, canvas.height,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST
        );
      }
    }else{

        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaaFbo.framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorFbo.framebuffer);
        gl.blitFramebuffer(
          0, 0, canvas.width, canvas.height,
          0, 0, canvas.width, canvas.height,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST
        );

    }
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);


    if ( isMultipleRenderTargerts ) {

      for ( let i = 0; i < msaaFbo.attachments.length-1; i ++ ) {

        gl.bindFramebuffer( gl.FRAMEBUFFER, msaaFbo.framebuffer );
        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, msaaFbo.attachments[i] );

        gl.bindFramebuffer( gl.FRAMEBUFFER, colorFbo.framebuffer );
        gl.framebufferTexture2D( gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, colorFbo.attachments[i], 0 );

      }

    }

    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, colorFbo.framebuffer);

  }

	add(object: Model3D) {
		this.objects.push(object);
	}

  updateAndClearFrameBuffer(){
    // TODO:  size change need regenerate texture and fbo

  }

  fboDepth2fbo(sourceFramebuffer: WebGLFramebuffer, sourceDepthTexture: WebGLTexture, targetFramebuffer: WebGLFramebuffer, targetDepthTexture: WebGLTexture){
    const gl = this.gl;
    // 首先，我们需要将sourceFramebuffer绑定到当前的Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, sourceFramebuffer);

    // 然后，我们需要将sourceDepthTexture绑定到当前的纹理
    gl.bindTexture(gl.TEXTURE_2D, sourceDepthTexture);

    // 接下来，我们需要将当前的Framebuffer的颜色缓冲区设置为不可读可写
    gl.colorMask(false, false, false, false);
    // 同时，我们需要将当前的Framebuffer的深度缓冲区设置为可读可写
    gl.depthMask(true);

    // 然后，我们需要将targetFramebuffer绑定到当前的Framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFramebuffer);

    // 接下来，我们需要将targetDepthTexture绑定到当前的纹理
    gl.bindTexture(gl.TEXTURE_2D, targetDepthTexture);

    // 我们需要将当前的Framebuffer的颜色缓冲区设置为不可读可写
    gl.colorMask(false, false, false, false);
    // 同时，我们需要将当前的Framebuffer的深度缓冲区设置为可读可写
    gl.depthMask(true);


    const width = this.gl.drawingBufferWidth;
    const height = this.gl.drawingBufferHeight;

    // 接下来，我们需要使用gl.copyTexImage2D来将sourceDepthTexture的内容复制到targetDepthTexture
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, 0, 0, width, height, 0);

    // 最后，我们需要将颜色和深度的mask设置回来
    gl.colorMask(true, true, true, true);
    gl.depthMask(false);
  }

	render(screenFbo: twgl.FramebufferInfo) {
    this.updateAndClearFrameBuffer();

    const gl = this.gl;

    let currentFbo = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    if(screenFbo){
       currentFbo = screenFbo;
    }
    if(this.enableMSAA){
      if(this.msaaFbo && screenFbo){
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFbo.framebuffer);
      }
    }

    if(!!screenFbo){
      gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		for (let i = 0; i < this.objects.length; i++) {
			this.objects[i].render();
		}
    if(this.enableMSAA){
      if(this.msaaFbo && currentFbo !== null && !!screenFbo){
        this.msaaToFbo(this.msaaFbo, screenFbo)
        this.fboDepth2fbo(this.msaaFbo.framebuffer, this.msaaFbo.attachments[2], screenFbo.framebuffer, screenFbo.attachments[2])
      }
    }

	}

  pick(windowPosition: [number, number]){
    const [screenX, screenY] = windowPosition
    const ray = this.camera.getPickRay(screenX, screenY)

    const pickResult = this.objects.map(obj => {
      return obj.intersectRay(ray)
    }).filter(a => a !== null) as twgl.v3.Vec3[]
    // console.log([...pickResult]);

    // z sort
    pickResult.sort((a, b) => {
      return a[2] - b[2]
    })
    return pickResult[0]
  }

  debugDepthTex(tex: WebGLTexture, fbo?: WebGLFramebuffer){
    const gl = this.gl;
    const quad = twgl.primitives.createXYQuadBufferInfo(gl)
    const pInfo = shaderProgramCache.createScreenDebugDepthProgramInfo(gl);
    const uniforms = {
      u_texture: tex,
    }
    unifromState.updateGlobalUniforms(uniforms, pInfo)
    gl.useProgram(pInfo.program)
    if(fbo){
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    twgl.setBuffersAndAttributes(gl, pInfo, quad)
    twgl.setUniforms(pInfo, uniforms)
    twgl.drawBufferInfo(gl, quad)

  }

  printTexToScreen(tex: WebGLTexture, fbo?: WebGLFramebuffer){
    const gl = this.gl;
    const quad = twgl.primitives.createXYQuadBufferInfo(gl)
    const pInfo = shaderProgramCache.createScreenProgramInfo(gl);
    gl.useProgram(pInfo.program)
    if(fbo){
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    }else{
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    twgl.setBuffersAndAttributes(gl, pInfo, quad)
    twgl.setUniforms(pInfo, {
      u_texture: tex
    })
    twgl.drawBufferInfo(gl, quad)
  }

}

export default Scene;
