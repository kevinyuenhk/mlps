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
    makeLog('info', '遠征開始。您的隊伍向荒廢墓地進發。'),
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
      return '護盾之光：神聖庇護環繞全隊——第一次危難帶來的傷害將有所減輕。';
    case 'healing_grace':
      return '治癒恩典：神聖暖意流遍全隊，治癒了輕傷，也穩定了心神。';
    case 'guiding_omen':
      return '引導神諭：您的第一次神聖神諭將免費使用。';
  }
}

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
          makeLog('intervention', '神聖神諭：您發出徵兆，引導隊伍走向特定道路。'),
        ],
      };
      break;

    case 'blessing':
      next = {
        ...next,
        activeBlessingBoost: true,
        expeditionLog: [
          ...next.expeditionLog,
          makeLog('intervention', '祝福降臨：隊伍的意志更加堅定。此刻他們的凝聚力有所提升。'),
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
          makeLog('intervention', '奇蹟施展：光輝降臨。傷口癒合，壓力消散（+20 體力，−20 壓力）。'),
        ],
      };
      break;
    }
  }

  return next;
}

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
    makeLog('event', `📍 ${node.name}：隊伍選擇了「${chosenOption.label}」`),
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
  };
}

export function advanceNode(state: RunState): RunState {
  const nextIndex = state.currentNodeIndex + 1;
  const isComplete = nextIndex >= state.nodes.length;
  const nextNode = state.nodes[nextIndex];

  const logText = nextNode
    ? `隊伍向前推進至：${nextNode.name}。${nextNode.description}`
    : '隊伍已清掃了整個墓地。';

  return {
    ...state,
    currentNodeIndex: nextIndex,
    expeditionComplete: isComplete,
    expeditionLog: [...state.expeditionLog, makeLog('arrival', logText)],
  };
}

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

function buildNarrativeLog(
  chosenLabel: string,
  result: ReturnType<typeof resolvePartyDecision>,
  event: ReturnType<typeof getEventById>
): string {
  if (!event) return '';

  const dissenters = result.characterDecisions
    .filter((cd) => cd.preferredOptionId !== result.winningOptionId)
    .map((cd) => cd.characterName);

  let text = `隊伍選擇：${chosenLabel}。`;
  if (dissenters.length === 1) {
    text += ` ${dissenters[0]}傾向另一方案，但被多數決推翻。`;
  } else if (dissenters.length > 1) {
    text += ` ${dissenters.join('與')}持不同意見，但多數仍占上風。`;
  } else {
    text += ` 隊伍一致同意。`;
  }

  return text;
}
