import * as twgl from 'twgl.js';

// Global uniform state
class UniformState{

	constructor(){

	}

  //
  get glb_modelMatrix(): twgl.m4.Mat4{
    return twgl.m4.identity();
  }

  get viewportCartesian4(): void {
    return
  }

  get view(): twgl.m4.Mat4{
    return twgl.m4.create()
  }

  get projection(): twgl.m4.Mat4{
    return twgl.m4.create()
  }

}

const unifromState = new UniformState();

export {
  UniformState
}

export default unifromState;
