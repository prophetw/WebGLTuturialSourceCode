import { ExtensionList, IContextInformation } from "./contextInformation";
import { ReadPixelsHelper } from "./readPixelsHelper";
import {
  WebGlConstantsByName,
  WebGlConstant,
  WebGlConstants,
  WebGlConstantsByValue,
} from "./webglConstants";
import { WebGlObjects } from "./baseWebGlObject";

export interface IRenderBufferRecorderData {
  target: string;
  internalFormat: number;
  width: number;
  height: number;
  length: number;
  samples: number;
}
export interface ITextureRecorderData {
  target: string;
  internalFormat: number;
  width: number;
  height: number;
  length: number;
  format?: number;
  type?: number;
  depth?: number;
  isCompressed: boolean;
}
interface ImgData {
  src: string;
  name: string; // like COLOR_ATTACHMENT0 gl inner name
  uname: string; // img custom name set by user
}
type Position =
  | "right-top"
  | "right-bottom"
  | "right-mid"
  | "left-bottom"
  | "left-top"
  | "left-mid";
export class VisualState {
  public static captureBaseSize = 256;

  blendState?: {
    [key: string]: any
  }
  depthState?: {
    [key: string]: any
  }
  quickCapture: boolean;
  fullCapture: boolean;
  NOTE: string;
  idPrefix: string;
  statusName: string;
  programInfo: any;
  context: WebGLRenderingContext | WebGL2RenderingContext;
  contextVersion: number;
  extensions: ExtensionList;
  currentState: {
    [key: string]: any;
  };
  MAXCAPIMGNUM: number;
  options: IContextInformation;
  img: HTMLImageElement;
  imgContainer: HTMLDivElement;
  sourceContainer: HTMLDivElement;
  statusContainer: HTMLDivElement;
  position: Position;
  imgSrcAry: ImgData[];
  imgFilterAry: ImgData[];
  curShowImg: undefined | ImgData;
  private readonly captureFrameBuffer: WebGLFramebuffer;
  private readonly workingCanvas: HTMLCanvasElement;
  private readonly captureCanvas: HTMLCanvasElement;
  private readonly workingContext2D: CanvasRenderingContext2D;
  private readonly captureContext2D: CanvasRenderingContext2D;

  /**
   *
   * @param options
   * @param imgPosition
   * @param max_capture_img_num
   * @example
   * ```ts
   * const visualState = new VisualState({
   *  context: gl,
   *  contextVersion: 2,
   *  toggleCapture: (capture: boolean) => {
   *   if (capture) {
   *    visualState.capture();
   *   } else {
   *   visualState.stopCapture();
   *   }
   * }, "right-top", 30);
   * ```
   */
  constructor(
    options: IContextInformation,
    imgPosition: Position,
    max_capture_img_num = 30
  ) {
    this.NOTE = "必须引入 Spector.js 基于其进行的修改";
    this.MAXCAPIMGNUM = max_capture_img_num;
    this.position = imgPosition;
    this.idPrefix = "pre_" + parseInt("" + Math.random() * 314);
    this.img = document.createElement("img");
    this.quickCapture = false;
    this.fullCapture = true;
    this.options = options;
    this.context = options.context;
    this.contextVersion = options.contextVersion;
    this.currentState = {};
    this.extensions = {};
    this.statusName = "";
    this.programInfo = undefined;
    if (options.extensions !== undefined) {
      this.extensions = options.extensions;
    }
    this.contextVersion = options.contextVersion;
    this.captureFrameBuffer =
      options.context.createFramebuffer() as WebGLFramebuffer;
    this.workingCanvas = document.createElement("canvas");
    this.workingContext2D = this.workingCanvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    this.captureCanvas = document.createElement("canvas");
    this.captureContext2D = this.captureCanvas.getContext(
      "2d"
    ) as CanvasRenderingContext2D;
    this.captureContext2D.imageSmoothingEnabled = true;
    (this.captureContext2D as any).mozImageSmoothingEnabled = true;
    (this.captureContext2D as any).oImageSmoothingEnabled = true;
    (this.captureContext2D as any).webkitImageSmoothingEnabled = true;
    (this.captureContext2D as any).msImageSmoothingEnabled = true;
    this.imgSrcAry = [];
    this.imgFilterAry = [];
    this.imgContainer = document.createElement("div");
    this.imgContainer.append(this.img);
    this.statusContainer = document.createElement("div");
    this.imgContainer.append(this.statusContainer);
    this.initImgContainer();
    this.sourceContainer = document.createElement("div");
    this.initSourceContainer();
    document.body.append(this.imgContainer);
    document.body.append(this.sourceContainer);
    this.initHTMLEvent();
  }

  initSourceContainer() {
    this.sourceContainer.style.display = "none";
    this.sourceContainer.style.background = "white";
    this.sourceContainer.style.width = "80%";
    this.sourceContainer.style.height = "80%";
    this.sourceContainer.style.overflow = "auto";
    this.sourceContainer.style.top = "0px";
    this.sourceContainer.style.left = "0px";
    this.sourceContainer.style.position = "absolute";
    this.sourceContainer.innerHTML = `
            <span style="position: absolute; right: 40px; top: 10px;" id="${this.idPrefix}closeBtn">关闭</span>
            <pre style="white-space: pre-wrap;word-wrap: break-word; overflow: auto; padding: 20px; height: calc(100% - 68px);" id="${this.idPrefix}source_container"></pre>
        `;
  }
  initHTMLEvent() {
    this.imgContainer.addEventListener("click", (e: MouseEvent) => {
      // @ts-ignore
      if (e && e.target && e.target.className === "fragBtn") {
        this.showShaderSource("frag");
      }
      // @ts-ignore
      if (e && e.target && e.target.className === "clear") {
          this.clear();
      }
      // @ts-ignore
      if (e && e.target && e.target.className === "vertBtn") {
        this.showShaderSource("vert");
      }
      // @ts-ignore
      if (e.target.className === "blendBtn") {
        this.showBlendState()
      }
    });
    document.addEventListener('keydown', e=>{
        if(e.code === 'Escape' || e.key === 'Escape'){
            this.closeShaderContainer()
        }
    })
    this.sourceContainer.addEventListener("click", (e: MouseEvent) => {
      // @ts-ignore
      if (e && e.target && e.target.id === `${this.idPrefix}closeBtn`) {
        this.closeShaderContainer();
      }
    });
  }
  showShaderContainer() {
    this.sourceContainer.style.display = "block";
  }
  closeShaderContainer() {
    this.sourceContainer.style.display = "none";
  }
  showShaderSource(type = "frag") {
    if (this.programInfo !== undefined) {
      if (this.programInfo.__SPECTOR_Object_CustomData) {
        const { shaders } = this.programInfo.__SPECTOR_Object_CustomData;
        let source = "";
        if (type === "frag") {
          if (shaders[0].name === "Fragment") {
            source = shaders[0].source;
          }
          if (shaders[1].name === "Fragment") {
            source = shaders[1].source;
          }
        }
        if (type === "vert") {
          if (shaders[0].name === "Vertex") {
            source = shaders[0].source;
          }
          if (shaders[1].name === "Vertex") {
            source = shaders[1].source;
          }
        }
        const container = document.getElementById(
          `${this.idPrefix}source_container`
        );
        this.showShaderContainer();
        if (container !== null) {
          container.innerHTML = source;
        }
      }
    } else {
      // eslint-disable-next-line no-alert
      alert(" no source detect");
    }
  }
  updateStatusContainer(name = "", uname = "") {
    let curIndex = 0;
    if (this.curShowImg) {
      curIndex = this.imgSrcAry.indexOf(this.curShowImg);
    }
    const customName = uname || this.statusName;
    const total = this.imgSrcAry.length;
    this.statusContainer.title = `${curIndex + 1
      }/${total} ${customName} ${name} `;
    this.statusContainer.innerHTML = `
            <span style="position:absolute; top:0px; display: inline-block; background: rgba(0.5, 0.5, 0.5,0.5);">${customName}</span>
            <span style="position:absolute; top:0px; right: 60px; display: inline-block; background: rgba(0.5, 0.5, 0.5,0.5);cursor: pointer;" class="clear">Clear</span>
            <span style="position:absolute; top:0px; right: 0px; display: inline-block; background: rgba(0.5, 0.5, 0.5,0.5);cursor: pointer;" class="fragBtn">Frag</span>
            <span style="position:absolute; top:0px; right: 30px; display: inline-block; background: rgba(0.5, 0.5, 0.5,0.5); cursor: pointer;" class="vertBtn">Vert</span>
            <span style="position:absolute; top:20px; right: 0px; display: inline-block; background: rgba(0.5, 0.5, 0.5,0.5);cursor: pointer;" class="blendBtn">Blend</span>
            <span style="position:absolute; bottom:0px; display: inline-block; background: rgba(0.5, 0.5, 0.5,0.5);">
                ${curIndex + 1}/${total} ${name}
            </span>
        `;
  }

  initImgContainer() {
    this.imgContainer.style.minWidth = "200px";
    this.imgContainer.style.minHeight = "200px";
    this.imgContainer.style.position = "absolute";
    this.imgContainer.style.boxSizing = "border-box";
    this.imgContainer.style.border = "1px solid #666";
    this.statusContainer.style.position = "absolute";
    this.statusContainer.style.left = "0px";
    this.statusContainer.style.bottom = "0px";
    this.statusContainer.style.height = "100%";
    this.statusContainer.style.fontSize = "12px";
    this.statusContainer.style.width = "100%";
    // this.statusContainer.style.background = 'rgba(0.5, 0.5, 0.5, 0.5)';
    this.statusContainer.style.color = "white";
    const prevIcon = document.createElement("img");
    const nextIcon = document.createElement("img");
    prevIcon.style.position = "absolute";
    prevIcon.style.background = "white";
    prevIcon.style.left = "0px";
    prevIcon.style.top = "40%";
    prevIcon.style.width = "20px";
    prevIcon.style.height = "20px";
    prevIcon.style.cursor = "pointer";
    prevIcon.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAMAAABmmnOVAAAAhFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8qm6wAAAAK3RSTlMA+xLJXx7FBaGK7UUmDgra03w6zVZMpata9fHfurCWhVE1K+riv72Db2cY2Bh2eAAAA7NJREFUeNrUmNuyojAQRRuScI0ojHhXRrwdzf//38yDMTQqlQRIzaw3q86JC7K7OxH+Y/yCVotdMNsmnpdsZ8FuUdHCB2dMyphsxEc2JC4nMDZhGhNPdOKROA1hPIpDIrRIDgWMAr9thQHbG4ehOe6FMfsjDEl6FVZc0+EUSFcOk6QrqWQYDbb8XIyLfH7kjwz+kj34cZ5Hnwt3yfrXZL4Wbc4RZV+EaXQWbdZ52HMnpqLF5c6hE36/iBbTFOwJ4/ZqOQMNWN52j0PrNAQ4gssCtCmWOK6BZTLKBClEHIzgEdJISrAgRgoHBsawA9KIzeOwQC+zBitqtKELw2BkO6E4UbCGnoRil4EBPhGKyIce+JFQEIOlWKPC1hR6QteNGmfa8g2HWQ29qWcNC18zD6SxFRkMQNbYEqK1YtjIZAUDUTXSqVMjjdr8gcH4aVSqSY/yVjAgK0+/a5XKoYRBKZVFCZ0wNS9WMDArNUdYZygDkzzY5yIItQJRwQhUOrFIVX+AUVD9Iv26GdNXn8xgFLLZq3N+25D8NS9qMMbXOsHVrzmSw0fY6w+ohcNM7HUs6OtBGXxiqQJh4yCkhWYslp2pPPlWDpoW/qkrm0Rtho2DtNDfENLxIgJzh18Cv+Nugu+v4ipHRm3uYDZvak/e2aHFUTw59HH4DTocxJMjYPZyHTa6AzBPRggQXJXnuA64TDk0ucmFuAMH4PJV3KDJVqbbhYPqi1toUIgnhRMH/H3tvE7Hc8BM32sxTORoc+CABnYSvndLZukwB0MY6proVHcxcSDIwZTL2zlPrnd35gD39hSbyLLlzhyAy/+etC48Z9BlghysOKuLEIpE5MYBt+64FQnq0AFoKxQbWaDmDiuQ2Bbp5hky+dGVA350HzVy4tQBCBof1CSXk2AgB1igJFZycLhywOOjQkpzMwcK/ZijX4928tjpygEfrXfoHsCdOgBH9xx5fXo4dYCH/BkCnS8z6CQb1gEydM5Mnis7cEA8Z3eCPjh0QA//70j8aecOigCGgRgG8mdtFJ7Zh0qhbXKxpRCvg/gwiV+UWKyIZZvYwIitnBhqiPGOGHSJkd84/BDHQOJATEQDREhixEVEcEZEiESYasTKRMBuVA1E6ULUT0YRR1SSRjlL1NRGYU+gCwbEQeAsBthDIE4G7GVgbwQAaKCQBhRq4LEGKEwg0wY8bmD0hlBgqBWGZGLoNoh4ZChYhoxmaHmIoGiomoi0iui7iMiMKN2I3K5o/siFB8zVDz3HZ8W8SKUu1T3kAAAAAElFTkSuQmCC";
    nextIcon.style.background = "white";
    nextIcon.style.position = "absolute";
    nextIcon.style.right = "0px";
    nextIcon.style.top = "40%";
    nextIcon.style.width = "20px";
    nextIcon.style.height = "20px";
    nextIcon.style.cursor = "pointer";
    nextIcon.src =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIQAAACECAMAAABmmnOVAAAAhFBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD8qm6wAAAAK3RSTlMA+xLJXx7FBaGK7UUmDgra03w6zVZMpata9fHfurCWhVE1K+riv72Db2cY2Bh2eAAAA7NJREFUeNrUmNmWojAURQ+EIJMotDgrLU6l+f//6xdJSErphCGrar+5llRtknPvTcQvxs29crn357vIcaLd3N8vSy93YY1pEZIte8uWhMUUYzOJQ+KwVhwSxhOMR36MmBbRMccoJPcdM2B3TzA0pwMz5nDCkMQ31olbPJwCacthFLUllQyjQVfvi3GZLU7JMwWA9JmcFlnwvnBXtH9NZhumcgk8+kHYCy5MZZP1rNh4xhSujwStJI8rU5jFfZYhVP9aRqEBzVT3sPNiUF+O4CqHNvlKjqtP0YkikhSCBEYkgaQRFehAKCkcKYyhR0kjNI/DUlrMCp2opA1dGgYj3TPB2UNnvDMT7FMY4BImCFz0wA2YgLjQhjYqbOOhJ96mUeNUW77hMK/Qm2resHA180AYJ0gxAGnAOCTVqotGJksMRNlIp06NNGrzC4Px1ahUkx7lrDEga0e/axXCocCgFMKiQCtUzIs1BmYt5ghtDaWvk4f+ufAnWoEoMQKlTixi0R8wCqJfxB83Y8b7ZIpRSOe8c37akIzPi0rr7OfCmIrPkQxvofwLno7Dgc07WHj8RSneseKB0HNg3KJTLFatqTy7eg7dLNxzWzYJ3ww9B27RdUNIy0L4+D/iZvjH3ML/vBS3emRUZnPA3KKqH75B4cReHKHD3z4WR/biBJl6kx2K0S1o/ewBEolUniNbiDJN0OReL0QCCxZJ/egdTXaig1iw4NW1Q4OcvchhwUL5f2peZ4Adi9n3WpxEfLRZsRADO5p875YUhiw6WlDRNdVT3RXoYUFMLK78nKfOrgesWTzUKTZ1eO+wZCG6ozNVLjwXoK/FFLpclItQyFu2RYtACQXhpxmLFp4Sii0v0K6sTS1EkW5fpz7x0Z6FeHVXauQEVi2IND48nsuBLHwti6WUxJIPDosWYnyUktIC/fDMLBbSr0d7fuy0aCGO1nvpHpDAqkUi3XPq6/oTVi2e9SVOOl+mGNYiRSupdM6MXvMMsGvx+mYkf7BqIV7+50j8a+cOigCGgRgG8mdtFJ7Zh0qhbXKxpRCvg/gwiV+UWKyIZZvYwIitnBhqiPGOGHSJkd84/BDHQOJATEQDREhixEVEcEZEiESYasTKRMBuVA1E6ULUT0YRR1SSRjlL1NRGYU+gCwbEQeAsBthDIE4G7GVgbwQAaKCQBhRq4LEGKEwg0wY8bmD0hlBgqBWGZGLoNoh4ZChYhoxmaHmIoGiomoi0iui7iMiMKN2I3K5o/siFB8zVDz3HZ3wCSKUyWTmTAAAAAElFTkSuQmCC";
    prevIcon.addEventListener("click", () => {
      this.showPrevImg();
    });
    nextIcon.addEventListener("click", () => {
      this.showNextImg();
    });
    this.imgContainer.append(prevIcon);
    this.imgContainer.append(nextIcon);
    if (this.position === "left-bottom") {
      this.imgContainer.style.left = "0px";
      this.imgContainer.style.bottom = "0px";
    } else if (this.position === "left-top") {
      this.imgContainer.style.left = "0px";
      this.imgContainer.style.top = "0px";
    } else if (this.position === "right-bottom") {
      this.imgContainer.style.right = "0px";
      this.imgContainer.style.bottom = "0px";
    } else if (this.position === "left-mid") {
      this.imgContainer.style.left = "0px";
      this.imgContainer.style.top = "30%";
    } else if (this.position === "right-mid") {
      this.imgContainer.style.right = "0px";
      this.imgContainer.style.top = "30%";
    } else {
      this.imgContainer.style.right = "0px";
      this.imgContainer.style.top = "0px";
    }
  }

  getProgramInfo() {
    if (this.programInfo === undefined) {
      const curProgram = WebGlConstants.CURRENT_PROGRAM.value;
      const pInfo = this.context.getParameter(curProgram);
      this.programInfo = pInfo;
    }
  }

  readFromContext(name = ""): void {
    this.getDepthState()
    this.getBlendState()
    this.getProgramInfo()
    if (this.imgSrcAry.length >= this.MAXCAPIMGNUM) {
      return;
    }
    this.statusName = name;
    const gl = this.context;
    this.currentState["Attachments"] = [];
    const frameBuffer = this.context.getParameter(
      WebGlConstants.FRAMEBUFFER_BINDING.value
    );
    if (!frameBuffer) {
      this.currentState["FrameBuffer"] = null;
      this.getCapture(
        gl,
        "Canvas COLOR_ATTACHMENT",
        0,
        0,
        gl.drawingBufferWidth,
        gl.drawingBufferHeight,
        0,
        0,
        WebGlConstants.UNSIGNED_BYTE.value
      );
      return;
    }
    const viewport = gl.getParameter(gl.VIEWPORT);
    const x = viewport[0];
    const y = viewport[1];
    const width = viewport[2];
    const height = viewport[3];
    this.currentState["FrameBuffer"] = this.getSpectorData(frameBuffer);

    // Check FBO status.
    const status = this.context.checkFramebufferStatus(
      WebGlConstants.FRAMEBUFFER.value
    );
    this.currentState["FrameBufferStatus"] = WebGlConstantsByValue[status].name;
    if (status !== WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
      return;
    }
    // @ts-ignore
    const drawBuffersExtension = this.extensions[WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
    if (drawBuffersExtension || this.contextVersion === 1) {
      // const maxDrawBuffers = this.context.getParameter(WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
      const maxDrawBuffers = 8;
      for (let i = 0; i < maxDrawBuffers; i++) {
        this.readFrameBufferAttachmentFromContext(
          this.context,
          frameBuffer,
          WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"],
          x,
          y,
          width,
          height
        );
      }
    } else if (this.contextVersion > 1) {
      const context2 = this.context;
      const maxDrawBuffers = context2.getParameter(
        WebGlConstants.MAX_DRAW_BUFFERS.value
      );
      for (let i = 0; i < maxDrawBuffers; i++) {
        this.readFrameBufferAttachmentFromContext(
          this.context,
          frameBuffer,
          WebGlConstantsByName["COLOR_ATTACHMENT" + i],
          x,
          y,
          width,
          height
        );
      }
    } else {
      this.readFrameBufferAttachmentFromContext(
        this.context,
        frameBuffer,
        WebGlConstantsByName["COLOR_ATTACHMENT0"],
        x,
        y,
        width,
        height
      );
    }
  }

  protected readFrameBufferAttachmentFromContext(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    frameBuffer: WebGLFramebuffer,
    webglConstant: WebGlConstant,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const target = WebGlConstants.FRAMEBUFFER.value;
    const type = this.context.getFramebufferAttachmentParameter(
      target,
      webglConstant.value,
      WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value
    );
    if (type === WebGlConstants.NONE.value) {
      return;
    }
    const storage = this.context.getFramebufferAttachmentParameter(
      target,
      webglConstant.value,
      WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value
    );
    if (!storage) {
      return;
    }
    const componentType =
      this.contextVersion > 1
        ? this.context.getFramebufferAttachmentParameter(
          target,
          webglConstant.value,
          WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE.value
        )
        : WebGlConstants.UNSIGNED_BYTE.value;

    const componentTypeName = WebGlConstantsByValue[componentType] && WebGlConstantsByValue[componentType].name
    const typeName = WebGlConstantsByValue[type] && WebGlConstantsByValue[type].name
    // console.log(`componentTypeName: ${componentTypeName} ${componentType}`);
    // console.log(`typeName: ${typeName}  ${type}`);
    if (type === WebGlConstants.RENDERBUFFER.value) {
      this.readFrameBufferAttachmentFromRenderBuffer(
        gl,
        frameBuffer,
        webglConstant,
        x,
        y,
        width,
        height,
        target,
        componentType,
        storage
      );
    } else if (type === WebGlConstants.TEXTURE.value) {
      this.readFrameBufferAttachmentFromTexture(
        gl,
        frameBuffer,
        webglConstant,
        x,
        y,
        width,
        height,
        target,
        componentType,
        storage
      );
    }
  }

  protected readFrameBufferAttachmentFromRenderBuffer(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    frameBuffer: WebGLFramebuffer,
    webglConstant: WebGlConstant,
    x: number,
    y: number,
    width: number,
    height: number,
    target: number,
    componentType: number,
    storage: any
  ): void {
    let samples = 0;
    let internalFormat = 0;
    if (storage.__SPECTOR_Object_CustomData) {
      const info =
        storage.__SPECTOR_Object_CustomData as IRenderBufferRecorderData;
      width = info.width;
      height = info.height;
      samples = info.samples;
      internalFormat = info.internalFormat;
      if (
        !samples &&
        !ReadPixelsHelper.isSupportedCombination(
          componentType,
          WebGlConstants.RGBA.value,
          internalFormat
        )
      ) {
        return;
      }
    } else {
      width += x;
      height += y;
    }
    x = y = 0;

    if (samples) {
      const gl2 = gl as WebGL2RenderingContext; // Samples only available in WebGL 2.
      const renderBuffer = gl.createRenderbuffer();
      const boundRenderBuffer = gl.getParameter(gl.RENDERBUFFER_BINDING);
      gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
      gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
      gl.bindRenderbuffer(gl.RENDERBUFFER, boundRenderBuffer);

      gl.bindFramebuffer(
        WebGlConstants.FRAMEBUFFER.value,
        this.captureFrameBuffer
      );
      gl.framebufferRenderbuffer(
        WebGlConstants.FRAMEBUFFER.value,
        WebGlConstants.COLOR_ATTACHMENT0.value,
        WebGlConstants.RENDERBUFFER.value,
        renderBuffer
      );

      const readFrameBuffer = gl2.getParameter(gl2.READ_FRAMEBUFFER_BINDING);
      const drawFrameBuffer = gl2.getParameter(gl2.DRAW_FRAMEBUFFER_BINDING);
      gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, frameBuffer);
      gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, this.captureFrameBuffer);

      gl2.blitFramebuffer(
        0,
        0,
        width,
        height,
        0,
        0,
        width,
        height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST
      );

      gl2.bindFramebuffer(
        WebGlConstants.FRAMEBUFFER.value,
        this.captureFrameBuffer
      );
      gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, readFrameBuffer);
      gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, drawFrameBuffer);

      const status = this.context.checkFramebufferStatus(
        WebGlConstants.FRAMEBUFFER.value
      );
      if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
        this.getCapture(
          gl,
          webglConstant.name,
          x,
          y,
          width,
          height,
          0,
          0,
          WebGlConstants.UNSIGNED_BYTE.value
        );
      }

      gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
      gl.deleteRenderbuffer(renderBuffer);
    } else {
      gl.bindFramebuffer(
        WebGlConstants.FRAMEBUFFER.value,
        this.captureFrameBuffer
      );
      gl.framebufferRenderbuffer(
        WebGlConstants.FRAMEBUFFER.value,
        WebGlConstants.COLOR_ATTACHMENT0.value,
        WebGlConstants.RENDERBUFFER.value,
        storage
      );
      const status = this.context.checkFramebufferStatus(
        WebGlConstants.FRAMEBUFFER.value
      );
      if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
        this.getCapture(
          gl,
          webglConstant.name,
          x,
          y,
          width,
          height,
          0,
          0,
          componentType
        );
      }
      gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
    }
  }
  protected readFrameBufferAttachmentFromTexture(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    frameBuffer: WebGLFramebuffer,
    webglConstant: WebGlConstant,
    x: number,
    y: number,
    width: number,
    height: number,
    target: number,
    componentType: number,
    storage: any
  ): void {
    let textureLayer = 0;
    if (this.contextVersion > 1) {
      textureLayer = this.context.getFramebufferAttachmentParameter(
        target,
        webglConstant.value,
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value
      );
    }

    const textureLevel = this.context.getFramebufferAttachmentParameter(
      target,
      webglConstant.value,
      WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value
    );
    const textureCubeMapFace = this.context.getFramebufferAttachmentParameter(
      target,
      webglConstant.value,
      WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value
    );
    const textureCubeMapFaceName =
      textureCubeMapFace > 0
        ? WebGlConstantsByValue[textureCubeMapFace].name
        : WebGlConstants.TEXTURE_2D.name;

    // Adapt to constraints defines in the custom data if any.
    let knownAsTextureArray = false;
    let textureType = componentType;
    if (storage.__SPECTOR_Object_CustomData) {
      const info = storage.__SPECTOR_Object_CustomData as ITextureRecorderData;
      width = info.width;
      height = info.height;
      if(info.type){
        textureType = info.type;
      }
      knownAsTextureArray =
        info.target === WebGlConstants.TEXTURE_2D_ARRAY.name;
      // @ts-ignore
      if (
        !ReadPixelsHelper.isSupportedCombination(
          // @ts-ignore
          info.type,
          info.format,
          info.internalFormat
        )
      ) {
        return;
      }
    } else {
      width += x;
      height += y;
    }
    x = y = 0;

    gl.bindFramebuffer(
      WebGlConstants.FRAMEBUFFER.value,
      this.captureFrameBuffer
    );
    if (textureLayer > 0 || knownAsTextureArray) {
      (gl as WebGL2RenderingContext).framebufferTextureLayer(
        WebGlConstants.FRAMEBUFFER.value,
        WebGlConstants.COLOR_ATTACHMENT0.value,
        storage,
        textureLevel,
        textureLayer
      );
    } else {
      gl.framebufferTexture2D(
        WebGlConstants.FRAMEBUFFER.value,
        WebGlConstants.COLOR_ATTACHMENT0.value,
        textureCubeMapFace
          ? textureCubeMapFace
          : WebGlConstants.TEXTURE_2D.value,
        storage,
        textureLevel
      );
    }

    const status = this.context.checkFramebufferStatus(
      WebGlConstants.FRAMEBUFFER.value
    );
    if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
      this.getCapture(
        gl,
        webglConstant.name,
        x,
        y,
        width,
        height,
        textureCubeMapFace,
        textureLayer,
        textureType
      );
    }

    gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
  }
  // 这个只能获取 当前绑定的 framebuffer 的 colorattachment0
  getCapture(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    name: string,
    x: number,
    y: number,
    width: number,
    height: number,
    textureCubeMapFace: number,
    textureLayer: number,
    type: number // 如果tex使用的 float 这个地方需要传float
  ) {
    if (this.imgSrcAry.length >= this.MAXCAPIMGNUM) {
      return;
    }
    const attachmentVisualState = {
      attachmentName: name,
      src: "",
      textureCubeMapFace: textureCubeMapFace
        ? WebGlConstantsByValue[textureCubeMapFace].name
        : null,
      textureLayer,
    };
    if (!this.quickCapture) {
      try {
        const pixels = ReadPixelsHelper.readPixels(
          // @ts-ignore
          gl,
          x,
          y,
          width,
          height,
          type
        );
        if (pixels) {
          this.workingCanvas.width = width;
          this.workingCanvas.height = height;
          const imageData = this.workingContext2D.createImageData(
            Math.ceil(width),
            Math.ceil(height)
          );
          imageData.data.set(pixels);
          this.workingContext2D.putImageData(imageData, 0, 0);
          if (!this.fullCapture) {
            const imageAspectRatio = width / height;
            if (imageAspectRatio < 1) {
              this.captureCanvas.width =
                VisualState.captureBaseSize * imageAspectRatio;
              this.captureCanvas.height = VisualState.captureBaseSize;
            } else if (imageAspectRatio > 1) {
              this.captureCanvas.width = VisualState.captureBaseSize;
              this.captureCanvas.height =
                VisualState.captureBaseSize / imageAspectRatio;
            } else {
              this.captureCanvas.width = VisualState.captureBaseSize;
              this.captureCanvas.height = VisualState.captureBaseSize;
            }
          } else {
            this.captureCanvas.width = this.workingCanvas.width;
            this.captureCanvas.height = this.workingCanvas.height;
          }
          this.captureCanvas.width = Math.max(this.captureCanvas.width, 1);
          this.captureCanvas.height = Math.max(this.captureCanvas.height, 1);
          this.captureContext2D.globalCompositeOperation = "copy";
          this.captureContext2D.scale(1, -1);
          this.captureContext2D.translate(0, -this.captureCanvas.height);
          this.captureContext2D.drawImage(
            this.workingCanvas,
            0,
            0,
            width,
            height,
            0,
            0,
            this.captureCanvas.width,
            this.captureCanvas.height
          );
          this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
          this.captureContext2D.globalCompositeOperation = "source-over";
          const src = this.captureCanvas.toDataURL();
          attachmentVisualState.src = src;
          this.imgSrcAry.push({
            src,
            name: name,
            uname: this.statusName,
          });
          this.showFirstImg();
        }
      } catch (e) {
        console.error("Spector can not capture the visual state: " + e);
      }
    }
    // this.currentState["Attachments"].push(attachmentVisualState);
  }
  showFirstImg() {
    const imgData = this.imgSrcAry[0];
    this.show(imgData);
  }
  show(imgData: ImgData) {
    // should be a queue  按照顺序加载 加载完成 在加载下一个
    this.curShowImg = imgData;
    const { src, name, uname } = imgData;
    this.updateStatusContainer(name, uname);
    this.img.src = src;
    this.img.alt = name;
    this.img.title = name;
    this.img.style.width = "200px";
  }

  showImgByName(customName = "") {
    const sameNameImgIdx: number[] = [];
    this.imgSrcAry.map((imgData, index) => {
      const { uname } = imgData;
      if (uname === customName) {
        sameNameImgIdx.push(index + 1);
      }
    });
    console.log(" same name idx ", sameNameImgIdx);
    console.log(" use showImgByIndex jump ");
  }

  showImgByIndex(idx: number) {
    const idxNotBeyondLen = Math.min(this.imgSrcAry.length - 1, idx - 1);
    const imgidx = Math.max(0, idxNotBeyondLen);
    const img = this.imgSrcAry[imgidx];
    this.show(img);
  }
  showNextImg() {
    if (this.imgFilterAry.length > 0) {
      // show from imgFilterAry
      // @ts-ignore
      let curIdx = this.imgFilterAry.indexOf(this.curShowImg)
      let nextImgIndex = -1
      const nextShowImg = this.imgFilterAry[curIdx + 1]
      nextImgIndex = this.imgSrcAry.indexOf(nextShowImg)
      this.showImgByIndex(nextImgIndex)
      return
    }
    let idx = -1;
    // @ts-ignore
    idx = this.imgSrcAry.indexOf(this.curShowImg);
    let nextimgIdx = Math.min(this.imgSrcAry.length - 1, idx + 1);
    if (idx === nextimgIdx) {
      nextimgIdx = 0
    }
    const nextImg = this.imgSrcAry[nextimgIdx];
    this.show(nextImg);
  }
  showPrevImg() {
    if (this.imgFilterAry.length > 0) {
      // show from imgFilterAry
      // @ts-ignore
      const idx = this.imgFilterAry.indexOf(this.curShowImg) < 0 ? this.imgFilterAry.length : this.imgFilterAry.indexOf(this.curShowImg)
      let nextImgIndex = -1
      const nextShowImg = this.imgFilterAry[idx - 1]
      nextImgIndex = this.imgSrcAry.indexOf(nextShowImg)
      this.showImgByIndex(nextImgIndex)
      return
    }
    let idx = -1;
    // @ts-ignore
    idx = this.imgSrcAry.indexOf(this.curShowImg);
    let previmgIdx = Math.max(0, idx - 1);
    if (idx === previmgIdx) {
      previmgIdx = this.imgSrcAry.length - 1
    }
    const nextImg = this.imgSrcAry[previmgIdx];
    this.show(nextImg);
  }
  getSpectorData(object: any): any {
    if (!object) {
      return undefined;
    }

    return {
      __SPECTOR_Object_TAG:
        WebGlObjects.getWebGlObjectTag(object) ||
        this.options.tagWebGlObject(object),
      __SPECTOR_Object_CustomData: object.__SPECTOR_Object_CustomData,
      __SPECTOR_Metadata: object.__SPECTOR_Metadata,
    };
  }
  clear() {
    this.imgSrcAry = [];
    this.programInfo = undefined;
    this.updateStatusContainer();
  }
  getThis() {
    console.log("ThisObj 右键保存成全局变量 从命令行调用接口", this);
    return this;
  }
  updateFilter(name = "") {
    // 只关注 某些
    this.imgFilterAry = this.imgSrcAry
      .map((imgData) => {
        let match = false;
        const imgName = imgData.name.toLowerCase();
        const uname = imgData.uname.toLowerCase();
        if (imgName.indexOf(name.toLowerCase()) > -1) {
          match = true;
        }
        if (uname.indexOf(name.toLowerCase()) > -1) {
          match = true;
        }
        if (match) {
          return imgData;
        }
        return undefined;
      })
      .filter((a): a is ImgData => a !== undefined);
    console.log(
      `只关注属性值包含" ${name} "的img  filter结果: ${this.imgFilterAry.length}`
    );
  }
  resetFilter() {
    this.imgFilterAry = [];
  }
  saveImg(imgIndex = 0) {
    const imgData = this.imgSrcAry[imgIndex]
    if (imgData) {
      let a = document.createElement("a"); //Create <a>
      a.href = imgData.src
      a.download = `${imgIndex}.png`; //File name Here
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // @ts-ignore
      a = undefined;
    }
  }
  getDepthState() {
    if (this.depthState !== undefined) return
    const depthState: {[key: string]: any} = {
      DEPTH_TEST: WebGlConstants.DEPTH_TEST,
      DEPTH_WRITEMASK: WebGlConstants.DEPTH_WRITEMASK,
      DEPTH_RANGE: WebGlConstants.DEPTH_RANGE,
      DEPTH_FUNC: WebGlConstants.DEPTH_FUNC,
    }
    const result: {[key: string]: any} = {}
    Object.keys(depthState).map((key) => {
      const obj = depthState[key]
      const value = this.context.getParameter(obj.value)
      if (value === 1) {
        result[obj.name] = "ONE"
      } else if (value === 0) {
        result[obj.name] = "ZERO"
      } else {
        const showValue = WebGlConstantsByValue[value] && WebGlConstantsByValue[value].name || value
        if (showValue instanceof Float32Array) {
          result[obj.name] = showValue.toString()
        } else {
          result[obj.name] = showValue
        }
      }
    })
    this.depthState = result;
  }
  getBlendState() {
    if (this.blendState !== undefined) return
    const blendState: { [key: string]: any } = {
      BLEND: WebGlConstants.BLEND,
      BLEND_COLOR: WebGlConstants.BLEND_COLOR,
      BLEND_DST_ALPHA: WebGlConstants.BLEND_DST_ALPHA,
      BLEND_DST_RGB: WebGlConstants.BLEND_DST_RGB,
      BLEND_EQUATION_ALPHA: WebGlConstants.BLEND_EQUATION_ALPHA,
      BLEND_EQUATION_RGB: WebGlConstants.BLEND_EQUATION_RGB,
      BLEND_SRC_ALPHA: WebGlConstants.BLEND_SRC_ALPHA,
      BLEND_SRC_RGB: WebGlConstants.BLEND_SRC_RGB,
    }
    const result: { [key: string]: any } = {}
    Object.keys(blendState).map((key) => {
      const obj = blendState[key]
      const value = this.context.getParameter(obj.value)
      if (value === 1) {
        result[obj.name] = "ONE"
      } else if (value === 0) {
        result[obj.name] = "ZERO"
      } else {
        const showValue = WebGlConstantsByValue[value] && WebGlConstantsByValue[value].name || value
        if (showValue instanceof Float32Array) {
          result[obj.name] = showValue.toString()
        } else {
          result[obj.name] = showValue
        }
      }
    })
    this.blendState = result;
    // this.context.getParameter()
  }
  getWebglShowName(value: number){
        const showValue = WebGlConstantsByValue[value] && WebGlConstantsByValue[value].name || value
        console.log(showValue);
        return showValue
  }
  showBlendState() {
    const state = this.blendState
    if (state) {

      let str = `BlendState:
            `
      Object.keys(state).map(key => {
        str += `
${key}: ${state[key]}`

      })
      const contariner = document.getElementById(
        `${this.idPrefix}source_container`
      ) as HTMLElement
      if (this.depthState) {
        str += `

DepthState:
                `
        Object.keys(this.depthState).map(key => {
          str += `
${key}: ${this.depthState[key]}`
        })
      }
      this.showShaderContainer();
      contariner.innerHTML = str;
    }

  }

}
