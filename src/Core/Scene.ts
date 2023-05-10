import Model3D from "./Model";

class Scene{
		constructor(){
				this.objects = [];
		}
		objects: Array<Model3D>;
		add(object: Model3D){
				this.objects.push(object);
		}
		render(){
				for(let i = 0; i < this.objects.length; i++){
						this.objects[i].render();
				}
		}
}