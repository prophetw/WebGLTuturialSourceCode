precision highp float;
varying vec2 texCoord;
uniform sampler2D textureRes;
void main() {
    gl_FragColor = texture2D(textureRes, texCoord);
}
