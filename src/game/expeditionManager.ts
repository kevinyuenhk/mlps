import type {
  Adventurer,
  BlessingType,
  DivinIntent,
  DungeonNode,
  EventResolution,
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

function getNode(nodes: DungeonNode[], nodeId: string): DungeonNode | undefined {
  return nodes.find((node) => node.id === nodeId);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function revealFromNode(nodes: DungeonNode[], currentNodeId: string, visible: string[]): string[] {
  const node = getNode(nodes, currentNodeId);
  if (!node) return visible;
  return unique([...visible, currentNodeId, ...node.nextNodeIds]);
}

function blessingStartText(blessing: BlessingType): string {
  switch (blessing) {
    case 'shielding_light':
      return '護盾之光就緒，等待首個受傷房間。';
    case 'healing_grace':
      return '治癒恩典在出發前為隊伍充能。';
    case 'guiding_omen':
      return '引導神諭使首次神諭免費。';
  }
}

export function createInitialRunState(
  selectedIds: string[],
  intent: DivinIntent,
  blessing: BlessingType
): RunState {
  let party: Adventurer[] = selectedIds
    .map((id) => ADVENTURER_POOL.find((adventurer) => adventurer.id === id))
    .filter(Boolean)
    .map((adventurer) => ({ ...adventurer! }));

  if (blessing === 'healing_grace') {
    party = party.map((member) => ({
      ...member,
      hp: Math.min(member.maxHp, member.hp + 15),
      stress: Math.max(0, member.stress - 10),
    }));
  }

  return {
    phase: 'expedition',
    selectedAdventurerIds: selectedIds,
    party,
    divinIntent: intent,
    oracleConfig: null,
    divinePower: 3,
    maxDivinePower: 3,
    currentNodeId: 'entrance',
    nodes: EXPEDITION_NODES,
    visibleNodeIds: ['entrance', 'vanguard'],
    resolvedNodeIds: [],
    pathTaken: ['entrance'],
    resolutions: [],
    relicRecovered: false,
    bossCleared: false,
    escaped: false,
    totalLoot: 0,
    expeditionLog: [
      makeLog('system', '隊伍在大門集合。'),
      makeLog('system', blessingStartText(blessing)),
    ],
    interventionsUsed: [],
    activeBlessing: blessing,
    expeditionComplete: false,
    activeOmenOptionId: null,
    activeBlessingBoost: false,
  };
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
    !state.interventionsUsed.some((entry) => entry.type === 'omen');

  const cost = isFirstOmenFree ? 0 : costs[type];
  if (state.divinePower < cost) return state;

  let next: RunState = {
    ...state,
    divinePower: state.divinePower - cost,
    interventionsUsed: [
      ...state.interventionsUsed,
      { type, nodeId: state.currentNodeId, optionId: targetOptionId },
    ],
  };

  if (type === 'omen') {
    next = {
      ...next,
      activeOmenOptionId: targetOptionId ?? null,
      expeditionLog: [...next.expeditionLog, makeLog('intervention', '神諭已施加於行動選項。')],
    };
  }

  if (type === 'blessing') {
    next = {
      ...next,
      activeBlessingBoost: true,
      expeditionLog: [...next.expeditionLog, makeLog('intervention', '祝福強化了隊伍決心。')],
    };
  }

  if (type === 'miracle') {
    next = {
      ...next,
      party: next.party.map((member) => ({
        ...member,
        hp: Math.min(member.maxHp, member.hp + 20),
        stress: Math.max(0, member.stress - 20),
      })),
      expeditionLog: [...next.expeditionLog, makeLog('intervention', '奇蹟治癒了全隊。')],
    };
  }

  return next;
}

function applyOutcomeToParty(
  state: RunState,
  hpChange: number,
  stressChange: number,
  loyaltyChange: number,
  faithChange: number
): Adventurer[] {
  return state.party.map((member) => {
    if (!member.alive) return member;

    const hp = Math.max(0, Math.min(member.maxHp, member.hp + hpChange));
    return {
      ...member,
      hp,
      stress: Math.max(0, Math.min(100, member.stress + stressChange)),
      loyalty: Math.max(0, Math.min(100, member.loyalty + loyaltyChange)),
      faith: Math.max(0, Math.min(100, member.faith + faithChange)),
      alive: hp > 0,
    };
  });
}

export function resolveCurrentEvent(state: RunState): RunState {
  const node = getNode(state.nodes, state.currentNodeId);
  if (!node?.eventId || !state.divinIntent) return state;

  const event = getEventById(node.eventId);
  if (!event) return state;

  const result = resolvePartyDecision(
    event,
    state.party,
    state.divinIntent,
    state.activeOmenOptionId,
    state.activeBlessingBoost
  );

  const chosenOption = event.options.find((option) => option.id === result.winningOptionId);
  if (!chosenOption) return state;

  const shieldActive =
    state.activeBlessing === 'shielding_light' &&
    state.resolutions.length === 0 &&
    chosenOption.outcome.hpChange < 0;

  const hpChange = shieldActive
    ? Math.floor(chosenOption.outcome.hpChange * 0.5)
    : chosenOption.outcome.hpChange;

  const updatedParty = applyOutcomeToParty(
    state,
    hpChange,
    chosenOption.outcome.stressChange,
    chosenOption.outcome.loyaltyChange,
    chosenOption.outcome.faithChange
  );

  const resolution: EventResolution = {
    eventId: event.id,
    nodeId: node.id,
    nodeName: node.name,
    nodeType: node.type,
    chosenOptionId: chosenOption.id,
    chosenOptionLabel: chosenOption.label,
    characterDecisions: result.characterDecisions,
    aggregateScores: result.aggregateScores,
    outcomeText: chosenOption.outcome.summary,
    followedDivineIntent: result.followedDivineIntent,
    divinePreferredOptionId: result.divinePreferredOptionId,
    divergenceNote: result.divergenceNote,
    hpChangePerMember: hpChange,
    stressChangePerMember: chosenOption.outcome.stressChange,
    interventionUsed: state.activeOmenOptionId
      ? 'omen'
      : state.activeBlessingBoost
      ? 'blessing'
      : undefined,
    relicSecured: chosenOption.outcome.relicProgress,
    lootDelta: chosenOption.outcome.loot,
  };

  const resolvedNodeIds = unique([...state.resolvedNodeIds, node.id]);
  const visibleNodeIds = revealFromNode(state.nodes, node.id, state.visibleNodeIds);
  const bossCleared = state.bossCleared || (node.type === 'boss' && chosenOption.outcome.relicProgress);
  const escaped = state.escaped || node.type === 'exit';

  return {
    ...state,
    party: updatedParty,
    visibleNodeIds,
    resolvedNodeIds,
    resolutions: [...state.resolutions, resolution],
    relicRecovered: state.relicRecovered || chosenOption.outcome.relicProgress,
    bossCleared,
    escaped,
    totalLoot: state.totalLoot + chosenOption.outcome.loot,
    expeditionComplete: escaped,
    expeditionLog: [
      ...state.expeditionLog,
      makeLog('decision', `${node.name}: ${chosenOption.label}`),
      makeLog('outcome', chosenOption.outcome.summary),
      ...(result.divergenceNote ? [makeLog('system', result.divergenceNote)] : []),
    ],
    activeOmenOptionId: null,
    activeBlessingBoost: false,
  };
}

export function moveToNode(state: RunState, nextNodeId: string): RunState {
  const currentNode = getNode(state.nodes, state.currentNodeId);
  if (!currentNode?.nextNodeIds.includes(nextNodeId)) return state;

  const nextNode = getNode(state.nodes, nextNodeId);
  if (!nextNode) return state;

  return {
    ...state,
    currentNodeId: nextNodeId,
    visibleNodeIds: revealFromNode(state.nodes, nextNodeId, state.visibleNodeIds),
    pathTaken: [...state.pathTaken, nextNodeId],
    expeditionLog: [...state.expeditionLog, makeLog('arrival', `進入${nextNode.name}。`)],
  };
}

export type MissionResult = 'success' | 'partial' | 'failure';

export function evaluateMissionResult(state: RunState): MissionResult {
  const survivors = state.party.filter((member) => member.alive).length;
  if (state.bossCleared && state.escaped && survivors >= 2) return 'success';
  if ((state.bossCleared && survivors >= 1) || (state.escaped && state.relicRecovered)) return 'partial';
  return 'failure';
}

export function countDivineAlignmentRate(state: RunState): number {
  if (state.resolutions.length === 0) return 1;
  const aligned = state.resolutions.filter((resolution) => resolution.followedDivineIntent).length;
  return aligned / state.resolutions.length;
}
