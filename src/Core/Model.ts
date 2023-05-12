
import * as twgl from 'twgl.js';
import shaderProgramCache from './ShaderProgram';
import BoundingBox from './BoundingBox';
import { Camera } from './Camera';

type Vector3 = twgl.v3.Vec3;

class Model3D{
	gl: WebGL2RenderingContext | WebGLRenderingContext
	bufferInfo: twgl.BufferInfo
	modelMatrix: twgl.m4.Mat4
	positions: number[]
	fragmentShader: string
	vertexShader: string
	numComponents: number
	boundingBox: BoundingBox
	camera: Camera
	color: twgl.v3.Vec3
	constructor(
		gl: WebGL2RenderingContext | WebGLRenderingContext,
		camera: Camera,
		vertics: twgl.Arrays,
		modelMatrix: twgl.m4.Mat4 = twgl.m4.identity(),
		vs = '',
		fs = '',
		){
		this.fragmentShader = fs;
		this.vertexShader = vs;
		this.gl = gl;
		this.positions = [];
		this.numComponents = 3;
		this.camera = camera;
		if(Array.isArray(vertics.position)){
			this.positions = vertics.position;
		}
		if(vertics.position && Array.isArray(vertics.position.data)){
			this.positions = vertics.position.data;
			this.numComponents = vertics.position.numComponents;
		}
		if(vertics.position instanceof Float32Array){
			this.positions = Array.from(vertics.position);
			this.numComponents = vertics.position.numComponents;
		}
		const pointAry = this.positions.map((v, i) => {
			if(i % this.numComponents === 0){
        const first = v
        const second = this.positions[i + 1]
        if(this.numComponents === 2){
          return [first, second, 0]
        }
				return [v, this.positions[i + 1], this.positions[i + 2]];
			}
			return null;
		}).filter(a=>a!==null) as twgl.v3.Vec3[];

		this.boundingBox = BoundingBox.fromPoints(pointAry);

		this.bufferInfo = twgl.createBufferInfoFromArrays(gl, vertics)
		this.modelMatrix = modelMatrix;
		this.color = twgl.v3.create(Math.random(), Math.random(), Math.random());
	}

  get worldBox(): BoundingBox{
    const modelMatrix = this.modelMatrix;
    const boundingBox = this.boundingBox;
    const min = boundingBox.min;
    const max = boundingBox.max;
    const minWorld = twgl.m4.transformPoint(modelMatrix, min);
    const maxWorld = twgl.m4.transformPoint(modelMatrix, max);
    return BoundingBox.fromPoints([minWorld, maxWorld]);
  }

	setModelMatrix(modelMatrix: twgl.m4.Mat4){
		this.modelMatrix = modelMatrix
	}

	render(){
		const gl = this.gl;
		const programInfo = shaderProgramCache.createColorProgramInfo(gl, this.vertexShader, this.fragmentShader)
		const uniforms = {
			projection: this.camera.frustum.projectionMatrix,
			view: this.camera.viewMatrix,
			model: this.modelMatrix,
			u_color: this.color
		};
    // console.log(uniforms);
    // console.log(' programInfo ', programInfo);
		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo);
		twgl.setUniforms(programInfo, uniforms);
		twgl.drawBufferInfo(gl, this.bufferInfo);
	}

}

export default Model3D
