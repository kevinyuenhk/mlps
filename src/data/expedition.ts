import type { ExpeditionNode } from '../types';

export const EXPEDITION_NODES: ExpeditionNode[] = [
  {
    id: 'entrance',
    name: 'Graveyard Entrance',
    description:
      'Rusted iron gates creak as the party enters. Crumbling tombstones stretch in every direction. The fog is thin here, but it will thicken.',
    position: 0,
    icon: '🚪',
  },
  {
    id: 'outer_graves',
    name: 'Outer Graves',
    description:
      'The outer cemetery is less disturbed — bones sealed in stone. A ravine cuts the shortest path.',
    eventId: 'collapsed_bridge',
    position: 1,
    icon: '⚰️',
  },
  {
    id: 'fork',
    name: 'Fork in the Path',
    description:
      'Two weathered trails diverge through ancient yew trees. The left is narrower; both lead deeper.',
    eventId: 'wounded_gravekeeper',
    position: 2,
    icon: '🌿',
  },
  {
    id: 'chapel',
    name: 'Abandoned Chapel',
    description:
      'A crumbling stone chapel stands in a clearing. Its side crypt door is ajar. Something glints inside.',
    eventId: 'glittering_vault',
    position: 3,
    icon: '⛪',
  },
  {
    id: 'deep_altar',
    name: 'Deep Altar',
    description:
      'An open-air altar ringed with standing stones marks the heart of the old graveyard. The dead are restless here.',
    eventId: 'restless_dead_ambush',
    position: 4,
    icon: '🪨',
  },
  {
    id: 'relic_chamber',
    name: 'Relic Chamber',
    description:
      'A barrow mound conceals a stone chamber. The sacred relic pulses with faint light from within — but so does the guardian.',
    eventId: 'chamber_guardian',
    position: 5,
    icon: '💀',
  },
  {
    id: 'escape',
    name: 'The Escape',
    description:
      'The mission\'s end approaches. The graveyard grows hostile. One final choice remains before the party reaches safety.',
    eventId: 'escape_route',
    position: 6,
    icon: '🌅',
  },
];
