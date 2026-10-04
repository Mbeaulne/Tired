import { expect, test } from '@playwright/test';
import type { FloorScene } from '../src/floor-scene';
import {
  FLOOR_TEXTURE_HEIGHT,
  FLOOR_TEXTURE_KEY,
  FLOOR_TEXTURE_WIDTH,
} from '../src/floor-texture';

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#status')).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => window.__tiredGame?.loop.running))
    .toBe(false);
  expect(errors).toEqual([]);
});

test('the texture is seamless and distant views match nearby equivalents', async ({ page }) => {
  const halvesMatch = await page.evaluate(({ key }) => {
    const source = window.__tiredGame!.textures.get(key).getSourceImage() as HTMLCanvasElement;
    const context = source.getContext('2d')!;
    const samePixels = (first: Uint8ClampedArray, second: Uint8ClampedArray): boolean =>
      first.every((value, index) => value === second[index]);

    return {
      horizontal: samePixels(
        context.getImageData(0, 0, 128, 128).data,
        context.getImageData(128, 0, 128, 128).data,
      ),
      vertical: samePixels(
        context.getImageData(0, 0, 256, 64).data,
        context.getImageData(0, 64, 256, 64).data,
      ),
    };
  }, { key: FLOOR_TEXTURE_KEY });
  expect(halvesMatch).toEqual({ horizontal: true, vertical: true });

  // Test the repeating floor separately from non-repeating world landmarks.
  await page.evaluate(async () => {
    const game = window.__tiredGame!;
    const scene = game.scene.getScene('Floor') as FloorScene;
    scene.cameras.main.ignore(scene.markers.images);
    const rendered = new Promise<void>((resolve) => game.events.once('postrender', () => resolve()));
    scene.setViewOffset(0, 0);
    await rendered;
  });

  const initial = await page.locator('canvas').screenshot();
  for (const offset of [
    { x: 83.25, y: 31.5 },
    { x: -83.25, y: -31.5 },
  ]) {
    await page.evaluate(async ({ x, y }) => {
      const game = window.__tiredGame!;
      const rendered = new Promise<void>((resolve) => game.events.once('postrender', () => resolve()));
      (game.scene.getScene('Floor') as FloorScene).setViewOffset(x, y);
      await rendered;
    }, offset);
    const nearby = await page.locator('canvas').screenshot();
    expect(nearby.equals(initial)).toBe(false);

    await page.evaluate(async ({ x, y }) => {
      const game = window.__tiredGame!;
      const rendered = new Promise<void>((resolve) => game.events.once('postrender', () => resolve()));
      (game.scene.getScene('Floor') as FloorScene).setViewOffset(
        x + 1_000_000_000_000,
        y - 1_000_000_000_000,
      );
      await rendered;
    }, offset);
    const distant = await page.locator('canvas').screenshot();
    expect(distant.equals(nearby)).toBe(true);
  }
});

test('travel uses constant resources and leaves no idle frame loop', async ({ page }) => {
  const measurements = await page.evaluate(async ({ key }) => {
    const game = window.__tiredGame!;
    const scene = game.scene.getScene('Floor') as FloorScene;
    const resources = () => ({
      objects: scene.children.length,
      markerObjects: scene.markers.images.length,
      textures: Object.keys(game.textures.list).length,
      width: scene.floor.width,
      height: scene.floor.height,
    });
    const before = resources();
    let frames = 0;
    const countFrame = () => { frames += 1; };
    game.events.on('postrender', countFrame);
    const startedAt = performance.now();

    for (let step = 0; step < 2_000; step += 1) {
      scene.setViewOffset(step * 1_000_000_003.25, -step * 1_000_000_007.5);
    }

    const elapsedMs = performance.now() - startedAt;
    await new Promise<void>((resolve) => game.events.once('postrender', () => resolve()));
    const after = resources();
    const framesAfterTravel = frames;
    await new Promise((resolve) => setTimeout(resolve, 250));
    const idleFrames = frames - framesAfterTravel;
    game.events.off('postrender', countFrame);
    const source = game.textures.get(key).getSourceImage();

    return {
      before,
      after,
      elapsedMs,
      renderedFrames: framesAfterTravel,
      idleFrames,
      loopRunning: game.loop.running,
      tilePositionX: scene.floor.tilePositionX,
      tilePositionY: scene.floor.tilePositionY,
      textureWidth: source.width,
      textureHeight: source.height,
    };
  }, { key: FLOOR_TEXTURE_KEY });

  expect(measurements.after).toEqual(measurements.before);
  expect(measurements.after.markerObjects).toBeGreaterThan(0);
  expect(measurements.after.objects).toBe(measurements.after.markerObjects + 2);
  expect(measurements.textureWidth).toBe(FLOOR_TEXTURE_WIDTH);
  expect(measurements.textureHeight).toBe(FLOOR_TEXTURE_HEIGHT);
  expect(measurements.tilePositionX).toBeGreaterThanOrEqual(0);
  expect(measurements.tilePositionX).toBeLessThan(FLOOR_TEXTURE_WIDTH);
  expect(measurements.tilePositionY).toBeGreaterThanOrEqual(0);
  expect(measurements.tilePositionY).toBeLessThan(FLOOR_TEXTURE_HEIGHT);
  expect(measurements.idleFrames).toBe(0);
  expect(measurements.renderedFrames).toBe(1);
  expect(measurements.loopRunning).toBe(false);
  console.log('Floor resource measurements:', JSON.stringify(measurements));
});

test('landmarks return to the same positions and share ground depth with the player', async ({ page }) => {
  const initial = await page.locator('canvas').screenshot();
  const depth = await page.evaluate(() => {
    const scene = window.__tiredGame!.scene.getScene('Floor') as FloorScene;
    const visible = scene.markers.images.filter((image) => image.visible);
    return {
      visibleCount: visible.length,
      behind: visible.filter((image) => image.depth < scene.player.depth).length,
      ahead: visible.filter((image) => image.depth > scene.player.depth).length,
      groundAligned: visible.every((image) => image.x % 64 === 0 && image.y % 32 === 0 &&
        (image.x / 64 - image.y / 32) % 2 === 0),
      sorted: scene.children.list.every((image, index, list) => index === 0 ||
        (list[index - 1] as Phaser.GameObjects.Image).depth <= (image as Phaser.GameObjects.Image).depth),
    };
  });
  expect(depth.visibleCount).toBeGreaterThan(0);
  expect(depth.behind).toBeGreaterThan(0);
  expect(depth.ahead).toBeGreaterThan(0);
  expect(depth.groundAligned).toBe(true);
  expect(depth.sorted).toBe(true);

  for (const offset of [{ x: 38_400, y: -19_200 }, { x: 0, y: 0 }]) {
    await page.evaluate(async ({ x, y }) => {
      const game = window.__tiredGame!;
      const rendered = new Promise<void>((resolve) => game.events.once('postrender', () => resolve()));
      (game.scene.getScene('Floor') as FloorScene).setViewOffset(x, y);
      await rendered;
    }, offset);
  }
  expect((await page.locator('canvas').screenshot()).equals(initial)).toBe(true);
});

test('the sleeping floor redraws and the player stays centered after resizing', async ({ page }) => {
  for (const viewport of [
    { width: 800, height: 600 },
    { width: 1920, height: 1080 },
    { width: 1100, height: 700 },
  ]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => {
      const game = window.__tiredGame!;
      const scene = game.scene.getScene('Floor') as FloorScene;
      return {
        width: scene.floor.width,
        height: scene.floor.height,
        canvasWidth: game.canvas.width,
        canvasHeight: game.canvas.height,
        playerX: scene.player.x,
        playerY: scene.player.y,
        loopRunning: game.loop.running,
      };
    })).toEqual({
      ...viewport,
      canvasWidth: viewport.width,
      canvasHeight: viewport.height,
      playerX: viewport.width / 2,
      playerY: viewport.height / 2,
      loopRunning: false,
    });
    const canvas = page.locator('canvas');
    await expect(canvas).toHaveAttribute('aria-label', 'Stationary player on an endless neutral isometric floor');
    await page.screenshot({ path: `test-results/floor-${viewport.width}x${viewport.height}.png` });
  }
});
