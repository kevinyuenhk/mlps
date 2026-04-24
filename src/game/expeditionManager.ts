import type {
  Adventurer,
  BlessingType,
  DivinIntent,
  EventResolution,
  ExpeditionNode,
  InterventionType,
  LogEntry,
  RunState,
} from '../types';
import { ADVENTURER_POOL } from '../data/adventurers';
import { EXPEDITION_NODES } from '../data/expedition';
import { getEventById } from '../data/events';
import { resolvePartyDecision } from './decisionEngine';

let logIdCounter = 0;
function makeLog(type: LogEntry['type'], text: string): LogEntry {
  return { id: `log-${++logIdCounter}`, timestamp: Date.now(), type, text };
}

// ─────────────────────────────────────────────────────────────────
// Initial state construction
// ─────────────────────────────────────────────────────────────────

export function createInitialRunState(
  selectedIds: string[],
  intent: DivinIntent,
  blessing: BlessingType
): RunState {
  let party: Adventurer[] = selectedIds
    .map((id) => ADVENTURER_POOL.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({ ...a! }));

  if (blessing === 'healing_grace') {
    party = party.map((a) => ({
      ...a,
      hp: Math.min(a.maxHp, a.hp + 15),
      stress: Math.max(0, a.stress - 10),
    }));
  }

  const initialLog: LogEntry[] = [
    makeLog('info', 'The expedition begins. Your party approaches the Abandoned Graveyard.'),
    makeLog('info', blessingStartText(blessing)),
  ];

  return {
    phase: 'expedition',
    selectedAdventurerIds: selectedIds,
    party,
    divinIntent: intent,
    oracleConfig: null,
    divinePower: 3,
    maxDivinePower: 3,
    currentNodeIndex: 0,
    nodes: EXPEDITION_NODES,
    resolutions: [],
    relicRecovered: false,
    expeditionLog: initialLog,
    interventionsUsed: [],
    activeBlessing: blessing,
    expeditionComplete: false,
    activeOmenOptionId: null,
    activeBlessingBoost: false,
  };
}

function blessingStartText(blessing: BlessingType): string {
  switch (blessing) {
    case 'shielding_light':
      return 'Shielding Light: divine protection surrounds the party — the first peril will hurt less.';
    case 'healing_grace':
      return 'Healing Grace: divine warmth flows through the party, mending small wounds and steadying nerves.';
    case 'guiding_omen':
      return 'Guiding Omen: your first divine omen will cost nothing to send.';
  }
}

// ─────────────────────────────────────────────────────────────────
// Intervention
// ─────────────────────────────────────────────────────────────────

export function applyIntervention(
  state: RunState,
  type: InterventionType,
  targetOptionId?: string
): RunState {
  const costs: Record<InterventionType, number> = { omen: 1, blessing: 1, miracle: 2 };

  const isFirstOmenFree =
    type === 'omen' &&
    state.activeBlessing === 'guiding_omen' &&
    !state.interventionsUsed.some((i) => i.type === 'omen');

  const cost = isFirstOmenFree ? 0 : costs[type];
  if (state.divinePower < cost) return state;

  let next: RunState = {
    ...state,
    divinePower: state.divinePower - cost,
    interventionsUsed: [
      ...state.interventionsUsed,
      { type, nodeIndex: state.currentNodeIndex, optionId: targetOptionId },
    ],
  };

  switch (type) {
    case 'omen':
      next = {
        ...next,
        activeOmenOptionId: targetOptionId ?? null,
        expeditionLog: [
          ...next.expeditionLog,
          makeLog('intervention', 'Divine Omen: you send a sign nudging the party toward a specific path.'),
        ],
      };
      break;

    case 'blessing':
      next = {
        ...next,
        activeBlessingBoost: true,
        expeditionLog: [
          ...next.expeditionLog,
          makeLog('intervention', "Blessing bestowed: the party's resolve strengthens. Their unity improves for this moment."),
        ],
      };
      break;

    case 'miracle': {
      next = {
        ...next,
        party: next.party.map((a) => ({
          ...a,
          hp: Math.min(a.maxHp, a.hp + 20),
          stress: Math.max(0, a.stress - 20),
        })),
        expeditionLog: [
          ...next.expeditionLog,
          makeLog('intervention', 'Miracle invoked: light descends. Wounds knit and stress dissolves (+20 HP, −20 stress).'),
        ],
      };
      break;
    }
  }

  return next;
}

// ─────────────────────────────────────────────────────────────────
// Event resolution — does NOT advance currentNodeIndex
// Call advanceNode separately after showing the resolution to the player.
// ─────────────────────────────────────────────────────────────────

export function resolveCurrentEvent(state: RunState): RunState {
  const node = state.nodes[state.currentNodeIndex];
  if (!node?.eventId) return state;

  const event = getEventById(node.eventId);
  if (!event) return state;

  const intent = state.divinIntent!;
  const result = resolvePartyDecision(
    event,
    state.party,
    intent,
    state.activeOmenOptionId,
    state.activeBlessingBoost
  );

  const chosenOption = event.options.find((o) => o.id === result.winningOptionId)!;
  const outcome = chosenOption.outcome;

  // Shielding Light halves HP loss on the first dangerous event
  const shieldActive =
    state.activeBlessing === 'shielding_light' &&
    state.resolutions.length === 0 &&
    outcome.hpChange < 0;
  const hpChange = shieldActive ? Math.floor(outcome.hpChange * 0.5) : outcome.hpChange;

  const updatedParty = state.party.map((a) => {
    if (!a.alive) return a;
    const hp = Math.max(0, Math.min(a.maxHp, a.hp + hpChange));
    const stress = Math.max(0, Math.min(100, a.stress + outcome.stressChange));
    const loyalty = Math.max(0, Math.min(100, a.loyalty + outcome.loyaltyChange));
    const faith = Math.max(0, Math.min(100, a.faith + outcome.faithChange));
    return { ...a, hp, stress, loyalty, faith, alive: hp > 0 };
  });

  const narrativeLog = buildNarrativeLog(chosenOption.label, result, event);

  const resolution: EventResolution = {
    eventId: event.id,
    nodeId: node.id,
    nodeName: node.name,
    chosenOptionId: result.winningOptionId,
    chosenOptionLabel: chosenOption.label,
    characterDecisions: result.characterDecisions,
    aggregateScores: result.aggregateScores,
    narrativeLog,
    outcomeText: outcome.narrativeResult,
    followedDivineIntent: result.followedDivineIntent,
    divinePreferredOptionId: result.divinePreferredOptionId,
    divergenceNote: result.divergenceNote,
    hpChangePerMember: hpChange,
    stressChangePerMember: outcome.stressChange,
    interventionUsed: state.activeOmenOptionId
      ? 'omen'
      : state.activeBlessingBoost
      ? 'blessing'
      : undefined,
    relicSecured: outcome.relicProgress,
  };

  const logEntries: LogEntry[] = [
    makeLog('event', `📍 ${node.name}: Party chose "${chosenOption.label}"`),
    makeLog('decision', narrativeLog),
    makeLog('outcome', outcome.narrativeResult),
  ];

  if (result.divergenceNote) {
    logEntries.push(makeLog('info', `⚠ ${result.divergenceNote}`));
  }

  return {
    ...state,
    party: updatedParty,
    resolutions: [...state.resolutions, resolution],
    relicRecovered: state.relicRecovered || outcome.relicProgress,
    expeditionLog: [...state.expeditionLog, ...logEntries],
    activeOmenOptionId: null,
    activeBlessingBoost: false,
    // currentNodeIndex is NOT changed here — call advanceNode after showing the resolution
  };
}

// ─────────────────────────────────────────────────────────────────
// Advance to the next node (call this after showing event resolution)
// ─────────────────────────────────────────────────────────────────

export function advanceNode(state: RunState): RunState {
  const nextIndex = state.currentNodeIndex + 1;
  const isComplete = nextIndex >= state.nodes.length;
  const nextNode = state.nodes[nextIndex];

  const logText = nextNode
    ? `The party moves on to: ${nextNode.name}. ${nextNode.description}`
    : 'The party has cleared the graveyard.';

  return {
    ...state,
    currentNodeIndex: nextIndex,
    expeditionComplete: isComplete,
    expeditionLog: [...state.expeditionLog, makeLog('arrival', logText)],
  };
}

// ─────────────────────────────────────────────────────────────────
// Final evaluation
// ─────────────────────────────────────────────────────────────────

export type MissionResult = 'success' | 'partial' | 'failure';

export function evaluateMissionResult(state: RunState): MissionResult {
  const survivors = state.party.filter((a) => a.alive).length;
  if (state.relicRecovered && survivors >= 2) return 'success';
  if (state.relicRecovered || survivors >= 2) return 'partial';
  return 'failure';
}

export function countDivineAlignmentRate(state: RunState): number {
  if (state.resolutions.length === 0) return 1;
  const aligned = state.resolutions.filter((r) => r.followedDivineIntent).length;
  return aligned / state.resolutions.length;
}

// ─────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────

function buildNarrativeLog(
  chosenLabel: string,
  result: ReturnType<typeof resolvePartyDecision>,
  event: ReturnType<typeof getEventById>
): string {
  if (!event) return '';

  const dissenters = result.characterDecisions
    .filter((cd) => cd.preferredOptionId !== result.winningOptionId)
    .map((cd) => cd.characterName);

  let text = `Party chose: ${chosenLabel}.`;
  if (dissenters.length === 1) {
    text += ` ${dissenters[0]} preferred a different approach but was outvoted.`;
  } else if (dissenters.length > 1) {
    text += ` ${dissenters.join(' and ')} dissented but the majority held.`;
  } else {
    text += ` The party was in agreement.`;
  }

  return text;
}
