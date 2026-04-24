import type {
  DungeonNode,
  ExitPoint,
  FogRevealPoint,
  MapData,
  MapDecoration,
  MapLink,
  MapObstacle,
  RouteTag,
  Vec2,
} from '../types';

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 1500;

function p(x: number, y: number): Vec2 {
  return { x, y };
}

function revealPoint(x: number, y: number, radius = 150): FogRevealPoint {
  return { x, y, radius };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeObstacles(color: number, seed: number): MapObstacle[] {
  const templates = [
    { kind: 'rect' as const, x: 390, y: 300, width: 140, height: 180, alpha: 0.9 },
    { kind: 'circle' as const, x: 640, y: 1160, radius: 92, alpha: 0.86 },
    { kind: 'rect' as const, x: 910, y: 290, width: 112, height: 160, alpha: 0.84 },
    { kind: 'rect' as const, x: 1140, y: 1180, width: 134, height: 126, alpha: 0.86 },
    { kind: 'circle' as const, x: 1420, y: 400, radius: 84, alpha: 0.88 },
    { kind: 'rect' as const, x: 1650, y: 1040, width: 118, height: 174, alpha: 0.82 },
    { kind: 'circle' as const, x: 1760, y: 300, radius: 70, alpha: 0.8 },
    { kind: 'rect' as const, x: 260, y: 980, width: 126, height: 142, alpha: 0.82 },
    { kind: 'circle' as const, x: 1210, y: 740, radius: 74, alpha: 0.78 },
  ];

  return templates.map((template, index) => {
    const wave = seed * 17 + index * 31;
    const offsetX = (wave % 5) * 18 - 36;
    const offsetY = (wave % 7) * 16 - 48;
    const x = clamp(template.x + offsetX, 120, WORLD_WIDTH - 120);
    const y = clamp(template.y + offsetY, 120, WORLD_HEIGHT - 120);
    return {
      id: `obs-${index + 1}`,
      kind: template.kind,
      x,
      y,
      width: 'width' in template ? template.width : undefined,
      height: 'height' in template ? template.height : undefined,
      radius: 'radius' in template ? template.radius : undefined,
      color,
      alpha: template.alpha,
    };
  });
}

function makeDecorations(color: number, seed: number): MapDecoration[] {
  const templates = [
    { kind: 'torch' as const, x: 250, y: 480, width: 34, height: 92, alpha: 0.92 },
    { kind: 'pillar' as const, x: 420, y: 1180, width: 52, height: 142, alpha: 0.72 },
    { kind: 'bone' as const, x: 520, y: 330, width: 76, height: 32, alpha: 0.8 },
    { kind: 'banner' as const, x: 700, y: 500, width: 38, height: 152, alpha: 0.72 },
    { kind: 'torch' as const, x: 850, y: 1120, width: 36, height: 96, alpha: 0.9 },
    { kind: 'pillar' as const, x: 980, y: 380, width: 56, height: 154, alpha: 0.68 },
    { kind: 'bone' as const, x: 1110, y: 1130, width: 70, height: 34, alpha: 0.82 },
    { kind: 'banner' as const, x: 1270, y: 540, width: 40, height: 148, alpha: 0.7 },
    { kind: 'shrine' as const, x: 1400, y: 1140, width: 72, height: 94, alpha: 0.62 },
    { kind: 'torch' as const, x: 1570, y: 360, width: 34, height: 94, alpha: 0.9 },
    { kind: 'pillar' as const, x: 1730, y: 960, width: 54, height: 148, alpha: 0.72 },
    { kind: 'bone' as const, x: 1820, y: 620, width: 76, height: 30, alpha: 0.78 },
    { kind: 'banner' as const, x: 310, y: 760, width: 34, height: 140, alpha: 0.7 },
    { kind: 'torch' as const, x: 620, y: 780, width: 34, height: 88, alpha: 0.9 },
    { kind: 'bone' as const, x: 1320, y: 760, width: 70, height: 30, alpha: 0.8 },
    { kind: 'pillar' as const, x: 1660, y: 740, width: 52, height: 136, alpha: 0.7 },
  ];

  return templates.map((template, index) => {
    const wave = seed * 19 + index * 29;
    const offsetX = (wave % 6) * 14 - 35;
    const offsetY = (wave % 5) * 18 - 36;
    return {
      id: `dec-${index + 1}`,
      kind: template.kind,
      x: clamp(template.x + offsetX, 80, WORLD_WIDTH - 80),
      y: clamp(template.y + offsetY, 80, WORLD_HEIGHT - 80),
      width: template.width,
      height: template.height,
      color,
      alpha: template.alpha,
    };
  });
}

function exit(
  id: string,
  x: number,
  y: number,
  label: string,
  targetMapId: string,
  targetSpawnPoint: Vec2,
  visible = false
): ExitPoint {
  return { id, x, y, radius: 70, label, targetMapId, targetSpawnPoint, visible };
}

function buildMap(config: Omit<MapData, 'width' | 'height' | 'obstacles' | 'decorations'> & {
  obstacleColor: number;
  decorationColor: number;
}): MapData {
  return {
    ...config,
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    paths: config.paths.map((path) => ({
      ...path,
      width: Math.max(path.width, 96),
    })),
    encounters: config.encounters.map((encounter) => ({
      ...encounter,
      radius: Math.max(encounter.radius, encounter.variant === 'boss' ? 200 : 170),
    })),
    exits: config.exits.map((mapExit) => ({
      ...mapExit,
      radius: Math.max(mapExit.radius, 82),
    })),
    interactables: config.interactables.map((interactable) => ({
      ...interactable,
      radius: Math.max(interactable.radius, 86),
    })),
    obstacles: makeObstacles(config.obstacleColor, config.order),
    decorations: makeDecorations(config.decorationColor, config.order),
  };
}

export const MAP_LINKS: MapLink[] = [
  { from: 'expedition_entrance', to: 'bone_foyer' },
  { from: 'bone_foyer', to: 'broken_bridge' },
  { from: 'bone_foyer', to: 'wounded_crosshall' },
  { from: 'broken_bridge', to: 'echo_corridor' },
  { from: 'wounded_crosshall', to: 'echo_corridor' },
  { from: 'echo_corridor', to: 'glitter_vault' },
  { from: 'echo_corridor', to: 'echo_shrine' },
  { from: 'glitter_vault', to: 'watch_crypt' },
  { from: 'echo_shrine', to: 'watch_crypt' },
  { from: 'watch_crypt', to: 'rift_crossing' },
  { from: 'rift_crossing', to: 'ante_shrine' },
  { from: 'ante_shrine', to: 'guardian_tomb' },
  { from: 'guardian_tomb', to: 'stone_gate' },
];

export const EXPEDITION_MAPS: MapData[] = [
  buildMap({
    id: 'expedition_entrance',
    order: 1,
    name: '遠征入口',
    shortName: '入口',
    description: '灰石長坡通向墓窟深處，火光尚算穩定，隊伍在此整好隊形。',
    type: 'entrance',
    icon: '🚪',
    bgColor: 0x3a4560,
    accentColor: 0x8fa1b8,
    encounterRate: 0.1,
    special: '安全區',
    spawnPoint: p(180, 760),
    startPathId: 'entry-main',
    obstacleColor: 0x313746,
    decorationColor: 0x768397,
    paths: [
      {
        id: 'entry-main',
        points: [p(180, 760), p(560, 760), p(900, 700)],
        width: 104,
        tags: ['safe', 'mission'],
        connections: [{ pathId: 'entry-upper', label: '北側斜坡', weight: 0.45, tags: ['safe'] }, { pathId: 'entry-lower', label: '南側坡道', weight: 0.55, tags: ['mission', 'speed'] }],
      },
      {
        id: 'entry-upper',
        points: [p(900, 700), p(1250, 520), p(1660, 520)],
        width: 88,
        tags: ['safe'],
        connections: [{ exitId: 'exit-to-bone', label: '前往白骨前廳', weight: 1, tags: ['mission'], targetMapId: 'bone_foyer' }],
      },
      {
        id: 'entry-lower',
        points: [p(900, 700), p(1280, 920), p(1660, 920)],
        width: 94,
        tags: ['speed', 'mission'],
        connections: [{ exitId: 'exit-to-bone', label: '前往白骨前廳', weight: 1, tags: ['mission', 'speed'], targetMapId: 'bone_foyer' }],
      },
    ],
    encounters: [],
    exits: [exit('exit-to-bone', 1800, 720, '前往 白骨前廳 →', 'bone_foyer', p(180, 760), true)],
    interactables: [],
  }),
  buildMap({
    id: 'bone_foyer',
    order: 2,
    name: '白骨前廳',
    shortName: '前廳',
    description: '暗紅前廳滿地骸骨，初入者必先承受一次死者的擾動。',
    type: 'combat',
    icon: '☠️',
    bgColor: 0x4a2a2a,
    accentColor: 0xcc7a7a,
    encounterRate: 0.6,
    special: '必戰',
    spawnPoint: p(180, 760),
    startPathId: 'bone-main',
    obstacleColor: 0x3a2323,
    decorationColor: 0x9a6161,
    paths: [
      {
        id: 'bone-main',
        points: [p(180, 760), p(600, 760), p(930, 760)],
        width: 110,
        tags: ['danger', 'mission'],
        connections: [
          { pathId: 'bone-upper', label: '踏上斷橋', weight: 0.5, tags: ['danger', 'speed', 'mission'], targetMapId: 'broken_bridge' },
          { pathId: 'bone-lower', label: '轉向傷者岔廳', weight: 0.5, tags: ['safe', 'mercy'], targetMapId: 'wounded_crosshall' },
        ],
      },
      {
        id: 'bone-upper',
        points: [p(930, 760), p(1260, 560), p(1620, 430)],
        width: 84,
        tags: ['danger', 'speed', 'mission'],
        connections: [{ exitId: 'exit-to-bridge', label: '前往 斷橋區 →', weight: 1, tags: ['danger', 'speed', 'mission'], targetMapId: 'broken_bridge' }],
      },
      {
        id: 'bone-lower',
        points: [p(930, 760), p(1270, 980), p(1610, 1090)],
        width: 88,
        tags: ['safe', 'mercy'],
        connections: [{ exitId: 'exit-to-wounded', label: '前往 傷者岔廳 →', weight: 1, tags: ['safe', 'mercy'], targetMapId: 'wounded_crosshall' }],
      },
    ],
    encounters: [
      { id: 'bone-frontline', x: 630, y: 760, radius: 180, chance: 1, enemyPool: ['骸骨兵', '墓語者'], cooldown: 999, variant: 'normal', once: true },
      { id: 'bone-side-1', x: 1200, y: 620, radius: 160, chance: 0.62, enemyPool: ['骨群', '墓犬'], cooldown: 10, variant: 'normal' },
      { id: 'bone-side-2', x: 1280, y: 920, radius: 160, chance: 0.58, enemyPool: ['骨群', '墓犬'], cooldown: 10, variant: 'normal' },
    ],
    exits: [
      exit('exit-to-bridge', 1770, 400, '前往 斷橋區 ↗', 'broken_bridge', p(180, 830)),
      exit('exit-to-wounded', 1770, 1110, '前往 傷者岔廳 ↘', 'wounded_crosshall', p(180, 690)),
    ],
    interactables: [],
  }),
  buildMap({
    id: 'broken_bridge',
    order: 3,
    name: '斷橋區',
    shortName: '斷橋',
    description: '深棕殘橋跨過裂隙，橋面鬆動，隊伍需在危險同速度之間取捨。',
    type: 'hazard',
    icon: '🌉',
    bgColor: 0x3e3420,
    accentColor: 0xc59a66,
    encounterRate: 0.4,
    special: '有陷阱區',
    spawnPoint: p(180, 830),
    startPathId: 'bridge-main',
    obstacleColor: 0x3b3123,
    decorationColor: 0x9b7e5a,
    paths: [
      {
        id: 'bridge-main',
        points: [p(180, 830), p(620, 840), p(960, 780)],
        width: 96,
        tags: ['danger', 'mission'],
        connections: [
          { pathId: 'bridge-upper', label: '橋面近道', weight: 0.55, tags: ['speed', 'danger', 'mission'] },
          { pathId: 'bridge-lower', label: '碎石側道', weight: 0.45, tags: ['safe', 'mission'] },
        ],
      },
      {
        id: 'bridge-upper',
        points: [p(960, 780), p(1360, 560), p(1710, 470)],
        width: 72,
        tags: ['speed', 'danger', 'mission'],
        connections: [{ exitId: 'exit-to-echo', label: '前往 回聲長廊 →', weight: 1, tags: ['mission', 'speed'], targetMapId: 'echo_corridor' }],
      },
      {
        id: 'bridge-lower',
        points: [p(960, 780), p(1320, 1020), p(1710, 980)],
        width: 86,
        tags: ['safe', 'mission'],
        connections: [{ exitId: 'exit-to-echo', label: '前往 回聲長廊 →', weight: 1, tags: ['mission', 'safe'], targetMapId: 'echo_corridor' }],
      },
    ],
    encounters: [
      { id: 'bridge-trap', x: 1260, y: 580, radius: 170, chance: 0.46, enemyPool: ['裂隙影', '骨弓手'], cooldown: 14, variant: 'normal' },
      { id: 'bridge-scree', x: 1320, y: 1020, radius: 160, chance: 0.35, enemyPool: ['裂隙影', '墓犬'], cooldown: 14, variant: 'normal' },
    ],
    exits: [exit('exit-to-echo', 1830, 740, '前往 回聲長廊 →', 'echo_corridor', p(180, 760))],
    interactables: [],
  }),
  buildMap({
    id: 'wounded_crosshall',
    order: 4,
    name: '傷者岔廳',
    shortName: '岔廳',
    description: '暗綠岔廳有負傷守望者留下的火盆，同時亦有較安全的繞路。',
    type: 'choice',
    icon: '🩹',
    bgColor: 0x2a4030,
    accentColor: 0x8dc6a7,
    encounterRate: 0.15,
    special: '有 NPC',
    spawnPoint: p(180, 690),
    startPathId: 'wounded-main',
    obstacleColor: 0x28372f,
    decorationColor: 0x7ea08f,
    paths: [
      {
        id: 'wounded-main',
        points: [p(180, 690), p(580, 700), p(900, 680)],
        width: 100,
        tags: ['safe', 'mercy'],
        connections: [
          { pathId: 'wounded-upper', label: '沿火盆前進', weight: 0.58, tags: ['safe', 'knowledge'] },
          { pathId: 'wounded-lower', label: '穿過陰濕側門', weight: 0.42, tags: ['mission'] },
        ],
      },
      {
        id: 'wounded-upper',
        points: [p(900, 680), p(1240, 490), p(1680, 520)],
        width: 88,
        tags: ['safe', 'knowledge'],
        connections: [{ exitId: 'exit-to-echo-safe', label: '前往 回聲長廊 →', weight: 1, tags: ['safe', 'knowledge'], targetMapId: 'echo_corridor' }],
      },
      {
        id: 'wounded-lower',
        points: [p(900, 680), p(1250, 930), p(1680, 1000)],
        width: 84,
        tags: ['mission'],
        connections: [{ exitId: 'exit-to-echo-safe', label: '前往 回聲長廊 →', weight: 1, tags: ['mission'], targetMapId: 'echo_corridor' }],
      },
    ],
    encounters: [{ id: 'wounded-shadow', x: 1290, y: 930, radius: 150, chance: 0.16, enemyPool: ['低語影'], cooldown: 12, variant: 'normal' }],
    exits: [exit('exit-to-echo-safe', 1830, 760, '前往 回聲長廊 →', 'echo_corridor', p(180, 760))],
    interactables: [
      { id: 'wounded-npc', kind: 'npc', name: '負傷守望者', x: 1120, y: 500, radius: 72, description: '守望者留下方向提醒與簡短祝詞。', once: true, stressRelief: 8, faithDelta: 4 },
    ],
  }),
  buildMap({
    id: 'echo_corridor',
    order: 5,
    name: '回聲長廊',
    shortName: '長廊',
    description: '冷灰長廊筆直延伸，回音令路口判斷更難，隊伍會被迫選邊。',
    type: 'room',
    icon: '🕯️',
    bgColor: 0x304050,
    accentColor: 0x9eb1cb,
    encounterRate: 0.25,
    special: '長走廊',
    spawnPoint: p(180, 760),
    startPathId: 'echo-main',
    obstacleColor: 0x2b3442,
    decorationColor: 0x78879d,
    paths: [
      {
        id: 'echo-main',
        points: [p(180, 760), p(700, 760), p(1030, 760)],
        width: 96,
        tags: ['mission'],
        connections: [
          { pathId: 'echo-upper', label: '金光偏門', weight: 0.5, tags: ['loot', 'mission'], targetMapId: 'glitter_vault' },
          { pathId: 'echo-lower', label: '白光偏門', weight: 0.5, tags: ['safe', 'mercy'], targetMapId: 'echo_shrine' },
        ],
      },
      {
        id: 'echo-upper',
        points: [p(1030, 760), p(1360, 540), p(1710, 420)],
        width: 82,
        tags: ['loot', 'mission'],
        connections: [{ exitId: 'exit-to-vault', label: '前往 閃光寶庫 ↗', weight: 1, tags: ['loot', 'mission'], targetMapId: 'glitter_vault' }],
      },
      {
        id: 'echo-lower',
        points: [p(1030, 760), p(1360, 980), p(1710, 1080)],
        width: 82,
        tags: ['safe', 'mercy'],
        connections: [{ exitId: 'exit-to-shrine', label: '前往 回聲神殿 ↘', weight: 1, tags: ['safe', 'mercy'], targetMapId: 'echo_shrine' }],
      },
    ],
    encounters: [
      { id: 'echo-strip-1', x: 840, y: 760, radius: 170, chance: 0.24, enemyPool: ['長廊殘響', '墓犬'], cooldown: 12, variant: 'normal' },
      { id: 'echo-strip-2', x: 1370, y: 960, radius: 150, chance: 0.28, enemyPool: ['長廊殘響'], cooldown: 12, variant: 'normal' },
    ],
    exits: [
      exit('exit-to-vault', 1820, 390, '前往 閃光寶庫 ↗', 'glitter_vault', p(180, 820)),
      exit('exit-to-shrine', 1820, 1110, '前往 回聲神殿 ↘', 'echo_shrine', p(180, 680)),
    ],
    interactables: [],
  }),
  buildMap({
    id: 'glitter_vault',
    order: 6,
    name: '閃光寶庫',
    shortName: '寶庫',
    description: '金棕密室鋪滿反光碎片，風險低，但容易令隊伍偏向財物。',
    type: 'treasure',
    icon: '💰',
    bgColor: 0x403820,
    accentColor: 0xe0b15d,
    encounterRate: 0.1,
    special: '寶箱',
    spawnPoint: p(180, 820),
    startPathId: 'vault-main',
    obstacleColor: 0x3c2f18,
    decorationColor: 0xc28e48,
    paths: [
      {
        id: 'vault-main',
        points: [p(180, 820), p(660, 820), p(1000, 760)],
        width: 102,
        tags: ['loot', 'mission'],
        connections: [
          { pathId: 'vault-upper', label: '摸向寶箱', weight: 0.65, tags: ['loot'] },
          { pathId: 'vault-lower', label: '直穿石台', weight: 0.35, tags: ['mission', 'speed'] },
        ],
      },
      {
        id: 'vault-upper',
        points: [p(1000, 760), p(1330, 560), p(1670, 600)],
        width: 84,
        tags: ['loot'],
        connections: [{ exitId: 'exit-to-watch', label: '前往 守望墓室 →', weight: 1, tags: ['danger', 'mission'], targetMapId: 'watch_crypt' }],
      },
      {
        id: 'vault-lower',
        points: [p(1000, 760), p(1330, 980), p(1670, 930)],
        width: 84,
        tags: ['mission', 'speed'],
        connections: [{ exitId: 'exit-to-watch', label: '前往 守望墓室 →', weight: 1, tags: ['mission', 'speed'], targetMapId: 'watch_crypt' }],
      },
    ],
    encounters: [{ id: 'vault-glint', x: 1350, y: 980, radius: 150, chance: 0.1, enemyPool: ['寶庫幽影'], cooldown: 18, variant: 'normal' }],
    exits: [exit('exit-to-watch', 1830, 760, '前往 守望墓室 →', 'watch_crypt', p(180, 780))],
    interactables: [
      { id: 'vault-chest', kind: 'chest', name: '封印寶箱', x: 1210, y: 565, radius: 72, description: '一道細光從箱縫滲出。', once: true, loot: 2 },
    ],
  }),
  buildMap({
    id: 'echo_shrine',
    order: 7,
    name: '回聲神殿',
    shortName: '神殿',
    description: '聖白殘壇仍有餘溫，係短暫休整地，但亦會拖慢整體推進。',
    type: 'shrine',
    icon: '✨',
    bgColor: 0x34404c,
    accentColor: 0xd8e4eb,
    encounterRate: 0.05,
    special: '恢復',
    spawnPoint: p(180, 680),
    startPathId: 'shrine-main',
    obstacleColor: 0x33414c,
    decorationColor: 0xaebdc6,
    paths: [
      {
        id: 'shrine-main',
        points: [p(180, 680), p(650, 680), p(980, 720)],
        width: 102,
        tags: ['safe', 'mercy'],
        connections: [
          { pathId: 'shrine-upper', label: '靠近聖壇', weight: 0.62, tags: ['safe', 'mercy'] },
          { pathId: 'shrine-lower', label: '繞過白霧', weight: 0.38, tags: ['mission'] },
        ],
      },
      {
        id: 'shrine-upper',
        points: [p(980, 720), p(1330, 510), p(1670, 550)],
        width: 84,
        tags: ['safe', 'mercy'],
        connections: [{ exitId: 'exit-to-watch-from-shrine', label: '前往 守望墓室 →', weight: 1, tags: ['mission', 'safe'], targetMapId: 'watch_crypt' }],
      },
      {
        id: 'shrine-lower',
        points: [p(980, 720), p(1320, 950), p(1670, 940)],
        width: 84,
        tags: ['mission'],
        connections: [{ exitId: 'exit-to-watch-from-shrine', label: '前往 守望墓室 →', weight: 1, tags: ['mission'], targetMapId: 'watch_crypt' }],
      },
    ],
    encounters: [{ id: 'shrine-shadow', x: 1340, y: 950, radius: 140, chance: 0.05, enemyPool: ['散影'], cooldown: 18, variant: 'normal' }],
    exits: [exit('exit-to-watch-from-shrine', 1830, 760, '前往 守望墓室 →', 'watch_crypt', p(180, 780))],
    interactables: [
      { id: 'echo-altar', kind: 'shrine', name: '回聲聖壇', x: 1220, y: 510, radius: 80, description: '神壇釋出一圈短暫白光。', once: true, heal: 12, stressRelief: 12, faithDelta: 6 },
    ],
  }),
  buildMap({
    id: 'watch_crypt',
    order: 8,
    name: '守望墓室',
    shortName: '墓室',
    description: '暗紫墓室有成排石棺與高位哨兵，係明顯嘅高壓路段。',
    type: 'combat',
    icon: '⚔️',
    bgColor: 0x3a2c44,
    accentColor: 0xba8bf0,
    encounterRate: 0.55,
    special: '強敵',
    spawnPoint: p(180, 780),
    startPathId: 'watch-main',
    obstacleColor: 0x352c44,
    decorationColor: 0x9a7fc1,
    paths: [
      {
        id: 'watch-main',
        points: [p(180, 780), p(670, 780), p(1020, 760)],
        width: 104,
        tags: ['danger', 'mission'],
        connections: [
          { pathId: 'watch-upper', label: '靠近棺列', weight: 0.48, tags: ['danger', 'knowledge'] },
          { pathId: 'watch-lower', label: '貼牆急行', weight: 0.52, tags: ['speed', 'danger', 'mission'] },
        ],
      },
      {
        id: 'watch-upper',
        points: [p(1020, 760), p(1350, 530), p(1690, 520)],
        width: 82,
        tags: ['danger', 'knowledge'],
        connections: [{ exitId: 'exit-to-rift', label: '前往 裂痕交匯 →', weight: 1, tags: ['danger', 'mission'], targetMapId: 'rift_crossing' }],
      },
      {
        id: 'watch-lower',
        points: [p(1020, 760), p(1350, 1010), p(1690, 980)],
        width: 82,
        tags: ['speed', 'danger', 'mission'],
        connections: [{ exitId: 'exit-to-rift', label: '前往 裂痕交匯 →', weight: 1, tags: ['danger', 'speed', 'mission'], targetMapId: 'rift_crossing' }],
      },
    ],
    encounters: [
      { id: 'watch-ambush', x: 1180, y: 720, radius: 180, chance: 0.52, enemyPool: ['墓哨', '骨弓手'], cooldown: 12, variant: 'normal' },
      { id: 'watch-strong', x: 1370, y: 520, radius: 160, chance: 0.58, enemyPool: ['墓哨', '墓語者'], cooldown: 12, variant: 'normal' },
    ],
    exits: [exit('exit-to-rift', 1830, 760, '前往 裂痕交匯 →', 'rift_crossing', p(180, 760))],
    interactables: [],
  }),
  buildMap({
    id: 'rift_crossing',
    order: 9,
    name: '裂痕交匯',
    shortName: '裂痕',
    description: '腐綠裂痕帶穿插多條破碎路，陷阱同伏兵密度都相當高。',
    type: 'hazard',
    icon: '🕳️',
    bgColor: 0x344424,
    accentColor: 0x8eb06a,
    encounterRate: 0.65,
    special: '陷阱多',
    spawnPoint: p(180, 760),
    startPathId: 'rift-main',
    obstacleColor: 0x303d25,
    decorationColor: 0x718d58,
    paths: [
      {
        id: 'rift-main',
        points: [p(180, 760), p(620, 760), p(970, 760)],
        width: 106,
        tags: ['danger', 'mission'],
        connections: [
          { pathId: 'rift-upper', label: '裂隙邊緣', weight: 0.44, tags: ['danger', 'knowledge'] },
          { pathId: 'rift-lower', label: '腐泥近路', weight: 0.56, tags: ['speed', 'danger', 'mission'] },
        ],
      },
      {
        id: 'rift-upper',
        points: [p(970, 760), p(1320, 540), p(1700, 520)],
        width: 80,
        tags: ['danger', 'knowledge'],
        connections: [{ exitId: 'exit-to-ante', label: '前往 神龕前廊 →', weight: 1, tags: ['mission', 'danger'], targetMapId: 'ante_shrine' }],
      },
      {
        id: 'rift-lower',
        points: [p(970, 760), p(1310, 1010), p(1700, 1010)],
        width: 80,
        tags: ['speed', 'danger', 'mission'],
        connections: [{ exitId: 'exit-to-ante', label: '前往 神龕前廊 →', weight: 1, tags: ['mission', 'speed'], targetMapId: 'ante_shrine' }],
      },
    ],
    encounters: [
      { id: 'rift-upper-encounter', x: 1320, y: 540, radius: 170, chance: 0.68, enemyPool: ['裂痕吞影', '墓哨'], cooldown: 10, variant: 'normal' },
      { id: 'rift-lower-encounter', x: 1310, y: 1010, radius: 170, chance: 0.64, enemyPool: ['裂痕吞影', '墓犬'], cooldown: 10, variant: 'normal' },
    ],
    exits: [exit('exit-to-ante', 1830, 760, '前往 神龕前廊 →', 'ante_shrine', p(180, 720))],
    interactables: [],
  }),
  buildMap({
    id: 'ante_shrine',
    order: 10,
    name: '神龕前廊',
    shortName: '前廊',
    description: '深藍前廊突然安靜落嚟，像決戰前刻意留出的一條呼吸帶。',
    type: 'room',
    icon: '🛕',
    bgColor: 0x283848,
    accentColor: 0x7ca0d9,
    encounterRate: 0.2,
    special: '靜謐',
    spawnPoint: p(180, 720),
    startPathId: 'ante-main',
    obstacleColor: 0x27344f,
    decorationColor: 0x6987b3,
    paths: [
      {
        id: 'ante-main',
        points: [p(180, 720), p(680, 720), p(1040, 700)],
        width: 104,
        tags: ['mission', 'safe'],
        connections: [
          { pathId: 'ante-upper', label: '靠近石燈', weight: 0.48, tags: ['safe', 'knowledge'] },
          { pathId: 'ante-lower', label: '直面墓門', weight: 0.52, tags: ['mission', 'boss'] },
        ],
      },
      {
        id: 'ante-upper',
        points: [p(1040, 700), p(1380, 520), p(1710, 530)],
        width: 82,
        tags: ['safe', 'knowledge'],
        connections: [{ exitId: 'exit-to-guardian', label: '前往 守護者墓廳 →', weight: 1, tags: ['mission', 'boss'], targetMapId: 'guardian_tomb' }],
      },
      {
        id: 'ante-lower',
        points: [p(1040, 700), p(1380, 930), p(1710, 930)],
        width: 82,
        tags: ['mission', 'boss'],
        connections: [{ exitId: 'exit-to-guardian', label: '前往 守護者墓廳 →', weight: 1, tags: ['mission', 'boss'], targetMapId: 'guardian_tomb' }],
      },
    ],
    encounters: [{ id: 'ante-shadow', x: 1390, y: 930, radius: 150, chance: 0.2, enemyPool: ['前廊幽影'], cooldown: 12, variant: 'normal' }],
    exits: [exit('exit-to-guardian', 1830, 760, '前往 守護者墓廳 →', 'guardian_tomb', p(180, 760))],
    interactables: [],
  }),
  buildMap({
    id: 'guardian_tomb',
    order: 11,
    name: '守護者墓廳',
    shortName: '墓廳',
    description: '血紅主廳只餘一道壓迫感極重的主路，終點就係守護者。',
    type: 'boss',
    icon: '👑',
    bgColor: 0x502020,
    accentColor: 0xf16d6d,
    encounterRate: 1,
    special: 'Boss',
    spawnPoint: p(180, 760),
    startPathId: 'guardian-main',
    obstacleColor: 0x472222,
    decorationColor: 0xc05c5c,
    paths: [
      {
        id: 'guardian-main',
        points: [p(180, 760), p(760, 760), p(1120, 760)],
        width: 116,
        tags: ['boss', 'mission', 'danger'],
        connections: [{ pathId: 'guardian-approach', label: '逼近王座', weight: 1, tags: ['boss', 'mission', 'danger'] }],
      },
      {
        id: 'guardian-approach',
        points: [p(1120, 760), p(1460, 760), p(1680, 760)],
        width: 90,
        tags: ['boss', 'mission', 'danger'],
        connections: [{ exitId: 'exit-to-stone', label: '前往 撤離石門 →', weight: 1, tags: ['mission', 'speed'], targetMapId: 'stone_gate' }],
      },
      {
        id: 'guardian-flank',
        points: [p(1120, 760), p(1440, 530), p(1640, 560)],
        width: 70,
        tags: ['knowledge', 'danger'],
        connections: [{ exitId: 'exit-to-stone', label: '前往 撤離石門 →', weight: 1, tags: ['mission'], targetMapId: 'stone_gate' }],
      },
    ],
    encounters: [{ id: 'guardian-boss-zone', x: 1450, y: 760, radius: 180, chance: 1, enemyPool: ['墓室守護者'], cooldown: 999, variant: 'boss', once: true }],
    exits: [exit('exit-to-stone', 1840, 760, '前往 撤離石門 →', 'stone_gate', p(180, 760))],
    interactables: [
      { id: 'guardian-altar', kind: 'altar', name: '奪回神龕', x: 1620, y: 760, radius: 84, description: '擊倒守護者後，神器就在眼前。', once: true, loot: 1, faithDelta: 8 },
    ],
  }),
  buildMap({
    id: 'stone_gate',
    order: 12,
    name: '撤離石門',
    shortName: '石門',
    description: '灰藍石門通往外側，最後只剩一段安靜但漫長的撤離路。',
    type: 'exit',
    icon: '🚶',
    bgColor: 0x343850,
    accentColor: 0x9badc6,
    encounterRate: 0,
    special: '出口',
    spawnPoint: p(180, 760),
    startPathId: 'stone-main',
    obstacleColor: 0x31384a,
    decorationColor: 0x7f90ab,
    paths: [
      {
        id: 'stone-main',
        points: [p(180, 760), p(740, 760), p(1120, 760)],
        width: 112,
        tags: ['mission', 'safe'],
        connections: [
          { pathId: 'stone-upper', label: '往外側石階', weight: 0.52, tags: ['safe', 'speed'] },
          { pathId: 'stone-lower', label: '沿門廊離開', weight: 0.48, tags: ['mission', 'speed'] },
        ],
      },
      {
        id: 'stone-upper',
        points: [p(1120, 760), p(1480, 560), p(1720, 520)],
        width: 82,
        tags: ['safe', 'speed'],
        connections: [{ exitId: 'exit-finish', label: '離開墓城', weight: 1, tags: ['mission', 'speed'], targetMapId: 'results' }],
      },
      {
        id: 'stone-lower',
        points: [p(1120, 760), p(1480, 960), p(1720, 990)],
        width: 82,
        tags: ['mission', 'speed'],
        connections: [{ exitId: 'exit-finish', label: '離開墓城', weight: 1, tags: ['mission', 'speed'], targetMapId: 'results' }],
      },
    ],
    encounters: [],
    exits: [exit('exit-finish', 1840, 760, '離開墓城', 'results', p(0, 0), true)],
    interactables: [],
  }),
];

export const INITIAL_REVEAL_POINTS: Record<string, FogRevealPoint[]> = {
  expedition_entrance: [revealPoint(180, 760)],
};

export const MAP_SUMMARY_NODES: DungeonNode[] = EXPEDITION_MAPS.map((map) => ({
  id: map.id,
  name: map.name,
  description: map.description,
  type: map.type,
  icon: map.icon,
  depth: map.order,
  x: map.order <= 6 ? 14 + (map.order - 1) * 14 : 28 + (map.order - 7) * 14,
  y: map.order <= 6 ? 34 : 72,
  width: 10,
  height: 10,
  biome: map.shortName,
  connections: MAP_LINKS.filter((link) => link.from === map.id).map((link) => link.to),
  nextNodeIds: MAP_LINKS.filter((link) => link.from === map.id).map((link) => link.to),
  routeTags: map.paths.flatMap((path) => path.tags).slice(0, 3),
  encounterChance: map.encounterRate,
  discovered: false,
  cleared: false,
}));

export function getMapById(mapId: string): MapData | undefined {
  return EXPEDITION_MAPS.find((map) => map.id === mapId);
}
