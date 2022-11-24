// HelloCanvas.js (c) 2012 matsuda
function main() {
  // Retrieve <canvas> element
  document.title = 'HelloCanvas'
  var canvas = document.getElementById('webgl') as HTMLCanvasElement;
  window.spector.startCapture(canvas, 20)

  // Get the rendering context for WebGL
  var gl = window.getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Set clear color
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
}
export default main
