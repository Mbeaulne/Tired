import Phaser from 'phaser';
import { FloorScene } from './floor-scene';
import './style.css';

declare global {
  interface Window {
    /** Development access for browser checks; absent from production builds. */
    __tiredGame?: Phaser.Game;
  }
}

try {
  const game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: 'game',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#3b4344',
    scene: FloorScene,
    audio: { noAudio: true },
    render: { antialias: true },
    banner: false,
  });

  game.canvas.setAttribute('role', 'img');
  game.canvas.setAttribute('aria-label', 'Stationary player on an endless neutral isometric floor');

  // Explicitly resize and wake the floor even when Phaser's frame loop sleeps.
  const resize = (): void => {
    game.scale.resize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', resize);

  if (import.meta.env.DEV) window.__tiredGame = game;

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener('resize', resize);
      game.destroy(true);
      // Destruction is processed by Phaser's next frame, even for a still view.
      game.loop.wake();
      delete window.__tiredGame;
    });
  }
} catch (error) {
  const status = document.querySelector<HTMLElement>('#status');
  if (status) {
    status.hidden = false;
    status.textContent = 'The floor could not start. Please use a browser with WebGL enabled.';
  }
  console.error(error);
}
