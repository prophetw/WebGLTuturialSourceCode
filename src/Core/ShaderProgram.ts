import * as twgl from 'twgl.js';

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
		const programInfo = twgl.createProgramInfo(gl, [vs, fs]);
		this.cache[key] = programInfo;
		return programInfo;
	}

	public createBlinnPhongProgramInfo(gl: WebGL2RenderingContext | WebGLRenderingContext, defines = []): twgl.ProgramInfo{
		const definedStr = defines.map(define => `#define ${define}`).join('\n');
		const vs = `
		${definedStr}
		attribute vec4 position;
		attribute vec3 normal;
		varying vec3 v_normal;
		varying vec3 v_position;
		uniform mat4 model;
		uniform mat4 view;
		uniform mat4 projection;
		void main() {
			gl_Position =  projection * view * model * position;
			v_normal = mat3(model) * normal;
			v_position = mat3(model) * position.xyz;
		}
		`
		const fs = `
		${definedStr}
		precision mediump float;
		varying vec3 v_normal;
		varying vec3 v_position;
		uniform vec3 u_color;
		uniform vec3 u_lightDirection;
		uniform vec3 u_lightColor;
		uniform vec3 u_ambientColor;
		uniform vec3 u_cameraPosition;
		uniform float u_shininess;
		void main() {
			vec3 normal = normalize(v_normal);
			vec3 lightDirection = normalize(u_lightDirection);
			float lambertTerm = max(dot(normal, lightDirection), 0.0);
			vec3 diffuse = u_lightColor * u_color * lambertTerm;
			vec3 ambient = u_ambientColor * u_color;
			vec3 viewDirection = normalize(u_cameraPosition - v_position);
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
		const definedStr = defines.map(define => `#define ${define}`).join('\n');
		vs = vs ? vs : `
		${definedStr}
		attribute vec4 position;
		varying vec4 v_Color;
		uniform mat4 model;
		uniform mat4 view;
		uniform mat4 projection;
		void main() {
			gl_Position =  projection * view * model * position;
			v_Color = position;
		}
		`
		fs = fs ? fs : `
		${definedStr}
		precision mediump float;
		varying vec4 v_Color;
		uniform vec3 u_color;
		void main() {
			gl_FragColor = vec4(u_color.xyz, 1.0);
		}
		`;
		return this.getProgramInfo(gl, vs, fs, defines);
	}

}

const shaderProgramCache = new ShaderProgramCache();
console.log(' shaderProgramCache ', shaderProgramCache);
export default shaderProgramCache;