
import * as twgl from 'twgl.js';

type Vector3 = twgl.v3.Vec3;

class Model3D{

	gl: WebGL2RenderingContext | WebGLRenderingContext
	bufferInfo: twgl.BufferInfo
	modelMatrix: twgl.m4.Mat4
	positions: number[]
	indics: number
	fragmentShader: string
	vertexShader: string
	constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, vertics: twgl.Arrays){
		// positions
		// const cubeVert = twgl.primitives.createCubeVertices()
		this.fragmentShader = ``
		this.vertexShader = ``
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

	render(){
		const gl = this.gl;
		const programInfo = twgl.createProgramInfo(gl, [this.vertexShader, this.fragmentShader]);
		const uniforms = {
			u_matrix: this.modelMatrix,
			u_color: [Math.random(), Math.random(), Math.random(), 1],
		};
		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo);
		twgl.setUniforms(programInfo, uniforms);
		twgl.drawBufferInfo(gl, this.bufferInfo);
	}

}

export default Model3D