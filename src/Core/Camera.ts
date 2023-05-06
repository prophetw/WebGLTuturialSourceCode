import * as twgl from 'twgl.js'
class Camera {
  canvas: HTMLCanvasElement
  _position: twgl.v3.Vec3
  _direction: twgl.v3.Vec3
  _right: twgl.v3.Vec3
  _up: twgl.v3.Vec3
  viewMatrix: twgl.m4.Mat4
  projectionViewMatrix: twgl.m4.Mat4
  inverseViewMatrix: twgl.m4.Mat4
  frustum: PerspectiveFrustum | OrthographicFrustum

  constructor(canvas: HTMLCanvasElement){
    this.canvas = canvas;
    this._position = twgl.v3.create();
    this._direction = twgl.v3.create();
    this._right = twgl.v3.create();
    this._up = twgl.v3.create();
    this.viewMatrix = twgl.m4.identity();
    this.inverseViewMatrix = twgl.m4.identity(); // camera matrix
    this.projectionViewMatrix = twgl.m4.identity();
    this.frustum = new PerspectiveFrustum(Math.PI / 4, 1, 0.1, 1000);
  }

  get position(){
    return this._position;
  }
  set position(position: twgl.v3.Vec3){
    this._position = position;
    this.updateViewMatrix();
  }
  get direction(){
    return this._direction;
  }
  set direction(direction: twgl.v3.Vec3){
    this._direction = direction;
    this.updateViewMatrix();
  }
  get right(){
    return this._right;
  }
  set right(right: twgl.v3.Vec3){
    this._right = right;
    this.updateViewMatrix();
  }
  get up(){
    return this._up;
  }
  set up(up: twgl.v3.Vec3){
    this._up = up;
    this.updateViewMatrix();
  }

  setFrustum(frustum: PerspectiveFrustum | OrthographicFrustum){
    this.frustum = frustum;
    this.updateProjectionViewMatrix();
  }

  updateProjectionViewMatrix(){
    twgl.m4.multiply(this.frustum.projectionMatrix, this.viewMatrix, this.projectionViewMatrix);
  }

  updateViewMatrix(){
    this.inverseViewMatrix = twgl.m4.lookAt(this.position, this.direction, this.up);
    this.viewMatrix = twgl.m4.inverse(this.inverseViewMatrix);
    const front = twgl.v3.subtract(this.direction, this.position);
    const normalizedFront = twgl.v3.normalize(front);
    const normalizedUp = twgl.v3.normalize(this.up);
    const right = twgl.v3.cross(normalizedUp, normalizedFront);
    this.right = twgl.v3.normalize(right);
    this.up = normalizedUp;
    this.direction = normalizedFront;
    this.updateProjectionViewMatrix();
  }

  moveForward(distance: number){
    const front = twgl.v3.subtract(this.direction, this.position);
    const normalizedFront = twgl.v3.normalize(front);
    const scaledFront = twgl.v3.mulScalar(normalizedFront, distance);
    this.position = twgl.v3.add(this.position, scaledFront);
  }

  moveBackward(distance: number){
    const front = twgl.v3.subtract(this.direction, this.position);
    const normalizedFront = twgl.v3.normalize(front);
    const scaledFront = twgl.v3.mulScalar(normalizedFront, distance);
    this.position = twgl.v3.subtract(this.position, scaledFront);
  }

  moveLeft(distance: number){
    const scaledRight = twgl.v3.mulScalar(this.right, distance);
    this.position = twgl.v3.subtract(this.position, scaledRight);
  }

  moveRight(distance: number){
    const scaledRight = twgl.v3.mulScalar(this.right, distance);
    this.position = twgl.v3.add(this.position, scaledRight);
  }

  moveUp(distance: number){
    const scaledUp = twgl.v3.mulScalar(this.up, distance);
    this.position = twgl.v3.add(this.position, scaledUp);
  }

  moveDown(distance: number){
    const scaledUp = twgl.v3.mulScalar(this.up, distance);
    this.position = twgl.v3.subtract(this.position, scaledUp);
  }

  rotateX(angle: number){
    const rotationMatrix = twgl.m4.axisRotation(this.right, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, this.direction);
    this.direction = rotatedDirection;
  }

  rotateY(angle: number){
    const rotationMatrix = twgl.m4.axisRotation(this.up, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, this.direction);
    this.direction = rotatedDirection;
  }

  rotateZ(angle: number){
    const rotationMatrix = twgl.m4.axisRotation(this.direction, angle);
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, this.up);
    this.up = rotatedUp;
  }

  rotateAroundX(angle: number, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(this.right, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    this.direction = twgl.v3.add(rotatedDirection, point);
  }

  rotateAroundY(angle: number, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(this.up, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    this.direction = twgl.v3.add(rotatedDirection, point);
  }

  rotateAroundZ(angle: number, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(this.direction, angle);
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundAxis(angle: number, axis: twgl.v3.Vec3, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(axis, angle);
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this.direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundPointX(angle: number, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(this.right, angle);
    const rotatedPosition = twgl.m4.transformPoint(rotationMatrix, twgl.v3.subtract(this.position, point));
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this.position = twgl.v3.add(rotatedPosition, point);
    this.direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundPointY(angle: number, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(this.up, angle);
    const rotatedPosition = twgl.m4.transformPoint(rotationMatrix, twgl.v3.subtract(this.position, point));
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this.position = twgl.v3.add(rotatedPosition, point);
    this.direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  rotateAroundPointZ(angle: number, point: twgl.v3.Vec3){
    const rotationMatrix = twgl.m4.axisRotation(this.direction, angle);
    const rotatedPosition = twgl.m4.transformPoint(rotationMatrix, twgl.v3.subtract(this.position, point));
    const rotatedDirection = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.direction, point));
    const rotatedUp = twgl.m4.transformDirection(rotationMatrix, twgl.v3.subtract(this.up, point));
    this.position = twgl.v3.add(rotatedPosition, point);
    this.direction = twgl.v3.add(rotatedDirection, point);
    this.up = twgl.v3.add(rotatedUp, point);
  }

  registerMouseEvent(){
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
      if(isDragging){
        const x = event.clientX;
        const y = event.clientY;
        const dx = x - lastX;
        const dy = y - lastY;

        if(event.shiftKey){
          this.rotateAroundPointX(dy * 0.01, this.position);
          this.rotateAroundPointY(dx * 0.01, this.position);
        }else{
          this.rotateAroundX(dy * 0.01, this.position);
          this.rotateAroundY(dx * 0.01, this.position);
        }

        lastX = x;
        lastY = y;
      }
    });

    canvas.addEventListener('mouseup', (event) => {
      isDragging = false;
    });
  }

  registerMouseWheelEvent(){
    const canvas = this.canvas;
    canvas.addEventListener('wheel', (event) => {
      const delta = event.deltaY * 0.01;
      this.translateAlongDirection(delta);
    });
  }


  translateAlongDirection(distance: number){
    this.position = twgl.v3.add(this.position, twgl.v3.mulScalar(this.direction, distance));
  }


}


class PerspectiveFrustum {
  _fov: number
  _aspect: number
  _near: number
  _far: number
  projectionMatrix: twgl.m4.Mat4

  constructor(fov: number, aspect: number, near: number, far: number){
    this._fov = fov;
    this._aspect = aspect;
    this._near = near;
    this._far = far;
    this.projectionMatrix = twgl.m4.identity();
  }

  get fov(){
    return this._fov;
  }
  set fov(fov: number){
    this._fov = fov;
    this.updateProjectionMatrix();
  }
  get aspect(){
    return this._aspect;
  }
  set aspect(aspect: number){
    this._aspect = aspect;
    this.updateProjectionMatrix();
  }
  get near(){
    return this._near;
  }
  set near(near: number){
    this._near = near;
    this.updateProjectionMatrix();
  }
  get far(){
    return this._far;
  }
  set far(far: number){
    this._far = far;
    this.updateProjectionMatrix();
  }


  updateProjectionMatrix(){
    this.projectionMatrix = twgl.m4.perspective(this.fov, this.aspect, this.near, this.far);
  }

  switchToOrthographicFrustum(){
    // TODO:
  }

}

class OrthographicFrustum {
  _left: number
  _right: number
  _bottom: number
  _top: number
  _near: number
  _far: number
  projectionMatrix: twgl.m4.Mat4

  constructor(left: number, right: number, bottom: number, top: number, near: number, far: number){
    this._left = left;
    this._right = right;
    this._bottom = bottom;
    this._top = top;
    this._near = near;
    this._far = far;
    this.projectionMatrix = twgl.m4.identity();
  }
  get left(){
    return this._left;
  }
  set left(left: number){
    this._left = left;
    this.updateProjectionMatrix();
  }
  get right(){
    return this._right;
  }
  set right(right: number){
    this._right = right;
    this.updateProjectionMatrix();
  }
  get bottom(){
    return this._bottom;
  }
  set bottom(bottom: number){
    this._bottom = bottom;
    this.updateProjectionMatrix();
  }
  get top(){
    return this._top;
  }
  set top(top: number){
    this._top = top;
    this.updateProjectionMatrix();
  }
  get near(){
    return this._near;
  }
  set near(near: number){
    this._near = near;
    this.updateProjectionMatrix();
  }
  get far(){
    return this._far;
  }
  set far(far: number){
    this._far = far;
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix(){
    this.projectionMatrix = twgl.m4.ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
  }

}


export { Camera, PerspectiveFrustum, OrthographicFrustum }
