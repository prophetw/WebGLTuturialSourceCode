import axios from "axios"

// 说明 https://github.com/KhronosGroup/glTF
class GltfLoader {
  src: string
  baseUrl: string
  gltfObj?: {
    [key: string]: any
  }
  constructor(src: string) {
    this.src = src
    const lastIndex = src.lastIndexOf('/')
    this.baseUrl = src.slice(0, lastIndex)
    this.init()
  }
  async loadGltf() {
    return axios.request({
      url: this.src,
    }).then(res=>{
      if(res.status === 200){
        return res.data
      }
    })
  }
  loadImage(src: string) {
    return axios.get(src).then(res=>{
      if(res.status === 200){
        return res.data
      }
    })
  }
  loadBuffer(src: string) {
    return axios.get(src, {
      responseType: 'arraybuffer'
    }).then(res=>{
      if(res.status === 200){
        return res.data
      }
    })

  }
  async init(){
    const gltfObj = await this.loadGltf()
    this.gltfObj = gltfObj
  }
}
const init = async () => {
  const gltf = new GltfLoader('http://localhost:5000/Cube/glTF/Cube.gltf')
  console.log(gltf);
  const gltfObj = await gltf.loadGltf()
  console.log(gltfObj);
  const buf = await gltf.loadBuffer('http://localhost:5000/Cube/glTF/cube.bin')
  console.log(buf);
}
init()
