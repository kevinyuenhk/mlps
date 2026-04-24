import type { TraitMeta } from '../types';

export const TRAIT_META: TraitMeta[] = [
  {
    name: 'Brave',
    description: 'Rushes toward danger without hesitation.',
    effectSummary: 'Favors high-risk options; penalizes retreat or avoidance.',
  },
  {
    name: 'Loyal',
    description: 'Deeply committed to the group and divine purpose.',
    effectSummary: 'Favors mission-aligned options; votes carry slight extra weight.',
  },
  {
    name: 'Stubborn',
    description: 'Digs in on a stance and resists changing course.',
    effectSummary: 'Boosts aggressive / committed options; strongly resists retreat.',
  },
  {
    name: 'Compassionate',
    description: 'Cannot ignore suffering, even at cost to the mission.',
    effectSummary: 'Strongly favors helping the wounded; penalizes ignoring victims.',
  },
  {
    name: 'Fearful',
    description: 'Threat perception is amplified; flinches under pressure.',
    effectSummary: 'Strongly favors safe/retreat options; penalizes combat and high-risk.',
  },
  {
    name: 'Devout',
    description: 'Treats divine commands as sacred truth.',
    effectSummary: 'Amplifies the weight of divine intent alignment by 30%.',
  },
  {
    name: 'Greedy',
    description: 'Eyes drift to gold before duty.',
    effectSummary: 'Strongly favors treasure-seeking; resists mission-only focus.',
  },
  {
    name: 'Clever',
    description: 'Finds angles others overlook.',
    effectSummary: 'Favors tactical / scouting / interrogation options.',
  },
  {
    name: 'Skeptical',
    description: 'Questions everything, including the gods.',
    effectSummary: 'Divine intent influence reduced by 50%.',
  },
  {
    name: 'Curious',
    description: 'Drawn to mysteries and hidden things.',
    effectSummary: 'Favors exploration, investigation, and scouting options.',
  },
  {
    name: 'Rational',
    description: 'Weighs risk-reward before acting.',
    effectSummary: 'Favors measured, low-risk tactical options.',
  },
  {
    name: 'Fragile',
    description: 'Poorly suited to sustained physical danger.',
    effectSummary: 'Penalizes high-risk options when HP is below 50%.',
  },
  {
    name: 'Calm',
    description: 'Unruffled under pressure; makes steady decisions.',
    effectSummary: 'Favors measured options; stress has less negative effect.',
  },
  {
    name: 'Dutiful',
    description: 'Follows orders and completes assigned tasks.',
    effectSummary: 'Favors mission-focused and escape options; reliable.',
  },
  {
    name: 'Wary',
    description: 'Approaches danger with careful, measured caution.',
    effectSummary: 'Strongly favors safe routes and defensive options.',
  },
];
