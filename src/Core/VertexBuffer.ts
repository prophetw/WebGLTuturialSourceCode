import * as twgl from 'twgl.js';

class VertexBuffer{

  static getScreenVertexBufferData(): twgl.BufferInfo{
    return {
      numElements: 6,
      elementType: WebGLRenderingContext.UNSIGNED_SHORT,
      indices: [0, 1, 2, 0, 2, 3],
      data: {
        position: {
          numComponents: 2,
          data: [
            -1, -1,
            1, -1,
            1, 1,
            -1, 1,
          ],
        },
        texcoord: {
          numComponents: 2,
          data: [
            0, 0,
            1, 0,
            1, 1,
            0, 1,
          ],
        },
      },
    };
  }

}

export default VertexBuffer;
