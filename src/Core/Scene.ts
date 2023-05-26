import { Camera, ScreenSpaceEventHandler } from "./Camera";
import Model3D from "./Model";
import * as twgl from "twgl.js";
import shaderProgramCache from "./ShaderProgram";
import VertexBuffer from "./VertexBuffer";

class Scene {
	objects: Array<Model3D>;
	gl: WebGL2RenderingContext | WebGLRenderingContext;
	canvas: HTMLCanvasElement;
	camera: Camera
	screenSpaceEvt: ScreenSpaceEventHandler
	constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, canvas: HTMLCanvasElement) {
		this.gl = gl;
		this.canvas = canvas;
		this.objects = [];
		this.camera = new Camera(canvas, this)
  	this.screenSpaceEvt = new ScreenSpaceEventHandler(canvas, this.camera)
	}

	add(object: Model3D) {
		this.objects.push(object);
	}

	render() {
		for (let i = 0; i < this.objects.length; i++) {
			this.objects[i].render();
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
    gl.useProgram(pInfo.program)
    if(fbo){
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    }
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    twgl.setBuffersAndAttributes(gl, pInfo, quad)
    twgl.setUniforms(pInfo, {
      u_texture: tex
    })
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
