export class WastelandScene {
  constructor() {
    this.name = "Perímetro abandonado";
    this.player = { x: 0, y: 0, hp: 100, stamina: 100, hunger: 82, speed: 145, attack: 0, facingX: 1, facingY: 0 };
    this.camera = { x: 0, y: 0 };
    this.enemies = [];
    this.crates = [];
    this.resources = { madera: 0, piedra: 0, fibra: 0, chatarra: 0 };
    this.resourceNodes = [];
    this.structures = [];
    this.storage = { madera: 0, piedra: 0, fibra: 0, chatarra: 0 };
    this.inventoryOpen = false; this.craftOpen = false; this.buildMode = false; this.storageOpen = false;
    this.equipment = { weapon: "Cuchillo" };
    this.chunkCache = new Map();
    this.recipes = [
      {name:"Vendaje",cost:{fibra:3},run:()=>{this.medkits++;}},
      {name:"Cuchillo reforzado",cost:{madera:2,piedra:2,chatarra:2},run:()=>{this.equipment.weapon="Cuchillo reforzado";this.player.damage=36;}},
      {name:"Almacén",cost:{madera:6,piedra:2},run:()=>{this.buildMode=true;this.pendingBuild="storage";}},
      {name:"Fogata",cost:{madera:4,piedra:3},run:()=>{this.buildMode=true;this.pendingBuild="campfire";}}
    ];
    this.time = 0;
    this.message = "Explora el perímetro. Acércate a las cajas para saquear.";
    this.messageTime = 5;
    this.scrap = 0;
    this.medkits = 2;
    this.food = 3;
    this.selected = 0;
    this.worldSeed = 9137;
    this.sprites = {};
    this.loadSprite("survivor", "./assets/wasteland/characters/survivor_scavenger_32px.png");
    this.loadSprite("infected", "./assets/wasteland/enemies/infected_walker_32px.png");
    this.loadSprite("terrainAtlas", "./assets/wasteland/terrain/wasteland_terrain_atlas.svg");
  }

  loadSprite(key, src) {
    const image = new Image();
    image.onload = () => { this.sprites[key] = image; this.chunkCache.clear(); };
    image.onerror = () => { console.warn("No se pudo cargar el recurso Wasteland:", src); };
    image.src = src;
  }

  drawSheetFrame(renderer, key, column, row, columns, x, y, size = 40) {
    const image = this.sprites[key];
    if (!image) return false;
    const frameW = image.width / columns;
    const frameH = frameW;
    const sx = Math.max(0, Math.min(image.width - frameW, column * frameW));
    const sy = Math.max(0, Math.min(image.height - frameH, row * frameH));
    renderer.context.drawImage(image, sx, sy, frameW, frameH,
      Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    return true;
  }

  drawAtlasTile(renderer, col, row, x, y, size = 32) {
    const image = this.sprites.terrainAtlas;
    if (!image) return false;
    renderer.context.drawImage(image, col * 16, row * 16, 16, 16,
      Math.round(x), Math.round(y), size, size);
    return true;
  }

  drawNature(renderer, kind, x, y, size = 42) {
    const image = this.sprites.terrainAtlas;
    if (!image) return false;
    const sources = {
      tree: [0, 48, 32, 48],
      pine: [32, 48, 32, 48],
      deadTree: [64, 48, 32, 48],
      rock: [96, 48, 32, 48],
      boulder: [0, 96, 32, 32],
      log: [64, 96, 32, 32]
    };
    const src = sources[kind] || sources.rock;
    renderer.context.drawImage(image, src[0], src[1], src[2], src[3],
      Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    return true;
  }

  directionIndex(x, y) {
    if (Math.abs(x) > Math.abs(y)) return x < 0 ? 1 : 2;
    return y < 0 ? 3 : 0;
  }

  random(x, y) {
    let n = Math.imul(x + this.worldSeed, 374761393) ^ Math.imul(y - this.worldSeed, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  }

  enter({ renderer }) {
    this.player.x = 0; this.player.y = 0;
    this.enemies = [];
    this.crates = [];
    this.resourceNodes = [];
    this.structures = []; this.storage = { madera:0,piedra:0,fibra:0,chatarra:0 };
    this.inventoryOpen = this.craftOpen = this.buildMode = this.storageOpen = false;
    this.resources = { madera: 0, piedra: 0, fibra: 0, chatarra: 0 };
    for (let i = 0; i < 11; i++) {
      const a = i * 2.399;
      const d = 230 + this.random(i, 4) * 390;
      this.enemies.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, hp: 40, maxHp: 40, speed: 30 + this.random(i, 8) * 18, hit: 0, dead: false });
    }
    for (let y = -14; y <= 14; y++) for (let x = -18; x <= 18; x++) {
      const roll = this.random(x + 311, y - 97);
      if (roll > .987) this.crates.push({ x: x * 64 + 32, y: y * 64 + 32, looted: false });
      else if (roll > .955) {
        const kind = roll > .979 ? "tree" : roll > .968 ? "rock" : "bush";
        this.resourceNodes.push({ x: x * 64 + 32, y: y * 64 + 32, kind, alive: true, amount: kind === "tree" ? 2 : kind === "rock" ? 2 : 1 });
      }
    }
    this.message = "Perímetro abandonado · Busca suministros y evita a los infectados.";
    this.messageTime = 6;
  }

  update(dt, { renderer, input }) {
    this.time += dt;
    this.messageTime = Math.max(0, this.messageTime - dt);
    const move = input.movement;
    const p = this.player;
    if (Math.hypot(move.x, move.y) > .05) {
      p.facingX = move.x; p.facingY = move.y;
      p.facingDir = this.directionIndex(move.x, move.y);
      p.moving = true;
      p.x += move.x * p.speed * dt;
      p.y += move.y * p.speed * dt;
      p.stamina = Math.max(0, p.stamina - 9 * dt);
    } else { p.moving = false; p.stamina = Math.min(100, p.stamina + 8 * dt); }
    p.hunger = Math.max(0, p.hunger - .018 * dt);
    if (p.hunger <= 0) p.hp = Math.max(1, p.hp - .6 * dt);
    p.attack = Math.max(0, p.attack - dt);
    this.camera.x = p.x - renderer.logicalWidth / 2;
    this.camera.y = p.y - renderer.logicalHeight / 2;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const dx = p.x - enemy.x, dy = p.y - enemy.y, d = Math.hypot(dx, dy);
      enemy.moving = d < 260 && d > 22;
      if (enemy.moving) {
        enemy.facingDir = this.directionIndex(dx, dy);
        enemy.x += dx / d * enemy.speed * dt;
        enemy.y += dy / d * enemy.speed * dt;
      }
      else if (d <= 22) { p.hp = Math.max(0, p.hp - 5 * dt); }
      enemy.hit = Math.max(0, enemy.hit - dt);
    }
    if (input.isDown("KeyC") && !this.keyC) this.craftOpen = !this.craftOpen;
    if (input.isDown("KeyI") && !this.keyI) this.inventoryOpen = !this.inventoryOpen;
    if (input.isDown("KeyB") && !this.keyB) this.buildMode = !this.buildMode;
    this.keyC=input.isDown("KeyC"); this.keyI=input.isDown("KeyI"); this.keyB=input.isDown("KeyB");
    if (this.craftOpen) for(let i=1;i<=4;i++) if(input.isDown("Digit"+i)&&this.lastDigit!==i){this.craft(i-1);this.lastDigit=i;}
    if (![1,2,3,4].some(i=>input.isDown("Digit"+i))) this.lastDigit=0;
    if ((input.isDown("Space") || input.isActionDown("attack")) && p.attack <= 0) this.attack();
    if ((input.isDown("KeyE") || input.isActionDown("interact")) && !this.interactHeld) { this.interact(); this.interactHeld = true; }
    if (!input.isDown("KeyE") && !input.isActionDown("interact")) this.interactHeld = false;
    for (let i = 1; i <= 4; i++) if (input.isDown("Digit" + i) && this.lastDigit !== i) { this.useSlot(i - 1); this.lastDigit = i; }
    if (![1,2,3,4].some(i => input.isDown("Digit" + i))) this.lastDigit = 0;
  }

  attack() {
    this.player.attack = .32;
    let defeated = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < 48) {
        e.hp -= this.player.damage || 24; e.hit = .2;
        if (e.hp <= 0) { e.dead = true; this.scrap++; defeated++; }
      }
    }
    this.message = defeated ? "Infectado eliminado · +1 chatarra" : "Ataque con cuchillo";
    this.messageTime = 1.8;
  }

  craft(index) {
    const recipe=this.recipes[index]; if(!recipe)return;
    if(!Object.entries(recipe.cost).every(([k,v])=>(this.resources[k]||0)>=v)){this.message="Materiales insuficientes";this.messageTime=2;return;}
    for(const [k,v] of Object.entries(recipe.cost))this.resources[k]-=v;
    recipe.run();this.message="Fabricado: "+recipe.name;this.messageTime=2.5;
  }
  placeStructure() {
    const type=this.pendingBuild||"storage";
    this.structures.push({type,x:Math.round((this.player.x+this.player.facingX*48)/32)*32,y:Math.round((this.player.y+this.player.facingY*48)/32)*32});
    this.pendingBuild=null;this.buildMode=false;this.interactHeld=true;this.message="Construcción completada: "+type;this.messageTime=2.5;
  }
  interact() {
    if(this.buildMode&&this.pendingBuild){this.placeStructure();return;}
    const nearby=this.structures.find(o=>o.type==="storage"&&Math.hypot(o.x-this.player.x,o.y-this.player.y)<62);
    if(nearby){for(const k of Object.keys(this.resources)){this.storage[k]+=this.resources[k];this.resources[k]=0;}this.storageOpen=!this.storageOpen;this.message="Materiales depositados en el almacén";this.messageTime=2;return;}
    const px = this.player.x, py = this.player.y;
    const box = this.crates.filter(c => !c.looted).sort((a,b) => Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py))[0];
    if (box && Math.hypot(box.x-px,box.y-py) < 58) {
      box.looted = true;
      const roll = this.random(Math.floor(box.x), Math.floor(box.y));
      const loot = roll > .66 ? ["madera", 2] : roll > .33 ? ["piedra", 2] : ["chatarra", 3];
      this.resources[loot[0]] += loot[1];
      this.scrap += loot[0] === "chatarra" ? loot[1] : 0;
      this.message = "Caja saqueada · +" + loot[1] + " " + loot[0];
      this.messageTime = 2.4;
      return;
    }
    const node = this.resourceNodes.filter(n => n.alive).sort((a,b) => Math.hypot(a.x-px,a.y-py)-Math.hypot(b.x-px,b.y-py))[0];
    if (node && Math.hypot(node.x-px,node.y-py) < 62) {
      node.amount--;
      const material = node.kind === "tree" ? "madera" : node.kind === "rock" ? "piedra" : "fibra";
      this.resources[material] += 1;
      if (node.amount <= 0) node.alive = false;
      this.message = "Recurso recolectado · +1 " + material;
    } else this.message = "No hay recursos ni cajas al alcance.";
    this.messageTime = 2;
  }

  useSlot(slot) {
    this.selected = slot;
    if (slot === 1 && this.medkits > 0 && this.player.hp < 100) { this.medkits--; this.player.hp = Math.min(100, this.player.hp + 45); this.message = "Botiquín utilizado · +45 vida"; }
    else if (slot === 2 && this.food > 0 && this.player.hunger < 100) { this.food--; this.player.hunger = Math.min(100, this.player.hunger + 35); this.message = "Ración consumida · +35 hambre"; }
    else this.message = ["Cuchillo equipado", "Sin botiquines o vida completa", "Sin comida o hambre completa", this.scrap + " chatarra recolectada"][slot];
    this.messageTime = 2;
  }

  drawTile(renderer, x, y, size, color) { renderer.rect(x, y, size, size, color); }
  render(renderer) {
    const w = renderer.logicalWidth, h = renderer.logicalHeight, cx = this.camera.x, cy = this.camera.y;
    renderer.clear("#1b2923");
    const chunkSize=512, x0=Math.floor(cx/chunkSize), y0=Math.floor(cy/chunkSize), x1=Math.floor((cx+w)/chunkSize), y1=Math.floor((cy+h)/chunkSize);
    for(let gy=y0;gy<=y1;gy++)for(let gx=x0;gx<=x1;gx++){
      const key=gx+":"+gy;let chunk=this.chunkCache.get(key);
      if(!chunk){
        chunk=document.createElement("canvas");chunk.width=512;chunk.height=512;
        const c=chunk.getContext("2d");c.imageSmoothingEnabled=false;
        for(let ty=0;ty<16;ty++)for(let tx=0;tx<16;tx++){
          const wx=gx*512+tx*32,wy=gy*512+ty*32,ix=Math.floor(wx/32),iy=Math.floor(wy/32),n=this.random(ix,iy);
          const col=n>.94?5:n>.87?3:n>.78?1:0,row=n>.965?2:n>.91?1:0;
          if(this.sprites.terrainAtlas)c.drawImage(this.sprites.terrainAtlas,col*16,row*16,16,16,tx*32,ty*32,32,32);
          else{c.fillStyle=n>.91?"#5a6048":n>.78?"#394c38":((ix+iy)%2?"#2d4436":"#304838");c.fillRect(tx*32,ty*32,32,32);}
          const d=this.random(ix+71,iy-19);
          if(this.sprites.terrainAtlas&&d>.986){const src=d>.997?[64,48]:d>.993?[32,48]:[0,48];c.drawImage(this.sprites.terrainAtlas,src[0],src[1],32,48,tx*32-3,ty*32-8,38,48);}
          else if(this.sprites.terrainAtlas&&d>.972)c.drawImage(this.sprites.terrainAtlas,96,48,32,48,tx*32+2,ty*32+2,27,27);
        }
        this.chunkCache.set(key,chunk);
      }
      renderer.context.drawImage(chunk,Math.round(gx*chunkSize-cx),Math.round(gy*chunkSize-cy));
    }
    if(this.chunkCache.size>40){const keep=new Set();for(let gy=y0-1;gy<=y1+1;gy++)for(let gx=x0-1;gx<=x1+1;gx++)keep.add(gx+":"+gy);for(const key of this.chunkCache.keys())if(!keep.has(key))this.chunkCache.delete(key);}
    // Ruined road crossing the sector
    const roadY = Math.floor(3 * 32 - cy);
    renderer.rect(0, roadY, w, 25, "#5a574b");
    renderer.line(0, roadY, w, roadY, "#817966", 2);
    // Scavenge crates
    for (const c of this.crates) if (!c.looted) {
      const x = c.x - cx, y = c.y - cy;
      if (x < -30 || y < -30 || x > w + 30 || y > h + 30) continue;
      renderer.rect(x - 10, y - 8, 20, 17, "#86613a");
      renderer.rect(x - 8, y - 6, 16, 2, "#c49a5c");
      renderer.line(x - 8, y - 6, x + 8, y + 7, "#4b3929", 2);
      renderer.line(x + 8, y - 6, x - 8, y + 7, "#4b3929", 2);
    }
    // Recolectables del entorno: árboles, rocas y arbustos con estado persistente durante la sesión.
    for (const node of this.resourceNodes) if (node.alive) {
      const x = node.x - cx, y = node.y - cy;
      if (x < -45 || y < -45 || x > w + 45 || y > h + 45) continue;
      if (node.kind === "tree") this.drawNature(renderer, "tree", x, y, 40);
      else if (node.kind === "rock") this.drawNature(renderer, "rock", x, y, 28);
      else {
        renderer.rect(x - 8, y - 4, 16, 10, "#49633a");
        renderer.rect(x - 5, y - 8, 9, 8, "#668447");
        renderer.rect(x - 2, y - 9, 3, 3, "#a0a65b");
      }
      renderer.rect(x - 11, y + 15, 22, 3, "#17201a");
      renderer.rect(x - 11, y + 15, 22 * node.amount / (node.kind === "bush" ? 1 : 2), 3, "#c49a58");
    }
    for(const o of this.structures){const x=o.x-cx,y=o.y-cy;if(o.type==="storage"){renderer.rect(x-14,y-11,28,22,"#795333");renderer.rect(x-12,y-9,24,5,"#bd8b4d");renderer.line(x-10,y-6,x+10,y+8,"#3e3025",3);}else{renderer.circle(x,y,13,"#564332");renderer.circle(x,y,8,"#d17b37");renderer.circle(x,y,4,"#f4c46a");}}
    // Enemies
    for (const e of this.enemies) if (!e.dead) {
      const x = e.x - cx, y = e.y - cy;
      if (x < -35 || y < -35 || x > w + 35 || y > h + 35) continue;
      const enemyDir = e.facingDir ?? 0;
      const enemyRow = e.hit > 0 ? 12 + enemyDir : (e.moving ? 4 : 0) + enemyDir;
      const enemyFrame = e.hit > 0 ? Math.floor((.2 - e.hit) * 10) % 2 : (e.moving ? Math.floor(this.time * 7) % 4 : Math.floor(this.time * 2.4) % 2);
      if (!this.drawSheetFrame(renderer, "infected", enemyFrame, enemyRow, 4, x, y, 38)) {
        renderer.rect(x - 8, y - 6, 16, 15, e.hit > 0 ? "#c7a58a" : "#78834c");
        renderer.rect(x - 5, y - 13, 10, 8, "#9b9876");
        renderer.rect(x - 4, y - 10, 2, 2, "#d95d48"); renderer.rect(x + 2, y - 10, 2, 2, "#d95d48");
      }
      if (e.hp < e.maxHp) { renderer.rect(x - 10, y - 19, 20, 3, "#271d1b"); renderer.rect(x - 10, y - 19, 20 * e.hp / e.maxHp, 3, "#bd5946"); }
    }
    // Survivor
    const px = this.player.x - cx, py = this.player.y - cy;
    const playerDir = this.player.facingDir ?? 2;
    const playerRow = this.player.attack > 0 ? 12 + playerDir : (this.player.moving ? 4 : 0) + playerDir;
    const playerFrame = this.player.attack > 0 ? Math.min(3, Math.floor((.32 - this.player.attack) * 13)) : (this.player.moving ? Math.floor(this.time * 8.7) % 6 : Math.floor(this.time * 2.4) % 2);
    if (!this.drawSheetFrame(renderer, "survivor", playerFrame, playerRow, 6, px, py, 42)) {
      renderer.rect(px - 8, py - 5, 16, 16, "#354b42");
      renderer.rect(px - 6, py - 15, 12, 11, "#b18a61");
      renderer.rect(px - 7, py - 17, 14, 4, "#282e2a");
      renderer.rect(px - 7, py + 10, 5, 7, "#292721"); renderer.rect(px + 2, py + 10, 5, 7, "#292721");
    }
    if (this.player.attack > 0) renderer.circle(px + this.player.facingX * 18, py + this.player.facingY * 18, 3, "#f0d17b");

    // HUD is rendered by the engine renderer, not by a second canvas or external game loop.
    renderer.rect(10, 10, 194, 65, "rgba(8,13,12,.82)");
    renderer.text("WASTELAND · SECTOR 01", 18, 25, "#e6d6ad", 10);
    this.drawBar(renderer, 18, 35, 118, this.player.hp, "#b95743", "VIDA");
    this.drawBar(renderer, 18, 49, 118, this.player.stamina, "#c2a34d", "RES");
    this.drawBar(renderer, 18, 63, 118, this.player.hunger, "#789653", "HAM");
    renderer.text("CHATARRA " + this.scrap, 145, 45, "#d6c79f", 9);
    renderer.rect(10, 83, 254, 28, "rgba(8,13,12,.82)");
    renderer.text("MADERA " + this.resources.madera + "   PIEDRA " + this.resources.piedra, 18, 95, "#e1d3b4", 9);
    renderer.text("FIBRA " + this.resources.fibra + "   BOTIQUÍN " + this.medkits + "   COMIDA " + this.food, 18, 105, "#b8c6a0", 8);
    if(this.craftOpen||this.inventoryOpen||this.storageOpen||this.buildMode){
      renderer.rect(w-236,82,224,116,"rgba(8,13,12,.93)");
      renderer.text(this.craftOpen?"FABRICACIÓN":this.inventoryOpen?"INVENTARIO":this.storageOpen?"ALMACÉN":"CONSTRUCCIÓN",w-224,99,"#e6d6ad",11);
      if(this.craftOpen)this.recipes.forEach((r,i)=>renderer.text((i+1)+". "+r.name+" · "+Object.entries(r.cost).map(([k,v])=>v+" "+k).join(", "),w-224,119+i*17,"#d9dfd1",8));
      else{renderer.text("Madera "+this.resources.madera+" · Piedra "+this.resources.piedra,w-224,121,"#d9dfd1",9);renderer.text("Fibra "+this.resources.fibra+" · Chatarra "+this.scrap,w-224,139,"#d9dfd1",9);renderer.text("Arma: "+this.equipment.weapon,w-224,157,"#d9dfd1",9);}
    }
    if (this.messageTime > 0) {
      const msgWidth = Math.min(w - 24, Math.max(180, this.message.length * 6.2 + 24));
      renderer.rect((w - msgWidth) / 2, 84, msgWidth, 26, "rgba(8,13,12,.85)");
      renderer.text(this.message, (w - msgWidth) / 2 + 10, 101, "#f0dfb7", 10);
    }
    // Los controles táctiles ya están visibles en pantalla; se evita duplicar instrucciones sobre el mapa.
  }

  drawBar(renderer, x, y, width, value, color, label) {
    renderer.text(label, x, y + 1, "#c9c2a8", 7);
    renderer.rect(x + 28, y - 6, width - 28, 5, "#39413a");
    renderer.rect(x + 28, y - 6, (width - 28) * Math.max(0, value) / 100, 5, color);
  }
}
