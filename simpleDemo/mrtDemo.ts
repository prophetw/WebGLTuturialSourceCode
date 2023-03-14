
function main(){
      const canvas = document.getElementById("webgl") as HTMLCanvasElement;
      const gl = canvas.getContext("webgl2");
      console.log(' gl ', gl);
      if (!gl) {
        alert("WebGL2 is not available in your browser.");
        return;
      }

      // Create two Textures to store the intermediate rendering results.
      const textures = [];
      for (let i = 0; i < 2; i++) {
        textures[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, textures[i]);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      }

      // Create two Framebuffer Objects to render to the Textures.
      const framebuffers = [];
      for (let i = 0; i < 2; i++) {
        framebuffers[i] = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, textures[i], 0);
      }

      // Create a Vertex Shader to pass the position information to the GPU.
      const vertexShaderSource = `#version 300 es
        in vec2 position;

        void main() {
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;
      const vertexShader = gl.createShader(gl.VERTEX_SHADER) as WebGLShader;
      gl.shaderSource(vertexShader, vertexShaderSource);
      gl.compileShader(vertexShader);

      // Create two Fragment Shaders to perform different rendering operations.
      const fragmentShaderSources = [
        `#version 300 es
          out vec4 outputColor;

          void main() {
            outputColor = vec4(1.0, 0.0, 0.0, 1.0);
          }
        `,
        `#version 300 es
          in vec2 vTexCoord;
          out vec4 outputColor;
          uniform sampler2D uTexture;

          void main() {
            outputColor = texture(uTexture, vTexCoord);
          }
        `
      ];
      const fragmentShaders: WebGLShader[] = [];
      for (let i = 0; i < 2; i++) {
        fragmentShaders[i] = gl.createShader(gl.FRAGMENT_SHADER) as WebGLShader;
        gl.shaderSource(fragmentShaders[i], fragmentShaderSources[i]);
        gl.compileShader(fragmentShaders[i]);
      }

      // Create two Programs, one for each Fragment Shader.
      const programs = [];
      for (let i = 0; i < 2; i++) {
        programs[i] = gl.createProgram() as WebGLProgram;
        gl.attachShader(programs[i], vertexShader);
        gl.attachShader(programs[i], fragmentShaders[i]);
        gl.linkProgram(programs[i]);
      }

      // Create a Vertex Buffer to store the position information.
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

      // Create a Vertex Array Object to store the Vertex Buffer information.
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      window.spector.startCapture(canvas, 1000);

      // Set the clear color and clear the canvas.
      gl.clearColor(0.0, 0.0, 0.0, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      console.log(' haha ');

      // Bind the first Framebuffer and use the first Program.
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[0]);
      gl.useProgram(programs[0]);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Bind the second Framebuffer and use the second Program.
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[1]);
      gl.useProgram(programs[1]);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Unbind the Framebuffer and render the final result on the canvas.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(programs[1]);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export default main;
