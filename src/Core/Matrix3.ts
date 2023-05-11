
type Matrix3NumAry = [number, number,number,number,number,number,number,number,number,]

class Matrix3 {
  elements: Matrix3NumAry
    constructor() {
        this.elements = [
            1, 0, 0,
            0, 1, 0,
            0, 0, 1,
        ];
    }
    set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number) {
        const te = this.elements;
        te[0] = n11;
        te[1] = n21;
        te[2] = n31;
        te[3] = n12;
        te[4] = n22;
        te[5] = n32;
        te[6] = n13;
        te[7] = n23;
        te[8] = n33;
        return this;
    }
    identity() {
        this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
        return this;
    }
    clone() {
        return new Matrix3().fromArray(this.elements);
    }
    copy(m) {
        const te = this.elements;
        const me = m.elements;
        te[0] = me[0];
        te[1] = me[1];
        te[2] = me[2];
        te[3] = me[3];
        te[4] = me[4];
        te[5] = me[5];
        te[6] = me[6];
        te[7] = me[7];
        te[8] = me[8];
        return this;
    }
    fromArray(array: number[], offset = 0) {
        for (let i = 0; i < 9; i++) {
            this.elements[i] = array[i + offset];
        }
        return this;
    }
    toArray(array: Matrix3NumAry, offset = 0) {
        const te = this.elements;
        array[offset] = te[0];
        array[offset + 1] = te[1];
        array[offset + 2] = te[2];
        array[offset + 3] = te[3];
        array[offset + 4] = te[4];
        array[offset + 5] = te[5];
        array[offset + 6] = te[6];
        array[offset + 7] = te[7];
        array[offset + 8] = te[8];
        return array;
    }

    multiply(m: Matrix3) {
        return this.multiplyMatrices(this, m);
    }

    multiplyMatrices(a: Matrix3, b: Matrix3) {

    }

  }
