import { IContextInformation } from './contextInformation'
import { ReadPixelsHelper } from './readPixelsHelper'
import { WebGlConstant, WebGlConstants, WebGlConstantsByValue } from './webglConstants'

type Position = 'right-top' | 'right-bottom' | 'right-mid' | 'left-bottom' | 'left-top' | 'left-mid'
export class VisualState {
  public static captureBaseSize = 256;

  quickCapture: boolean
  fullCapture: boolean
  img: HTMLImageElement
  imgContainer: HTMLDivElement
  statusContainer: HTMLDivElement
  position: Position
  imgSrcAry: {
    src: string
    name: string
  }[]
  curShowImg: undefined | {
    src: string
    name: string
  }
  private readonly captureFrameBuffer: WebGLFramebuffer;
  private readonly workingCanvas: HTMLCanvasElement;
  private readonly captureCanvas: HTMLCanvasElement;
  private readonly workingContext2D: CanvasRenderingContext2D;
  private readonly captureContext2D: CanvasRenderingContext2D;

  constructor(options: IContextInformation, imgPosition: Position) {
    this.position = imgPosition
    this.img = document.createElement('img') as HTMLImageElement
    this.quickCapture = false
    this.fullCapture = false
    this.captureFrameBuffer = options.context.createFramebuffer() as WebGLFramebuffer;
    this.workingCanvas = document.createElement("canvas");
    this.workingContext2D = this.workingCanvas.getContext("2d") as CanvasRenderingContext2D;
    this.captureCanvas = document.createElement("canvas");
    this.captureContext2D = this.captureCanvas.getContext("2d") as CanvasRenderingContext2D;
    this.captureContext2D.imageSmoothingEnabled = true;
    (this.captureContext2D as any).mozImageSmoothingEnabled = true;
    (this.captureContext2D as any).oImageSmoothingEnabled = true;
    (this.captureContext2D as any).webkitImageSmoothingEnabled = true;
    (this.captureContext2D as any).msImageSmoothingEnabled = true;
    this.imgSrcAry = []
    this.imgContainer = document.createElement('div') as HTMLDivElement
    this.imgContainer.append(this.img)
    this.statusContainer = document.createElement('div') as HTMLDivElement
    this.imgContainer.append(this.statusContainer)
    this.initImgContainer()
    document.body.append(this.imgContainer)
  }

  updateStatusContainer(name = ''){
    console.log(name);
    let curIndex = 0
    if(this.curShowImg){
      curIndex = this.imgSrcAry.indexOf(this.curShowImg)
    }
    const total = this.imgSrcAry.length
    this.statusContainer.innerHTML = `${curIndex+1}/${total} ${name}`
  }

  initImgContainer(){
    this.imgContainer.style.width = '200px'
    this.imgContainer.style.height = '200px'
    this.imgContainer.style.position = 'absolute'
    this.statusContainer.style.position = 'absolute'
    this.statusContainer.style.left = '0px'
    this.statusContainer.style.bottom = '0px'
    this.statusContainer.style.height = '24px'
    this.statusContainer.style.maxWidth = '200px'
    this.statusContainer.style.background = 'rgba(0.5, 0.5, 0.5, 0.5)'
    this.statusContainer.style.color = 'white'

    const prevIcon = document.createElement('img')
    const nextIcon = document.createElement('img')
    prevIcon.style.position = 'absolute'
    prevIcon.style.background = 'white'
    prevIcon.style.left = '0px'
    prevIcon.style.top = '40%'
    prevIcon.style.width = '20px'
    prevIcon.style.height = '20px'
    prevIcon.style.cursor = 'pointer'
    prevIcon.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAMAAABmmnOVAAAAhFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8qm6wAAAAK3RSTlMA+xLJXx7FBaGK7UUmDgra03w6zVZMpata9fHfurCWhVE1K+riv72Db2cY2Bh2eAAAA7NJREFUeNrUmNuyojAQRRuScI0ojHhXRrwdzf//38yDMTQqlQRIzaw3q86JC7K7OxH+Y/yCVotdMNsmnpdsZ8FuUdHCB2dMyphsxEc2JC4nMDZhGhNPdOKROA1hPIpDIrRIDgWMAr9thQHbG4ehOe6FMfsjDEl6FVZc0+EUSFcOk6QrqWQYDbb8XIyLfH7kjwz+kj34cZ5Hnwt3yfrXZL4Wbc4RZV+EaXQWbdZ52HMnpqLF5c6hE36/iBbTFOwJ4/ZqOQMNWN52j0PrNAQ4gssCtCmWOK6BZTLKBClEHIzgEdJISrAgRgoHBsawA9KIzeOwQC+zBitqtKELw2BkO6E4UbCGnoRil4EBPhGKyIce+JFQEIOlWKPC1hR6QteNGmfa8g2HWQ29qWcNC18zD6SxFRkMQNbYEqK1YtjIZAUDUTXSqVMjjdr8gcH4aVSqSY/yVjAgK0+/a5XKoYRBKZVFCZ0wNS9WMDArNUdYZygDkzzY5yIItQJRwQhUOrFIVX+AUVD9Iv26GdNXn8xgFLLZq3N+25D8NS9qMMbXOsHVrzmSw0fY6w+ohcNM7HUs6OtBGXxiqQJh4yCkhWYslp2pPPlWDpoW/qkrm0Rtho2DtNDfENLxIgJzh18Cv+Nugu+v4ipHRm3uYDZvak/e2aHFUTw59HH4DTocxJMjYPZyHTa6AzBPRggQXJXnuA64TDk0ucmFuAMH4PJV3KDJVqbbhYPqi1toUIgnhRMH/H3tvE7Hc8BM32sxTORoc+CABnYSvndLZukwB0MY6proVHcxcSDIwZTL2zlPrnd35gD39hSbyLLlzhyAy/+etC48Z9BlghysOKuLEIpE5MYBt+64FQnq0AFoKxQbWaDmDiuQ2Bbp5hky+dGVA350HzVy4tQBCBof1CSXk2AgB1igJFZycLhywOOjQkpzMwcK/ZijX4928tjpygEfrXfoHsCdOgBH9xx5fXo4dYCH/BkCnS8z6CQb1gEydM5Mnis7cEA8Z3eCPjh0QA//70j8aecOigCGgRgG8mdtFJ7Zh0qhbXKxpRCvg/gwiV+UWKyIZZvYwIitnBhqiPGOGHSJkd84/BDHQOJATEQDREhixEVEcEZEiESYasTKRMBuVA1E6ULUT0YRR1SSRjlL1NRGYU+gCwbEQeAsBthDIE4G7GVgbwQAaKCQBhRq4LEGKEwg0wY8bmD0hlBgqBWGZGLoNoh4ZChYhoxmaHmIoGiomoi0iui7iMiMKN2I3K5o/siFB8zVDz3HZ8W8SKUu1T3kAAAAAElFTkSuQmCC"

    nextIcon.style.background = 'white'
    nextIcon.style.position = 'absolute'
    nextIcon.style.right = '0px'
    nextIcon.style.top = '40%'
    nextIcon.style.width = '20px'
    nextIcon.style.height = '20px'
    nextIcon.style.cursor = 'pointer'
    nextIcon.src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAMAAABmmnOVAAAAhFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8qm6wAAAAK3RSTlMA+xLJXx7FBaGK7UUmDgra03w6zVZMpata9fHfurCWhVE1K+riv72Db2cY2Bh2eAAAA7NJREFUeNrUmNmWojAURQ+EIJMotDgrLU6l+f//6xdJSErphCGrar+5llRtknPvTcQvxs29crn357vIcaLd3N8vSy93YY1pEZIte8uWhMUUYzOJQ+KwVhwSxhOMR36MmBbRMccoJPcdM2B3TzA0pwMz5nDCkMQ31olbPJwCacthFLUllQyjQVfvi3GZLU7JMwWA9JmcFlnwvnBXtH9NZhumcgk8+kHYCy5MZZP1rNh4xhSujwStJI8rU5jFfZYhVP9aRqEBzVT3sPNiUF+O4CqHNvlKjqtP0YkikhSCBEYkgaQRFehAKCkcKYyhR0kjNI/DUlrMCp2opA1dGgYj3TPB2UNnvDMT7FMY4BImCFz0wA2YgLjQhjYqbOOhJ96mUeNUW77hMK/Qm2resHA180AYJ0gxAGnAOCTVqotGJksMRNlIp06NNGrzC4Px1ahUkx7lrDEga0e/axXCocCgFMKiQCtUzIs1BmYt5ghtDaWvk4f+ufAnWoEoMQKlTixi0R8wCqJfxB83Y8b7ZIpRSOe8c37akIzPi0rr7OfCmIrPkQxvofwLno7Dgc07WHj8RSneseKB0HNg3KJTLFatqTy7eg7dLNxzWzYJ3ww9B27RdUNIy0L4+D/iZvjH3ML/vBS3emRUZnPA3KKqH75B4cReHKHD3z4WR/biBJl6kx2K0S1o/ewBEolUniNbiDJN0OReL0QCCxZJ/egdTXaig1iw4NW1Q4OcvchhwUL5f2peZ4Adi9n3WpxEfLRZsRADO5p875YUhiw6WlDRNdVT3RXoYUFMLK78nKfOrgesWTzUKTZ1eO+wZCG6ozNVLjwXoK/FFLpclItQyFu2RYtACQXhpxmLFp4Sii0v0K6sTS1EkW5fpz7x0Z6FeHVXauQEVi2IND48nsuBLHwti6WUxJIPDosWYnyUktIC/fDMLBbSr0d7fuy0aCGO1nvpHpDAqkUi3XPq6/oTVi2e9SVOOl+mGNYiRSupdM6MXvMMsGvx+mYkf7BqIV7+50j8a+cOigCGgRgG8mdtFJ7Zh0qhbXKxpRCvg/gwiV+UWKyIZZvYwIitnBhqiPGOGHSJkd84/BDHQOJATEQDREhixEVEcEZEiESYasTKRMBuVA1E6ULUT0YRR1SSRjlL1NRGYU+gCwbEQeAsBthDIE4G7GVgbwQAaKCQBhRq4LEGKEwg0wY8bmD0hlBgqBWGZGLoNoh4ZChYhoxmaHmIoGiomoi0iui7iMiMKN2I3K5o/siFB8zVDz3HZ3wCSKUyWTmTAAAAAElFTkSuQmCC"

    prevIcon.addEventListener('click', ()=>{
      this.showPrevImg()
    })
    nextIcon.addEventListener('click', ()=>{
      this.showNextImg()
    })
    this.imgContainer.append(prevIcon)
    this.imgContainer.append(nextIcon)

    if (this.position === 'left-bottom') {
      this.imgContainer.style.left = '0px'
      this.imgContainer.style.bottom = '0px'
    } else if (this.position === 'left-top') {
      this.imgContainer.style.left = '0px'
      this.imgContainer.style.top = '0px'
    } else if (this.position === 'right-bottom') {
      this.imgContainer.style.right = '0px'
      this.imgContainer.style.bottom = '0px'
    } else if (this.position === 'left-mid') {
      this.imgContainer.style.left = '0px'
      this.imgContainer.style.top = '50%'
    } else if (this.position === 'right-mid') {
      this.imgContainer.style.right = '0px'
      this.imgContainer.style.top = '50%'
    } else {
      this.imgContainer.style.right = '0px'
      this.imgContainer.style.top = '0px'
    }
  }


  // 这个只能获取 当前绑定的 framebuffer 的 colorattachment0
  getCapture(
    gl: WebGLRenderingContext,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    textureCubeMapFace: number,
    textureLayer: number,
    type = WebGlConstants.UNSIGNED_BYTE.value) {
    const attachmentVisualState = {
      attachmentName: name,
      src: null as string,
      textureCubeMapFace: textureCubeMapFace ? WebGlConstantsByValue[textureCubeMapFace].name : null,
      textureLayer,
    };

    if (!this.quickCapture) {
      try {
        // Read the pixels from the context.
        const pixels = ReadPixelsHelper.readPixels(gl, x, y, width, height, type);
        if (pixels) {
          // Copy the pixels to a working 2D canvas same size.
          this.workingCanvas.width = width;
          this.workingCanvas.height = height;
          const imageData = this.workingContext2D.createImageData(Math.ceil(width), Math.ceil(height));
          imageData.data.set(pixels);
          this.workingContext2D.putImageData(imageData, 0, 0);

          // Copy the pixels to a resized capture 2D canvas.
          if (!this.fullCapture) {
            const imageAspectRatio = width / height;
            if (imageAspectRatio < 1) {
              this.captureCanvas.width =
                VisualState.captureBaseSize * imageAspectRatio;
              this.captureCanvas.height =
                VisualState.captureBaseSize;
            } else if (imageAspectRatio > 1) {
              this.captureCanvas.width =
                VisualState.captureBaseSize;
              this.captureCanvas.height =
                VisualState.captureBaseSize / imageAspectRatio;
            } else {
              this.captureCanvas.width =
                VisualState.captureBaseSize;
              this.captureCanvas.height =
                VisualState.captureBaseSize;
            }
          } else {
            this.captureCanvas.width = this.workingCanvas.width;
            this.captureCanvas.height = this.workingCanvas.height;
          }

          this.captureCanvas.width = Math.max(this.captureCanvas.width, 1);
          this.captureCanvas.height = Math.max(this.captureCanvas.height, 1);

          // Scale and draw to flip Y to reorient readPixels.
          this.captureContext2D.globalCompositeOperation = "copy";
          this.captureContext2D.scale(1, -1); // Y flip
          this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
          this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
          this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
          this.captureContext2D.globalCompositeOperation = "source-over";

          // get the screen capture
          const src = this.captureCanvas.toDataURL();
          attachmentVisualState.src = src
          this.imgSrcAry.push({
            src,
            name
          })
          this.showFirstImg()
        }
      }
      catch (e) {
        // Do nothing in case of error at this level.
        console.error("Spector can not capture the visual state: " + e);
      }
    }

    // this.currentState["Attachments"].push(attachmentVisualState);
  }
  showFirstImg(){
    const imgData = this.imgSrcAry[0]
    this.show(imgData)
  }
  show(imgData: {src: string, name: string}) {
    // should be a queue  按照顺序加载 加载完成 在加载下一个
    this.curShowImg = imgData
    const {src, name} = imgData
    this.updateStatusContainer(name)
    this.img.src = src
    this.img.alt = name
    this.img.title = name
    this.img.style.width = '200px'
    this.img.onload = () => {
      //
    }
  }

  showNextImg (){
    console.log(' next img ');
    if(this.curShowImg){
      const idx = this.imgSrcAry.indexOf(this.curShowImg)
      const nextimgIdx = Math.min(this.imgSrcAry.length-1, idx+1)
      const nextImg = this.imgSrcAry[nextimgIdx]
      this.show(nextImg)
    }
  }
  showPrevImg (){
    console.log(' prev img ');
    if(this.curShowImg){
      const idx = this.imgSrcAry.indexOf(this.curShowImg)
      const previmgIdx = Math.max(0, idx-1)
      const nextImg = this.imgSrcAry[previmgIdx]
      this.show(nextImg)
    }

  }
}
