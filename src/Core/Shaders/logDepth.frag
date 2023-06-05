varying float vLogDepth;
void write_logDepth(){
    float depth = log2(vLogDepth) * glb_oneOverLogOnePlusFarMinusNear;
    gl_FragDepth = depth;
}
