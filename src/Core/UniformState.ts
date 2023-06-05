import * as twgl from 'twgl.js';
import AutomaticUniforms, { AutomaticUniformsType } from './AutomaticUniforms';

// Global uniform state
class UniformState{
  private _frustumDepth: [number, number];
  private _isOrthoCamera: number;
  private _shininess: number;
  private _viewMat4: twgl.m4.Mat4
  private _viewport: [number, number, number, number]
  private _projection: twgl.m4.Mat4
  private _lightPositionAry: twgl.v3.Vec3[] // point light
  private _lightDirection: twgl.v3.Vec3 // direction light
  private _lightColor: twgl.v3.Vec3
  private _ambientColor: twgl.v3.Vec3

	constructor(){
    this._frustumDepth = [0.1, 10000];
    this._isOrthoCamera = 0.0;
    this._viewMat4 = twgl.m4.identity()
    this._viewport = [0, 0, 0, 0]
    this._projection = twgl.m4.identity()
    this._shininess = 32.0;  // blinPhong default shininess

    // direction light should be array
    this._lightDirection = twgl.v3.create(1, 1, 1)

    // point light should be array
    this._lightPositionAry = []

    this._lightColor = twgl.v3.create(1, 1, 1)
    this._ambientColor = twgl.v3.create(0.3, 0.3, 0.3)
    console.log(' --- uniformstate --- ', this);
	}

  get shininess(): number{
    return this._shininess;
  }
  set shininess(value: number){
    this._shininess = value;
  }
  get lightColor (): twgl.v3.Vec3 {
    return this._lightColor
  }
  set lightColor (value: twgl.v3.Vec3) {
    this._lightColor = value
  }
  get ambientColor (): twgl.v3.Vec3 {
    return this._ambientColor
  }
  set ambientColor (value: twgl.v3.Vec3) {
    this._ambientColor = value
  }
  get projectionInverse (): twgl.m4.Mat4 {
    return twgl.m4.inverse(this._projection)
  }
  get viewInverse (): twgl.m4.Mat4 {
    return twgl.m4.inverse(this._viewMat4)
  }
  get viewProjection (): twgl.m4.Mat4 {
    return twgl.m4.multiply(this._projection, this._viewMat4)
  }
  get cameraPosition (): twgl.v3.Vec3 {
    return twgl.m4.getTranslation(this.viewInverse)
  }

  get lightDirectionWC (): twgl.v3.Vec3 {
    twgl.v3.normalize(this._lightDirection, this._lightDirection)
    return this._lightDirection
  }
  set lightDirectionWC (value: twgl.v3.Vec3) {
    this._lightDirection = value
  }
  get lightDirectionEC (): twgl.v3.Vec3 {
    const dirEc = twgl.m4.transformDirection(this.viewInverse, this._lightDirection)
    const normalizeDir = twgl.v3.normalize(dirEc, dirEc)
    return normalizeDir
  }

  get lightPositionAry () {
    return this._lightPositionAry
  }
  set lightPositionAry (value: twgl.v3.Vec3[]) {
    this._lightPositionAry = value
  }

  get frustumDepth(){
    return this._frustumDepth;
  }
  set frustumDepth(value: [number, number]){
    this._frustumDepth = value;
  }

  get oneOverLogOnePlusFarMinusNear(): number{
    return 1.0 / Math.log2(1.0 + this.frustumDepth[1] - this.frustumDepth[0]);
  }

  get isOrthoCamera(){
    return this._isOrthoCamera
  }
  set isOrthoCamera(value: number){
    this._isOrthoCamera = value;
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
    return this._viewMat4
  }
  set view(viewMat4: twgl.m4.Mat4){
    this._viewMat4 = viewMat4;
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
