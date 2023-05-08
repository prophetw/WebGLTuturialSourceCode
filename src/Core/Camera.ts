import * as twgl from 'twgl.js'
import { angleToRads } from '../../lib/utils'

class BoundingBox {
  min: twgl.v3.Vec3
  max: twgl.v3.Vec3
  center: twgl.v3.Vec3
  size: twgl.v3.Vec3
  constructor(min: twgl.v3.Vec3, max: twgl.v3.Vec3) {
    this.min = min;
    this.max = max;
    this.center = twgl.v3.divScalar(twgl.v3.add(this.min, this.max), 2);
    this.size = twgl.v3.subtract(this.max, this.min);
  }

  fromVec3Array(vec3Ary: twgl.v3.Vec3[]) {
    const min = twgl.v3.create(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    const max = twgl.v3.create(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
    vec3Ary.forEach(vec3 => {
      twgl.v3.min(min, vec3, min);
      twgl.v3.max(max, vec3, max);
    });
    this.min = min;
    this.max = max;
    this.center = twgl.v3.divScalar(twgl.v3.add(this.min, this.max), 2);
    this.size = twgl.v3.subtract(this.max, this.min);
  }

}

class ScreenSpaceEventHandler {
  canvas: HTMLCanvasElement
  camera: Camera
  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.camera = camera
    this.canvas = canvas
  }

  registerMouseEvent() {
    const canvas = this.canvas;
    let lastX = 0;
    let lastY = 0;
    let isDragging = false;

    canvas.addEventListener('mousedown', (event) => {
      lastX = event.clientX;
      lastY = event.clientY;
      isDragging = true;
    });

    canvas.addEventListener('mousemove', (event) => {
      if (isDragging) {
        const x = event.clientX;
        const y = event.clientY;
        const dx = x - lastX;
        const dy = y - lastY;
        const worldPos = this.camera.convertScreenCoordToWorldCoord(lastX, lastY);
        console.log(worldPos);
        if (event.shiftKey) {
          this.camera.rotateAroundPointX(dy * 0.01, worldPos);
          this.camera.rotateAroundPointY(dx * 0.01, worldPos);
        } else {
          this.camera.rotateAroundPointX(dy * 0.01, worldPos);
          this.camera.rotateAroundPointY(dx * 0.01, worldPos);
        }

        lastX = x;
        lastY = y;
      }
    });

    canvas.addEventListener('mouseup', (event) => {
      isDragging = false;
    });
    canvas.oncontextmenu = () => false;

  }

  registerMouseWheelEvent() {
    const canvas = this.canvas;
    canvas.addEventListener('wheel', (event) => {
      console.log(' wheel event', event.deltaY);
      const x = event.clientX;
      const y = event.clientY;
      // const NDC = this.camera.convertScreenCoordToNDC(x, y);
      const delta = event.deltaY * 0.01;
      this.camera.moveForward(-delta);
    });
  }

  registerKeyboradEvent() {
    document.addEventListener('keydown', (event) => {
      const key = event.key;
      switch (key) {
        // arrow keys
        case 'w':
          this.camera.translateAlongDirection(0.1);
          break;
        case 's':
          this.camera.translateAlongDirection(-0.1);
          break;
        case 'ArrowLeft':
        case 'a':
          this.camera.moveLeft(0.1);
          break;
        case 'ArrowRight':
        case 'd':
          this.camera.moveRight(0.1);
          break;
        case 'ArrowUp':
        case 'q':
          this.camera.moveUp(0.1);
          break;
        case 'ArrowDown':
        case 'e':
          this.camera.moveDown(0.1);
          break;
      }
    });
  }

  unregisterMouseEvent() {
    const canvas = this.canvas;
    canvas.removeEventListener('mousedown', () => { });
    canvas.removeEventListener('mousemove', () => { });
    canvas.removeEventListener('mouseup', () => { });
  }
  unregisterMouseWheelEvent() {
    const canvas = this.canvas;
    canvas.removeEventListener('wheel', () => { });
  }
  unregisterKeyboradEvent() {
    document.removeEventListener('keydown', () => { });
  }

  initEvent() {
    this.registerMouseEvent();
    this.registerMouseWheelEvent();
    this.registerKeyboradEvent();
  }
  unregisterEvent() {
    this.unregisterMouseEvent();
    this.unregisterMouseWheelEvent();
    this.unregisterKeyboradEvent();
  }
}

class Camera {
  canvas: HTMLCanvasElement
  private _position: twgl.v3.Vec3
  private _direction: twgl.v3.Vec3
  private _right: twgl.v3.Vec3
  private _up: twgl.v3.Vec3
  viewMatrix: twgl.m4.Mat4
  projectionViewMatrix: twgl.m4.Mat4
  inverseViewMatrix: twgl.m4.Mat4
  frustum: PerspectiveFrustum | OrthographicFrustum
  screenSpaceEventHandler: ScreenSpaceEventHandler

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this._position = twgl.v3.create();
    this._direction = twgl.v3.create();
    this._right = twgl.v3.create();
    this._up = twgl.v3.create(0, 1, 0);
    this.viewMatrix = twgl.m4.identity();
    this.inverseViewMatrix = twgl.m4.identity(); // camera matrix
    this.projectionViewMatrix = twgl.m4.identity();
    this.frustum = new PerspectiveFrustum(60, 1, 0.1, 100);
    this.screenSpaceEventHandler = new ScreenSpaceEventHandler(canvas, this);
    this.screenSpaceEventHandler.initEvent();
  }

  get position() {
    return this._position;
  }
  set position(position: twgl.v3.Vec3) {
    this._position = position;
    this.updateViewMatrix();
  }
  get direction() {
    return this._direction;
  }
  set direction(direction: twgl.v3.Vec3) {
    this._direction = direction;
    this.updateViewMatrix();
  }
  get right() {
    return this._right;
  }
  set right(right: twgl.v3.Vec3) {
    this._right = right;
    this.updateViewMatrix();
  }
  get up() {
    return this._up;
  }
  set up(up: twgl.v3.Vec3) {
    this._up = up;
    this.updateViewMatrix();
  }

  setFrustum(frustum: PerspectiveFrustum | OrthographicFrustum) {
    this.frustum = frustum;
    this.updateProjectionViewMatrix();
  }

  updateProjectionViewMatrix() {
    twgl.m4.multiply(this.frustum.projectionMatrix, this.viewMatrix, this.projectionViewMatrix);
  }

  updateViewMatrix() {

    const target = twgl.v3.add(this.position, this.direction);

    this.inverseViewMatrix = twgl.m4.lookAt(this.position, target, this.up);
    this.viewMatrix = twgl.m4.inverse(this.inverseViewMatrix);
    const normalizedFront = twgl.v3.normalize(this.direction);
    const normalizedUp = twgl.v3.normalize(this.up);
    const right = twgl.v3.cross(normalizedUp, normalizedFront);
    this._right = twgl.v3.normalize(right);
    this._up = normalizedUp;
    this._direction = normalizedFront;
    // console.log(this.position, this.direction, this.up, this.right);
    this.updateProjectionViewMatrix();
  }

  moveForward(distance: number) {
    const front = twgl.v3.subtract(this.direction, this.position);
    const normalizedFront = twgl.v3.normalize(front);
    const scaledFront = twgl.v3.mulScalar(normalizedFront, distance);
    this.position = twgl.v3.add(this.position, scaledFront);
  }

  moveBackward(distance: number) {
    const front = twgl.v3.subtract(this.direction, this.position);
    const normalizedFront = twgl.v3.normalize(front);
    const scaledFront = twgl.v3.mulScalar(normalizedFront, distance);
    this.position = twgl.v3.subtract(this.position, scaledFront);
  }

  moveLeft(distance: number) {
    const scaledRight = twgl.v3.mulScalar(this.right, distance);
    this.position = twgl.v3.subtract(this.position, scaledRight);
  }

  moveRight(distance: number) {
    const scaledRight = twgl.v3.mulScalar(this.right, distance);
    this.position = twgl.v3.add(this.position, scaledRight);
  }

  moveUp(distance: number) {
    const scaledUp = twgl.v3.mulScalar(this.up, distance);
    this.position = twgl.v3.add(this.position, scaledUp);
  }

  moveDown(distance: number) {
    const scaledUp = twgl.v3.mulScalar(this.up, distance);
    this.position = twgl.v3.subtract(this.position, scaledUp);
  }

  rotateX(angle: number) {
    const rotationMatrix = twgl.m4.axisRotation(this.right, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, this.direction);
    this.direction = rotatedDirection;
  }

  rotateY(angle: number) {
    const rotationMatrix = twgl.m4.axisRotation(this.up, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, this.direction);
    this.direction = rotatedDirection;
  }

  rotateZ(angle: number) {
    const rotationMatrix = twgl.m4.axisRotation(this.direction, angle);
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, this.up);
    this.up = rotatedUp;
  }

  rotateAroundX(angle: number, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(this.right, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    this.direction = twgl.v3.add(rotatedDirection, point);
  }

  rotateAroundY(angle: number, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(this.up, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    this.direction = twgl.v3.add(rotatedDirection, point);
  }

  rotateAroundZ(angle: number, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(this.direction, angle);
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundAxis(angle: number, axis: twgl.v3.Vec3, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(axis, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this._direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundPointX(angle: number, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(this.right, angle);
    const rotatedPosition = twgl.m4.transformPoint(rotationMatrix, twgl.v3.subtract(this.position, point));
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this._position = twgl.v3.add(rotatedPosition, point);
    this._direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundPointY(angle: number, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(this.up, angle);
    const rotatedPosition = twgl.m4.transformPoint(rotationMatrix, twgl.v3.subtract(this.position, point));
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this._position = twgl.v3.add(rotatedPosition, point);
    this._direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundPointZ(angle: number, point: twgl.v3.Vec3) {
    const rotationMatrix = twgl.m4.axisRotation(this.direction, angle);
    const rotatedPosition = twgl.m4.transformPoint(rotationMatrix, twgl.v3.subtract(this.position, point));
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this._position = twgl.v3.add(rotatedPosition, point);
    this._direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }


  translateAlongDirection(distance: number) {
    const offset = twgl.v3.mulScalar(this.direction, distance);
    this.position = twgl.v3.add(this.position, offset);
  }

  setViewToBoundingBox(boundingBox: BoundingBox) {
    // perspective camera
    //
    if (this.frustum instanceof PerspectiveFrustum) {
      const center = boundingBox.center;
      const distance = twgl.v3.distance(center, boundingBox.max) / Math.tan(this.frustum.fov / 2) / this.frustum.aspect;
      console.log(' distance ', distance);
      const cameraPosition = twgl.v3.subtract(center, twgl.v3.mulScalar(this.direction, distance));
      this.position = cameraPosition;
    } else {
      console.log(' TODO: ');
    }

  }

  switchToOrthographicFrustum() {
    // TODO:

    if (this.frustum instanceof PerspectiveFrustum) {
      // 当前视角 模型的高度 10 希望占满整个屏幕高度  那么正交视锥体的高度就是 10
      const orthHeight = 2
      const orthWidth = orthHeight * this.frustum.aspect;
      const orthFrustum = new OrthographicFrustum(-orthWidth / 2, orthWidth / 2, -orthHeight / 2, orthHeight / 2, this.frustum.near, this.frustum.far);
      this.frustum = orthFrustum;
    }
  }

  switchToPerspectiveFrustum() {

  }

  convertScreenCoordToWorldCoord(x: number, y: number){
      // const screenCoord = [x, y, 0];
      const NDCCoord = [x/this.canvas.width * 2 - 1, y/this.canvas.height * 2 - 1, -1]
      const viewProjectionMatrix = twgl.m4.multiply(this.viewMatrix, this.frustum.projectionMatrix);
      const inverseViewProjectionMatrix = twgl.m4.inverse(viewProjectionMatrix);
      const worldCoord = twgl.m4.transformPoint(inverseViewProjectionMatrix, NDCCoord);
      return worldCoord;
  }

  projectPointToScreenSpace(point: twgl.v3.Vec3) {
    const viewProjectionMatrix = twgl.m4.multiply(this.viewMatrix, this.frustum.projectionMatrix);
    const projectedPoint = twgl.m4.transformPoint(viewProjectionMatrix, point);
    return projectedPoint;
  }

  unprojectPointFromScreenSpace(point: twgl.v3.Vec3) {
    const viewProjectionMatrix = twgl.m4.multiply(this.viewMatrix, this.frustum.projectionMatrix);
    const inverseViewProjectionMatrix = twgl.m4.inverse(viewProjectionMatrix);
    const unprojectedPoint = twgl.m4.transformPoint(inverseViewProjectionMatrix, point);
    return unprojectedPoint;
  }

  destroy() {
    this.screenSpaceEventHandler.unregisterEvent();
  }

}

class Frustum {
  projectionMatrix: twgl.m4.Mat4
  private quadVS?: string
  private quadFS?: string
  private programInfo?: twgl.ProgramInfo
  private bufferInfo?: twgl.BufferInfo
  private wireframeBufInfo?: twgl.BufferInfo
  private gl?: WebGL2RenderingContext | WebGLRenderingContext
  constructor() {
    this.projectionMatrix = twgl.m4.identity();
  }
  initWireframe(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.quadVS = `
  attribute vec4 position;
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  void main(){
    gl_Position = projection * view * model * position;
  }
    `;
    this.quadFS = `
  precision mediump float;
	uniform vec3 u_color;
  void main() {
    gl_FragColor = vec4(u_color.xyz, 1.0);
    // gl_FragColor = vec4(1.0);
  }
    `;

    const bufAry = {

      position: [
        // 0, 0, 0, // camera position
        // near plane
        -1, -1, -1,
        1, -1, -1,
        -1, 1, -1,
        1, 1, -1,
        //  far plane
        -1, -1, 1,
        1, -1, 1,
        -1, 1, 1,
        1, 1, 1,
      ],
      indices: [
        0, 1,
        1, 3,
        3, 2,
        2, 0,

        4, 5,
        5, 7,
        7, 6,
        6, 4,

        0, 4,
        1, 5,
        3, 7,
        2, 6,
      ],
    }
    this.wireframeBufInfo = twgl.createBufferInfoFromArrays(gl, bufAry)
    this.gl = gl;
    this.programInfo = twgl.createProgramInfo(gl, [this.quadVS, this.quadFS]);
  }
  debugWireframe(viewMatrix: twgl.m4.Mat4) {
    if (this.gl && this.programInfo && this.wireframeBufInfo) {
      this.gl.useProgram(this.programInfo.program)
      twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.wireframeBufInfo)
      twgl.setUniforms(this.programInfo, {
        view: viewMatrix,
        projection: this.projectionMatrix,
        model: twgl.m4.identity(),
        u_color: twgl.v3.create(1.0, 1.0, 0.0),
      })
      twgl.drawBufferInfo(this.gl, this.wireframeBufInfo, this.gl.LINES);
    }
  }
}

class PerspectiveFrustum extends Frustum{
  _fov: number
  fovAngle: number
  _aspect: number
  _near: number
  _far: number
  projectionMatrix: twgl.m4.Mat4

  /**
   *
   * @param fov angle
   * @param aspect
   * @param near
   * @param far
   */
  constructor(fovAngle: number, aspect: number, near: number, far: number) {
    super()
    this.fovAngle = fovAngle;
    this._fov = angleToRads(fovAngle);
    this._aspect = aspect;
    this._near = near;
    this._far = far;
    this.projectionMatrix = twgl.m4.perspective(this.fov, this.aspect, this.near, this.far);
  }

  get fov() {
    return this._fov;
  }
  set fov(fov: number) {
    this._fov = fov;
    this.updateProjectionMatrix();
  }
  get aspect() {
    return this._aspect;
  }
  set aspect(aspect: number) {
    this._aspect = aspect;
    this.updateProjectionMatrix();
  }
  get near() {
    return this._near;
  }
  set near(near: number) {
    this._near = near;
    this.updateProjectionMatrix();
  }
  get far() {
    return this._far;
  }
  set far(far: number) {
    this._far = far;
    this.updateProjectionMatrix();
  }


  updateProjectionMatrix() {
    this.projectionMatrix = twgl.m4.perspective(angleToRads(this.fov), this.aspect, this.near, this.far);
  }


}

class OrthographicFrustum extends Frustum{
  _left: number
  _right: number
  _bottom: number
  _top: number
  _near: number
  _far: number
  projectionMatrix: twgl.m4.Mat4

  constructor(left: number, right: number, bottom: number, top: number, near: number, far: number) {
    super();
    this._left = left;
    this._right = right;
    this._bottom = bottom;
    this._top = top;
    this._near = near;
    this._far = far;
    this.projectionMatrix = twgl.m4.ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
  }
  get left() {
    return this._left;
  }
  set left(left: number) {
    this._left = left;
    this.updateProjectionMatrix();
  }
  get right() {
    return this._right;
  }
  set right(right: number) {
    this._right = right;
    this.updateProjectionMatrix();
  }
  get bottom() {
    return this._bottom;
  }
  set bottom(bottom: number) {
    this._bottom = bottom;
    this.updateProjectionMatrix();
  }
  get top() {
    return this._top;
  }
  set top(top: number) {
    this._top = top;
    this.updateProjectionMatrix();
  }
  get near() {
    return this._near;
  }
  set near(near: number) {
    this._near = near;
    this.updateProjectionMatrix();
  }
  get far() {
    return this._far;
  }
  set far(far: number) {
    this._far = far;
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    this.projectionMatrix = twgl.m4.ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
  }

}


export {
  Camera,
  PerspectiveFrustum,
  OrthographicFrustum,
  BoundingBox,
}
