import Phaser from 'phaser';
import type { Interactable, MapData, MapDecoration, MapObstacle, PathData, Vec2 } from '../types';

type VisibilityState = {
  discoveredExitIds: string[];
  clearedInteractableIds: string[];
};

type ThemePalette = {
  base: number;
  shadow: number;
  trench: number;
  highlight: number;
  pathFill: number;
  pathEdge: number;
  pathTexture: number;
  zoneFill: number;
  zoneStroke: number;
  exitGlow: number;
  exitEdge: number;
  obstacleFill: number;
  obstacleEdge: number;
  decor: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(color: number) {
  return {
    r: (color >> 16) & 0xff,
    g: (color >> 8) & 0xff,
    b: color & 0xff,
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255);
}

function mixColor(a: number, b: number, amount: number) {
  const from = hexToRgb(a);
  const to = hexToRgb(b);
  return rgbToHex(
    from.r + (to.r - from.r) * amount,
    from.g + (to.g - from.g) * amount,
    from.b + (to.b - from.b) * amount
  );
}

function makeTheme(map: MapData): ThemePalette {
  const base = mixColor(map.bgColor, 0x050505, 0.52);
  const shadow = mixColor(base, 0x000000, 0.4);
  const trench = mixColor(base, 0x000000, 0.58);
  const highlight = mixColor(map.accentColor, 0xf6efe0, 0.24);

  return {
    base,
    shadow,
    trench,
    highlight,
    pathFill: 0xd4c8a0,
    pathEdge: 0x1a1510,
    pathTexture: 0xefe3be,
    zoneFill: 0xa81f1f,
    zoneStroke: 0xff746a,
    exitGlow: 0xffd36a,
    exitEdge: 0x6d4a13,
    obstacleFill: mixColor(map.bgColor, 0x090909, 0.66),
    obstacleEdge: mixColor(map.accentColor, 0xf7f3e8, 0.14),
    decor: mixColor(map.accentColor, 0xf6efe0, 0.16),
  };
}

function pathLength(points: Vec2[]) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Phaser.Math.Distance.Between(points[i - 1].x, points[i - 1].y, points[i].x, points[i].y);
  }
  return total;
}

function pointOnPath(points: Vec2[], distance: number) {
  let remaining = distance;
  for (let i = 1; i < points.length; i += 1) {
    const start = points[i - 1];
    const end = points[i];
    const length = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
    if (remaining <= length) {
      const t = length === 0 ? 0 : remaining / length;
      const x = Phaser.Math.Linear(start.x, end.x, t);
      const y = Phaser.Math.Linear(start.y, end.y, t);
      const angle = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);
      return { x, y, angle };
    }
    remaining -= length;
  }

  const last = points[points.length - 1] ?? { x: 0, y: 0 };
  const previous = points[points.length - 2] ?? last;
  return {
    x: last.x,
    y: last.y,
    angle: Phaser.Math.Angle.Between(previous.x, previous.y, last.x, last.y),
  };
}

function drawBackground(scene: Phaser.Scene, map: MapData, theme: ThemePalette) {
  const background = scene.add.graphics();
  const bands = 9;

  for (let index = 0; index < bands; index += 1) {
    const blend = index / Math.max(1, bands - 1);
    background.fillStyle(mixColor(theme.highlight, theme.base, blend * 0.9), 1);
    background.fillRect(0, (map.height / bands) * index, map.width, map.height / bands + 2);
  }

  background.fillStyle(theme.highlight, 0.16);
  background.fillEllipse(map.width * 0.2, map.height * 0.18, map.width * 0.7, map.height * 0.42);
  background.fillStyle(theme.shadow, 0.38);
  background.fillEllipse(map.width * 0.82, map.height * 0.78, map.width * 0.84, map.height * 0.6);

  for (let index = 0; index < 180; index += 1) {
    const x = (index * 151) % map.width;
    const y = (index * 89 + map.order * 47) % map.height;
    const radius = 1 + (index % 3);
    background.fillStyle(index % 5 === 0 ? theme.highlight : 0xffffff, index % 5 === 0 ? 0.045 : 0.02);
    background.fillCircle(x, y, radius);
  }

  for (let index = 0; index < 16; index += 1) {
    const offset = (index / 15) * map.height;
    background.lineStyle(2, theme.shadow, 0.1);
    background.beginPath();
    background.moveTo(0, offset + 40 * Math.sin(index));
    background.lineTo(map.width, offset - 36 * Math.cos(index * 0.7));
    background.strokePath();
  }

  return background;
}

function drawSinglePath(graphics: Phaser.GameObjects.Graphics, path: PathData, theme: ThemePalette) {
  graphics.lineStyle(path.width + 18, theme.trench, 0.96);
  graphics.beginPath();
  graphics.moveTo(path.points[0].x, path.points[0].y);
  path.points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
  graphics.strokePath();

  graphics.lineStyle(path.width + 6, 0x0c0a08, 0.82);
  graphics.beginPath();
  graphics.moveTo(path.points[0].x, path.points[0].y);
  path.points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
  graphics.strokePath();

  graphics.lineStyle(path.width, theme.pathFill, 1);
  graphics.beginPath();
  graphics.moveTo(path.points[0].x, path.points[0].y);
  path.points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
  graphics.strokePath();

  graphics.lineStyle(Math.max(16, path.width * 0.24), theme.pathTexture, 0.4);
  graphics.beginPath();
  graphics.moveTo(path.points[0].x, path.points[0].y);
  path.points.slice(1).forEach((point) => graphics.lineTo(point.x, point.y));
  graphics.strokePath();
}

function drawPathTexture(graphics: Phaser.GameObjects.Graphics, path: PathData, theme: ThemePalette) {
  const total = pathLength(path.points);
  const spacing = 112;

  for (let distance = 42; distance < total; distance += spacing) {
    const { x, y, angle } = pointOnPath(path.points, distance);
    const perpendicular = angle + Math.PI / 2;
    const slabHalf = Math.min(18, path.width * 0.22);
    const dx = Math.cos(perpendicular) * slabHalf;
    const dy = Math.sin(perpendicular) * slabHalf;

    graphics.lineStyle(4, theme.pathEdge, 0.25);
    graphics.beginPath();
    graphics.moveTo(x - dx, y - dy);
    graphics.lineTo(x + dx, y + dy);
    graphics.strokePath();

    graphics.lineStyle(2, theme.pathTexture, 0.28);
    graphics.beginPath();
    graphics.moveTo(x - dx * 0.8, y - dy * 0.8);
    graphics.lineTo(x + dx * 0.8, y + dy * 0.8);
    graphics.strokePath();
  }
}

function drawPaths(scene: Phaser.Scene, map: MapData, theme: ThemePalette) {
  const pathGraphics = scene.add.graphics();
  const textureGraphics = scene.add.graphics();

  for (const path of map.paths) {
    drawSinglePath(pathGraphics, path, theme);
    drawPathTexture(textureGraphics, path, theme);
  }

  return scene.add.container(0, 0, [pathGraphics, textureGraphics]);
}

function drawObstacleShape(graphics: Phaser.GameObjects.Graphics, obstacle: MapObstacle, fill: number, alpha: number) {
  graphics.fillStyle(fill, alpha);
  if (obstacle.kind === 'circle' && obstacle.radius) {
    graphics.fillCircle(obstacle.x, obstacle.y, obstacle.radius);
    return;
  }

  if (obstacle.width && obstacle.height) {
    graphics.fillRoundedRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height, 18);
  }
}

function offsetObstacle(obstacle: MapObstacle, offsetX: number, offsetY: number): MapObstacle {
  return {
    ...obstacle,
    x: obstacle.x + offsetX,
    y: obstacle.y + offsetY,
  };
}

function strokeObstacleShape(graphics: Phaser.GameObjects.Graphics, obstacle: MapObstacle) {
  if (obstacle.kind === 'circle' && obstacle.radius) {
    graphics.strokeCircle(obstacle.x, obstacle.y, obstacle.radius);
    return;
  }

  if (obstacle.width && obstacle.height) {
    graphics.strokeRoundedRect(obstacle.x - obstacle.width / 2, obstacle.y - obstacle.height / 2, obstacle.width, obstacle.height, 18);
  }
}

function drawObstacles(scene: Phaser.Scene, map: MapData, theme: ThemePalette) {
  const graphics = scene.add.graphics();

  for (const obstacle of map.obstacles) {
    drawObstacleShape(graphics, offsetObstacle(obstacle, 8, 8), 0x040506, 0.28);
    drawObstacleShape(graphics, obstacle, theme.obstacleFill, obstacle.alpha ?? 0.92);
    graphics.lineStyle(4, theme.obstacleEdge, 0.85);
    strokeObstacleShape(graphics, obstacle);
    graphics.lineStyle(2, 0xf3e6c9, 0.1);
    strokeObstacleShape(graphics, obstacle);
  }

  return graphics;
}

function drawDecoration(graphics: Phaser.GameObjects.Graphics, item: MapDecoration, theme: ThemePalette) {
  const alpha = item.alpha ?? 0.7;
  const x = item.x;
  const y = item.y;
  const width = item.width;
  const height = item.height;

  if (item.kind === 'torch') {
    graphics.fillStyle(theme.decor, alpha);
    graphics.fillRoundedRect(x - width * 0.18, y - height * 0.5, width * 0.36, height * 0.72, 8);
    graphics.fillStyle(0xffd56f, 0.34);
    graphics.fillCircle(x, y - height * 0.55, width * 1.1);
    graphics.fillStyle(0xff9d3c, 0.88);
    graphics.fillTriangle(
      x,
      y - height * 0.84,
      x - width * 0.45,
      y - height * 0.36,
      x + width * 0.45,
      y - height * 0.36
    );
    return;
  }

  if (item.kind === 'bone') {
    graphics.fillStyle(0xd8d1c3, alpha);
    graphics.fillRoundedRect(x - width * 0.46, y - height * 0.14, width * 0.92, height * 0.28, 10);
    graphics.fillCircle(x - width * 0.42, y, height * 0.28);
    graphics.fillCircle(x + width * 0.42, y, height * 0.28);
    return;
  }

  if (item.kind === 'banner') {
    graphics.fillStyle(0x1a0f10, alpha);
    graphics.fillRect(x - width * 0.08, y - height * 0.5, width * 0.16, height);
    graphics.fillStyle(theme.decor, alpha);
    graphics.fillRoundedRect(x - width * 0.4, y - height * 0.44, width * 0.8, height * 0.68, 10);
    graphics.fillStyle(theme.highlight, 0.22);
    graphics.fillRect(x - width * 0.22, y - height * 0.38, width * 0.12, height * 0.58);
    return;
  }

  if (item.kind === 'shrine') {
    graphics.fillStyle(theme.decor, alpha);
    graphics.fillRoundedRect(x - width * 0.5, y - height * 0.24, width, height * 0.5, 14);
    graphics.lineStyle(4, 0xf3e6c9, 0.45);
    graphics.strokeRoundedRect(x - width * 0.5, y - height * 0.24, width, height * 0.5, 14);
    graphics.fillStyle(0xf3e6c9, 0.3);
    graphics.fillCircle(x, y - height * 0.06, Math.min(width, height) * 0.18);
    return;
  }

  graphics.fillStyle(theme.decor, alpha);
  graphics.fillRoundedRect(x - width * 0.35, y - height * 0.5, width * 0.7, height, 12);
  graphics.lineStyle(3, theme.obstacleEdge, 0.42);
  graphics.strokeRoundedRect(x - width * 0.35, y - height * 0.5, width * 0.7, height, 12);
}

function drawDecorations(scene: Phaser.Scene, map: MapData, theme: ThemePalette) {
  const graphics = scene.add.graphics();
  for (const item of map.decorations) {
    drawDecoration(graphics, item, theme);
  }
  return graphics;
}

function drawDashedCircle(graphics: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, color: number, alpha: number) {
  const dashCount = 22;
  for (let index = 0; index < dashCount; index += 1) {
    if (index % 2 === 1) continue;
    const start = (Math.PI * 2 * index) / dashCount;
    const end = start + Math.PI / dashCount;
    graphics.lineStyle(4, color, alpha);
    graphics.beginPath();
    graphics.arc(x, y, radius, start, end);
    graphics.strokePath();
  }
}

function encounterLabel(zoneVariant: 'normal' | 'boss' | undefined) {
  return zoneVariant === 'boss' ? '首領區' : '遭遇區';
}

function drawEncounterZones(scene: Phaser.Scene, map: MapData, theme: ThemePalette) {
  const zoneContainer = scene.add.container(0, 0);

  for (const zone of map.encounters) {
    const fill = scene.add.circle(zone.x, zone.y, zone.radius, theme.zoneFill, zone.variant === 'boss' ? 0.28 : 0.2);
    fill.setStrokeStyle(0);
    zoneContainer.add(fill);

    const ring = scene.add.graphics();
    drawDashedCircle(ring, zone.x, zone.y, zone.radius, theme.zoneStroke, 0.9);
    drawDashedCircle(ring, zone.x, zone.y, zone.radius - 8, 0xffb4a9, 0.35);
    zoneContainer.add(ring);

    const label = scene.add.text(zone.x, zone.y - zone.radius - 14, encounterLabel(zone.variant), {
      fontFamily: '"Noto Serif TC", "PingFang TC", serif',
      fontSize: '20px',
      color: '#ffd8d2',
      stroke: '#240707',
      strokeThickness: 5,
    });
    label.setOrigin(0.5);
    zoneContainer.add(label);

    scene.tweens.add({
      targets: [fill, ring],
      alpha: { from: 0.84, to: 1 },
      scaleX: { from: 0.97, to: 1.03 },
      scaleY: { from: 0.97, to: 1.03 },
      duration: zone.variant === 'boss' ? 900 : 1300,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  return zoneContainer;
}

function interactableSymbol(kind: Interactable['kind']) {
  if (kind === 'chest') return '寶';
  if (kind === 'shrine') return '壇';
  if (kind === 'altar') return '神';
  return '人';
}

function drawInteractables(scene: Phaser.Scene, visibility: VisibilityState, interactables: MapData['interactables']) {
  const container = scene.add.container(0, 0);

  for (const interactable of interactables) {
    const cleared = visibility.clearedInteractableIds.includes(interactable.id);
    const glowColor = cleared ? 0x64748b : 0x74f0d1;
    const glow = scene.add.circle(interactable.x, interactable.y, interactable.radius * 0.95, glowColor, cleared ? 0.12 : 0.22);
    const base = scene.add.circle(interactable.x, interactable.y, interactable.radius * 0.62, cleared ? 0x27313d : 0xf8fafc, cleared ? 0.55 : 0.94);
    base.setStrokeStyle(6, cleared ? 0x94a3b8 : 0x1b6b62, cleared ? 0.52 : 0.95);

    const symbol = scene.add.text(interactable.x, interactable.y + 1, interactableSymbol(interactable.kind), {
      fontFamily: '"Noto Sans TC", "PingFang TC", sans-serif',
      fontSize: `${Math.round(interactable.radius * 0.78)}px`,
      color: cleared ? '#cbd5e1' : '#0f172a',
      fontStyle: '700',
    });
    symbol.setOrigin(0.5);

    const label = scene.add.text(interactable.x, interactable.y - interactable.radius - 16, interactable.name, {
      fontFamily: '"Noto Serif TC", "PingFang TC", serif',
      fontSize: '22px',
      color: cleared ? '#cbd5e1' : '#f8fafc',
      stroke: '#020617',
      strokeThickness: 5,
    });
    label.setOrigin(0.5);

    container.add([glow, base, symbol, label]);

    if (!cleared) {
      scene.tweens.add({
        targets: [glow, base],
        alpha: { from: 0.74, to: 1 },
        scaleX: { from: 0.96, to: 1.06 },
        scaleY: { from: 0.96, to: 1.06 },
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
    }
  }

  return container;
}

function drawExitMarkers(scene: Phaser.Scene, visibility: VisibilityState, exits: MapData['exits']) {
  const container = scene.add.container(0, 0);

  for (const mapExit of exits) {
    const discovered = mapExit.visible || visibility.discoveredExitIds.includes(mapExit.id);
    const glow = scene.add.circle(mapExit.x, mapExit.y, mapExit.radius * 1.2, 0xffcf66, discovered ? 0.24 : 0.14);
    const frame = scene.add.graphics();
    const width = mapExit.radius * 1.12;
    const height = mapExit.radius * 1.38;
    frame.lineStyle(7, 0x5d3f14, 1);
    frame.strokeRoundedRect(mapExit.x - width / 2, mapExit.y - height / 2, width, height, 14);
    frame.lineStyle(5, 0xffd56f, 1);
    frame.strokeRoundedRect(mapExit.x - width / 2 + 8, mapExit.y - height / 2 + 8, width - 16, height - 16, 12);
    frame.fillStyle(0xffd56f, discovered ? 0.15 : 0.08);
    frame.fillRoundedRect(mapExit.x - width / 2 + 8, mapExit.y - height / 2 + 8, width - 16, height - 16, 12);

    const arrow = scene.add.triangle(
      mapExit.x,
      mapExit.y - height * 0.72,
      0,
      26,
      18,
      0,
      36,
      26,
      0xffd56f,
      0.96
    );
    arrow.setOrigin(0.5, 0.5);
    arrow.setStrokeStyle(4, 0x5d3f14, 0.9);

    const label = scene.add.text(mapExit.x, mapExit.y + mapExit.radius + 22, mapExit.label, {
      fontFamily: '"Noto Serif TC", "PingFang TC", serif',
      fontSize: '24px',
      color: discovered ? '#fff2bf' : '#d7c493',
      stroke: '#1f1609',
      strokeThickness: 6,
      align: 'center',
    });
    label.setOrigin(0.5);

    container.add([glow, frame, arrow, label]);

    scene.tweens.add({
      targets: [glow, arrow],
      alpha: { from: discovered ? 0.76 : 0.42, to: 1 },
      scaleX: { from: 0.96, to: 1.08 },
      scaleY: { from: 0.96, to: 1.08 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
  }

  return container;
}

export function renderMap(scene: Phaser.Scene, map: MapData, visibility: VisibilityState) {
  const world = scene.add.container(0, 0);
  const theme = makeTheme(map);

  world.add(drawBackground(scene, map, theme));
  world.add(drawEncounterZones(scene, map, theme));
  world.add(drawPaths(scene, map, theme));
  world.add(drawObstacles(scene, map, theme));
  world.add(drawDecorations(scene, map, theme));
  world.add(drawInteractables(scene, visibility, map.interactables));
  world.add(drawExitMarkers(scene, visibility, map.exits));

  return world;
}
