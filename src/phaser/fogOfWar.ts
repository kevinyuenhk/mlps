import Phaser from 'phaser';
import type { FogRevealPoint } from '../types';

export function renderFogOfWar(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  revealPoints: FogRevealPoint[],
  livePoint?: FogRevealPoint
) {
  graphics.clear();
  graphics.fillStyle(0x02040a, 0.9);
  graphics.fillRect(0, 0, width, height);

  graphics.setBlendMode(Phaser.BlendModes.ERASE);

  for (const point of revealPoints) {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(point.x, point.y, point.radius);
  }

  if (livePoint) {
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(livePoint.x, livePoint.y, livePoint.radius);
    graphics.fillStyle(0xffffff, 0.28);
    graphics.fillCircle(livePoint.x, livePoint.y, livePoint.radius + 42);
  }

  graphics.setBlendMode(Phaser.BlendModes.NORMAL);

  if (livePoint) {
    graphics.lineStyle(4, 0xf8fafc, 0.08);
    graphics.strokeCircle(livePoint.x, livePoint.y, livePoint.radius + 28);
  }
}

export function mergeRevealPoint(
  existing: FogRevealPoint[],
  nextPoint: FogRevealPoint,
  minDistance = 120
) {
  const alreadyCovered = existing.some(
    (point) => Math.hypot(point.x - nextPoint.x, point.y - nextPoint.y) < minDistance
  );

  return alreadyCovered ? existing : [...existing, nextPoint];
}
