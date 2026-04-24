import type { ExpeditionNode } from '../types';

export const EXPEDITION_NODES: ExpeditionNode[] = [
  { id: 'entrance', name: 'Dungeon Gate', description: 'The party enters the sealed lower cemetery.', position: 0, icon: '🚪' },
  { id: 'broken_bridge', name: 'Broken Bridge', description: 'A cracked span blocks the shortest route.', eventId: 'collapsed_bridge', position: 1, icon: '🌉' },
  { id: 'gravekeeper_alcove', name: "Gravekeeper's Alcove", description: 'A wounded keeper points toward two routes.', eventId: 'wounded_gravekeeper', position: 2, icon: '🩹' },
  { id: 'looted_reliquary', name: 'Looted Reliquary', description: 'Treasure glints behind old warding bars.', eventId: 'glittering_vault', position: 3, icon: '💰' },
  { id: 'restless_dead', name: 'Restless Dead', description: 'The dead rise around the altar stairs.', eventId: 'restless_dead_ambush', position: 4, icon: '⚔️' },
  { id: 'guardian_chamber', name: 'Guardian Chamber', description: 'The relic waits behind its tomb guardian.', eventId: 'chamber_guardian', position: 5, icon: '👑' },
  { id: 'falling_exit', name: 'Falling Exit', description: 'Stone breaks loose as the dungeon rejects them.', eventId: 'escape_route', position: 6, icon: '🏃' },
];
