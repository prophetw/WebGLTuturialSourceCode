import * as twgl from 'twgl.js';

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

  multiplyByMatrix(matrix: twgl.m4.Mat4) {
    const min = twgl.v3.create(this.min[0], this.min[1], this.min[2]);
    const max = twgl.v3.create(this.max[0], this.max[1], this.max[2]);
    const points = [
      twgl.v3.create(min[0], min[1], min[2]),
      twgl.v3.create(max[0], min[1], min[2]),
      twgl.v3.create(min[0], max[1], min[2]),
      twgl.v3.create(max[0], max[1], min[2]),
      twgl.v3.create(min[0], min[1], max[2]),
      twgl.v3.create(max[0], min[1], max[2]),
      twgl.v3.create(min[0], max[1], max[2]),
      twgl.v3.create(max[0], max[1], max[2]),
    ];
    points.forEach(point => {
      const pt = twgl.m4.transformPoint(matrix, point);
      return pt;
    });
    const newBoundingBox = BoundingBox.fromPoints(points);
    return newBoundingBox;
  }

	static fromPoints(vec3Ary: twgl.v3.Vec3[]) {
		const min = twgl.v3.create(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
		const max = twgl.v3.create(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
		vec3Ary.forEach(vec3 => {
			twgl.v3.min(min, vec3, min);
			twgl.v3.max(max, vec3, max);
		});
		return new BoundingBox(min, max);
	}

}

export default BoundingBox
