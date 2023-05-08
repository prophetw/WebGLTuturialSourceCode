
import * as twgl from 'twgl.js';

type Vector3 = twgl.v3.Vec3;

class Model3D{

	gl: WebGL2RenderingContext | WebGLRenderingContext
	bufferInfo: twgl.BufferInfo
	modelMatrix: twgl.m4.Mat4
	positions: number[]
	indics: number
	constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, vertics: twgl.Arrays){
		// positions
		// const cubeVert = twgl.primitives.createCubeVertices()
		this.gl = gl;
		this.positions = [];
		this.indics = 3;
		if(Array.isArray(vertics.position)){
			this.positions = vertics.position;
		}

		this.bufferInfo = twgl.createBufferInfoFromArrays(gl, vertics) 
		this.modelMatrix = twgl.m4.identity()
	}

	setModelMatrix(modelMatrix: twgl.m4.Mat4){
		this.modelMatrix = modelMatrix
	}

}

export default Model3D