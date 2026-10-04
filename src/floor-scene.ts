import Phaser from 'phaser';
import {
  createFloorTexture,
  FLOOR_TEXTURE_HEIGHT,
  FLOOR_TEXTURE_KEY,
  FLOOR_TEXTURE_WIDTH,
} from './floor-texture';
import {
  createPlayerTexture,
  PLAYER_FEET_Y,
  PLAYER_HEIGHT,
  PLAYER_TEXTURE_KEY,
} from './player-texture';
import { MarkerField } from './markers';

/** One viewport-sized surface, regardless of how far the view travels. */
export class FloorScene extends Phaser.Scene {
  public floor!: Phaser.GameObjects.TileSprite;
  public player!: Phaser.GameObjects.Image;
  public markers!: MarkerField;
  private renderPending = false;
  private wakeRequest: number | null = null;
  private viewOffsetX = 0;
  private viewOffsetY = 0;

  constructor() {
    super('Floor');
  }

  create(): void {
    createFloorTexture(this);
    this.floor = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, FLOOR_TEXTURE_KEY)
      .setOrigin(0, 0)
      .setDepth(-Infinity);

    createPlayerTexture(this);
    this.player = this.add
      .image(this.scale.width / 2, this.scale.height / 2, PLAYER_TEXTURE_KEY)
      .setScale(0.5)
      .setOrigin(0.5, PLAYER_FEET_Y / PLAYER_HEIGHT)
      .setDepth(this.scale.height / 2);

    this.markers = new MarkerField(this);
    this.markers.resize(this.scale.width, this.scale.height);
    this.game.events.on(Phaser.Core.Events.PRE_RENDER, this.positionMarkers, this);

    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeFloor, this);
    this.game.renderer.on(Phaser.Renderer.Events.RESTORE_WEBGL, this.requestRender, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeFloor, this);
      this.game.renderer.off(Phaser.Renderer.Events.RESTORE_WEBGL, this.requestRender, this);
      this.game.events.off(Phaser.Core.Events.POST_RENDER, this.finishRender, this);
      this.game.events.off(Phaser.Core.Events.PRE_RENDER, this.positionMarkers, this);
      if (this.wakeRequest !== null) window.cancelAnimationFrame(this.wakeRequest);
    });

    const status = document.querySelector<HTMLElement>('#status');
    if (status) status.hidden = true;
    this.requestRender();
  }

  /** Future movement can shift the floor without building or retaining a map. */
  setViewOffset(x: number, y: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new RangeError('Floor offsets must be finite.');
    }

    // Keep GPU texture coordinates small, including for very distant views.
    this.viewOffsetX = x;
    this.viewOffsetY = y;
    this.floor.setTilePosition(
      ((x % FLOOR_TEXTURE_WIDTH) + FLOOR_TEXTURE_WIDTH) % FLOOR_TEXTURE_WIDTH,
      ((y % FLOOR_TEXTURE_HEIGHT) + FLOOR_TEXTURE_HEIGHT) % FLOOR_TEXTURE_HEIGHT,
    );
    this.requestRender();
  }

  private resizeFloor(size: Phaser.Structs.Size): void {
    this.floor.setSize(size.width, size.height);
    this.player.setPosition(size.width / 2, size.height / 2);
    this.player.setDepth(size.height / 2);
    this.markers.resize(size.width, size.height);
    this.requestRender();
  }

  private positionMarkers(): void {
    this.markers.update(this.viewOffsetX, this.viewOffsetY);
  }

  private requestRender(): void {
    if (this.renderPending) return;
    this.renderPending = true;
    this.game.events.once(Phaser.Core.Events.POST_RENDER, this.finishRender, this);
    if (!this.game.loop.running) {
      // Coalesce rapid changes instead of rendering immediately for each one.
      this.wakeRequest = window.requestAnimationFrame(() => {
        this.wakeRequest = null;
        this.game.loop.wake();
      });
    }
  }

  private finishRender(): void {
    this.renderPending = false;
    // This experiment is still: spend no GPU frames while nothing changes.
    this.game.loop.sleep();
  }
}
