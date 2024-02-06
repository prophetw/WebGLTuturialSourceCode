
import * as twgl from 'twgl.js';
import shaderProgramCache from './ShaderProgram';
import BoundingBox from './BoundingBox';
import { Camera, PerspectiveFrustum } from './Camera';
import Ray from './Ray';
import AutomaticUniforms from './AutomaticUniforms';
import unifromState from './UniformState';
import Scene from './Scene';

type Vector3 = twgl.v3.Vec3;

class Model3D {
	gl: WebGL2RenderingContext | WebGLRenderingContext
	bufferInfo: twgl.BufferInfo
	modelMatrix: twgl.m4.Mat4
	positions: number[]
	pointAry: twgl.v3.Vec3[]
	triangleAry: twgl.v3.Vec3[]
	fragmentShader: string
	vertexShader: string
	numComponents: number
	indices: twgl.ArraySpec
	vertics: twgl.Arrays
	boundingBox: BoundingBox
	camera: Camera
	color: twgl.v3.Vec3
  programInfo: twgl.ProgramInfo | undefined
  scene: Scene
	constructor(opt: {
    scene: Scene
		camera: Camera,
		context: WebGL2RenderingContext | WebGLRenderingContext,
		vertics: twgl.Arrays,
		modelMatrix?: twgl.m4.Mat4,
		vs?: string,
		fs?: string,
    color?: twgl.v3.Vec3
  }
	) {
    const {context, camera, vertics, scene} = opt;
    const modelMatrix = opt.modelMatrix || twgl.m4.identity();
    const vs = opt.vs || ``
    const fs = opt.fs || ``
    this.scene = scene;
    const color = opt.color ? opt.color : twgl.v3.create(Math.random(), Math.random(), Math.random());
		this.color = color;
		this.vertics = vertics;
		this.fragmentShader = fs;
		this.vertexShader = vs;
		this.gl = context;
		this.positions = [];
		this.numComponents = 3;
    this.programInfo = undefined;
		this.camera = camera;
		if (Array.isArray(vertics.position)) {
			this.positions = vertics.position;
		}
		if (vertics.position && Array.isArray(vertics.position.data)) {
			this.positions = vertics.position.data;
			this.numComponents = vertics.position.numComponents;
		}
		if (vertics.position instanceof Float32Array) {
			this.positions = Array.from(vertics.position);
			this.numComponents = vertics.position.numComponents;
		}
		this.indices = this.vertics.indices
		const pointAry = this.positions.map((v, i) => {
			if (i % this.numComponents === 0) {
				const first = v
				const second = this.positions[i + 1]
				if (this.numComponents === 2) {
					return [first, second, 0]
				}
				return [v, this.positions[i + 1], this.positions[i + 2]];
			}
			return null;
		}).filter(a => a !== null) as twgl.v3.Vec3[];

		this.pointAry = pointAry
		this.triangleAry = []
		if(Array.isArray(this.indices) || this.indices instanceof Uint16Array){
			const indices = [...this.indices]
			indices.forEach((v, i) => {
				if (i % 3 === 0) {
					const first = pointAry[v]
					const second = pointAry[indices[i + 1]]
					const third = pointAry[indices[i + 2]]
					this.triangleAry.push(first, second, third)
				}
			})
			if(this.indices.length !== this.triangleAry.length){
				console.error(' this.indices.length !== this.triangleAry.length ');
			}
		}

		this.boundingBox = BoundingBox.fromPoints(pointAry);
		this.bufferInfo = twgl.createBufferInfoFromArrays(this.gl, vertics)
		this.modelMatrix = modelMatrix;
	}

	get worldBox(): BoundingBox {
		const modelMatrix = this.modelMatrix;
    const transformdPointAry = this.pointAry.map(v => twgl.m4.transformPoint(modelMatrix, v))
		return BoundingBox.fromPoints([...transformdPointAry]);
	}

	setModelMatrix(modelMatrix: twgl.m4.Mat4) {
		this.modelMatrix = modelMatrix
	}

	render() {
		const gl = this.gl;
    // const programInfo = shaderProgramCache.createBlinnPhongProgramInfo(gl, [''])
    let programInfo;

    // programInfo = shaderProgramCache.createBlinnPhongProgramInfo(gl, [''])
    if(this.camera.frustum instanceof PerspectiveFrustum){
      if(this.scene.useLogDepth){
        programInfo = shaderProgramCache.createBlinnPhongProgramInfo(gl, ['LOG_DEPTH'])
      }else{
        programInfo = shaderProgramCache.createBlinnPhongProgramInfo(gl, [''])
      }
    }else{
      programInfo = shaderProgramCache.createBlinnPhongProgramInfo(gl, [''])
    }
		// const programInfo = shaderProgramCache.createColorProgramInfo(gl, this.vertexShader, this.fragmentShader)
    this.programInfo = programInfo;
		const uniforms = {
			projection: this.camera.frustum.projectionMatrix,
			view: this.camera.viewMatrix,
			model: this.modelMatrix,
			u_color: this.color,
		};
    unifromState.updateGlobalUniforms(uniforms, programInfo)
		// console.log(uniforms);
		// console.log(' programInfo ', programInfo);
		gl.useProgram(programInfo.program);
		twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo);
		twgl.setUniforms(programInfo, uniforms);
		twgl.drawBufferInfo(gl, this.bufferInfo);
	}

	generateOCTreeData() {

	}

	intersectRay(ray: Ray): null | twgl.v3.Vec3 {
		let result = null;
		const transformdTriangleAry = this.triangleAry.map(v => {
			return twgl.m4.transformPoint(this.modelMatrix, v)
		})
		const resultAry: twgl.v3.Vec3[] = [];
		transformdTriangleAry.forEach((v, i) => {
			if (i % 3 === 0) {
				result = ray.rayTriangleIntersection(v, transformdTriangleAry[i + 1], transformdTriangleAry[i + 2]);
				if (result) {
					// console.log('isIntersect', result);
					resultAry.push(result);
				}
			}
		})
		// console.log(' ______ ', resultAry);
		if(resultAry.length>0){
			result = resultAry[0];
			for(let i = 1; i<resultAry.length; i++){
				if(twgl.v3.distance(resultAry[i], ray.origin) < twgl.v3.distance(result, ray.origin)){
					result = resultAry[i];
				}
			}
		}
		return result;
	}

}

export default Model3D
