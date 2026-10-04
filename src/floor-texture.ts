import type { Scene } from 'phaser';

export const FLOOR_TEXTURE_KEY = 'neutral-floor';
export const FLOOR_TEXTURE_WIDTH = 256;
export const FLOOR_TEXTURE_HEIGHT = 128;

/** Bake a seamless 2:1 diamond grid once; no per-tile objects or image downloads. */
export function createFloorTexture(scene: Scene): void {
  const texture = scene.textures.createCanvas(
    FLOOR_TEXTURE_KEY,
    FLOOR_TEXTURE_WIDTH,
    FLOOR_TEXTURE_HEIGHT,
  );

  if (!texture) throw new Error('Could not create the floor texture.');

  const context = texture.context;
  const image = context.createImageData(FLOOR_TEXTURE_WIDTH, FLOOR_TEXTURE_HEIGHT);
  const lineDistance = (coordinate: number): number => {
    const wrapped = ((coordinate % 128) + 128) % 128;
    return Math.min(wrapped, 128 - wrapped) / Math.sqrt(5);
  };

  // Periodic line distances produce exact matching edges, including antialiasing.
  // The two line families slope at +/- 1:2, forming 128 x 64 pixel diamonds.
  for (let y = 0; y < FLOOR_TEXTURE_HEIGHT; y += 1) {
    for (let x = 0; x < FLOOR_TEXTURE_WIDTH; x += 1) {
      const centerX = x + 0.5;
      const centerY = y + 0.5;
      const distance = Math.min(
        lineDistance(2 * centerY - centerX - 64),
        lineDistance(2 * centerY + centerX - 64),
      );
      const coverage = Math.max(0, Math.min(1, 1 - distance));
      const index = (y * FLOOR_TEXTURE_WIDTH + x) * 4;
      image.data[index] = Math.round(59 - 21 * coverage);
      image.data[index + 1] = Math.round(67 - 21 * coverage);
      image.data[index + 2] = Math.round(68 - 21 * coverage);
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  texture.refresh();
}
