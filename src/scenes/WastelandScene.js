export class WastelandScene {
  constructor() {
    this.name = "Perímetro abandonado";
    this.player = { x: 0, y: 0, hp: 100, stamina: 100, hunger: 82, speed: 145, attack: 0, facingX: 1, facingY: 0 };
    this.camera = { x: 0, y: 0 };
    this.enemies = [];
    this.crates = [];
    this.time = 0;
    this.message = "Explora el perímetro. Acércate a las cajas para saquear.";
    this.messageTime = 5;
    this.scrap = 0;
    this.medkits = 2;
    this.food = 3;
    this.selected = 0;
    this.worldSeed = 9137;
    this.sprites = {};
    this.loadSprite("grass", "./assets/wasteland/terrain/grass_base.png");
    this.loadSprite("survivorIdle", "./assets/wasteland/characters/survivor_idle_down.png");
    this.loadSprite("survivorWalk", "./assets/wasteland/characters/survivor_walk_down_0.png");
    this.loadSprite("infectedIdle", "./assets/wasteland/enemies/infected_idle_down.png");
    this.loadSprite("infectedWalk", "./assets/wasteland/enemies/infected_walk_down_0.png");
  }

  loadSprite(key, src) {
    const image = new Image();
    image.onload = () => { this.sprites[key] = image; };
    image.src = src;
  }

  blit(renderer, key, x, y, width, height) {
    const image = this.sprites[key];
    if (!image) return false;
    renderer.context.drawImage(image, Math.round(x - width / 2), Math.round(y - height / 2), width, height);
    return true;
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
    for (let i = 0; i < 11; i++) {
      const a = i * 2.399;
      const d = 230 + this.random(i, 4) * 390;
      this.enemies.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, hp: 40, maxHp: 40, speed: 30 + this.random(i, 8) * 18, hit: 0, dead: false });
    }
    for (let y = -10; y <= 10; y++) for (let x = -14; x <= 14; x++) {
      if (this.random(x, y) > .975) this.crates.push({ x: x * 64 + 32, y: y * 64 + 32, looted: false });
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
      p.x += move.x * p.speed * dt;
      p.y += move.y * p.speed * dt;
      p.stamina = Math.max(0, p.stamina - 9 * dt);
    } else p.stamina = Math.min(100, p.stamina + 8 * dt);
    p.hunger = Math.max(0, p.hunger - .018 * dt);
    if (p.hunger <= 0) p.hp = Math.max(1, p.hp - .6 * dt);
    p.attack = Math.max(0, p.attack - dt);
    this.camera.x = p.x - renderer.logicalWidth / 2;
    this.camera.y = p.y - renderer.logicalHeight / 2;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;
      const dx = p.x - enemy.x, dy = p.y - enemy.y, d = Math.hypot(dx, dy);
      enemy.moving = d < 260 && d > 22;
      if (enemy.moving) { enemy.x += dx / d * enemy.speed * dt; enemy.y += dy / d * enemy.speed * dt; }
      else if (d <= 22) { p.hp = Math.max(0, p.hp - 5 * dt); }
      enemy.hit = Math.max(0, enemy.hit - dt);
    }
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
        e.hp -= 24; e.hit = .2;
        if (e.hp <= 0) { e.dead = true; this.scrap++; defeated++; }
      }
    }
    this.message = defeated ? "Infectado eliminado · +1 chatarra" : "Ataque con cuchillo";
    this.messageTime = 1.8;
  }

  interact() {
    const box = this.crates.find(c => !c.looted && Math.hypot(c.x - this.player.x, c.y - this.player.y) < 58);
    if (box) { box.looted = true; this.scrap += 2; this.message = "Caja saqueada · +2 chatarra"; }
    else this.message = "No hay suministros cerca.";
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
    const tile = 32;
    const left = Math.floor(cx / tile) - 1, top = Math.floor(cy / tile) - 1;
    for (let ty = top; ty < top + Math.ceil(h / tile) + 2; ty++) for (let tx = left; tx < left + Math.ceil(w / tile) + 2; tx++) {
      const n = this.random(tx, ty), x = tx * tile - cx, y = ty * tile - cy;
      if (this.sprites.grass) renderer.context.drawImage(this.sprites.grass, Math.round(x), Math.round(y), tile, tile);
      else {
        const color = n > .91 ? "#5a6048" : n > .78 ? "#394c38" : (tx + ty) % 2 ? "#2d4436" : "#304838";
        this.drawTile(renderer, x, y, tile, color);
      }
      if (n > .97) { renderer.rect(x + 8, y + 10, 2, 2, "#83906a"); renderer.rect(x + 23, y + 22, 3, 2, "#202c25"); }
    }
    // Ruined road crossing the sector
    const roadY = Math.floor(3 * tile - cy);
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
    // Enemies
    for (const e of this.enemies) if (!e.dead) {
      const x = e.x - cx, y = e.y - cy;
      if (x < -35 || y < -35 || x > w + 35 || y > h + 35) continue;
      if (!this.blit(renderer, e.moving ? "infectedWalk" : "infectedIdle", x, y, 32, 32)) {
        renderer.rect(x - 8, y - 6, 16, 15, e.hit > 0 ? "#c7a58a" : "#78834c");
        renderer.rect(x - 5, y - 13, 10, 8, "#9b9876");
        renderer.rect(x - 4, y - 10, 2, 2, "#d95d48"); renderer.rect(x + 2, y - 10, 2, 2, "#d95d48");
      }
      if (e.hp < e.maxHp) { renderer.rect(x - 10, y - 19, 20, 3, "#271d1b"); renderer.rect(x - 10, y - 19, 20 * e.hp / e.maxHp, 3, "#bd5946"); }
    }
    // Survivor
    const px = this.player.x - cx, py = this.player.y - cy;
    if (!this.blit(renderer, Math.hypot(this.player.facingX, this.player.facingY) > .05 && this.time % .6 > .3 ? "survivorWalk" : "survivorIdle", px, py, 40, 40)) {
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
