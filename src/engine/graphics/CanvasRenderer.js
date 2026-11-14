export class CanvasRenderer{
 constructor(canvas){this.canvas=canvas;this.context=canvas.getContext("2d",{alpha:false});if(!this.context)throw new Error("No se pudo inicializar Canvas 2D.");this.width=0;this.height=0;this.pixelRatio=1;this.background="#152321";}
 resize(){const rect=this.canvas.getBoundingClientRect();const ratio=Math.min(window.devicePixelRatio||1,2);const width=Math.max(1,Math.round(rect.width*ratio));const height=Math.max(1,Math.round(rect.height*ratio));if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}this.width=width;this.height=height;this.pixelRatio=ratio;this.context.imageSmoothingEnabled=false;this.context.setTransform(ratio,0,0,ratio,0,0);}
 beginFrame(){const c=this.context;c.save();c.setTransform(this.pixelRatio,0,0,this.pixelRatio,0,0);c.fillStyle=this.background;c.fillRect(0,0,this.logicalWidth,this.logicalHeight);}
 endFrame(){this.context.restore();}
 clear(color=this.background){this.context.fillStyle=color;this.context.fillRect(0,0,this.logicalWidth,this.logicalHeight);}
 get logicalWidth(){return this.width/this.pixelRatio;}get logicalHeight(){return this.height/this.pixelRatio;}
 rect(x,y,w,h,color){this.context.fillStyle=color;this.context.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 line(x1,y1,x2,y2,color,width=1){const c=this.context;c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();}
 text(value,x,y,color="#fff",size=12){this.context.fillStyle=color;this.context.font=`bold ${size}px monospace`;this.context.fillText(value,x,y);}
 circle(x,y,r,color){const c=this.context;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
}
