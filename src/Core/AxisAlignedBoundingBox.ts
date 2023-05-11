import Vector3 from "./Vector3";

class AxisAlignedBoundingBox {
    public min: Vector3;
    public max: Vector3;

    public constructor(min: Vector3, max: Vector3) {
        this.min = min;
        this.max = max;
    }

    public static fromPoints(points: Vector3[]): AxisAlignedBoundingBox {
        let min = new Vector3(Infinity, Infinity, Infinity);
        let max = new Vector3(-Infinity, -Infinity, -Infinity);

        for (let i = 0; i < points.length; i++) {
            let point = points[i];

            min.x = Math.min(min.x, point.x);
            min.y = Math.min(min.y, point.y);
            min.z = Math.min(min.z, point.z);

            max.x = Math.max(max.x, point.x);
            max.y = Math.max(max.y, point.y);
            max.z = Math.max(max.z, point.z);
        }

        return new AxisAlignedBoundingBox(min, max);
    }

    public static fromCenterAndHalfExtents(center: Vector3, halfExtents: Vector3): AxisAlignedBoundingBox {
        let min = new Vector3(center.x - halfExtents.x, center.y - halfExtents.y, center.z - halfExtents.z);
        let max = new Vector3(center.x + halfExtents.x, center.y + halfExtents.y, center.z + halfExtents.z);

        return new AxisAlignedBoundingBox(min, max);
    }

    public static fromCenterAndRadius(center: Vector3, radius: number): AxisAlignedBoundingBox {
        let min = new Vector3(center.x - radius, center.y - radius, center.z - radius);
        let max = new Vector3(center.x + radius, center.y + radius, center.z + radius);

        return new AxisAlignedBoundingBox(min, max);
    }

    public static fromCenterAndRadius2D(center: Vector2, radius: number): AxisAlignedBoundingBox {
        let min = new Vector3(center.x - radius, center.y - radius, -Infinity);
        let max = new Vector3(center.x + radius, center.y + radius, Infinity);

        return new AxisAlignedBoundingBox(min, max);
    }

    public static fromCenterAndRadius3D(center: Vector3, radius: number): AxisAlignedBoundingBox {
        let min = new Vector3(center.x - radius, center.y - radius, center.z - radius);
        let max = new Vector3(center.x + radius, center.y + radius, center.z + radius);

        return new AxisAlignedBoundingBox(min, max);
    }
}

export default AxisAlignedBoundingBox
