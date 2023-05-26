// 四叉树节点类
class QuadTreeNode {
  bounds: Rectangle; // 矩形表示四叉树的边界
  capacity: number; // 节点分割前的最大点数
  points: Point[] = []; // 存储四叉树节点中的点的数组
  subdivided: boolean = false; // 表示四叉树节点是否已经被分割
  children: QuadTreeNode[] = []; // 存储子四叉树节点的数组

  constructor(bounds: Rectangle, capacity: number) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  // 将点插入四叉树节点
  insert(point: Point) {
    // 如果点在边界外部，则忽略该点
    if (!this.bounds.contains(point)) {
      return;
    }

    // 如果四叉树节点中的点数小于容量，则将点添加到当前节点中
    if (this.points.length < this.capacity) {
      this.points.push(point);
    } else {
      // 如果四叉树节点尚未被分割，则将其分割为四个子四叉树节点
      if (!this.subdivided) {
        this.subdivide();
      }

      // 将点插入适当的子四叉树节点中
      for (const child of this.children) {
        child.insert(point);
      }
    }
  }

  // 将四叉树节点分割为四个子四叉树节点
  subdivide() {
    const { x, y, width, height } = this.bounds;
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    const nw = new Rectangle(x, y, halfWidth, halfHeight);
    const ne = new Rectangle(x + halfWidth, y, halfWidth, halfHeight);
    const sw = new Rectangle(x, y + halfHeight, halfWidth, halfHeight);
    const se = new Rectangle(x + halfWidth, y + halfHeight, halfWidth, halfHeight);

    this.children.push(new QuadTreeNode(nw, this.capacity));
    this.children.push(new QuadTreeNode(ne, this.capacity));
    this.children.push(new QuadTreeNode(sw, this.capacity));
    this.children.push(new QuadTreeNode(se, this.capacity));

    this.subdivided = true;
  }

  // 在范围内查询四叉树节点中的点
  query(range: Rectangle): Point[] {
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

// 矩形类
class Rectangle {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number
  ) {}

  // 检查点是否在矩形内部
  contains(point: Point): boolean {
    return (
      point.x >= this.x &&
      point.x <= this.x + this.width &&
      point.y >= this.y &&
      point.y <= this.y + this.height
    );
  }

  // 检查矩形是否与另一个矩形相交
  intersects(range: Rectangle): boolean {
    return !(
      range.x > this.x + this.width ||
      range.x + range.width < this.x ||
      range.y > this.y + this.height ||
      range.y + range.height < this.y
    );
  }
}

// 点类
class Point {
  constructor(public x: number, public y: number, public z: number) {}
}
