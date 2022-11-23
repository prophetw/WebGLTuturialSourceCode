# WebGLexamples

> Demo from
1. book [WebGL Programming Guide source code demo]
2. [webglfundamentals](https://webglfundamentals.org/)  
3. [webgl2example](https://github.com/tsherif/webgl2examples)
4. [learnopengl](https://learnopengl.com/)
5. [3dGameShadersForBeginner](https://lettier.github.io/3d-game-shaders-for-beginners/index.html)

```bash
# install dep
$ yarn

# start static server
$ yarn start

# change src/index.js choose target example

git clone https://github.com/prophetw/WebGLTuturialSourceCode.git WebGLexamples

# use Spector to debug gl instructions
git clone https://github.com/BabylonJS/Spector.js.git
cd Spector.js 
yarn 
yarn link

cd WebGLexamples
yarn link 'spectorjs'

# if you want to debug webgl commands 
```js
window.spector.startCapture(document.getElementById('canvasId'), commandCount)
```

##  webgl programming guide source code 
##  base on https://github.com/liujingjie/WebGLexamples.git

### feature
1. use parcel start up
2. remove all html files
3. move vert frag to single .glsl file
4. test 
