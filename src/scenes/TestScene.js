export class TestScene {
  constructor({ name, variant = 0 }) {
    this.name = name;
    this.variant = variant;
    this.marker = { x: 0, y: 0, size: 12 };
    this.time = 0;
  }

  enter({ renderer }) {
    this.marker.x = renderer.logicalWidth / 2;
    this.marker.y = renderer.logicalHeight / 2;
  }

  update(delta, { renderer, input }) {
    this.time += delta;
    const movement = input.movement;
    const speed = 150;
    this.marker.x += movement.x * speed * delta;
    this.marker.y += movement.y * speed * delta;
    this.marker.x = Math.max(12, Math.min(renderer.logicalWidth - 12, this.marker.x));
    this.marker.y = Math.max(12, Math.min(renderer.logicalHeight - 12, this.marker.y));
  }

  render(renderer) {
    const width = renderer.logicalWidth;
    const height = renderer.logicalHeight;
    renderer.background = this.variant ? "#1a2026" : "#152321";
    renderer.clear(renderer.background);
    const tile = 32;

    for (let y = 0; y < height; y += tile) {
      for (let x = 0; x < width; x += tile) {
        const alternate = ((x / tile + y / tile) % 2) === 0;
        const color = this.variant
          ? (alternate ? "#29332f" : "#303b35")
          : (alternate ? "#24372f" : "#293d34");
        renderer.rect(x, y, tile, tile, color);
      }
    }

    for (let i = 0; i < 14; i++) {
      const x = 28 + ((i * 73) % Math.max(80, width - 56));
      const y = 35 + ((i * 47) % Math.max(80, height - 70));
      renderer.rect(x, y, 13, 13, "#4c5941");
      renderer.rect(x + 3, y - 5, 7, 8, "#75804b");
      renderer.rect(x + 4, y + 10, 5, 7, "#574333");
    }

    renderer.rect(0, height * 0.72, width, 22, "#55534a");
    renderer.line(0, height * 0.72, width, height * 0.72, "#777568", 2);
    renderer.text(this.name.toUpperCase(), 16, height - 17, "#e4d4b2", 11);

    const player = this.marker;
    renderer.rect(player.x - 7, player.y - 4, 14, 12, "#202b35");
    renderer.rect(player.x - 5, player.y - 11, 10, 9, "#d6a35b");
    renderer.rect(player.x - 3, player.y - 9, 6, 5, "#394c5a");
    renderer.rect(player.x - 5, player.y + 8, 4, 5, "#2b2420");
    renderer.rect(player.x + 1, player.y + 8, 4, 5, "#2b2420");
    renderer.text("SURVIVOR", player.x + 12, player.y - 5, "#f1e4c9", 9);
  }
}
