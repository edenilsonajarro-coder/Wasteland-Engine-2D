export class SceneManager{
 constructor(context){this.context=context;this.scenes=new Map();this.current=null;this.currentName=null;}
 register(name,scene){if(this.scenes.has(name))throw new Error(`La escena "${name}" ya existe.`);this.scenes.set(name,scene);}
 switchTo(name){const next=this.scenes.get(name);if(!next)throw new Error(`No existe la escena "${name}".`);if(this.current?.exit)this.current.exit();this.current=next;this.currentName=name;this.current.enter?.(this.context);this.context.events.emit("scene:changed",{name:next.name??name});}
 update(delta){this.current?.update?.(delta,this.context);}
 render(renderer){this.current?.render?.(renderer,this.context);}
}
