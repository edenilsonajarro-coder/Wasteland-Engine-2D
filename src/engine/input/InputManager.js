export class InputManager{
 constructor(target){this.target=target;this.keys=new Set();this.pointer={x:0,y:0,down:false,pressed:false,released:false};
 this.boundKeyDown=e=>{this.keys.add(e.code);if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();};
 this.boundKeyUp=e=>this.keys.delete(e.code);window.addEventListener("keydown",this.boundKeyDown);window.addEventListener("keyup",this.boundKeyUp);
 target.addEventListener("pointerdown",this.onPointerDown.bind(this));target.addEventListener("pointermove",this.onPointerMove.bind(this));window.addEventListener("pointerup",this.onPointerUp.bind(this));window.addEventListener("blur",()=>{this.keys.clear();this.pointer.down=false;});}
 position(e){const r=this.target.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
 onPointerDown(e){this.target.setPointerCapture?.(e.pointerId);Object.assign(this.pointer,this.position(e),{down:true,pressed:true});}
 onPointerMove(e){Object.assign(this.pointer,this.position(e));}
 onPointerUp(e){Object.assign(this.pointer,this.position(e),{down:false,released:true});}
 update(){this.pointer.pressed=false;this.pointer.released=false;}
 isDown(...codes){return codes.some(code=>this.keys.has(code));}
 get movement(){return{x:Number(this.isDown("ArrowRight","KeyD"))-Number(this.isDown("ArrowLeft","KeyA")),y:Number(this.isDown("ArrowDown","KeyS"))-Number(this.isDown("ArrowUp","KeyW"))};}
}
