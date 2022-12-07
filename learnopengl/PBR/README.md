## [Physical Based Rendering](https://learnopengl-cn.github.io/07%20PBR/01%20Theory/)

> [Unreal Engine PBR implement (based on Disney) pdf](https://blog.selfshadow.com/publications/s2013-shading-course/karis/s2013_pbs_epic_notes_v2.pdf)
> [Disney PBR pdf]()
> [Disney PBR 中文]()


```math
\boldsymbol{h}=\frac{\boldsymbol{l}+\boldsymbol{v}}{|\boldsymbol{l}+\boldsymbol{v}|}
```

```math  
f(\boldsymbol{l}, \boldsymbol{v})=\text { diffuse }+\frac{D\left(\theta_{h}\right) F\left(\theta_{d}\right) G\left(\theta_{l}, \theta_{v}\right)}{4 \cos \theta_{l} \cos \theta_{v}}
```
