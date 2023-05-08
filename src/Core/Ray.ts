
import * as twgl from 'twgl.js';
import BoundingBox from './BoundingBox';

type Vector3 = twgl.v3.Vec3;

class Ray {
	public origin: Vector3;
	public direction: Vector3;

	constructor(origin: Vector3, direction: Vector3) {
		this.origin = origin;
		this.direction = direction;
	}

	intersectBox(box: BoundingBox): boolean {

		return false;
	}

	intersectTriangle(v0: Vector3, v1: Vector3, v2: Vector3): boolean {
		const edge1 = twgl.v3.subtract(v1, v0);
		const edge2 = twgl.v3.subtract(v2, v0);
		const h = twgl.v3.cross(this.direction, edge2);
		const a = twgl.v3.dot(edge1, h);
		if (a > -0.00001 && a < 0.00001) {
			return false;
		}
		const f = 1.0 / a;
		const s = twgl.v3.subtract(this.origin, v0);
		const u = f * twgl.v3.dot(s, h);
		if (u < 0.0 || u > 1.0) {
			return false;
		}
		const q = twgl.v3.cross(s, edge1);
		const v = f * twgl.v3.dot(this.direction, q);
		if (v < 0.0 || u + v > 1.0) {
			return false;
		}
		const t = f * twgl.v3.dot(edge2, q);
		if (t > 0.00001) {
			return true;
		}
		return false;
	}

	intersectPlane(planeNormal: Vector3, planePoint: Vector3): boolean {
		const v = twgl.v3.subtract(planePoint, this.origin);
		const t = twgl.v3.dot(v, planeNormal) / twgl.v3.dot(this.direction, planeNormal);
		if (t > 0) {
			return true;
		}
		return false;
	}

	rayPlaneIntersection(planeNormal: Vector3, planePoint: Vector3): Vector3 {
		const v = twgl.v3.subtract(planePoint, this.origin);
		const t = twgl.v3.dot(v, planeNormal) / twgl.v3.dot(this.direction, planeNormal);
		return twgl.v3.add(this.origin, twgl.v3.mulScalar(this.direction, t));
	}

	rayTriangleIntersection(v0: Vector3, v1: Vector3, v2: Vector3): Vector3 | null {
		const edge1 = twgl.v3.subtract(v1, v0);
		const edge2 = twgl.v3.subtract(v2, v0);
		const h = twgl.v3.cross(this.direction, edge2);
		const a = twgl.v3.dot(edge1, h);
		if (a > -0.00001 && a < 0.00001) {
			return null;
		}
		const f = 1.0 / a;
		const s = twgl.v3.subtract(this.origin, v0);
		const u = f * twgl.v3.dot(s, h);
		if (u < 0.0 || u > 1.0) {
			return null;
		}
		const q = twgl.v3.cross(s, edge1);
		const v = f * twgl.v3.dot(this.direction, q);
		if (v < 0.0 || u + v > 1.0) {
			return null;
		}
		const t = f * twgl.v3.dot(edge2, q);
		if (t > 0.00001) {
			return twgl.v3.add(this.origin, twgl.v3.mulScalar(this.direction, t));
		}
		return null;
	}

	at(t: number): Vector3 {
		return twgl.v3.add(this.origin, twgl.v3.mulScalar(this.direction, t));
	}

}

export default Ray;