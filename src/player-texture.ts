import type { Scene } from 'phaser';

export const PLAYER_TEXTURE_KEY = 'player-placeholder';
export const PLAYER_WIDTH = 64;
export const PLAYER_HEIGHT = 80;
export const PLAYER_FEET_Y = 70;

/** Bake the placeholder and its ground shadow once at twice the display size. */
export function createPlayerTexture(scene: Scene): void {
  const texture = scene.textures.createCanvas(
    PLAYER_TEXTURE_KEY,
    PLAYER_WIDTH * 2,
    PLAYER_HEIGHT * 2,
  );
  if (!texture) throw new Error('Could not create the player texture.');

  const context = texture.context;
  context.scale(2, 2);
  context.lineJoin = 'round';
  context.lineCap = 'round';

  // A shallow ellipse places the upright figure on the isometric ground plane.
  context.fillStyle = 'rgba(14, 20, 21, 0.35)';
  context.beginPath();
  context.ellipse(32, PLAYER_FEET_Y, 16, 7, 0, 0, Math.PI * 2);
  context.fill();

  // Far leg, near leg, and boots.
  context.strokeStyle = '#243035';
  context.lineWidth = 9;
  context.beginPath();
  context.moveTo(28, 46);
  context.lineTo(26, 64);
  context.moveTo(36, 46);
  context.lineTo(38, 66);
  context.stroke();
  context.strokeStyle = '#677b80';
  context.lineWidth = 5;
  context.stroke();
  context.strokeStyle = '#202b30';
  context.lineWidth = 7;
  context.beginPath();
  context.moveTo(25, 67);
  context.lineTo(29, 67);
  context.moveTo(37, 69);
  context.lineTo(42, 69);
  context.stroke();

  // Arms sit behind a slightly angled torso.
  context.strokeStyle = '#26363c';
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(23, 31);
  context.lineTo(18, 43);
  context.lineTo(21, 49);
  context.moveTo(41, 32);
  context.lineTo(45, 44);
  context.lineTo(42, 51);
  context.stroke();
  context.strokeStyle = '#8aabb5';
  context.lineWidth = 4;
  context.stroke();

  context.beginPath();
  context.moveTo(23, 29);
  context.lineTo(37, 27);
  context.lineTo(42, 32);
  context.lineTo(39, 49);
  context.lineTo(26, 50);
  context.lineTo(21, 43);
  context.closePath();
  context.fillStyle = '#9fbcc5';
  context.fill();
  context.strokeStyle = '#26363c';
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = '#7f9faa';
  context.beginPath();
  context.moveTo(35, 28);
  context.lineTo(40, 32);
  context.lineTo(37, 47);
  context.lineTo(32, 48);
  context.closePath();
  context.fill();

  // Neutral, featureless head keeps this a replaceable humanoid placeholder.
  context.fillStyle = '#cedbd8';
  context.strokeStyle = '#29383c';
  context.lineWidth = 2;
  context.beginPath();
  context.ellipse(33, 18, 7, 9, -0.1, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  texture.refresh();
}
