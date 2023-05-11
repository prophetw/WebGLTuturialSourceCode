import * as twgl from 'twgl.js'
import WebGLConstants from './CONST/WebGLConstants';
import { UniformState } from './UniformState';
// auto matic update global uniform

const viewerPositionWCScratch = twgl.v3.create();

var datatypeToGlsl: {
  [key: number]: string;
} = {};
datatypeToGlsl[WebGLConstants.FLOAT] = 'float';
datatypeToGlsl[WebGLConstants.FLOAT_VEC2] = 'vec2';
datatypeToGlsl[WebGLConstants.FLOAT_VEC3] = 'vec3';
datatypeToGlsl[WebGLConstants.FLOAT_VEC4] = 'vec4';
datatypeToGlsl[WebGLConstants.INT] = 'int';
datatypeToGlsl[WebGLConstants.INT_VEC2] = 'ivec2';
datatypeToGlsl[WebGLConstants.INT_VEC3] = 'ivec3';
datatypeToGlsl[WebGLConstants.INT_VEC4] = 'ivec4';
datatypeToGlsl[WebGLConstants.BOOL] = 'bool';
datatypeToGlsl[WebGLConstants.BOOL_VEC2] = 'bvec2';
datatypeToGlsl[WebGLConstants.BOOL_VEC3] = 'bvec3';
datatypeToGlsl[WebGLConstants.BOOL_VEC4] = 'bvec4';
datatypeToGlsl[WebGLConstants.FLOAT_MAT2] = 'mat2';
datatypeToGlsl[WebGLConstants.FLOAT_MAT3] = 'mat3';
datatypeToGlsl[WebGLConstants.FLOAT_MAT4] = 'mat4';
datatypeToGlsl[WebGLConstants.SAMPLER_2D] = 'sampler2D';
datatypeToGlsl[WebGLConstants.SAMPLER_CUBE] = 'samplerCube';

class AutomaticUniform {
  _size: number
  _datatype: number
  getValue: Function
  constructor(options: {
    size: number,
    datatype: number,
    getValue: Function
  }) {
    this._size = options.size;
    this._datatype = options.datatype;
    this.getValue = options.getValue;
  }
  getDeclaration (name: string) {
    var declaration = 'uniform ' + datatypeToGlsl[this._datatype] + ' ' + name;

    var size = this._size;
    if (size === 1) {
      declaration += ';';
    } else {
      declaration += '[' + size.toString() + '];';
    }

    return declaration;
  }
}

const AutomaticUniforms = {
  glb_viewport: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_VEC4,
    getValue: function (uniformState: UniformState) {
      return uniformState.viewportCartesian4;
    }
  }),

  glb_view: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState: UniformState) {
      return uniformState.view;
    }
  }),

  glb_projection: new AutomaticUniform({
    size: 1,
    datatype: WebGLConstants.FLOAT_MAT4,
    getValue: function (uniformState: UniformState) {
      return uniformState.projection;
    }
  }),


}

export default AutomaticUniforms;
