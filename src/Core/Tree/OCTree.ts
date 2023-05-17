// 八叉树节点类
class OctreeNode {
  bounds: Cuboid; // 立方体表示八叉树的边界
  capacity: number; // 节点分割前的最大点数
  points: Point[] = []; // 存储八叉树节点中的点的数组
  subdivided: boolean = false; // 表示八叉树节点是否已经被分割
  children: OctreeNode[] = []; // 存储子八叉树节点的数组

  constructor(bounds: Cuboid, capacity: number) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  // 将点插入八叉树节点
  insert(point: Point) {
    // 如果点在边界外部，则忽略该点
    if (!this.bounds.contains(point)) {
      return;
    }

    // 如果八叉树节点中的点数小于容量，则将点添加到当前节点中
    if (this.points.length < this.capacity) {
      this.points.push(point);
    } else {
      // 如果八叉树节点尚未被分割，则将其分割为八个子八叉树节点
      if (!this.subdivided) {
        this.subdivide();
      }

      // 将点插入适当的子八叉树节点中
      for (const child of this.children) {
        child.insert(point);
      }
    }
  }

  // 将八叉树节点分割为八个子八叉树节点
  subdivide() {
    const { x, y, z, width, height, depth } = this.bounds;
    const w = width / 2;
    const h = height / 2;
    const d = depth / 2;

    const nwx = new Cuboid(x, y, z, w, h, d);
    const nwy = new Cuboid(x + w, y, z, w, h, d);
    const nwz = new Cuboid(x, y + h, z, w, h, d);
    const nxy = new Cuboid(x + w, y + h, z, w, h, d);
    const nxz = new Cuboid(x, y, z + d, w, h, d);
    const nyz = new Cuboid(x + w, y, z + d, w, h, d);
    const nxyz = new Cuboid(x, y + h, z + d, w, h, d);
    const ne = new Cuboid(x + w, y + h, z + d, w, h, d);

    this.children.push(new OctreeNode(nwx, this.capacity));
    this.children.push(new OctreeNode(nwy, this.capacity));
    this.children.push(new OctreeNode(nwz, this.capacity));
    this.children.push(new OctreeNode(nxy, this.capacity));
    this.children.push(new OctreeNode(nxz, this.capacity));
    this.children.push(new OctreeNode(nyz, this.capacity));
    this.children.push(new OctreeNode(nxyz, this.capacity));
    this.children.push(new OctreeNode(ne, this.capacity));

    this.subdivided = true;
  }

  // 在范围内查询八叉树
  query(range: Cuboid): Point[] {
    const found: Point[] = [];

    // 如果边界与范围不相交，则返回已找到的点数组
    if (!this.bounds.intersects(range)) {
      return found;
    }

    // 将范围内的点添加到已找到的点数组中
    for (const point of this.points) {
      if (range.contains(point)) {
        found.push(point);
      }
    }

    // 如果节点已分割，则递归查询子节点中的点
    if (this.subdivided) {
      for (const child of this.children) {
        const childPoints = child.query(range);
        found.push(...childPoints);
      }
    }

    return found;
  }
}

// 立方体类
class Cuboid {
  constructor(
    public x: number,
    public y: number,
    public z: number,
    public width: number,
    public height: number,
    public depth: number
  ) {}

  // 检查点是否在立方体内部
  contains(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height &&
      point.z >= this.z &&
      point.z <= this.z + this.depth
    );
  }

  // 检查立方体是否与另一个立方体相交
  intersects(range: Cuboid): boolean {
    return !(
      range.x > this.x + this.width ||
      range.x + range.width < this.x ||
      range.y > this.y + this.height ||
      range.y + range.height < this.y ||
      range.z > this.z + this.depth ||
      range.z + range.depth < this.z
    );
  }
}

