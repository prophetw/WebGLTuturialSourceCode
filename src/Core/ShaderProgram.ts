import * as twgl from 'twgl.js';
import ShaderSource from './ShaderSource';

class ShaderProgramCache{
	cache: { [key: string]: twgl.ProgramInfo}
	constructor(){
		this.cache = {};
	}

	getProgramInfo(
		gl: WebGL2RenderingContext | WebGLRenderingContext,
		vs: string,
		fs: string,
		defines: string[] = []) : twgl.ProgramInfo{

		const key = vs + defines.join('_') + fs;
		if(this.cache[key]){
			return this.cache[key];
		}
    const shaderSource = ShaderSource.compileShaderSource(vs, fs, defines);
		const programInfo = twgl.createProgramInfo(gl, [shaderSource.vertexShader, shaderSource.fragmentShader]);
		this.cache[key] = programInfo;
		return programInfo;
	}

	public createBlinnPhongProgramInfo(gl: WebGL2RenderingContext | WebGLRenderingContext, defines = []): twgl.ProgramInfo{
		const vs = `
attribute vec4 position;
attribute vec3 normal;
varying vec3 v_normalWC;
varying vec3 v_positionWC;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
void main() {
  gl_Position =  projection * view * model * position;
  v_normalWC = mat3(model) * normal;
  v_positionWC = mat3(model) * position.xyz;
}
		`
		const fs = `
varying vec3 v_normalWC;
varying vec3 v_positionWC;
uniform vec3 u_color;
uniform vec3 u_lightDirection;
uniform vec3 u_lightColor;
uniform vec3 u_ambientColor;
uniform vec3 u_cameraPosition;
uniform float u_shininess;
void main() {
  vec3 normal = normalize(v_normalWC);
  vec3 lightDirection = normalize(u_lightDirection);
  float lambertTerm = max(dot(normal, lightDirection), 0.0);
  vec3 diffuse = u_lightColor * u_color * lambertTerm;
  vec3 ambient = u_ambientColor * u_color;
  vec3 viewDirection = normalize(u_cameraPosition - v_positionWC);
  vec3 halfVector = normalize(lightDirection + viewDirection);
  float specular = pow(max(dot(normal, halfVector), 0.0), u_shininess);
  gl_FragColor = vec4(diffuse + ambient + specular, 1.0);
}
		`;
		return this.getProgramInfo(gl, vs, fs, defines);
	}

	public createColorProgramInfo(gl: WebGL2RenderingContext | WebGLRenderingContext,
		vs?: string,
		fs?: string,
		defines: string[] = []): twgl.ProgramInfo{
		vs = vs ? vs : `
attribute vec4 position;
varying vec4 posEC;
varying vec4 posWC;
varying vec4 cc;
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
void main() {
  gl_Position =  projection * view * model * position;
  posEC = view * model * position;
  posWC = model * position;
  cc = glb_view * position;
}
		`
		fs = fs ? fs : `
varying vec4 posEC;
varying vec4 posWC;
uniform vec3 u_color;
void main() {
  gl_FragColor = vec4(u_color.xyz, 1.0);
  // gl_FragColor = vec4(posWC.xyz, 1.0);
}
		`;
		return this.getProgramInfo(gl, vs, fs, defines);
	}


  public createScreenProgramInfo(gl: WebGL2RenderingContext | WebGLRenderingContext,
		vs?: string,
		fs?: string,
		defines: string[] = []): twgl.ProgramInfo{
      vs = vs ? vs : `
attribute vec4 position;
attribute vec2 texcoord;
varying vec2 v_texcoord;
void main() {
  gl_Position =  position;
  v_texcoord = texcoord;
}
  `
      fs = fs ? fs : `
precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_texture;
void main() {
  gl_FragColor = texture2D(u_texture, v_texcoord);
}
  `;
      return this.getProgramInfo(gl, vs, fs, defines);
    }

  public createScreenDebugDepthProgramInfo(gl: WebGL2RenderingContext | WebGLRenderingContext,
		vs?: string,
		fs?: string,
		defines: string[] = []): twgl.ProgramInfo{
      vs = vs ? vs : `
attribute vec4 position;
attribute vec2 texcoord;
varying vec2 v_texcoord;
void main() {
  gl_Position =  position;
  v_texcoord = texcoord;
}
  `
      fs = fs ? fs : `
varying vec2 v_texcoord;
uniform sampler2D u_texture;
vec4 packDepth(float depth) {
    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * depth;
    enc = fract(enc);
    enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
    return enc;
}
void main() {
  float originDepth = texture2D(u_texture, v_texcoord).r;
  float near = glb_frustumDepth.x;
  float far = glb_frustumDepth.y;

  // 对于使 正交相机很近的 0.1 0.00001 变化变大
  float depth = log(originDepth * (far - 1.0) + 1.0) / log(far);

  // 使用彩虹色映射
  float R = abs(depth * 6.0 - 3.0) - 1.0;
  float G = 2.0 - abs(depth * 6.0 - 2.0);
  float B = 2.0 - abs(depth * 6.0 - 4.0);
  // 这是因为在这个特定的映射函数中，我们将深度值映射到了一个颜色梯度上，
  // 这个梯度从蓝色（深度值小）过渡到红色（深度值大）。
  if(glb_camera_is_ortho >= 1.0){
    gl_FragColor = vec4(clamp(vec3(R, G, B), 0.0, 1.0), 1.0);
  }else{
    gl_FragColor = vec4(vec3(originDepth), 1.0);
  }

}
  `;
      return this.getProgramInfo(gl, vs, fs, defines);
    }
}

const shaderProgramCache = new ShaderProgramCache();
console.log(' shaderProgramCache ', shaderProgramCache);
export default shaderProgramCache;
