import * as twgl from 'twgl.js'

class Light{
  lightColor: twgl.v3.Vec3
  constructor(color: twgl.v3.Vec3){
    this.lightColor = color || twgl.v3.create()
  }
}
class DirectionLight extends Light{
  direction: twgl.v3.Vec3
  constructor(color: twgl.v3.Vec3, direction: twgl.v3.Vec3){
    super(color)
    this.direction = direction || twgl.v3.create()
  }
}








export {
  DirectionLight
}
