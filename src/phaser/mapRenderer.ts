import Phaser from 'phaser';
import type { Interactable, MapData, MapDecoration, MapObstacle, PathData, Vec2 } from '../types';

type BiomeCategory = 'grassland' | 'forest' | 'ruins' | 'dungeon' | 'shrine' | 'boss' | 'exit';

const BIOME_MAP: Record<string, BiomeCategory> = {
  expedition_entrance: 'grassland',
  bone_foyer: 'dungeon',
  broken_bridge: 'ruins',
  wounded_crosshall: 'forest',
  echo_corridor: 'dungeon',
  glitter_vault: 'ruins',
  echo_shrine: 'shrine',
  watch_crypt: 'dungeon',
  rift_crossing: 'forest',
  ante_shrine: 'shrine',
  guardian_tomb: 'boss',
  stone_gate: 'exit',
};

function getBiome(map: MapData): BiomeCategory {
  return BIOME_MAP[map.id] ?? 'dungeon';
}

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

const BIOME_PATH_FILL: Record<BiomeCategory, number> = {
  grassland: 0xc8b87a,
  forest:    0x8a7a50,
  ruins:     0xb8a882,
  dungeon:   0x8e8a82,
  shrine:    0xc8dff4,
  boss:      0x9a2828,
  exit:      0xa0a8b8,
};

const BIOME_PATH_TEXTURE: Record<BiomeCategory, number> = {
  grassland: 0xe8d898,
  forest:    0xa89a6a,
  ruins:     0xd8c8a0,
  dungeon:   0xb0acaa,
  shrine:    0xe0f0ff,
  boss:      0xc04040,
  exit:      0xc0c8d8,
};

function makeTheme(map: MapData): ThemePalette {
  const biome = getBiome(map);
  const base = mixColor(map.bgColor, 0x050505, 0.52);
  const shadow = mixColor(base, 0x000000, 0.4);
  const trench = mixColor(base, 0x000000, 0.58);
  const highlight = mixColor(map.accentColor, 0xf6efe0, 0.24);

  return {
    base,
    shadow,
    trench,
    highlight,
    pathFill: BIOME_PATH_FILL[biome],
    pathEdge: biome === 'grassland' || biome === 'forest' ? 0x1a2a0a : 0x1a1510,
    pathTexture: BIOME_PATH_TEXTURE[biome],
    zoneFill: biome === 'boss' ? 0xcc1010 : 0xa81f1f,
    zoneStroke: biome === 'boss' ? 0xff3030 : 0xff746a,
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

function drawGrasslandBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  const bands = 12;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    g.fillStyle(mixColor(0x5a7a40, 0x3a5228, t * 0.8), 1);
    g.fillRect(0, (map.height / bands) * i, map.width, map.height / bands + 2);
  }
  g.fillStyle(0x6a9050, 0.18);
  g.fillEllipse(map.width * 0.3, map.height * 0.2, map.width * 0.8, map.height * 0.5);
  for (let i = 0; i < 320; i++) {
    const x = (i * 197) % map.width;
    const y = (i * 113 + map.order * 53) % map.height;
    g.fillStyle(i % 4 === 0 ? 0x7ab050 : 0x4a6830, i % 4 === 0 ? 0.06 : 0.03);
    g.fillCircle(x, y, 2 + (i % 4));
  }
  for (let i = 0; i < 28; i++) {
    const x = (i * 107) % map.width;
    const y = (i * 83 + map.order * 29) % map.height;
    g.fillStyle(0x8ac860, 0.09);
    g.fillRect(x, y, 3 + (i % 5), 18 + (i % 12));
  }
}

function drawForestBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  g.fillStyle(0x122010, 1);
  g.fillRect(0, 0, map.width, map.height);
  for (let i = 0; i < 60; i++) {
    const x = (i * 211) % map.width;
    const y = (i * 137 + map.order * 61) % map.height;
    const r = 80 + (i % 6) * 30;
    g.fillStyle(0x1a3018, 0.55 + (i % 3) * 0.12);
    g.fillCircle(x, y, r);
    g.fillStyle(0x2a4824, 0.2);
    g.fillCircle(x + 20, y - 20, r * 0.6);
  }
  g.fillStyle(0x4a8030, 0.08);
  g.fillEllipse(map.width * 0.5, map.height * 0.4, map.width * 0.9, map.height * 0.7);
  for (let i = 0; i < 14; i++) {
    const x = (i * 193) % map.width;
    g.lineStyle(1, 0x60c040, 0.06);
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 80, map.height);
    g.strokePath();
  }
}

function drawRuinsBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  g.fillStyle(0x2e2214, 1);
  g.fillRect(0, 0, map.width, map.height);
  const tileW = 120, tileH = 100;
  for (let col = 0; col < map.width / tileW + 1; col++) {
    for (let row = 0; row < map.height / tileH + 1; row++) {
      const shade = (col + row) % 2 === 0 ? 0x362a1a : 0x2e2214;
      g.fillStyle(shade, 1);
      g.fillRect(col * tileW, row * tileH, tileW - 1, tileH - 1);
    }
  }
  for (let i = 0; i < 22; i++) {
    const x = (i * 173) % map.width;
    const y = (i * 97 + map.order * 43) % map.height;
    g.lineStyle(2, 0x1a1008, 0.5);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 60 + (i % 4) * 20, y + 8 + (i % 3) * 6);
    g.strokePath();
  }
  g.fillStyle(theme.highlight, 0.12);
  g.fillEllipse(map.width * 0.25, map.height * 0.22, map.width * 0.6, map.height * 0.4);
}

function drawDungeonBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  g.fillStyle(mixColor(map.bgColor, 0x020202, 0.6), 1);
  g.fillRect(0, 0, map.width, map.height);
  const tileW = 96, tileH = 96;
  for (let col = 0; col < map.width / tileW + 1; col++) {
    for (let row = 0; row < map.height / tileH + 1; row++) {
      const shade = (col + row) % 2 === 0 ? 0x1c1c24 : 0x181820;
      g.fillStyle(shade, 0.9);
      g.fillRect(col * tileW + 1, row * tileH + 1, tileW - 2, tileH - 2);
    }
  }
  g.fillStyle(theme.highlight, 0.14);
  g.fillEllipse(map.width * 0.18, map.height * 0.16, map.width * 0.65, map.height * 0.4);
  g.fillStyle(theme.shadow, 0.42);
  g.fillEllipse(map.width * 0.8, map.height * 0.8, map.width * 0.8, map.height * 0.55);
  for (let i = 0; i < 160; i++) {
    const x = (i * 151) % map.width;
    const y = (i * 89 + map.order * 47) % map.height;
    g.fillStyle(0xffffff, 0.015);
    g.fillCircle(x, y, 1 + (i % 2));
  }
}

function drawShrineBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  const bands = 10;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    g.fillStyle(mixColor(0x1e2c40, 0x0c1828, t * 0.85), 1);
    g.fillRect(0, (map.height / bands) * i, map.width, map.height / bands + 2);
  }
  const cx = map.width * 0.5, cy = map.height * 0.5;
  for (let r = 0; r < 8; r++) {
    g.fillStyle(0x90c8f8, 0.025 + r * 0.006);
    g.fillCircle(cx, cy, 200 + r * 160);
  }
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    g.lineStyle(60, 0xb0deff, 0.04);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(angle) * map.width * 0.8, cy + Math.sin(angle) * map.height * 0.8);
    g.strokePath();
  }
  for (let i = 0; i < 120; i++) {
    const x = (i * 167) % map.width;
    const y = (i * 103 + map.order * 59) % map.height;
    g.fillStyle(0xd0eeff, 0.05 + (i % 3) * 0.02);
    g.fillCircle(x, y, 1 + (i % 3));
  }
}

function drawBossBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  g.fillStyle(0x200000, 1);
  g.fillRect(0, 0, map.width, map.height);
  const cx = map.width * 0.72, cy = map.height * 0.5;
  for (let r = 0; r < 6; r++) {
    g.fillStyle(0x600000, 0.15 + r * 0.04);
    g.fillCircle(cx, cy, 180 + r * 140);
  }
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const len = 300 + (i % 5) * 120;
    g.lineStyle(3 + (i % 3), 0x8a0000, 0.25 - i * 0.006);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(angle) * len, cy + Math.sin(angle) * len);
    g.strokePath();
  }
  for (let i = 0; i < 18; i++) {
    const x = (i * 163) % map.width;
    const y = (i * 107 + 31) % map.height;
    g.lineStyle(2, 0x440000, 0.4);
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 40 + (i % 4) * 15, y + 30 + (i % 3) * 20);
    g.strokePath();
  }
  g.fillStyle(0xff2020, 0.04);
  g.fillRect(0, 0, map.width, map.height);
}

function drawExitBackground(g: Phaser.GameObjects.Graphics, map: MapData, theme: ThemePalette) {
  const bands = 10;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    g.fillStyle(mixColor(0x383848, 0x1c1c2c, t * 0.8), 1);
    g.fillRect(0, (map.height / bands) * i, map.width, map.height / bands + 2);
  }
  g.fillStyle(0x8090b0, 0.1);
  g.fillEllipse(map.width * 0.7, map.height * 0.3, map.width * 0.7, map.height * 0.5);
  for (let i = 0; i < 100; i++) {
    const x = (i * 151) % map.width;
    const y = (i * 89 + map.order * 47) % map.height;
    g.fillStyle(0xc0d0e0, 0.025);
    g.fillCircle(x, y, 1 + (i % 3));
  }
}

function drawBackground(scene: Phaser.Scene, map: MapData, theme: ThemePalette) {
  const g = scene.add.graphics();
  const biome = getBiome(map);
  if (biome === 'grassland') drawGrasslandBackground(g, map, theme);
  else if (biome === 'forest') drawForestBackground(g, map, theme);
  else if (biome === 'ruins') drawRuinsBackground(g, map, theme);
  else if (biome === 'shrine') drawShrineBackground(g, map, theme);
  else if (biome === 'boss') drawBossBackground(g, map, theme);
  else if (biome === 'exit') drawExitBackground(g, map, theme);
  else drawDungeonBackground(g, map, theme);
  return g;
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

function drawZoneLabel(scene: Phaser.Scene, map: MapData) {
  const container = scene.add.container(0, 0);
  const biome = getBiome(map);

  const labelColor: Record<BiomeCategory, string> = {
    grassland: '#c8f0a0',
    forest: '#80c860',
    ruins: '#d4b880',
    dungeon: '#a0a8c0',
    shrine: '#c0e8ff',
    boss: '#ff8080',
    exit: '#b0c0d8',
  };

  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.28);
  bg.fillRoundedRect(32, 32, 480, 96, 12);
  bg.lineStyle(2, 0xffffff, 0.12);
  bg.strokeRoundedRect(32, 32, 480, 96, 12);

  const accent = scene.add.graphics();
  accent.fillStyle(0xffffff, 0.5);
  accent.fillRect(48, 48, 6, 64);

  const title = scene.add.text(70, 44, map.name, {
    fontFamily: '"Noto Serif TC", "PingFang TC", serif',
    fontSize: '38px',
    color: labelColor[biome],
    fontStyle: '700',
    stroke: '#000000',
    strokeThickness: 5,
  });

  const sub = scene.add.text(70, 88, map.special + '  ·  ' + map.description.slice(0, 28) + '…', {
    fontFamily: '"Noto Sans TC", "PingFang TC", sans-serif',
    fontSize: '18px',
    color: '#c8c8d0',
    stroke: '#000000',
    strokeThickness: 3,
  });

  container.add([bg, accent, title, sub]);
  container.setScrollFactor(0);
  container.setDepth(35);
  return container;
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
  world.add(drawZoneLabel(scene, map));

  return world;
}
