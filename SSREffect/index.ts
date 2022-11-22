import twgl from 'twgl.js'
import FS from './Shadow.frag'
import VS from './Shadow.vert'

const Matrix4 = twgl.m4
const Vector3 = twgl.v3
const Primitive = twgl.primitives

const lightInfo = {
  diffuse: [],
  specular: 0.5,
  ambient: [],
  position: []
}

function Shadow (){
  console.log(' shadow ');
  // 光源 + 三角形 + 平面    平面上可以看到 三角形的投影
  // 圆柱体 球 cube 在平面上的反射
  // MRT  normal + position + depth
  const canvas = document.getElementById('webgl') as HTMLCanvasElement
  const gl = canvas.getContext('webgl2')
  if(gl === null){
    console.error(' gl is null ');
    return
  }
  const pInfo = twgl.createProgramInfo(gl, [VS, FS])
  const cubeVertics = Primitive.createCubeVertices()
  const quadVertics = Primitive.createXYQuadVertices()
  // const sphereVertics = Primitive.createSphereVertices(5, 1, 2)
  twgl.createBufferInfoFromArrays(gl, cubeVertics)

  console.log(pInfo, cubeVertics, quadVertics);

}

export default Shadow
