import * as Phaser from 'phaser';
import { DungeonScene, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './DungeonScene';

export function createDungeonGame(
  parent: HTMLDivElement,
  scene: DungeonScene
) {
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent,
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    backgroundColor: '#05070b',
    roundPixels: false,
    antialias: true,
    scene: [scene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: VIEWPORT_WIDTH,
      height: VIEWPORT_HEIGHT,
    },
    render: {
      pixelArt: false,
      antialiasGL: true,
    },
  });

  const canvas = game.canvas;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  return game;
}
