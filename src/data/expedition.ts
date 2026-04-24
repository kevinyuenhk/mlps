import type { ExpeditionNode } from '../types';

export const EXPEDITION_NODES: ExpeditionNode[] = [
  {
    id: 'entrance',
    name: '墓地入口',
    description:
      '生鏽的鐵門在隊伍入內時嘎嘎作響。殘破的墓碑向四面八方延伸。這裡的霧氣尚稀薄，但它很快便會濃厚起來。',
    position: 0,
    icon: '🚪',
  },
  {
    id: 'outer_graves',
    name: '外圍墓區',
    description:
      '外圍的墓園較少受到擾動——骸骨封存於石棺之中。一道峽谷橫截了最短的路徑。',
    eventId: 'collapsed_bridge',
    position: 1,
    icon: '⚰️',
  },
  {
    id: 'fork',
    name: '岔路口',
    description:
      '兩條古老紫杉樹間的風化小徑在此分岔。左側路徑更為狹窄；兩條路都通往更深處。',
    eventId: 'wounded_gravekeeper',
    position: 2,
    icon: '🌿',
  },
  {
    id: 'chapel',
    name: '廢棄禮拜堂',
    description:
      '一座搖搖欲墜的石砌禮拜堂矗立於空地之中。側邊的地下墓室門扉虛掩。裡面有什麼東西在閃閃發光。',
    eventId: 'glittering_vault',
    position: 3,
    icon: '⛪',
  },
  {
    id: 'deep_altar',
    name: '深處祭壇',
    description:
      '一座環繞著立石的露天祭壇，標誌著古老墓地的核心。死者在此地躁動不安。',
    eventId: 'restless_dead_ambush',
    position: 4,
    icon: '🪨',
  },
  {
    id: 'relic_chamber',
    name: '神器密室',
    description:
      '一座土丘掩蓋著一間石室。神聖神器從內部發出微弱的光芒——但守衛亦然。',
    eventId: 'chamber_guardian',
    position: 5,
    icon: '💀',
  },
  {
    id: 'escape',
    name: '撤離之路',
    description:
      '任務即將走向終點。墓地愈發充滿敵意。在隊伍抵達安全之地前，最後一個抉擇仍等待著他們。',
    eventId: 'escape_route',
    position: 6,
    icon: '🌅',
  },
];
