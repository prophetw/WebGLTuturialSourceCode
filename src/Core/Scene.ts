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
  msaaSamples: number
  enableMSAA: boolean
	constructor(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) {
		this.gl = gl;
		this.canvas = canvas;
		this.objects = [];
		this.camera = new Camera(canvas, this)
  	this.screenSpaceEvt = new ScreenSpaceEventHandler(canvas, this.camera)
    this.msaaSamples = 4;
    this.enableMSAA = false;
    this.createMSAAFbo();
	}

  createMSAAFbo(){
    // if(this.msaaFbo){
    //   return this.msaaFbo;
    // }
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
        samples: 4,
      },
      {
        format: this.gl.RGBA8, // internal format must be  gl.RGBA8 not gl.RGBA not same
        type: this.gl.UNSIGNED_BYTE,
        minMag: this.gl.NEAREST,
        wrap: this.gl.CLAMP_TO_EDGE,
        target: this.gl.RENDERBUFFER,
        width: this.gl.drawingBufferWidth,
        height: this.gl.drawingBufferHeight,
        samples: 4,
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
        samples: 4,
      }
    ]
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
    const isMultipleRenderTargerts = true; // color_attachment > 1

    if ( isMultipleRenderTargerts ) {

      for ( let i = 0; i < msaaFbo.attachments.length-1; i ++ ) {

        gl.bindFramebuffer( gl.FRAMEBUFFER, msaaFbo.framebuffer );
        gl.framebufferRenderbuffer( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, null );

        gl.bindFramebuffer( gl.FRAMEBUFFER, colorFbo.framebuffer );
        gl.framebufferTexture2D( gl.DRAW_FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, null, 0 );

      }

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
        gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT,
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

	render(screenFbo: twgl.FramebufferInfo) {
    this.updateAndClearFrameBuffer();

    const gl = this.gl;

    const currentFbo = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    // console.log(' currentFbo ', currentFbo);
    if(this.enableMSAA){
      if(this.msaaFbo && currentFbo !== null){
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.msaaFbo.framebuffer);
      }
    }

    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		for (let i = 0; i < this.objects.length; i++) {
			this.objects[i].render();
		}
    if(this.enableMSAA){
      if(this.msaaFbo && currentFbo !== null){
        this.msaaToFbo(this.msaaFbo, screenFbo)
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
