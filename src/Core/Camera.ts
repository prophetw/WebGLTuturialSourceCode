import * as twgl from 'twgl.js'
import { angleToRads } from '../../lib/utils'
import Vector4 from './Vector4'
import BoundingBox from './BoundingBox'
import Euler from './Euler'
import Ray from './Ray'
import Scene from './Scene'


class ScreenSpaceEventHandler {
  canvas: HTMLCanvasElement
  camera: Camera
  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.camera = camera
    this.canvas = canvas
    this.initEvent();
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

        // heading/yaw
        const dy = y - lastY;

        // pitch
        const dx = x - lastX;

        // roll z 与鼠标偏移无关

        const worldPos = this.camera.convertScreenCoordToWorldCoord(lastX, lastY);
        // const ray = this.camera.getPickRay(lastX, lastY);
        const pickRes = this.camera.scene?.pick([lastX, lastY]);
        console.log(' ______ ', pickRes);

        // console.log(worldPos);
        this.camera.rotateAroundPointX(dy * 0.01, worldPos);
        this.camera.rotateAroundPointY(dx * 0.01, worldPos);
        // this.camera.rotateAroundPoint(dy * 0.01, dx * 0.01, worldPos);

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
      const rayPoint = this.camera.scene?.pick([x, y]);
      this.camera.moveForward(-delta, rayPoint );
      console.log(this.camera.position);
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
  scene?: Scene
  private _position: twgl.v3.Vec3
  private _direction: twgl.v3.Vec3
  private _target: twgl.v3.Vec3
  private _right: twgl.v3.Vec3
  private _up: twgl.v3.Vec3
  private _heading: number
  private _pitch: number
  private _roll: number
  viewMatrix: twgl.m4.Mat4
  projectionViewMatrix: twgl.m4.Mat4
  inverseViewMatrix: twgl.m4.Mat4
  frustum: PerspectiveFrustum | OrthographicFrustum

  constructor(canvas: HTMLCanvasElement, scene?: Scene) {
    this.scene = scene;
    this.canvas = canvas;
    this._position = twgl.v3.create(0, 0, 5);
    this._direction = twgl.v3.create(0, 0, -1);
    this._target = twgl.v3.create(0, 0, 0);
    this._right = twgl.v3.create();
    this._up = twgl.v3.create(0, 1, 0);
    this.viewMatrix = twgl.m4.identity();
    this.inverseViewMatrix = twgl.m4.identity(); // camera matrix
    this.projectionViewMatrix = twgl.m4.identity();
    this.frustum = new PerspectiveFrustum(60, 1, 0.1, 100);
    this._heading = 0
    this._pitch = 0
    this._roll = 0
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
  }
  get target() {
    return this._target;
  }
  set target(val: twgl.v3.Vec3) {
    this._target = val;
    this.updateViewMatrix();
  }
  get right() {
    return this._right;
  }
  set right(right: twgl.v3.Vec3) {
    this._right = right;
  }
  get up() {
    return this._up;
  }
  set up(up: twgl.v3.Vec3) {
    this._up = up;
    this.updateViewMatrix();
  }

  get headingInAngle(){
    return this._heading * 180 / Math.PI;
  }
  get pitchInAngle(){
    return this._pitch * 180 / Math.PI;
  }
  get rollInAngle(){
    return this._roll * 180 / Math.PI;
  }
  get heading(){
    return this._heading;
  }
  set heading(heading: number){
    this._heading = heading;
    this.updateViewMatrix();
  }
  get pitch(){
    return this._pitch;
  }
  set pitch(pitch: number){
    this._pitch = pitch;
    this.updateViewMatrix();
  }
  get roll(){
    return this._roll;
  }
  set roll(roll: number){
    this._roll = roll;
    this.updateViewMatrix();
  }

  updateHeadingPitchRoll(){
    // this._heading = Math.atan2(this._direction[0], this._direction[2]);
    // this._position = twgl.v3.transformPoint(this.inverseViewMatrix, [0, 0, 0]);
    // this._direction = twgl.v3.transformDirection(this.inverseViewMatrix, [0, 0, -1]);
    const euler = Euler.fromMatrix4(this.inverseViewMatrix, 'XYZ');
    this._heading = euler.yaw;
    this._pitch = euler.pitch;
    this._roll = euler.roll;

  }

  setFrustum(frustum: PerspectiveFrustum | OrthographicFrustum) {
    this.frustum = frustum;
    this.updateProjectionViewMatrix();
  }

  updateProjectionViewMatrix() {
    twgl.m4.multiply(this.frustum.projectionMatrix, this.viewMatrix, this.projectionViewMatrix);
  }

  updateViewMatrix() {

    const dir = twgl.v3.subtract(this.target, this.position);

    this.inverseViewMatrix = twgl.m4.lookAt(this.position, this.target, this.up);
    this.viewMatrix = twgl.m4.inverse(this.inverseViewMatrix);
    const normalizedFront = twgl.v3.normalize(dir);
    const normalizedUp = twgl.v3.normalize(this.up);
    const right = twgl.v3.cross(normalizedUp, normalizedFront);
    this._right = twgl.v3.normalize(right);
    this._up = normalizedUp;
    this._direction = normalizedFront;
    // console.log(this.position, this.direction, this.up, this.right);
    this.updateHeadingPitchRoll()
    this.updateProjectionViewMatrix();
  }

  moveForward(distance: number, position?: twgl.v3.Vec3) {
    if(position){
      const offsetVec = twgl.v3.subtract(this.position, position);
      const normalize = twgl.v3.normalize(offsetVec);
      this._target = twgl.v3.add(this.target, twgl.v3.mulScalar(normalize, distance));
      this.position = twgl.v3.add(this.position, twgl.v3.mulScalar(normalize, distance));
    }else{
      const scaledFront = twgl.v3.mulScalar(this.direction, distance);
      this.position = twgl.v3.add(this.position, scaledFront);
    }
  }

  moveBackward(distance: number) {
    const scaledFront = twgl.v3.mulScalar(this.direction, distance);
    this.position = twgl.v3.subtract(this.position, scaledFront);
  }

  moveLeft(distance: number) {
    const scaledRight = twgl.v3.mulScalar(this.right, distance);
    this._target = twgl.v3.subtract(this.target, scaledRight);
    this.position = twgl.v3.subtract(this.position, scaledRight);
  }

  moveRight(distance: number) {
    const scaledRight = twgl.v3.mulScalar(this.right, distance);
    this._target = twgl.v3.add(this.target, scaledRight);
    this.position = twgl.v3.add(this.position, scaledRight);
  }

  moveUp(distance: number) {
    const scaledUp = twgl.v3.mulScalar(this.up, distance);
    this._target = twgl.v3.add(this.target, scaledUp);
    this.position = twgl.v3.add(this.position, scaledUp);
  }

  moveDown(distance: number) {
    const scaledUp = twgl.v3.mulScalar(this.up, distance);
    this._target = twgl.v3.subtract(this.target, scaledUp);
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

  rotateAroundPoint(yaw: number, pitch: number, point: twgl.v3.Vec3){

    // move camera to point
    const moveMatrix = twgl.m4.translation(twgl.v3.negate(point));
    const invmoveMatrix = twgl.m4.inverse(moveMatrix)
    twgl.m4.transformPoint(moveMatrix, this._position, this._position);

    const rotationMatrix = twgl.m4.axisRotation(this.direction, pitch);
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this._up = twgl.v3.add(rotatedUp, point);

    const rotationMatrix2 = twgl.m4.axisRotation(this.right, yaw);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix2, twgl.v3.subtract(this.direction, point));
    this._direction = twgl.v3.add(rotatedDirection, point);

    // move camera back
    let result = twgl.v3.create()
    twgl.m4.transformPoint(invmoveMatrix, this._position, result);


    this.position = result;

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
      this.target = center;
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
      const NDCCoord = [x/this.canvas.width * 2 - 1, 1 - y/this.canvas.height * 2, -1]

      const viewProjectionMatrix = twgl.m4.multiply(this.viewMatrix, this.frustum.projectionMatrix);
      const inverseViewProjectionMatrix = twgl.m4.inverse(viewProjectionMatrix);
      const worldCoord = twgl.m4.transformPoint(inverseViewProjectionMatrix, NDCCoord);
      return worldCoord;
  }

  convertScreenCoordToNDC(x: number, y: number){
    // 右手坐标系
    // 中心 0 0
    // x 轴 从左往右 -1 1
    // y 轴 从下往上 -1 1
    // 左上角点 -1 1
    // 右下角点 1 -1
    const NDCCoord = [x/this.canvas.width * 2 - 1, 1 - y/this.canvas.height * 2, -1]
    return NDCCoord;
  }

  convertScreenCoordToClipCoord(x: number, y: number){
      const clipCoord = [x/this.canvas.width * 2 - 1, 1 - y/this.canvas.height * 2, -1]
      return clipCoord;
  }

  convertWorldCoordToScreenCoord(x: number, y: number, z: number) {
    const worldCoord = [x, y, z];
    const viewProjectionMatrix = twgl.m4.multiply(this.viewMatrix, this.frustum.projectionMatrix);
    const projectedPoint = twgl.m4.transformPoint(viewProjectionMatrix, worldCoord);
    const screenCoord = [projectedPoint[0] / projectedPoint[3], projectedPoint[1] / projectedPoint[3], projectedPoint[2] / projectedPoint[3]];
    return screenCoord;
  }

  convertScreenCoordToViewCoord(x: number, y: number): Vector4 {
    const NDC = this.convertScreenCoordToNDC(x, y);
    const NDCVec4 = new Vector4(NDC[0], NDC[1], NDC[2], 1);
    const inverseProjection = twgl.m4.inverse(this.frustum.projectionMatrix);
    const coordInEyeSpace1 = Vector4.transformMat4(NDCVec4, inverseProjection);
    // console.log(' coordInEyeSpace1 ', coordInEyeSpace1);
    // const coordInEyeSpace = twgl.m4.transformPoint(inverseProjection, NDC);
    // console.log(' coordInEyeSpace ', coordInEyeSpace);
    return coordInEyeSpace1;
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

  getPickRay(x: number, y: number) {
    const pointInEyeSpace = this.convertScreenCoordToViewCoord(x, y);
    const pointInWorldSpace = Vector4.transformMat4(pointInEyeSpace, this.inverseViewMatrix);
    console.log(' pointInWorldSpace ', pointInWorldSpace);

    const eyePosiInEyeSpace = [0,0,0];
    const eyePosiInWorldSpace = twgl.m4.transformPoint(this.inverseViewMatrix, eyePosiInEyeSpace);

    const rayInWorldSpace = new Ray(eyePosiInWorldSpace, twgl.v3.subtract([pointInWorldSpace.x/pointInWorldSpace.w, pointInWorldSpace.y/pointInWorldSpace.w, pointInWorldSpace.z/pointInWorldSpace.w], eyePosiInWorldSpace));

    return rayInWorldSpace;
  }

  destroy() {

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
        // 0, 1,
        // 1, 2,
        // 2, 3,
        // 3, 0,

        // 4, 5,
        // 5, 6,
        // 6, 7,
        // 7, 4,

        // 0, 5,
        // 1, 4,
        // 2, 7,
        // 3, 6,

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
    console.log(' frustumn ', this);
  }
  debugWireframe(viewMatrix: twgl.m4.Mat4, projectionMatrix?: twgl.m4.Mat4, modelMatrix?: twgl.m4.Mat4) {
    if (this.gl && this.programInfo && this.wireframeBufInfo) {
      this.gl.useProgram(this.programInfo.program)
      twgl.setBuffersAndAttributes(this.gl, this.programInfo, this.wireframeBufInfo)
      const projMat4 = projectionMatrix || this.projectionMatrix
      const model = modelMatrix || twgl.m4.identity()
      twgl.setUniforms(this.programInfo, {
        projection: projMat4,
        view: viewMatrix,
        model,
        u_color: twgl.v3.create(0.0, 0.0, 0.0),
      })
      twgl.drawBufferInfo(this.gl, this.wireframeBufInfo, this.gl.LINES);
    }
  }

  getFrustumPlanes(viewMatrix: twgl.m4.Mat4, projectionMatrix?: twgl.m4.Mat4) {
    const projMat4 = projectionMatrix || this.projectionMatrix
    const viewProjectionMatrix = twgl.m4.multiply(viewMatrix, projMat4);
    const inverseViewProjectionMatrix = twgl.m4.inverse(viewProjectionMatrix);
    const planes = [
      // left plane
      Vector4.transformMat4(Vector4.create(1, 0, 0, 1), inverseViewProjectionMatrix),
      // right plane
      Vector4.transformMat4(Vector4.create(-1, 0, 0, 1), inverseViewProjectionMatrix),
      // bottom plane
      Vector4.transformMat4(Vector4.create(0, 1, 0, 1), inverseViewProjectionMatrix),
      // top plane
      Vector4.transformMat4(Vector4.create(0, -1, 0, 1), inverseViewProjectionMatrix),
      // near plane
      Vector4.transformMat4(Vector4.create(0, 0, 1, 1), inverseViewProjectionMatrix),
      // far plane
      Vector4.transformMat4(Vector4.create(0, 0, -1, 1), inverseViewProjectionMatrix),
    ];
    return planes;
  }

  frustumCulling(planes: Vector4[], boundingBox: BoundingBox) {
    const center = boundingBox.center;
    // const halfSize = twgl.v3.multiply(boundingBox.size);
    // for (let i = 0; i < 6; i++) {
    //   const plane = planes[i];
    //   const dot = Vector4.dot(plane, center);
    //   const radius = Vector4.dot(plane, halfSize);
    //   if (dot + radius < 0) {
    //     return false;
    //   }
    // }
    return true;
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
   * @param fovAngle angle
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
    this.projectionMatrix = twgl.m4.perspective(this.fov, this.aspect, this.near, this.far);
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
  ScreenSpaceEventHandler,
}
