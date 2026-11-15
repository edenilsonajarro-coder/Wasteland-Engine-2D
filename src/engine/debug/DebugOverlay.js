export class DebugOverlay{
 constructor(){this.visible=true;}
 toggle(){this.visible=!this.visible;return this.visible;}
 render(renderer,stats,paused){if(!this.visible)return;const c=renderer.context;c.save();c.fillStyle="rgba(5,10,12,.72)";c.fillRect(10,10,124,58);renderer.text(`FPS ${stats.fps}`,18,27,"#9de0a8",11);renderer.text(paused?"PAUSADO":"ENGINE ACTIVE",18,43,"#d4dce0",9);renderer.text(`${stats.frameMs.toFixed(1)} ms promedio`,18,57,"#c3cbd0",8);c.restore();}
}
