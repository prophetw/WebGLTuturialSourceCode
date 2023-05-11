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
