function main() {
	// Initialize the WebGL context
	var canvas = document.getElementById("webgl") as HTMLCanvasElement
	var gl = canvas.getContext("webgl2-compute") as WebGL2RenderingContext

	if (gl === null) {
		console.log(' gl is null ');
		return
	}
	// Create a compute shader
	var computeShader = gl.createShader(gl.COMPUTE_SHADER);
	if (computeShader === null) {
		console.log('computeHader is null');
		return
	}
	gl.shaderSource(computeShader, `#version 310 es
layout(local_size_x = 16, local_size_y = 16) in;
layout(rgba32f, binding = 0) writeonly uniform image2D destTex;
uniform vec2 resolution;
void main() {
  ivec2 pos = ivec2(gl_GlobalInvocationID.xy);
  vec2 uv = vec2(pos) / resolution;
  vec4 color = vec4(uv, sin(uv.x * 10.0), 1.0);
  imageStore(destTex, pos, color);
}
`);
	gl.compileShader(computeShader);

	// Create a WebGL program
	var program = gl.createProgram();
	if(program === null){
		console.log(' program is null ');
		return
	}
	gl.attachShader(program, computeShader);
	gl.linkProgram(program);
	gl.useProgram(program);

	// Get the uniform location and set its value
	var resolutionLocation = gl.getUniformLocation(program, "resolution");
	gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

	// Create a texture to store the computed results
	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
	gl.bindImageTexture(0, texture, 0, false, 0, gl.WRITE_ONLY, gl.RGBA32F);

	// Dispatch the compute shader
	gl.dispatchCompute(canvas.width / 16, canvas.height / 16, 1);

	// Read the computed results back into JavaScript
	var data = new Float32Array(canvas.width * canvas.height * 4);
	gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.FLOAT, data);

}


export default main