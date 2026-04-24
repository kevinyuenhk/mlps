import type { Intervention } from '../types';

export const INTERVENTIONS: Intervention[] = [
  {
    type: 'omen',
    label: 'Send an Omen',
    description:
      'Nudge the party toward a specific option. Select an option after activating — it gains a significant boost in the party\'s deliberation.',
    cost: 1,
    flavorText: 'A divine sign: a sudden wind, a flash of clarity, a voice in the mind.',
  },
  {
    type: 'blessing',
    label: 'Bestow a Blessing',
    description:
      'Strengthen resolve. The party\'s loyalty is temporarily heightened, making them more cohesive in their next decision.',
    cost: 1,
    flavorText: 'Golden warmth suffuses the party. Doubt retreats. The bond holds.',
  },
  {
    type: 'miracle',
    label: 'Invoke a Miracle',
    description:
      'A major divine act: heal all party members significantly and reduce their stress. Costs 2 divine power.',
    cost: 2,
    flavorText: 'Light descends. Wounds knit. Pain fades. The god is present.',
  },
];

export const BLESSINGS = [
  {
    id: 'shielding_light',
    label: 'Shielding Light',
    description: 'The party begins with divine protection, reducing HP loss from the first harmful event.',
    effect: 'First dangerous event: HP damage reduced by 50%.',
  },
  {
    id: 'healing_grace',
    label: 'Healing Grace',
    description: 'Mira\'s healing is supernaturally potent at expedition start.',
    effect: 'All party members start with +15 HP and –10 stress.',
  },
  {
    id: 'guiding_omen',
    label: 'Guiding Omen',
    description: 'The god\'s first Omen intervention is free.',
    effect: 'First Omen use costs 0 divine power.',
  },
] as const;
