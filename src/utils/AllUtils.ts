import * as twgl from 'twgl.js'

/**
 *
 * @param gl
 * @param texinfo
 * @returns
 * @example
 *
 const texs = await createTextures(gl, {
    albedoMap: {
      // level: 0,
      auto: true,
      src: `./resources/pbr/${materialName}/albedo.png`,
      // format: gl.RED,
      // internalFormat: gl.R8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
    normalMap: {
      // level: 0,
      auto: true,
      src: `./resources/pbr/${materialName}/normal.png`,
      // format: gl.RED,
      // internalFormat: gl.R8,
      type: gl.UNSIGNED_BYTE,
      wrapS: gl.REPEAT,
      wrapT: gl.REPEAT,
      min: gl.LINEAR_MIPMAP_LINEAR,
      max: gl.LINEAR,
    },
  });
 */
async function createTextures(gl: WebGLRenderingContext, texinfo: {
  [key: string]: twgl.TextureOptions
}): Promise<{
  [key: string]: WebGLTexture;
}> {
  return new Promise((resolve, reject) => {
    twgl.createTextures(gl, texinfo, (err, textures: {
      [key: string]: WebGLTexture;
    }) => {
      if (err) {
        reject(err)
      }
      resolve(textures)
    })
  })
}


async function createTexture(gl: WebGLRenderingContext, texinfo: twgl.TextureOptions
): Promise<WebGLTexture> {
  return new Promise((resolve, reject) => {
    console.log(' hhhhh ');
    twgl.createTexture(gl, texinfo, (err: any, tex: WebGLTexture) => {
      console.log(' _____ ', err, tex);
      if (err) {
        reject(err)
      }
      resolve(tex)
    })
  })
}


async function loadImg(src: string): Promise<HTMLImageElement>{
  return new Promise((resolve, reject)=>{
    const img = document.createElement('img')
    img.crossOrigin = ''
    img.src = src
    img.onload = ()=>{
      resolve(img)
    }
  })
}

async function loadHDR(hdrSrc: string): Promise<{
  dataFloat: Float32Array,
  dataRGBE: Uint8Array
  imageData: ImageData,
  canvas: HTMLCanvasElement
}> {
  return new Promise((resolve, reject) => {
    // https://enkimute.github.io/hdrpng.js/
    const hdrloader = new window.HDRImage()
    hdrloader.src = hdrSrc;
    hdrloader.onload = () => {
      // gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB9_E5, w, h, 0, gl.RGB, gl.FLOAT, new Float32Array(myHDR.dataRAW.buffer));
      const width = hdrloader.width
      const height = hdrloader.height
      const ctx = (hdrloader as HTMLCanvasElement).getContext('2d') as CanvasRenderingContext2D
      const imageData = ctx.createImageData(width, height)
      console.log(' dataFloat ', hdrloader.dataFloat);
      console.log(' dataRGBE ', hdrloader.dataRGBE);
      const dataFloat = hdrloader.dataFloat
      const dataRGBE = hdrloader.dataRGBE
      resolve({
        dataFloat,
        dataRGBE,
        imageData,
        canvas: hdrloader
      })
      // hdrloader.toHDRBlob(function (blob: Blob) {
      //   var a = document.createElement('a');
      //   a.href = URL.createObjectURL(blob);
      //   a.download = 'memorial.RGBE.PNG';
      //   a.innerHTML = 'click to save';
      //   document.body.appendChild(a); // or a.click()
      //   a.click()
      //   // resolve(blob)
      // })
    }
  })
}

export {
  createTextures,
  createTexture,
  loadHDR,
  loadImg,
}
