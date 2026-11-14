export class TestScene{
 constructor({name,variant=0}){this.name=name;this.variant=variant;this.marker={x:0,y:0,size:12};this.time=0;}
 enter({renderer}){this.marker.x=renderer.logicalWidth/2;this.marker.y=renderer.logicalHeight/2;}
 update(delta,{renderer,input}){this.time+=delta;const move=input.movement;this.marker.x+=move.x*150*delta;this.marker.y+=move.y*150*delta;if(input.pointer.down||input.pointer.pressed){this.marker.x=input.pointer.x;this.marker.y=input.pointer.y;}this.marker.x=Math.max(12,Math.min(renderer.logicalWidth-12,this.marker.x));this.marker.y=Math.max(12,Math.min(renderer.logicalHeight-12,this.marker.y));}
 render(renderer){const w=renderer.logicalWidth,h=renderer.logicalHeight;renderer.background=this.variant?"#1a2026":"#152321";renderer.clear(renderer.background);const tile=32;
 for(let y=0;y<h;y+=tile)for(let x=0;x<w;x+=tile){const alt=((x/tile+y/tile)%2)===0;renderer.rect(x,y,tile,tile,this.variant?(alt?"#29332f":"#303b35"):(alt?"#24372f":"#293d34"));}
 for(let i=0;i<14;i++){const x=28+(i*73)%Math.max(80,w-56),y=35+(i*47)%Math.max(80,h-70);renderer.rect(x,y,13,13,"#4c5941");renderer.rect(x+3,y-5,7,8,"#75804b");renderer.rect(x+4,y+10,5,7,"#574333");}
 renderer.rect(0,h*.72,w,22,"#55534a");renderer.line(0,h*.72,w,h*.72,"#777568",2);renderer.text(this.name.toUpperCase(),16,h-17,"#e4d4b2",11);
 const p=this.marker;renderer.rect(p.x-7,p.y-4,14,12,"#202b35");renderer.rect(p.x-5,p.y-11,10,9,"#d6a35b");renderer.rect(p.x-3,p.y-9,6,5,"#394c5a");renderer.rect(p.x-5,p.y+8,4,5,"#2b2420");renderer.rect(p.x+1,p.y+8,4,5,"#2b2420");renderer.text("SURVIVOR",p.x+12,p.y-5,"#f1e4c9",9);}
}
