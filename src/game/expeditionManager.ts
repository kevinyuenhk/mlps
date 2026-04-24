import type {
  Adventurer,
  BattleAction,
  BattleOmenFocus,
  BattlePartyMember,
  BattleState,
  BattleSummary,
  BlessingType,
  DivinIntent,
  FogRevealPoint,
  InterventionType,
  LogEntry,
  MapData,
  PartyGuidance,
  PartyTokenState,
  RunState,
} from '../types';
import { ADVENTURER_POOL } from '../data/adventurers';
import { chooseBattleAction } from './decisionEngine';
import { aliveCount, clamp } from '../utils/helpers';
import { EXPEDITION_MAPS, INITIAL_REVEAL_POINTS, MAP_LINKS, MAP_SUMMARY_NODES, getMapById } from '../phaser/mapData';
import { mergeRevealPoint } from '../phaser/fogOfWar';
import { spawnTokenOnPath } from '../phaser/partyController';

let logIdCounter = 0;

function makeLog(type: LogEntry['type'], text: string): LogEntry {
  return { id: `log-${++logIdCounter}`, timestamp: Date.now(), type, text };
}

function emptyNudges() {
  return {
    speed: 0,
    caution: 0,
    mission: 0,
    omenNodeId: null,
  };
}

function toGuidance(state: RunState): PartyGuidance {
  return {
    speed: state.explorationNudges.speed,
    caution: state.explorationNudges.caution,
    mission: state.explorationNudges.mission,
    omenTargetMapId: state.explorationNudges.omenNodeId,
  };
}

export function getExplorationGuidance(state: RunState): PartyGuidance {
  return toGuidance(state);
}

function blessingStartText(blessing: BlessingType): string {
  switch (blessing) {
    case 'shielding_light':
      return '護盾之光籠罩隊伍，首次受創將被削弱。';
    case 'healing_grace':
      return '治癒恩典先穩住了隊伍的呼吸。';
    case 'guiding_omen':
      return '引導神諭令首次徵兆免費。';
  }
}

function mapTypeToBattleVariant(map: MapData, forcedVariant?: 'normal' | 'boss') {
  if (forcedVariant) return forcedVariant;
  return map.type === 'boss' ? 'boss' : 'normal';
}

function createBattleState(map: MapData, party: Adventurer[], variant?: 'normal' | 'boss'): BattleState {
  const resolvedVariant = mapTypeToBattleVariant(map, variant);
  return {
    roomId: map.id,
    roomName: map.name,
    variant: resolvedVariant,
    round: 1,
    party: toBattleParty(party),
    enemies: createEnemies(map.id, resolvedVariant),
    log: [`${map.name} 開戰。`],
    omenFocus: null,
    blessingShield: 0,
    miracleUsedThisBattle: false,
    lastRoundActions: [],
  };
}

function toBattleParty(party: Adventurer[]): BattlePartyMember[] {
  return party.map((member) => ({
    ...member,
    guard: 0,
    resolveBoost: 0,
    studiedTargetId: null,
    protectedById: null,
  }));
}

function createEnemies(mapId: string, variant: 'normal' | 'boss'): BattleState['enemies'] {
  if (variant === 'boss') {
    return [
      {
        id: 'guardian-boss',
        name: '墓室守護者',
        role: 'boss',
        hp: 130,
        maxHp: 130,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 10,
        studied: false,
      },
      {
        id: 'guardian-flame',
        name: '骨焰侍者',
        role: 'caster',
        hp: 44,
        maxHp: 44,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 0,
        studied: false,
      },
    ];
  }

  if (mapId === 'watch_crypt') {
    return [
      {
        id: 'watch-1',
        name: '墓哨',
        role: 'guardian',
        hp: 50,
        maxHp: 50,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 5,
        studied: false,
      },
      {
        id: 'watch-2',
        name: '墓哨',
        role: 'skirmisher',
        hp: 40,
        maxHp: 40,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 0,
        studied: false,
      },
      {
        id: 'watch-caster',
        name: '墓語者',
        role: 'caster',
        hp: 30,
        maxHp: 30,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 0,
        studied: false,
      },
    ];
  }

  if (mapId === 'bone_foyer') {
    return [
      {
        id: 'bone-1',
        name: '骸骨兵',
        role: 'skirmisher',
        hp: 36,
        maxHp: 36,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 0,
        studied: false,
      },
      {
        id: 'bone-2',
        name: '骸骨兵',
        role: 'skirmisher',
        hp: 36,
        maxHp: 36,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 0,
        studied: false,
      },
      {
        id: 'bone-caster',
        name: '墓語者',
        role: 'caster',
        hp: 28,
        maxHp: 28,
        stress: 0,
        maxStress: 100,
        alive: true,
        guard: 0,
        studied: false,
      },
    ];
  }

  return [
    {
      id: 'shade-1',
      name: '墓窟敵影',
      role: 'skirmisher',
      hp: 34,
      maxHp: 34,
      stress: 0,
      maxStress: 100,
      alive: true,
      guard: 0,
      studied: false,
    },
    {
      id: 'shade-2',
      name: '墓窟敵影',
      role: 'guardian',
      hp: 38,
      maxHp: 38,
      stress: 0,
      maxStress: 100,
      alive: true,
      guard: 2,
      studied: false,
    },
  ];
}

function applyOutcomeToParty(
  state: RunState,
  hpChange: number,
  stressChange: number,
  faithChange = 0
): Adventurer[] {
  return state.party.map((member) => {
    if (!member.alive) return member;
    const hp = clamp(member.hp + hpChange, 0, member.maxHp);
    return {
      ...member,
      hp,
      stress: clamp(member.stress + stressChange, 0, 100),
      faith: clamp(member.faith + faithChange, 0, 100),
      alive: hp > 0,
    };
  });
}

function syncPartyFromBattle(state: RunState, battle: BattleState): Adventurer[] {
  return state.party.map((member) => {
    const battleMember = battle.party.find((entry) => entry.id === member.id);
    if (!battleMember) return member;
    return {
      ...member,
      hp: battleMember.hp,
      stress: battleMember.stress,
      alive: battleMember.alive,
    };
  });
}

export function createBlankRunState(): RunState {
  const initialMap = EXPEDITION_MAPS[0];
  return {
    phase: 'title',
    selectedAdventurerIds: [],
    party: [],
    divinIntent: null,
    oracleConfig: null,
    divinePower: 3,
    maxDivinePower: 3,
    dungeonMap: null,
    nodes: MAP_SUMMARY_NODES,
    maps: EXPEDITION_MAPS,
    mapLinks: MAP_LINKS,
    currentMapId: initialMap.id,
    exploredMapIds: [],
    visitedMapIds: [],
    clearedMapIds: [],
    clearedInteractableIds: [],
    discoveredExitIds: initialMap.exits.filter((item) => item.visible).map((item) => item.id),
    encounterCooldowns: {},
    revealedAreas: { ...INITIAL_REVEAL_POINTS },
    pathTaken: [],
    token: spawnTokenOnPath(initialMap, initialMap.spawnPoint, 64),
    explorationPhase: 'paused',
    pendingBranch: null,
    explorationNudges: emptyNudges(),
    resolutions: [],
    battleState: null,
    lastBattleSummary: null,
    relicRecovered: false,
    bossCleared: false,
    escaped: false,
    totalLoot: 0,
    expeditionLog: [],
    interventionsUsed: [],
    activeBlessing: null,
    expeditionComplete: false,
  };
}

export function createInitialRunState(
  selectedIds: string[],
  intent: DivinIntent,
  blessing: BlessingType
): RunState {
  const initialMap = EXPEDITION_MAPS[0];
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
    phase: 'exploration',
    selectedAdventurerIds: selectedIds,
    party,
    divinIntent: intent,
    oracleConfig: null,
    divinePower: 3,
    maxDivinePower: 3,
    dungeonMap: null,
    nodes: MAP_SUMMARY_NODES,
    maps: EXPEDITION_MAPS,
    mapLinks: MAP_LINKS,
    currentMapId: initialMap.id,
    exploredMapIds: [initialMap.id],
    visitedMapIds: [initialMap.id],
    clearedMapIds: [],
    clearedInteractableIds: [],
    discoveredExitIds: initialMap.exits.filter((item) => item.visible).map((item) => item.id),
    encounterCooldowns: {},
    revealedAreas: { ...INITIAL_REVEAL_POINTS },
    pathTaken: [initialMap.id],
    token: spawnTokenOnPath(initialMap, initialMap.spawnPoint, 64),
    explorationPhase: 'walking',
    pendingBranch: null,
    explorationNudges: emptyNudges(),
    resolutions: [],
    battleState: null,
    lastBattleSummary: null,
    relicRecovered: false,
    bossCleared: false,
    escaped: false,
    totalLoot: 0,
    expeditionLog: [
      makeLog('system', '隊伍在大門集合。'),
      makeLog('system', blessingStartText(blessing)),
      makeLog('arrival', `隊伍踏入 ${initialMap.name}。`),
    ],
    interventionsUsed: [],
    activeBlessing: blessing,
    expeditionComplete: false,
  };
}

function storeRevealPoint(state: RunState, mapId: string, revealPoint: FogRevealPoint) {
  return {
    ...state.revealedAreas,
    [mapId]: mergeRevealPoint(state.revealedAreas[mapId] ?? [], revealPoint),
  };
}

export function syncExplorationPosition(
  state: RunState,
  payload: { token: PartyTokenState; revealPoint: FogRevealPoint }
): RunState {
  if (state.phase !== 'exploration') return state;
  return {
    ...state,
    token: payload.token,
    revealedAreas: storeRevealPoint(state, state.currentMapId, payload.revealPoint),
  };
}

export function triggerMapEncounter(
  state: RunState,
  payload: { mapId: string; zoneId: string; enemyType: string; variant: 'normal' | 'boss'; token: PartyTokenState }
): RunState {
  if (state.phase !== 'exploration') return state;
  const map = getMapById(payload.mapId);
  if (!map) return state;

  const cooldown = map.encounters.find((zone) => zone.id === payload.zoneId)?.cooldown ?? 10;
  const nextCooldowns = { ...state.encounterCooldowns, [payload.zoneId]: Date.now() + cooldown * 1000 };

  return {
    ...state,
    phase: 'battle',
    explorationPhase: 'paused',
    token: payload.token,
    battleState: createBattleState(map, state.party, payload.variant),
    encounterCooldowns: nextCooldowns,
    revealedAreas: storeRevealPoint(state, payload.mapId, { x: payload.token.x, y: payload.token.y, radius: 150 }),
    expeditionLog: [
      ...state.expeditionLog,
      makeLog('battle', `${map.name} 觸發遭遇戰，${payload.enemyType} 從陰影撲出。`),
    ],
  };
}

export function transitionToMap(
  state: RunState,
  payload: { mapId: string; exitId: string; token: PartyTokenState }
): RunState {
  if (state.phase !== 'exploration') return state;
  const sourceMap = getMapById(payload.mapId);
  if (!sourceMap) return state;

  const usedExit = sourceMap.exits.find((item) => item.id === payload.exitId);
  if (!usedExit) return state;

  if (usedExit.targetMapId === 'results') {
    return {
      ...state,
      escaped: true,
      expeditionComplete: true,
      phase: 'results',
      explorationPhase: 'paused',
      token: payload.token,
      expeditionLog: [...state.expeditionLog, makeLog('arrival', '隊伍穿過石門，撤離完成。')],
    };
  }

  const nextMap = getMapById(usedExit.targetMapId);
  if (!nextMap) return state;

  return {
    ...state,
    currentMapId: nextMap.id,
    exploredMapIds: Array.from(new Set([...state.exploredMapIds, nextMap.id])),
    visitedMapIds: Array.from(new Set([...state.visitedMapIds, nextMap.id])),
    discoveredExitIds: Array.from(new Set([...state.discoveredExitIds, payload.exitId, ...nextMap.exits.filter((item) => item.visible).map((item) => item.id)])),
    token: spawnTokenOnPath(nextMap, usedExit.targetSpawnPoint, state.token.speed),
    pathTaken: [...state.pathTaken, nextMap.id],
    explorationPhase: 'walking',
    expeditionLog: [
      ...state.expeditionLog,
      makeLog('arrival', `隊伍離開 ${sourceMap.name}，進入 ${nextMap.name}。`),
    ],
  };
}

export function resolveMapInteractable(
  state: RunState,
  payload: { mapId: string; interactableId: string; token: PartyTokenState }
): RunState {
  if (state.phase !== 'exploration') return state;
  const map = getMapById(payload.mapId);
  if (!map) return state;

  const interactable = map.interactables.find((entry) => entry.id === payload.interactableId);
  if (!interactable) return state;
  if (interactable.once && state.clearedInteractableIds.includes(interactable.id)) return state;

  let party = state.party;
  if (interactable.heal || interactable.stressRelief || interactable.faithDelta) {
    party = applyOutcomeToParty(state, interactable.heal ?? 0, -(interactable.stressRelief ?? 0), interactable.faithDelta ?? 0);
  }

  const gainedLoot = interactable.loot ?? 0;
  const clearedMapIds =
    interactable.kind === 'altar' ? Array.from(new Set([...state.clearedMapIds, map.id])) : state.clearedMapIds;

  return {
    ...state,
    party,
    token: payload.token,
    clearedInteractableIds: Array.from(new Set([...state.clearedInteractableIds, interactable.id])),
    clearedMapIds,
    totalLoot: state.totalLoot + gainedLoot,
    relicRecovered: state.relicRecovered || interactable.kind === 'altar',
    revealedAreas: storeRevealPoint(state, payload.mapId, { x: payload.token.x, y: payload.token.y, radius: 150 }),
    expeditionLog: [...state.expeditionLog, makeLog('outcome', `${interactable.name}：${interactable.description}`)],
  };
}

export function advanceExploration(state: RunState): RunState {
  if (state.phase !== 'exploration') return state;
  return { ...state, explorationPhase: 'walking' };
}

export function confirmBranchDecision(state: RunState): RunState {
  return state;
}

export function completeExplorationMovement(state: RunState): RunState {
  return state;
}

export function resolveExplorationArrival(state: RunState): RunState {
  return state;
}

export function applyExplorationNudge(
  state: RunState,
  type: 'speed' | 'caution' | 'mission' | 'omen',
  targetNodeId?: string
): RunState {
  if (state.phase !== 'exploration') return state;

  if (type === 'omen') {
    const isFirstOmenFree =
      state.activeBlessing === 'guiding_omen' &&
      !state.interventionsUsed.some((entry) => entry.type === 'omen');
    const cost = isFirstOmenFree ? 0 : 1;
    if (state.divinePower < cost || !targetNodeId) return state;

    return {
      ...state,
      divinePower: state.divinePower - cost,
      explorationNudges: { ...emptyNudges(), omenNodeId: targetNodeId },
      interventionsUsed: [
        ...state.interventionsUsed,
        { type: 'omen', nodeId: state.currentMapId, optionId: targetNodeId },
      ],
      expeditionLog: [...state.expeditionLog, makeLog('intervention', '神諭把隊伍的腳步推向特定方向。')],
    };
  }

  return {
    ...state,
    explorationNudges: {
      speed: type === 'speed' ? 1 : 0,
      caution: type === 'caution' ? 1 : 0,
      mission: type === 'mission' ? 1 : 0,
      omenNodeId: state.explorationNudges.omenNodeId,
    },
    expeditionLog: [
      ...state.expeditionLog,
      makeLog(
        'intervention',
        type === 'speed'
          ? '你催促隊伍加快腳步。'
          : type === 'caution'
          ? '你要求隊伍走得更穩。'
          : '你再次提醒隊伍，任務先於一切。'
      ),
    ],
  };
}

function enemyBaseDamage(role: BattleState['enemies'][number]['role']): number {
  switch (role) {
    case 'boss':
      return 18;
    case 'guardian':
      return 13;
    case 'caster':
      return 11;
    default:
      return 10;
  }
}

function applyBattleDamage(member: BattlePartyMember, amount: number, shield: number): BattlePartyMember {
  const reduced = Math.max(0, Math.round(amount - member.guard * 0.45 - shield));
  const hp = clamp(member.hp - reduced, 0, member.maxHp);
  return {
    ...member,
    hp,
    stress: clamp(member.stress + Math.max(3, Math.round(reduced * 0.8)), 0, 100),
    alive: hp > 0,
  };
}

function buildBattleSummary(battle: BattleState, result: 'victory' | 'defeat'): BattleSummary {
  return {
    roomId: battle.roomId,
    roomName: battle.roomName,
    variant: battle.variant,
    result,
    rounds: battle.round,
    log: battle.log,
  };
}

export function applyBattleIntervention(
  state: RunState,
  type: InterventionType,
  omenFocus?: BattleOmenFocus
): RunState {
  if (state.phase !== 'battle' || !state.battleState) return state;

  const isFirstOmenFree =
    type === 'omen' &&
    state.activeBlessing === 'guiding_omen' &&
    !state.interventionsUsed.some((entry) => entry.type === 'omen');
  const cost = type === 'miracle' ? 2 : type === 'omen' && isFirstOmenFree ? 0 : 1;
  if (state.divinePower < cost) return state;

  let battleState = state.battleState;

  if (type === 'omen') {
    battleState = {
      ...battleState,
      omenFocus: omenFocus ?? 'attack',
      log: [...battleState.log, `徵兆降下，隊伍傾向${omenFocus === 'guard' ? '守勢' : omenFocus === 'study' ? '觀敵' : '逼攻'}。`],
    };
  }

  if (type === 'blessing') {
    battleState = {
      ...battleState,
      blessingShield: battleState.blessingShield + 6,
      party: battleState.party.map((member) => ({
        ...member,
        resolveBoost: member.resolveBoost + 8,
        stress: clamp(member.stress - 8, 0, 100),
      })),
      log: [...battleState.log, '祝福覆在隊伍身上。'],
    };
  }

  if (type === 'miracle') {
    battleState = {
      ...battleState,
      miracleUsedThisBattle: true,
      party: battleState.party.map((member) => ({
        ...member,
        hp: clamp(member.hp + 18, 0, member.maxHp),
        stress: clamp(member.stress - 14, 0, 100),
      })),
      log: [...battleState.log, '奇蹟之光急救了全隊。'],
    };
  }

  return {
    ...state,
    divinePower: state.divinePower - cost,
    battleState,
    interventionsUsed: [...state.interventionsUsed, { type, nodeId: state.currentMapId }],
    expeditionLog: [
      ...state.expeditionLog,
      makeLog('intervention', type === 'miracle' ? '神蹟扭轉戰局。' : type === 'blessing' ? '祝福降臨戰場。' : '徵兆改變了隊伍傾向。'),
    ],
  };
}

function findBattleTargetById<T extends { id: string }>(list: T[], id?: string): T | undefined {
  if (!id) return undefined;
  return list.find((entry) => entry.id === id);
}

function resolvePartyAction(battle: BattleState, action: BattleAction): BattleState {
  const actor = battle.party.find((member) => member.id === action.actorId);
  if (!actor || !actor.alive) return battle;

  let party = battle.party;
  let enemies = battle.enemies;
  let line = '';

  if (action.actionType === 'attack' || action.actionType === 'press_forward') {
    const target = findBattleTargetById(enemies, action.targetId) ?? enemies.find((enemy) => enemy.alive);
    if (!target) return battle;
    const extra = action.actionType === 'press_forward' ? 8 : 0;
    const studiedBonus = target.studied ? 5 : 0;
    const rawDamage =
      (actor.class === 'Mage' ? 13 : actor.class === 'Rogue' ? 12 : actor.class === 'Ranger' ? 11 : 10) +
      extra +
      studiedBonus +
      Math.round(actor.resolveBoost * 0.25);
    const damage = Math.max(1, rawDamage - target.guard);
    enemies = enemies.map((enemy) =>
      enemy.id !== target.id
        ? enemy
        : { ...enemy, hp: clamp(enemy.hp - damage, 0, enemy.maxHp), alive: enemy.hp - damage > 0, studied: enemy.studied }
    );
    party = party.map((member) =>
      member.id !== actor.id ? member : { ...member, stress: clamp(member.stress + (action.actionType === 'press_forward' ? 5 : 2), 0, 100) }
    );
    line = `${actor.name}${action.actionType === 'press_forward' ? '追擊' : '攻擊'}${target.name}，造成 ${damage} 傷害`;
  }

  if (action.actionType === 'heal') {
    const target = findBattleTargetById(party, action.targetId) ?? party.find((member) => member.alive);
    if (!target) return battle;
    const amount = actor.class === 'Healer' ? 18 : 10;
    party = party.map((member) =>
      member.id !== target.id
        ? member
        : { ...member, hp: clamp(member.hp + amount, 0, member.maxHp), stress: clamp(member.stress - 8, 0, 100) }
    );
    line = `${actor.name}治療${target.name}，回復 ${amount}`;
  }

  if (action.actionType === 'protect_ally') {
    const target = findBattleTargetById(party, action.targetId) ?? party.find((member) => member.alive);
    if (!target) return battle;
    party = party.map((member) => {
      if (member.id === actor.id) return { ...member, guard: member.guard + 12 };
      if (member.id === target.id) return { ...member, protectedById: actor.id };
      return member;
    });
    line = `${actor.name}護在${target.name}前方`;
  }

  if (action.actionType === 'defend') {
    party = party.map((member) =>
      member.id !== actor.id ? member : { ...member, guard: member.guard + 14, stress: clamp(member.stress - 4, 0, 100) }
    );
    line = `${actor.name}收緊防勢`;
  }

  if (action.actionType === 'study_enemy') {
    const target = findBattleTargetById(enemies, action.targetId) ?? enemies.find((enemy) => enemy.alive);
    if (!target) return battle;
    enemies = enemies.map((enemy) => (enemy.id === target.id ? { ...enemy, studied: true } : enemy));
    party = party.map((member) =>
      member.id !== actor.id ? member : { ...member, studiedTargetId: target.id, stress: clamp(member.stress + 1, 0, 100) }
    );
    line = `${actor.name}看穿了${target.name}的節奏`;
  }

  return {
    ...battle,
    party,
    enemies,
    log: [...battle.log, line],
  };
}

function chooseEnemyTarget(battle: BattleState): BattlePartyMember | undefined {
  const living = battle.party.filter((member) => member.alive);
  return living.sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
}

function resolveEnemyTurn(battle: BattleState): BattleState {
  let next = battle;
  for (const enemy of next.enemies.filter((entry) => entry.alive)) {
    const desiredTarget = chooseEnemyTarget(next);
    if (!desiredTarget) break;

    const protector = next.party.find((member) => member.id === desiredTarget.protectedById && member.alive);
    const actualTarget = protector ?? desiredTarget;
    const damage = enemyBaseDamage(enemy.role) + (enemy.studied ? -2 : 0);

    next = {
      ...next,
      party: next.party.map((member) => (member.id === actualTarget.id ? applyBattleDamage(member, damage, next.blessingShield) : member)),
      log: [...next.log, `${enemy.name}攻擊${actualTarget.name}`],
    };
  }
  return next;
}

function decayBattleState(battle: BattleState): BattleState {
  return {
    ...battle,
    omenFocus: null,
    blessingShield: Math.max(0, battle.blessingShield - 2),
    party: battle.party.map((member) => ({
      ...member,
      guard: Math.max(0, member.guard - 6),
      resolveBoost: Math.max(0, member.resolveBoost - 4),
      protectedById: null,
      alive: member.hp > 0,
    })),
  };
}

export function runBattleRound(state: RunState): RunState {
  if (state.phase !== 'battle' || !state.battleState || !state.divinIntent) return state;

  let battle = { ...state.battleState, lastRoundActions: [] as BattleAction[] };
  const actions = battle.party.filter((member) => member.alive).map((member) => chooseBattleAction(member, battle, state.divinIntent!));

  for (const action of actions) {
    battle = resolvePartyAction(battle, action);
  }

  battle = { ...battle, lastRoundActions: actions };

  if (battle.enemies.every((enemy) => !enemy.alive)) {
    const summary = buildBattleSummary(battle, 'victory');
    const rewardLoot = battle.variant === 'boss' ? 2 : 1;
    const syncedParty = syncPartyFromBattle(state, battle);

    return {
      ...state,
      phase: 'post_battle',
      party: syncedParty,
      battleState: battle,
      lastBattleSummary: summary,
      clearedMapIds: Array.from(new Set([...state.clearedMapIds, battle.roomId])),
      bossCleared: state.bossCleared || battle.variant === 'boss',
      relicRecovered: state.relicRecovered || battle.variant === 'boss',
      totalLoot: state.totalLoot + rewardLoot,
      expeditionLog: [
        ...state.expeditionLog,
        makeLog('battle', `${battle.roomName} 戰勝。`),
        ...(battle.variant === 'boss' ? [makeLog('system', '守護者倒下，墓室深處的神器重新落入隊伍手中。')] : []),
      ],
      explorationNudges: emptyNudges(),
    };
  }

  battle = resolveEnemyTurn(battle);

  if (aliveCount(syncPartyFromBattle(state, battle)) === 0) {
    const summary = buildBattleSummary(battle, 'defeat');
    return {
      ...state,
      phase: 'results',
      party: syncPartyFromBattle(state, battle),
      battleState: battle,
      lastBattleSummary: summary,
      expeditionComplete: true,
      expeditionLog: [...state.expeditionLog, makeLog('battle', `${battle.roomName} 失守。`)],
    };
  }

  battle = decayBattleState(battle);

  return {
    ...state,
    battleState: { ...battle, round: battle.round + 1 },
  };
}

export function continueAfterBattle(state: RunState): RunState {
  if (state.phase !== 'post_battle') return state;

  if (state.lastBattleSummary?.result === 'defeat') {
    return { ...state, phase: 'results', expeditionComplete: true };
  }

  return {
    ...state,
    phase: state.escaped ? 'results' : 'exploration',
    battleState: null,
    explorationPhase: state.escaped ? 'paused' : 'walking',
    expeditionComplete: state.escaped,
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
