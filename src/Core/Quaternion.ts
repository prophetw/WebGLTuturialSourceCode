import * as twgl from 'twgl.js'

interface TypeQuaternion {
  w: number
  x: number
  y: number
  z: number
}

interface TypeAxis{
    x: number;
    y: number;
    z: number;
}

interface TypeAxisXYZ{
    x: {
        angle: number;
        axis: {
            x: number;
            y: number;
            z: number;
        };
    };
    y: {
        angle: number;
        axis: {
            x: number;
            y: number;
            z: number;
        };
    };
    z?: {
        angle: number;
        axis: {
            x: number;
            y: number;
            z: number;
        };
    };
}

class Quaternion {
  w: number
  x: number
  y: number
  z: number
  quaternion: TypeQuaternion
  constructor(w: number, x: number, y: number, z: number) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
    this.quaternion = {
      w, x, y, z
    }
  }

  // 将鼠标移动转换为四元数
  rotate(dx: number, dy: number) {
    const sensitivity = 0.002;
    const axis: TypeAxisXYZ = {
      x: { angle: dy * sensitivity, axis: { x: 1, y: 0, z: 0 } },
      y: { angle: dx * sensitivity, axis: { x: 0, y: 1, z: 0 } }
    };

    const q = this.rotateAroundAxis(axis.y.axis, axis.y.angle);
    const q2 = this.rotateAroundAxis(axis.x.axis, axis.x.angle);

    this.quaternion = this.multiplyQuaternions(q, this.quaternion);
    this.quaternion = this.multiplyQuaternions(this.quaternion, q2);
  }

  // 绕指定轴旋转指定角度的四元数
  rotateAroundAxis(axis: TypeAxis, angle: number) {
    let q = {} as TypeQuaternion;
    const sin = Math.sin(angle / 2);
    const cos = Math.cos(angle / 2);

    q.x = axis.x * sin;
    q.y = axis.y * sin;
    q.z = axis.z * sin;
    q.w = cos;

    return q;
  }

  // 四元数相乘
  multiplyQuaternions(q1: TypeQuaternion, q2: TypeQuaternion) {
    const q = {} as TypeQuaternion;
    q.w = q1.w*q2.w - q1.x*q2.x - q1.y*q2.y - q1.z*q2.z;
    q.x = q1.w*q2.x + q1.x*q2.w + q1.y*q2.z - q1.z*q2.y;
    q.y = q1.w*q2.y - q1.x*q2.z + q1.y*q2.w + q1.z*q2.x;
    q.z = q1.w*q2.z + q1.x*q2.y - q1.y*q2.x + q1.z*q2.w;

    return q;
  }


  // 将四元数转换为旋转矩阵
  toMatrix3() {
    const xx = this.x * this.x;
    const xy = this.x * this.y;
    const xz = this.x * this.z;
    const xw = this.x * this.w;
    const yy = this.y * this.y;
    const yz = this.y * this.z;
    const yw = this.y * this.w;
    const zz = this.z * this.z;
    const zw = this.z * this.w;

    const matrix = [
      1 - 2*(yy + zz), 2*(xy - zw), 2*(xz + yw),
      2*(xy + zw), 1 - 2*(xx + zz), 2*(yz - xw),
      2*(xz - yw), 2*(yz + xw), 1 - 2*(xx + yy)
    ];
    return matrix;
  }


  // 将四元数转换为欧拉角
  toEuler() {
    const sinB = 2*(this.w*this.y - this.x*this.z);
    const cosB = 1 - 2*(this.y*this.y + this.z*this.z);
    const beta = Math.atan2(sinB, cosB);

    const sinA = 2*(this.w*this.x + this.y*this.z);
    const cosA = 1 - 2*(this.x*this.x + this.y*this.y);
    const alpha = Math.atan2(sinA, cosA);

    const sinC = 2*(this.w*this.z + this.x*this.y);
    const cosC = 1 - 2*(this.y*this.y + this.z*this.z);
    const gamma = Math.atan2(sinC, cosC);

    const euler = { alpha: alpha, beta: beta, gamma: gamma };

    return euler;
  }

  // 将四元数转换为字符串形式
  toString() {
    return `${this.w}, ${this.x}, ${this.y}, ${this.z}`;
  }
}

export default Quaternion
