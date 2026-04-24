import type { DungeonCorridor, DungeonMap, DungeonNode, RouteTag, RoomType, Vec2 } from '../types';

export const DUNGEON_WORLD_WIDTH = 3000;
export const DUNGEON_WORLD_HEIGHT = 4000;

interface RoomTemplate {
  id: string;
  name: string;
  description: string;
  type: RoomType;
  depth: number;
  lane: number;
  routeTags: RouteTag[];
  icon: string;
  eventId?: string;
  encounterChance?: number;
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 'entrance',
    name: '遠征入口',
    description: '遠征隊整隊後踏進幽深墓窟，火把在潮濕石壁上搖動。',
    type: 'entrance',
    depth: 0,
    lane: 0,
    routeTags: ['mission'],
    icon: '🚪',
  },
  {
    id: 'vanguard',
    name: '白骨前廳',
    description: '第一段行軍已驚動前廳亡骸，隊伍需撐過這場試探。',
    type: 'combat',
    depth: 1,
    lane: 0,
    routeTags: ['danger', 'mission'],
    icon: '⚔️',
    eventId: 'restless_dead_ambush',
    encounterChance: 1,
  },
  {
    id: 'bridge',
    name: '斷橋區',
    description: '裂開石橋橫跨黑井，腳步聲在深坑裡空洞回響。',
    type: 'hazard',
    depth: 2,
    lane: -1,
    routeTags: ['speed', 'danger', 'mission'],
    icon: '🪵',
    eventId: 'collapsed_bridge',
    encounterChance: 0.35,
  },
  {
    id: 'keeper',
    name: '傷者岔廳',
    description: '岔路角落蜷著一名守墓人，願意以情報交換援手。',
    type: 'choice',
    depth: 2,
    lane: 1,
    routeTags: ['mercy', 'safe', 'knowledge'],
    icon: '🩹',
    eventId: 'wounded_gravekeeper',
  },
  {
    id: 'echo_hall',
    name: '回聲長廊',
    description: '空蕩主廊拉得極長，遠處傳來鐵甲摩擦石地的迴響。',
    type: 'room',
    depth: 3,
    lane: 0,
    routeTags: ['mission', 'knowledge'],
    icon: '🕯️',
  },
  {
    id: 'vault',
    name: '閃光寶庫',
    description: '半掩側室堆滿舊幣與封箱，財光照得人心浮動。',
    type: 'treasure',
    depth: 4,
    lane: -1,
    routeTags: ['loot', 'mission'],
    icon: '💰',
    eventId: 'glittering_vault',
  },
  {
    id: 'shrine',
    name: '回聲神殿',
    description: '殘破祭壇還殘留一絲溫熱神性，可暫時穩住隊伍。',
    type: 'shrine',
    depth: 4,
    lane: 1,
    routeTags: ['safe', 'mercy', 'mission'],
    icon: '✨',
    eventId: 'shrine_of_echoes',
  },
  {
    id: 'crypt_watch',
    name: '守望墓室',
    description: '守衛殘魂在補給路線盤旋，近道與風險綁在一起。',
    type: 'combat',
    depth: 5,
    lane: 0,
    routeTags: ['speed', 'loot', 'danger'],
    icon: '🕯️',
    eventId: 'crypt_watch',
    encounterChance: 1,
  },
  {
    id: 'sundered_crossing',
    name: '裂痕交匯點',
    description: '牆體裂縫滲出腐霧，地面滿是舊陷阱與拖行痕跡。',
    type: 'hazard',
    depth: 6,
    lane: -1,
    routeTags: ['danger', 'speed'],
    icon: '☠️',
    encounterChance: 0.58,
  },
  {
    id: 'sanctum_approach',
    name: '神龕前廊',
    description: '最後一段前廊異常安靜，像有什麼刻意讓道路保持空白。',
    type: 'room',
    depth: 6,
    lane: 1,
    routeTags: ['mission', 'safe'],
    icon: '🏛️',
  },
  {
    id: 'guardian',
    name: '守護者墓廳',
    description: '墓廳深處的封印正在呼吸，守護者等著最後一批闖入者。',
    type: 'boss',
    depth: 7,
    lane: 0,
    routeTags: ['boss', 'mission', 'danger'],
    icon: '👑',
    eventId: 'chamber_guardian',
    encounterChance: 1,
  },
  {
    id: 'escape',
    name: '撤離石門',
    description: '帶著戰果回頭時，每一步都比來時更沉重。',
    type: 'exit',
    depth: 8,
    lane: 0,
    routeTags: ['mission', 'safe', 'speed'],
    icon: '🏃',
  },
];

const CONNECTIONS: Array<[string, string]> = [
  ['entrance', 'vanguard'],
  ['vanguard', 'bridge'],
  ['vanguard', 'keeper'],
  ['bridge', 'echo_hall'],
  ['keeper', 'echo_hall'],
  ['echo_hall', 'vault'],
  ['echo_hall', 'shrine'],
  ['vault', 'crypt_watch'],
  ['shrine', 'crypt_watch'],
  ['crypt_watch', 'sundered_crossing'],
  ['crypt_watch', 'sanctum_approach'],
  ['sundered_crossing', 'guardian'],
  ['sanctum_approach', 'guardian'],
  ['guardian', 'escape'],
];

function randomInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function distance(a: Vec2, b: Vec2) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function makeCorridorPath(from: Vec2, to: Vec2, bendBias: number): Vec2[] {
  const midY = Math.round((from.y + to.y) / 2 + bendBias);
  return [
    { x: from.x, y: from.y },
    { x: from.x, y: midY },
    { x: to.x, y: midY },
    { x: to.x, y: to.y },
  ];
}

function roomCenter(room: Pick<DungeonNode, 'x' | 'y'>): Vec2 {
  return { x: room.x, y: room.y };
}

export function generateMaze(): DungeonMap {
  const laneFlip = Math.random() > 0.5 ? 1 : -1;
  const laneBase = DUNGEON_WORLD_WIDTH / 2;
  const laneStep = 520;
  const depthStep = 440;

  const rooms = ROOM_TEMPLATES.map<DungeonNode>((template) => {
    const jitterX = randomInt(-90, 90);
    const jitterY = randomInt(-40, 40);
    const width = template.type === 'boss' ? 400 : template.type === 'entrance' || template.type === 'exit' ? 300 : 260 + randomInt(-20, 36);
    const height = template.type === 'boss' ? 320 : 210 + randomInt(-24, 28);
    const laneOffset = template.lane * laneStep * laneFlip;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      eventId: template.eventId,
      icon: template.icon,
      depth: template.depth,
      x: laneBase + laneOffset + jitterX,
      y: 320 + template.depth * depthStep + jitterY,
      width,
      height,
      biome:
        template.type === 'shrine'
          ? 'sanctified'
          : template.type === 'treasure'
          ? 'gilded'
          : template.type === 'boss'
          ? 'royal'
          : template.type === 'hazard'
          ? 'ruined'
          : 'crypt',
      connections: [],
      nextNodeIds: [],
      routeTags: template.routeTags,
      encounterChance: template.encounterChance ?? 0,
      discovered: false,
      cleared: false,
    };
  });

  const roomById = new Map(rooms.map((room) => [room.id, room]));
  const corridors = CONNECTIONS.map<DungeonCorridor>(([fromId, toId], index) => {
    const fromRoom = roomById.get(fromId)!;
    const toRoom = roomById.get(toId)!;
    fromRoom.connections.push(toId);
    fromRoom.nextNodeIds.push(toId);

    const path = makeCorridorPath(
      roomCenter(fromRoom),
      roomCenter(toRoom),
      randomInt(-70, 70)
    );

    let length = 0;
    for (let cursor = 1; cursor < path.length; cursor += 1) {
      length += distance(path[cursor - 1], path[cursor]);
    }

    return {
      id: `corridor-${index + 1}`,
      from: fromId,
      to: toId,
      path,
      length,
    };
  });

  return {
    width: DUNGEON_WORLD_WIDTH,
    height: DUNGEON_WORLD_HEIGHT,
    rooms,
    corridors,
    spawnPoint: roomCenter(roomById.get('entrance')!),
    bossRoomId: 'guardian',
    exitRoomId: 'escape',
  };
}
