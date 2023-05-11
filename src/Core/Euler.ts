import { angleToRads } from "../../lib/utils";
import * as twgl from 'twgl.js';

class Euler {
  roll: number;
  pitch: number;
  yaw: number;
  rollInAngle: number
  pitchInAngle: number
  yawInAngle: number

  constructor(roll: number, pitch: number, yaw: number) {
    this.rollInAngle = roll;
    this.pitchInAngle = pitch;
    this.yawInAngle = yaw;
    this.roll = angleToRads(roll);
    this.pitch = angleToRads(pitch);
    this.yaw = angleToRads(yaw);
  }

  // 将欧拉角转换为旋转矩阵
  toMatrix3() {
    const cosA = Math.cos(this.roll);
    const sinA = Math.sin(this.roll);
    const cosB = Math.cos(this.pitch);
    const sinB = Math.sin(this.pitch);
    const cosC = Math.cos(this.yaw);
    const sinC = Math.sin(this.yaw);

    const matrix = [
      [cosB * cosC, -cosB * sinC, sinB],
      [cosA * sinC + sinA * sinB * cosC, cosA * cosC - sinA * sinB * sinC, -sinA * cosB],
      [sinA * sinC - cosA * sinB * cosC, sinA * cosC + cosA * sinB * sinC, cosA * cosB]
    ];

    return matrix;
  }

  public static fromMatrix4(matrix: twgl.m4.Mat4, order: string = 'XYZ') {
    const m11 = matrix[0];
    const m12 = matrix[1];
    const m13 = matrix[2];
    const m21 = matrix[4];
    const m22 = matrix[5];
    const m23 = matrix[6];
    const m31 = matrix[8];
    const m32 = matrix[9];
    const m33 = matrix[10];

    const matrix3 = [
      [m11, m12, m13],
      [m21, m22, m23],
      [m31, m32, m33]
    ];

    const euler = new Euler(0, 0, 0);

    if (order === 'XYZ') {
      euler.pitch = Math.asin(Math.max(-1, Math.min(1, m13)));
      if (Math.abs(m13) < 0.99999) {
        euler.roll = Math.atan2(-m23, m33);
        euler.yaw = Math.atan2(-m12, m11);
      } else {
        euler.roll = Math.atan2(m32, m22);
        euler.yaw = 0;
      }
    } else if (order === 'YXZ') {
      euler.roll = Math.asin(-Math.max(-1, Math.min(1, m23)));
      if (Math.abs(m23) < 0.99999) {
        euler.pitch = Math.atan2(m13, m33);
        euler.yaw = Math.atan2(m21, m22);
      } else {
        euler.pitch = Math.atan2(-m31, m11);
        euler.yaw = 0;
      }
    } else if (order === 'ZXY') {
      euler.roll = Math.asin(Math.max(-1, Math.min(1, m32)));
      if (Math.abs(m32) < 0.99999) {
        euler.pitch = Math.atan2(-m31, m33);
        euler.yaw = Math.atan2(-m12, m22);
      } else {
        euler.pitch = 0;
        euler.yaw = Math.atan2(m21, m11);
      }
    } else if (order === 'ZYX') {
      euler.pitch = Math.asin(-Math.max(-1, Math.min(1, m31))); // pitch
      if (Math.abs(m31) < 0.99999) {
        euler.roll = Math.atan2(m32, m33); // roll
        euler.yaw = Math.atan2(m21, m11); // yaw
      } else {
        euler.roll = 0;
        euler.yaw = Math.atan2(-m12, m22);
      }
    } else if (order === 'YZX') {
      euler.yaw = Math.asin(Math.max(-1, Math.min(1, m21)));
      if (Math.abs(m21) < 0.99999) {
        euler.pitch = Math.atan2(-m23, m22);
        euler.roll = Math.atan2(-m31, m11);
      } else {
        euler.pitch = 0;
        euler.roll = Math.atan2(m13, m33);
      }
    }
    return euler;
  }

  // 将欧拉角转换为四元数
  toQuaternion() {
    const cosA = Math.cos(this.roll / 2);
    const sinA = Math.sin(this.roll / 2);
    const cosB = Math.cos(this.pitch / 2);
    const sinB = Math.sin(this.pitch / 2);
    const cosC = Math.cos(this.yaw / 2);
    const sinC = Math.sin(this.yaw / 2);

    const w = cosA * cosB * cosC + sinA * sinB * sinC;
    const x = sinA * cosB * cosC - cosA * sinB * sinC;
    const y = cosA * sinB * cosC + sinA * cosB * sinC;
    const z = cosA * cosB * sinC - sinA * sinB * cosC;

    const quaternion = { w: w, x: x, y: y, z: z };

    return quaternion;
  }

  // 将欧拉角转换为字符串形式
  toString() {
    return `${this.roll}, ${this.pitch}, ${this.yaw}`;
  }
}

export default Euler;
