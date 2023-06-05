varying float vLogDepth;
void vertex_logDepth(vec4 ClipPosition){
  vLogDepth = 1.0 + ClipPosition.w - glb_frustumDepth.x; //
}
