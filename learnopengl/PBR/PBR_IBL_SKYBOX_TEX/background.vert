#version 300 es
layout (location = 0) in vec3 position;

uniform mat4 projection;
uniform mat4 view;

out vec3 WorldPos;

void main()
{
  WorldPos = position;

  // 去掉矩阵里面平移部分 因为最终效果 始终处在天空盒的正中心的位置
	mat4 rotView = mat4(mat3(view));
	vec4 clipPos = projection * rotView * vec4(WorldPos, 1.0);

  // 保证 z = 1 可以把天空盒渲染在最远处
	gl_Position = clipPos.xyww;
  // gl_Position = projection * view * vec4(position, 1.0);
}
