import type Phaser from 'phaser';

const TEXTURE_KEY = 'stone-markers';
const WIDTH = 64;
const HEIGHT = 80;
const GROUND_Y = 60;
const CELL_WIDTH = 384;
const CELL_HEIGHT = 192;

function cellHash(x: number, y: number): number {
  let value = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ 0x6a09e667;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return (value ^ (value >>> 16)) >>> 0;
}

function createMarkerTexture(scene: Phaser.Scene): void {
  const texture = scene.textures.createCanvas(TEXTURE_KEY, WIDTH * 2 * 3, HEIGHT * 2);
  if (!texture) throw new Error('Could not create the marker texture.');

  const context = texture.context;
  const polygon = (points: number[][], color: string): void => {
    context.beginPath();
    points.forEach(([x, y], index) => {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = '#394747';
    context.lineWidth = 1;
    context.stroke();
  };

  for (let variant = 0; variant < 3; variant += 1) {
    context.save();
    context.translate(variant * WIDTH * 2, 0);
    context.scale(2, 2);
    const top = GROUND_Y - (20 + variant * 7);

    context.fillStyle = 'rgba(16, 23, 24, 0.3)';
    context.beginPath();
    context.ellipse(37, GROUND_Y + 3, 22, 9, 0, 0, Math.PI * 2);
    context.fill();
    polygon([[16, top], [32, top + 8], [32, 68], [16, 60]], '#71817e');
    polygon([[32, top + 8], [48, top], [48, 60], [32, 68]], '#4f615e');
    polygon([[32, top - 8], [48, top], [32, top + 8], [16, top]], '#9eada6');

    context.restore();
    texture.add(variant, 0, variant * WIDTH * 2, 0, WIDTH * 2, HEIGHT * 2);
  }

  texture.refresh();
}

/** A fixed pool for the visible area; cell hashes replace a stored world map. */
export class MarkerField {
  public readonly images: Phaser.GameObjects.Image[] = [];
  private columns = 0;
  private rows = 0;
  private width = 0;
  private height = 0;

  constructor(private readonly scene: Phaser.Scene) {
    createMarkerTexture(scene);
  }

  resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.columns = Math.ceil(width / CELL_WIDTH) + 2;
    this.rows = Math.ceil(height / CELL_HEIGHT) + 2;
    const capacity = this.columns * this.rows;

    while (this.images.length < capacity) {
      this.images.push(this.scene.add.image(0, 0, TEXTURE_KEY, 0)
        .setScale(0.5)
        .setOrigin(0.5, GROUND_Y / HEIGHT));
    }
    while (this.images.length > capacity) this.images.pop()!.destroy();
  }

  update(offsetX: number, offsetY: number): void {
    const firstColumn = Math.floor(offsetX / CELL_WIDTH) - 1;
    const firstRow = Math.floor(offsetY / CELL_HEIGHT) - 1;

    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) {
        const cellX = firstColumn + column;
        const cellY = firstRow + row;
        const hash = cellHash(cellX, cellY);
        let tileX = 1 + (hash & 3);
        const tileY = 1 + ((hash >>> 4) & 3);
        if ((tileX - tileY) % 2 !== 0) tileX += 1;

        // Bases sit at diamond centers; GPU positions remain near the viewport.
        const x = cellX * CELL_WIDTH - offsetX + tileX * 64;
        const y = cellY * CELL_HEIGHT - offsetY + tileY * 32;
        const image = this.images[row * this.columns + column];
        image.setPosition(x, y).setDepth(y).setFrame((hash >>> 8) % 3);
        image.setVisible(hash % 5 !== 0 && x > -32 && x < this.width + 32 &&
          y > -12 && y < this.height + 60);
      }
    }
  }
}
