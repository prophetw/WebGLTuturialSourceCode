
import Vector3 from "./Vector3";
import Vector4 from "./Vector4";

class Vector2{
    public x: number;
    public y: number;

    public constructor(x: number, y: number){
        this.x = x;
        this.y = y;
    }

    public static fromVector2(vector: Vector2): Vector2{
        return new Vector2(vector.x, vector.y);
    }

    public static fromVector3(vector: Vector3): Vector2{
        return new Vector2(vector.x, vector.y);
    }

    public static fromVector4(vector: Vector4): Vector2{
        return new Vector2(vector.x, vector.y);
    }

    public static fromValues(x: number, y: number): Vector2{
        return new Vector2(x, y);
    }

    public static zero(): Vector2{
        return new Vector2(0, 0);
    }

    public static one(): Vector2{
        return new Vector2(1, 1);
    }

    public static up(): Vector2{
        return new Vector2(0, 1);
    }

    public static down(): Vector2{
        return new Vector2(0, -1);
    }

    public static left(): Vector2{
        return new Vector2(-1, 0);
    }

    public static right(): Vector2{
        return new Vector2(1, 0);
    }

    public static lerp(a: Vector2, b: Vector2, t: number): Vector2{
        return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
    }

    public static add(a: Vector2, b: Vector2): Vector2{
        return new Vector2(a.x + b.x, a.y + b.y);
    }

    public static subtract(a: Vector2, b: Vector2): Vector2{
        return new Vector2(a.x - b.x, a.y - b.y);
    }

    public static multiply(a: Vector2, b: Vector2): Vector2{
        return new Vector2(a.x * b.x, a.y * b.y);
    }

    public static divide(a: Vector2, b: Vector2): Vector2{
        return new Vector2(a.x / b.x, a.y / b.y);
    }

    public static scale(a: Vector2, scale: number): Vector2{
        return new Vector2(a.x * scale, a.y * scale);
    }
}

export default Vector2
