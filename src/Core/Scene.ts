import { Camera, ScreenSpaceEventHandler } from "./Camera";
import Model3D from "./Model";

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
		this.camera = new Camera(canvas)
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
}

export default Scene;