import * as twgl from 'twgl.js';

// Global uniform state
class UniformState{

	constructor(){

	}

  //
  get glb_modelMatrix(): twgl.m4.Mat4{
    return twgl.m4.identity();
  }

}

const unifromState = new UniformState();

export default unifromState;
