import * as twgl from 'twgl.js';

type Matrix4 = twgl.m4.Mat4;

class Vector4{
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1){
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public static create(x: number = 0, y: number = 0, z: number = 0, w: number = 1): Vector4{
        return new Vector4(x, y, z, w);
    }

    public static add(v1: Vector4, v2: Vector4): Vector4{
        return new Vector4(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z, v1.w + v2.w);
    }

    public static sub(v1: Vector4, v2: Vector4): Vector4{
        return new Vector4(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z, v1.w - v2.w);
    }

    public static mul(v1: Vector4, v2: Vector4): Vector4{
        return new Vector4(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z, v1.w * v2.w);
    }

    public static div(v1: Vector4, v2: Vector4): Vector4{
        return new Vector4(v1.x / v2.x, v1.y / v2.y, v1.z / v2.z, v1.w / v2.w);
    }

    public static scale(v: Vector4, scale: number): Vector4{
        return new Vector4(v.x * scale, v.y * scale, v.z * scale, v.w * scale);
    }

    public static dot(v1: Vector4, v2: Vector4): number{
        return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z + v1.w * v2.w;
    }

    public static normalize(v: Vector4): Vector4{
        let length: number = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z + v.w * v.w);
        return new Vector4(v.x / length, v.y / length, v.z / length, v.w / length);
    }

    public static cross(v1: Vector4, v2: Vector4): Vector4{
        return new Vector4(v1.y * v2.z - v1.z * v2.y,
                           v1.z * v2.x - v1.x * v2.z,
                           v1.x * v2.y - v1.y * v2.x,
                           0);
    }

    public static transformMat4(vec4: Vector4, m: Matrix4): Vector4{
        let x: number = vec4.x * m[0] + vec4.y * m[4] + vec4.z * m[8] + vec4.w * m[12];
        let y: number = vec4.x * m[1] + vec4.y * m[5] + vec4.z * m[9] + vec4.w * m[13];
        let z: number = vec4.x * m[2] + vec4.y * m[6] + vec4.z * m[10] + vec4.w * m[14];
        let w: number = vec4.x * m[3] + vec4.y * m[7] + vec4.z * m[11] + vec4.w * m[15];
        return new Vector4(x, y, z, w);
    }

}

export default Vector4;
