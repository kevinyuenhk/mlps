import type { GameEvent } from '../types';

/**
 * 6 handcrafted events covering all required categories.
 * Each option includes:
 *  - signalAlignment: which divine intent signals this option resonates with
 *  - traitBonuses: per-trait bonus (+) or penalty (−) for this option
 *  - baseWeight: inherent attractiveness of the option
 */
export const EVENTS: GameEvent[] = [
  // ─────────────────────────────────────────────────────
  // EVENT 1: Route Choice — The Collapsed Bridge
  // ─────────────────────────────────────────────────────
  {
    id: 'collapsed_bridge',
    title: 'The Collapsed Bridge',
    description:
      'The main path across the ravine has partially collapsed. Rotten planks hang over a ten-foot drop. Three routes present themselves: creep across the remaining structure, double back along a longer safe trail, or bind the planks together and force a crossing.',
    type: 'route_choice',
    nodeId: 'outer_graves',
    options: [
      {
        id: 'cross_carefully',
        label: 'Cross Carefully',
        description: 'Pick your footing. The bridge holds — probably.',
        riskLevel: 'medium',
        baseWeight: 0.55,
        signalAlignment: { urgency: 0.6, survivalPriority: 0.4, missionFocus: 0.4 },
        traitBonuses: {
          Brave: 0.25,
          Calm: 0.2,
          Dutiful: 0.15,
          Fearful: -0.3,
          Wary: -0.2,
          Fragile: -0.15,
        },
        outcome: {
          hpChange: -8,
          stressChange: 10,
          loyaltyChange: 2,
          faithChange: 0,
          narrativeResult:
            'The party picks their way across. One board snaps but everyone reaches the other side, rattled but intact.',
          relicProgress: false,
        },
      },
      {
        id: 'safe_detour',
        label: 'Take the Long Way',
        description: 'Double back through the outer tombs. Slower, but certain.',
        riskLevel: 'low',
        baseWeight: 0.45,
        signalAlignment: { survivalPriority: 0.9, stealthPreference: 0.5 },
        traitBonuses: {
          Wary: 0.4,
          Rational: 0.3,
          Calm: 0.15,
          Stubborn: -0.2,
          Brave: -0.1,
          Dutiful: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -5,
          loyaltyChange: -2,
          faithChange: 0,
          narrativeResult:
            'The detour is uneventful. Time is lost and morale slips slightly, but the party arrives unharmed.',
          relicProgress: false,
        },
      },
      {
        id: 'force_through',
        label: 'Force the Crossing',
        description: 'Lash the planks with rope and drive across at speed.',
        riskLevel: 'high',
        baseWeight: 0.35,
        signalAlignment: { urgency: 0.9, aggression: 0.5, missionFocus: 0.5 },
        traitBonuses: {
          Brave: 0.4,
          Stubborn: 0.35,
          Loyal: 0.1,
          Fearful: -0.5,
          Rational: -0.3,
          Fragile: -0.4,
          Wary: -0.35,
        },
        outcome: {
          hpChange: -18,
          stressChange: 20,
          loyaltyChange: 3,
          faithChange: 5,
          narrativeResult:
            'The bridge screams under their weight. Two members slip, taking bruising falls. They make it, but the cost is felt.',
          relicProgress: false,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // EVENT 2: Moral Dilemma — The Wounded Gravekeeper
  // ─────────────────────────────────────────────────────
  {
    id: 'wounded_gravekeeper',
    title: 'The Wounded Gravekeeper',
    description:
      'A elderly man in a groundskeeper\'s coat lies propped against a tomb, clutching a deep gash on his leg. He looks up with desperate eyes. "Please — the creatures came at dusk. I know the layout of the deep cemetery. Help me and I can guide you."',
    type: 'moral_dilemma',
    nodeId: 'fork',
    options: [
      {
        id: 'help_keeper',
        label: 'Help the Wounded Man',
        description: 'Bind his wounds and hear what he knows.',
        riskLevel: 'low',
        baseWeight: 0.5,
        signalAlignment: { mercyPriority: 1.0, survivalPriority: 0.3, missionFocus: 0.3 },
        traitBonuses: {
          Compassionate: 0.55,
          Devout: 0.2,
          Loyal: 0.15,
          Greedy: -0.3,
          Skeptical: -0.15,
          Dutiful: -0.05,
        },
        outcome: {
          hpChange: 5,
          stressChange: -10,
          loyaltyChange: 8,
          faithChange: 10,
          narrativeResult:
            'The keeper\'s knowledge proves invaluable — he sketches a route avoiding two undead patrols. Morale improves and faith deepens.',
          relicProgress: false,
        },
      },
      {
        id: 'ignore_keeper',
        label: 'Press On — Leave Him',
        description: 'The mission cannot wait for strangers.',
        riskLevel: 'low',
        baseWeight: 0.35,
        signalAlignment: { missionFocus: 0.8, urgency: 0.7 },
        traitBonuses: {
          Skeptical: 0.2,
          Dutiful: 0.2,
          Rational: 0.1,
          Compassionate: -0.55,
          Devout: -0.2,
          Loyal: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: 15,
          loyaltyChange: -10,
          faithChange: -8,
          narrativeResult:
            'The party leaves the man behind. His quiet plea echoes. Several members grow distant; Mira\'s hands tremble with suppressed guilt.',
          relicProgress: false,
        },
      },
      {
        id: 'interrogate_keeper',
        label: 'Question Him Briefly',
        description: 'Take the useful information but keep moving.',
        riskLevel: 'low',
        baseWeight: 0.55,
        signalAlignment: { missionFocus: 0.6, stealthPreference: 0.4, urgency: 0.4 },
        traitBonuses: {
          Clever: 0.45,
          Curious: 0.3,
          Rational: 0.25,
          Calm: 0.15,
          Compassionate: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -5,
          loyaltyChange: 3,
          faithChange: 2,
          narrativeResult:
            'The gravekeeper gives up a useful shortcut before the party moves on. A pragmatic compromise that leaves no one fully satisfied.',
          relicProgress: false,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // EVENT 3: Temptation — The Glittering Vault
  // ─────────────────────────────────────────────────────
  {
    id: 'glittering_vault',
    title: 'The Glittering Vault',
    description:
      'A iron door hangs open beside the main path. Inside, torchlight glints off stacked grave-goods — silver jewelry, old coin, a jeweled goblet. It looks undisturbed. The relic chamber lies two hours deeper. Taking a detour now could cost precious time.',
    type: 'temptation',
    nodeId: 'chapel',
    options: [
      {
        id: 'investigate_treasure',
        label: 'Investigate the Vault',
        description: 'Loot what you can. Wealth is its own reward.',
        riskLevel: 'medium',
        baseWeight: 0.3,
        signalAlignment: { greedAllowance: 1.0 },
        traitBonuses: {
          Greedy: 0.65,
          Curious: 0.3,
          Brave: 0.1,
          Loyal: -0.2,
          Dutiful: -0.3,
          Devout: -0.25,
          Wary: -0.15,
        },
        outcome: {
          hpChange: -10,
          stressChange: 5,
          loyaltyChange: -5,
          faithChange: -12,
          narrativeResult:
            'The vault is emptied. A guardian spirit wakes — the party fights it off but takes wounds. Kell grins with a full pouch; Mira prays for forgiveness.',
          relicProgress: false,
        },
      },
      {
        id: 'stay_on_mission',
        label: 'Stay on Mission',
        description: 'Leave the gold. The relic matters more.',
        riskLevel: 'low',
        baseWeight: 0.5,
        signalAlignment: { missionFocus: 1.0, urgency: 0.5 },
        traitBonuses: {
          Loyal: 0.3,
          Dutiful: 0.4,
          Devout: 0.25,
          Brave: 0.05,
          Greedy: -0.4,
          Curious: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -8,
          loyaltyChange: 5,
          faithChange: 8,
          narrativeResult:
            'The party walks past without a glance — or almost without a glance. The mission holds. Divine favor strengthens.',
          relicProgress: false,
        },
      },
      {
        id: 'quick_scout',
        label: 'Scout Briefly, Then Move',
        description: 'Check for traps or clues — then continue.',
        riskLevel: 'low',
        baseWeight: 0.55,
        signalAlignment: {
          missionFocus: 0.5,
          greedAllowance: 0.3,
          stealthPreference: 0.6,
        },
        traitBonuses: {
          Clever: 0.4,
          Curious: 0.35,
          Calm: 0.2,
          Wary: 0.1,
          Greedy: 0.15,
          Loyal: 0.05,
        },
        outcome: {
          hpChange: 0,
          stressChange: -3,
          loyaltyChange: 2,
          faithChange: 0,
          narrativeResult:
            'A brief scan reveals nothing dangerous. Iven pockets a curious inscribed stone for study. The party moves on quickly.',
          relicProgress: false,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // EVENT 4: Combat — Restless Dead Ambush
  // ─────────────────────────────────────────────────────
  {
    id: 'restless_dead_ambush',
    title: 'Restless Dead Ambush',
    description:
      'Six shambling corpses rise from the altar mounds as the party approaches the deep altar. Hollow eye sockets fix on the intruders. They move slowly but their numbers are a concern. The altar passage ahead is the only forward route.',
    type: 'combat',
    nodeId: 'deep_altar',
    options: [
      {
        id: 'fight_through',
        label: 'Fight Through',
        description: 'Engage and clear the passage. Hold nothing back.',
        riskLevel: 'high',
        baseWeight: 0.5,
        signalAlignment: { aggression: 1.0, missionFocus: 0.5 },
        traitBonuses: {
          Brave: 0.55,
          Stubborn: 0.35,
          Loyal: 0.1,
          Fearful: -0.55,
          Fragile: -0.4,
          Wary: -0.2,
          Rational: -0.1,
        },
        outcome: {
          hpChange: -22,
          stressChange: 25,
          loyaltyChange: 5,
          faithChange: 3,
          narrativeResult:
            'The dead fall — but at cost. Everyone bears cuts and bruises. Rowan has a gash across one arm. The passage is clear.',
          relicProgress: false,
        },
      },
      {
        id: 'withdraw',
        label: 'Withdraw and Regroup',
        description: 'Pull back and find another approach.',
        riskLevel: 'low',
        baseWeight: 0.25,
        signalAlignment: { survivalPriority: 0.9, stealthPreference: 0.5 },
        traitBonuses: {
          Fearful: 0.45,
          Wary: 0.35,
          Rational: 0.15,
          Brave: -0.35,
          Stubborn: -0.45,
          Loyal: -0.15,
          Dutiful: -0.1,
        },
        outcome: {
          hpChange: -5,
          stressChange: -5,
          loyaltyChange: -8,
          faithChange: -5,
          narrativeResult:
            'The party retreats to a side alcove. The undead lose interest. Later, a longer route is found — time lost, morale uncertain.',
          relicProgress: false,
        },
      },
      {
        id: 'defensive_formation',
        label: 'Defensive Formation',
        description: 'Shield wall. Let them come. Break them methodically.',
        riskLevel: 'medium',
        baseWeight: 0.55,
        signalAlignment: { survivalPriority: 0.6, aggression: 0.3, missionFocus: 0.5 },
        traitBonuses: {
          Rational: 0.4,
          Calm: 0.35,
          Loyal: 0.25,
          Dutiful: 0.3,
          Brave: 0.1,
          Fearful: -0.1,
          Stubborn: 0.1,
        },
        outcome: {
          hpChange: -12,
          stressChange: 8,
          loyaltyChange: 8,
          faithChange: 5,
          narrativeResult:
            'The shield line holds. Dead hands find no gaps. The undead are systematically destroyed. Efficient; bonding.',
          relicProgress: false,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // EVENT 5: Boss — Relic Chamber Guardian
  // ─────────────────────────────────────────────────────
  {
    id: 'chamber_guardian',
    title: 'The Chamber Guardian',
    description:
      'A towering barrow-knight stands in the center of the relic chamber — ten feet of corroded armor animated by grave-magic. The sacred relic glows behind it on a stone altar. The guardian\'s hollow visor turns toward the party. It is between them and everything they came for.',
    type: 'boss',
    nodeId: 'relic_chamber',
    options: [
      {
        id: 'press_attack',
        label: 'Press the Attack',
        description: 'Overwhelm it before it can adapt. All in.',
        riskLevel: 'high',
        baseWeight: 0.45,
        signalAlignment: { aggression: 0.9, missionFocus: 0.9 },
        traitBonuses: {
          Brave: 0.55,
          Stubborn: 0.35,
          Loyal: 0.15,
          Fearful: -0.6,
          Fragile: -0.5,
          Wary: -0.25,
          Rational: -0.15,
        },
        outcome: {
          hpChange: -30,
          stressChange: 30,
          loyaltyChange: 10,
          faithChange: 15,
          narrativeResult:
            'The guardian falls in a roar of collapsing armor. The relic is seized. The cost is severe — every member is wounded, some gravely — but the mission is complete.',
          relicProgress: true,
        },
      },
      {
        id: 'conserve_and_flank',
        label: 'Conserve and Flank',
        description: 'Wear it down with tactical patience.',
        riskLevel: 'medium',
        baseWeight: 0.6,
        signalAlignment: {
          survivalPriority: 0.5,
          missionFocus: 0.8,
          urgency: 0.3,
        },
        traitBonuses: {
          Clever: 0.45,
          Rational: 0.4,
          Calm: 0.3,
          Dutiful: 0.2,
          Brave: 0.1,
          Fearful: -0.05,
        },
        outcome: {
          hpChange: -18,
          stressChange: 15,
          loyaltyChange: 8,
          faithChange: 10,
          narrativeResult:
            'Working as one, the party finds gaps in the guardian\'s defense. It crumbles at last. Wounded but not broken, they claim the relic.',
          relicProgress: true,
        },
      },
      {
        id: 'retreat_partial',
        label: 'Withdraw — Abandon the Relic',
        description: 'The party cannot survive this fight. Retreat.',
        riskLevel: 'low',
        baseWeight: 0.2,
        signalAlignment: { survivalPriority: 0.95 },
        traitBonuses: {
          Fearful: 0.45,
          Wary: 0.5,
          Fragile: 0.35,
          Brave: -0.45,
          Stubborn: -0.55,
          Loyal: -0.2,
          Dutiful: -0.25,
        },
        outcome: {
          hpChange: -5,
          stressChange: 30,
          loyaltyChange: -15,
          faithChange: -20,
          narrativeResult:
            'The party backs out of the chamber. The guardian does not pursue. The relic remains behind. They survived — but at what cost to the faith?',
          relicProgress: false,
        },
      },
    ],
  },

  // ─────────────────────────────────────────────────────
  // EVENT 6: Extraction — The Escape Route
  // ─────────────────────────────────────────────────────
  {
    id: 'escape_route',
    title: 'The Escape Route',
    description:
      'With the relic in hand (or the mission failed), the graveyard seems to know. The dead stir. Fog thickens. A side passage offers quick escape, but one party member has taken a serious wound and is struggling to keep pace. Voices from deeper in the dark suggest survivors. Do you cut losses, carry the wounded, or push once more?',
    type: 'extraction',
    nodeId: 'escape',
    options: [
      {
        id: 'escape_immediately',
        label: 'Escape Now',
        description: 'Get out before the dead fully wake.',
        riskLevel: 'low',
        baseWeight: 0.5,
        signalAlignment: { survivalPriority: 0.9, urgency: 0.8 },
        traitBonuses: {
          Wary: 0.3,
          Calm: 0.25,
          Dutiful: 0.2,
          Stubborn: -0.2,
          Brave: -0.1,
          Greedy: -0.1,
        },
        outcome: {
          hpChange: 0,
          stressChange: -10,
          loyaltyChange: 2,
          faithChange: 5,
          narrativeResult:
            'The party makes for the exit without pause. Fog parts before them. They emerge battered but alive.',
          relicProgress: false,
        },
      },
      {
        id: 'search_once_more',
        label: 'Search Once More',
        description: 'Risk a final sweep — there may be more worth taking.',
        riskLevel: 'medium',
        baseWeight: 0.3,
        signalAlignment: { greedAllowance: 0.6, missionFocus: 0.4, urgency: 0.5 },
        traitBonuses: {
          Greedy: 0.45,
          Curious: 0.35,
          Brave: 0.2,
          Loyal: 0.1,
          Fearful: -0.35,
          Wary: -0.3,
          Dutiful: -0.1,
        },
        outcome: {
          hpChange: -15,
          stressChange: 20,
          loyaltyChange: -3,
          faithChange: -5,
          narrativeResult:
            'The final sweep yields a secondary fragment of sacred text — valuable, but the dead were close. Wounds deepen. The escape is harrowing.',
          relicProgress: false,
        },
      },
      {
        id: 'carry_wounded',
        label: 'Help the Wounded — Leave No One',
        description: 'Carry the injured member out together.',
        riskLevel: 'low',
        baseWeight: 0.55,
        signalAlignment: { mercyPriority: 1.0, survivalPriority: 0.6 },
        traitBonuses: {
          Compassionate: 0.6,
          Loyal: 0.45,
          Devout: 0.2,
          Brave: 0.1,
          Greedy: -0.2,
          Dutiful: 0.15,
        },
        outcome: {
          hpChange: 5,
          stressChange: -15,
          loyaltyChange: 15,
          faithChange: 12,
          narrativeResult:
            'No one is left behind. The party carries their wounded member out into the grey dawn, slower but unbroken. Faith burns stronger than before.',
          relicProgress: false,
        },
      },
    ],
  },
];

export function getEventById(id: string): GameEvent | undefined {
  return EVENTS.find((e) => e.id === id);
}
