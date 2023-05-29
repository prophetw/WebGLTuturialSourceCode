import * as twgl from 'twgl.js';
import AutomaticUniforms, { AutomaticUniformsType } from './AutomaticUniforms';

// Global uniform state
class UniformState{
  private _frustumDepth: [number, number];
  private _camera_is_ortho: number;
  private _camera_view_mat4: twgl.m4.Mat4
  private _viewport: [number, number, number, number]
  private _projection: twgl.m4.Mat4
  private _lightPosition: twgl.v3.Vec3
  private _lightDirection: twgl.v3.Vec3

	constructor(){
    this._frustumDepth = [0.1, 10000];
    this._camera_is_ortho = 0.0;
    this._camera_view_mat4 = twgl.m4.identity()
    this._viewport = [0, 0, 0, 0]
    this._projection = twgl.m4.identity()
    this._lightPosition = twgl.v3.create(0, 0, 0)
    this._lightDirection = twgl.v3.create(0, 0, 0)
    console.log(' --- uniformstate --- ', this);
	}

  get projectionInverse (): twgl.m4.Mat4 {
    return twgl.m4.inverse(this._projection)
  }
  get viewInverse (): twgl.m4.Mat4 {
    return twgl.m4.inverse(this._camera_view_mat4)
  }
  get viewProjection (): twgl.m4.Mat4 {
    return twgl.m4.multiply(this._projection, this._camera_view_mat4)
  }
  get cameraPosition (): twgl.v3.Vec3 {
    return twgl.m4.getTranslation(this.viewInverse)
  }

  get lightDirection (): twgl.v3.Vec3 {
    return this._lightDirection
  }
  set lightDirection (value: twgl.v3.Vec3) {
    this._lightDirection = value
  }
  get lightPosition (): twgl.v3.Vec3 {
    return this._lightPosition
  }
  set lightPosition (value: twgl.v3.Vec3) {
    this._lightPosition = value
  }

  get frustumDepth(){
    return this._frustumDepth;
  }
  set frustumDepth(value: [number, number]){
    this._frustumDepth = value;
  }

  get camera_is_ortho(){
    return this._camera_is_ortho
  }
  set camera_is_ortho(value: number){
    this._camera_is_ortho = value;
  }
  //
  get glb_modelMatrix(): twgl.m4.Mat4{
    return twgl.m4.identity();
  }

  get viewport(): [number, number, number, number] {
    return this._viewport
  }
  set viewport(value: [number, number, number, number]){
    this._viewport = value;
  }

  get view(): twgl.m4.Mat4{
    return this._camera_view_mat4
  }
  set view(viewMat4: twgl.m4.Mat4){
    this._camera_view_mat4 = viewMat4;
  }

  get projection(): twgl.m4.Mat4{
    return this._projection;
  }
  set projection(projectionMat4: twgl.m4.Mat4){
    this._projection = projectionMat4;
  }

  updateGlobalUniforms(uniforms: {
    [key: string]: any
  }, programInfo: twgl.ProgramInfo
  ){
    const uniformKeys = Object.keys(programInfo.uniformSetters);
    const globalUniforms = uniformKeys.filter(key => key.indexOf('glb_') !== -1);
    globalUniforms.forEach(key => {
      const existKey = key as keyof AutomaticUniformsType;
      uniforms[key] = AutomaticUniforms[existKey].getValue(this)
    });
  }
}

const unifromState = new UniformState();

export {
  UniformState
}

export default unifromState;
