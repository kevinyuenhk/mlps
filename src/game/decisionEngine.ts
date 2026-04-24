import type {
  Adventurer,
  AdventurerClass,
  BattleAction,
  BattleActionType,
  BattleState,
  BranchState,
  CharacterDecision,
  DecisionBreakdown,
  DivinIntent,
  DungeonNode,
  EventOption,
  ExplorationNudges,
  GameEvent,
  ParsedSignals,
  RoutePreference,
  TraitName,
} from '../types';
import { classDisplayName, traitDisplayName } from '../utils/helpers';

const RANDOMNESS_RANGE = 0.05;

const CLASS_BIASES: Record<AdventurerClass, Record<string, number>> = {
  Knight: {
    fight_through: 0.25,
    press_attack: 0.25,
    defensive_formation: 0.2,
    force_through: 0.15,
    cleanse_altar: 0.15,
    rush_supply_cache: 0.15,
    withdraw: -0.2,
    retreat_partial: -0.25,
  },
  Healer: {
    help_keeper: 0.3,
    carry_wounded: 0.35,
    offer_prayer: 0.25,
    fight_through: -0.2,
    press_attack: -0.25,
    rush_supply_cache: -0.2,
  },
  Rogue: {
    investigate_treasure: 0.25,
    quick_scout: 0.2,
    interrogate_keeper: 0.2,
    silent_pickoff: 0.25,
    rush_supply_cache: 0.1,
    fight_through: -0.1,
  },
  Mage: {
    interrogate_keeper: 0.25,
    quick_scout: 0.15,
    conserve_and_flank: 0.2,
    defensive_formation: 0.15,
    cleanse_altar: 0.2,
    offer_prayer: 0.1,
    fight_through: -0.15,
  },
  Ranger: {
    safe_detour: 0.2,
    cross_carefully: 0.15,
    withdraw: 0.1,
    bypass_watch: 0.25,
    silent_pickoff: 0.15,
    defensive_formation: 0.1,
    press_attack: -0.05,
  },
};

const ROUTE_TAG_SIGNAL_WEIGHT: Record<string, Partial<ParsedSignals>> = {
  mission: { missionFocus: 0.9, urgency: 0.15 },
  safe: { survivalPriority: 0.85, stealthPreference: 0.2 },
  danger: { aggression: 0.8, survivalPriority: -0.25 },
  loot: { greedAllowance: 0.85 },
  mercy: { mercyPriority: 0.8, survivalPriority: 0.15 },
  speed: { urgency: 0.85, missionFocus: 0.2 },
  knowledge: { stealthPreference: 0.45, missionFocus: 0.35 },
  boss: { missionFocus: 1, aggression: 0.55 },
};

function computeTraitScore(
  traits: TraitName[],
  option: EventOption
): { score: number; tags: string[] } {
  let score = 0;
  const tags: string[] = [];

  for (const trait of traits) {
    const bonus = option.traitBonuses[trait] ?? 0;
    if (bonus === 0) continue;
    score += bonus;
    const name = traitDisplayName(trait);
    if (bonus >= 0.3) tags.push(`${name} 強烈傾向此選項。`);
    else if (bonus >= 0.15) tags.push(`${name} 傾向此選項。`);
    else if (bonus <= -0.3) tags.push(`${name} 強烈抗拒。`);
    else if (bonus <= -0.15) tags.push(`${name} 不喜歡此選項。`);
  }

  return { score, tags };
}

function computeDivineAlignment(
  character: Adventurer,
  option: EventOption,
  signals: ParsedSignals
): { score: number; tags: string[] } {
  const tags: string[] = [];
  let rawAlignment = 0;

  for (const [key, weight] of Object.entries(option.signalAlignment)) {
    const intentValue = signals[key as keyof ParsedSignals] ?? 0;
    rawAlignment += intentValue * (weight as number);
  }

  const faithMultiplier = character.faith / 100;
  const devoutMultiplier = character.traits.includes('Devout') ? 1.3 : 1;
  const skepticalMultiplier = character.traits.includes('Skeptical') ? 0.5 : 1;
  const finalScore = rawAlignment * faithMultiplier * devoutMultiplier * skepticalMultiplier * 0.7;

  if (rawAlignment > 0.3 && finalScore > 0.1) tags.push('神諭契合。');
  if (character.traits.includes('Devout') && rawAlignment > 0.2) tags.push('信仰放大神諭。');
  if (character.traits.includes('Skeptical')) tags.push('多疑削弱信號。');

  return { score: finalScore, tags };
}

function computeStateModifiers(
  character: Adventurer,
  option: EventOption
): { score: number; tags: string[] } {
  const tags: string[] = [];
  let score = 0;

  const hpRatio = character.hp / character.maxHp;
  const stressRatio = character.stress / 100;

  if (option.riskLevel === 'high' && hpRatio < 0.4) {
    score -= 0.35;
    tags.push('體力過低拒絕高風險。');
  } else if (option.riskLevel === 'high' && hpRatio < 0.6) {
    score -= 0.15;
    tags.push('受傷令其更不願冒險。');
  }

  if (character.traits.includes('Fragile') && option.riskLevel === 'high') {
    score -= 0.2;
    tags.push('脆弱體質迴避重傷。');
  }

  if (stressRatio > 0.7) {
    if (option.riskLevel === 'high') {
      score -= 0.2;
      tags.push('壓力懲罰冒險。');
    }
    if (option.riskLevel === 'low') {
      score += 0.15;
      tags.push('壓力驅使其尋求安全。');
    }
  }

  if (character.traits.includes('Calm') && stressRatio > 0.5) {
    score += 0.1;
    tags.push('冷靜穩住陣腳。');
  }

  return { score, tags };
}

function computeClassBias(
  character: Adventurer,
  option: EventOption
): { score: number; tags: string[] } {
  const bias = CLASS_BIASES[character.class]?.[option.id] ?? 0;
  const tags: string[] = [];

  if (Math.abs(bias) >= 0.15) {
    tags.push(`${classDisplayName(character.class)} 訓練使然。`);
  }

  return { score: bias, tags };
}

interface ScoreOptions {
  randomnessRange?: number;
}

interface OptionScore {
  score: number;
  tags: string[];
  breakdown: DecisionBreakdown;
}

function scoreOption(
  character: Adventurer,
  option: EventOption,
  intent: DivinIntent,
  interventionBoost: number,
  options?: ScoreOptions
): OptionScore {
  const trait = computeTraitScore(character.traits, option);
  const divine = computeDivineAlignment(character, option, intent.parsedSignals);
  const state = computeStateModifiers(character, option);
  const classBias = computeClassBias(character, option);
  const randomness = (Math.random() - 0.5) * (options?.randomnessRange ?? RANDOMNESS_RANGE) * 2;

  const tags = [
    ...trait.tags,
    ...divine.tags,
    ...state.tags,
    ...classBias.tags,
    ...(interventionBoost > 0.1 ? ['神聖推動偏向此選項。'] : []),
  ];

  const score =
    option.baseWeight +
    trait.score +
    divine.score +
    state.score +
    classBias.score +
    interventionBoost +
    randomness;

  return {
    score,
    tags,
    breakdown: {
      baseWeight: option.baseWeight,
      traitModifiers: trait.score,
      divineAlignment: divine.score,
      stateModifiers: state.score,
      classBias: classBias.score,
      interventionModifier: interventionBoost,
      randomness,
    },
  };
}

export interface PartyDecisionResult {
  characterDecisions: CharacterDecision[];
  aggregateScores: Record<string, number>;
  winningOptionId: string;
  divinePreferredOptionId: string;
  followedDivineIntent: boolean;
  divergenceNote?: string;
}

function resolveWithOptions(
  event: GameEvent,
  party: Adventurer[],
  intent: DivinIntent,
  activeOmenOptionId: string | null,
  activeBlessingBoost: boolean,
  options?: ScoreOptions
): PartyDecisionResult {
  const living = party.filter((character) => character.alive);
  const characterDecisions: CharacterDecision[] = [];

  for (const character of living) {
    const scores: Record<string, number> = {};
    const tags: Record<string, string[]> = {};
    const breakdown: Record<string, DecisionBreakdown> = {};

    for (const option of event.options) {
      const interventionBoost = activeOmenOptionId === option.id ? 0.5 : 0;
      const result = scoreOption(character, option, intent, interventionBoost, options);
      scores[option.id] = result.score;
      tags[option.id] = result.tags;
      breakdown[option.id] = result.breakdown;
    }

    const preferredOptionId = Object.entries(scores).reduce(
      (best, [id, score]) => (score > scores[best] ? id : best),
      event.options[0].id
    );

    characterDecisions.push({
      characterId: character.id,
      characterName: character.name,
      preferredOptionId,
      scores,
      tags,
      breakdown,
    });
  }

  const aggregateScores: Record<string, number> = Object.fromEntries(
    event.options.map((option) => [option.id, 0])
  );

  for (const decision of characterDecisions) {
    const character = living.find((member) => member.id === decision.characterId);
    if (!character) continue;

    const effectiveLoyalty = Math.min(100, character.loyalty + (activeBlessingBoost ? 20 : 0));
    const loyaltyWeight = effectiveLoyalty / 100;

    for (const option of event.options) {
      aggregateScores[option.id] += (decision.scores[option.id] ?? 0) * loyaltyWeight;
    }
  }

  for (const optionId of Object.keys(aggregateScores)) {
    aggregateScores[optionId] /= Math.max(1, living.length);
  }

  const winningOptionId = Object.entries(aggregateScores).reduce(
    (best, [id, score]) => (score > aggregateScores[best] ? id : best),
    event.options[0].id
  );

  const divineScores: Record<string, number> = {};
  for (const option of event.options) {
    let divineScore = 0;
    for (const [key, weight] of Object.entries(option.signalAlignment)) {
      const signalValue = intent.parsedSignals[key as keyof ParsedSignals] ?? 0;
      divineScore += signalValue * (weight as number);
    }
    divineScores[option.id] = divineScore;
  }

  const divinePreferredOptionId = Object.entries(divineScores).reduce(
    (best, [id, score]) => (score > divineScores[best] ? id : best),
    event.options[0].id
  );

  const followedDivineIntent = winningOptionId === divinePreferredOptionId;
  const winner = event.options.find((option) => option.id === winningOptionId);
  const divine = event.options.find((option) => option.id === divinePreferredOptionId);

  return {
    characterDecisions,
    aggregateScores,
    winningOptionId,
    divinePreferredOptionId,
    followedDivineIntent,
    divergenceNote: followedDivineIntent
      ? undefined
      : `隊伍選了${winner?.label}而非${divine?.label}。`,
  };
}

export function resolvePartyDecision(
  event: GameEvent,
  party: Adventurer[],
  intent: DivinIntent,
  activeOmenOptionId: string | null,
  activeBlessingBoost: boolean
): PartyDecisionResult {
  return resolveWithOptions(event, party, intent, activeOmenOptionId, activeBlessingBoost);
}

export function previewPartyDecision(
  event: GameEvent,
  party: Adventurer[],
  intent: DivinIntent,
  activeOmenOptionId: string | null,
  activeBlessingBoost: boolean
): PartyDecisionResult {
  return resolveWithOptions(event, party, intent, activeOmenOptionId, activeBlessingBoost, {
    randomnessRange: 0,
  });
}

function routeSignalScore(node: DungeonNode, signals: ParsedSignals): number {
  return node.routeTags.reduce((total, tag) => {
    const weights = ROUTE_TAG_SIGNAL_WEIGHT[tag] ?? {};
    return (
      total +
      Object.entries(weights).reduce((sum, [key, weight]) => {
        return sum + signals[key as keyof ParsedSignals] * (weight ?? 0);
      }, 0)
    );
  }, 0);
}

function routeTraitModifier(character: Adventurer, node: DungeonNode): { score: number; tags: string[] } {
  let score = 0;
  const tags: string[] = [];

  const isSafe = node.routeTags.includes('safe');
  const isDanger = node.routeTags.includes('danger') || node.type === 'combat' || node.type === 'boss';
  const hasLoot = node.routeTags.includes('loot');
  const hasMercy = node.routeTags.includes('mercy');
  const hasKnowledge = node.routeTags.includes('knowledge');
  const isFast = node.routeTags.includes('speed');

  if (character.traits.includes('Brave') && isDanger) {
    score += 0.26;
    tags.push('勇敢偏向危險。');
  }
  if (character.traits.includes('Fearful') && isDanger) {
    score -= 0.36;
    tags.push('膽怯抗拒前方威脅。');
  }
  if (character.traits.includes('Wary') && isSafe) {
    score += 0.28;
    tags.push('警慎支持穩路。');
  }
  if (character.traits.includes('Greedy') && hasLoot) {
    score += 0.34;
    tags.push('貪婪看上財物。');
  }
  if (character.traits.includes('Compassionate') && hasMercy) {
    score += 0.32;
    tags.push('慈悲在意傷者。');
  }
  if (character.traits.includes('Curious') && hasKnowledge) {
    score += 0.26;
    tags.push('好奇追逐情報。');
  }
  if (character.traits.includes('Dutiful') && node.routeTags.includes('mission')) {
    score += 0.24;
    tags.push('盡責追任務線。');
  }
  if (character.traits.includes('Stubborn') && isFast) {
    score += 0.16;
    tags.push('固執想硬推。');
  }
  if (character.traits.includes('Rational') && isSafe) {
    score += 0.18;
    tags.push('理性偏好穩健。');
  }

  return { score, tags };
}

function routeStateModifier(character: Adventurer, node: DungeonNode): { score: number; tags: string[] } {
  let score = 0;
  const tags: string[] = [];
  const hpRatio = character.hp / character.maxHp;

  if (hpRatio < 0.45 && (node.type === 'combat' || node.type === 'boss' || node.routeTags.includes('danger'))) {
    score -= 0.3;
    tags.push('負傷使其退縮。');
  }
  if (character.stress > 60 && node.routeTags.includes('safe')) {
    score += 0.22;
    tags.push('壓力驅使其求穩。');
  }
  if (character.stress > 70 && node.routeTags.includes('danger')) {
    score -= 0.18;
    tags.push('壓力懲罰冒進。');
  }
  if (character.traits.includes('Fragile') && node.routeTags.includes('danger')) {
    score -= 0.18;
    tags.push('脆弱體質避戰。');
  }
  if (character.class === 'Healer' && node.routeTags.includes('mercy')) {
    score += 0.18;
    tags.push('治癒者傾向救援。');
  }

  return { score, tags };
}

function routeClassBias(character: Adventurer, node: DungeonNode): { score: number; tags: string[] } {
  let score = 0;
  const tags: string[] = [];

  if (character.class === 'Knight' && (node.type === 'combat' || node.type === 'boss')) score += 0.18;
  if (character.class === 'Healer' && node.type === 'shrine') score += 0.24;
  if (character.class === 'Rogue' && node.routeTags.includes('loot')) score += 0.22;
  if (character.class === 'Mage' && node.routeTags.includes('knowledge')) score += 0.18;
  if (character.class === 'Ranger' && node.routeTags.includes('safe')) score += 0.18;
  if (Math.abs(score) > 0.15) tags.push(`${classDisplayName(character.class)} 本能。`);

  return { score, tags };
}

function routeInterventionModifier(node: DungeonNode, nudges: ExplorationNudges): number {
  let score = 0;
  if (nudges.omenNodeId === node.id) score += 0.36;
  if (node.routeTags.includes('speed')) score += nudges.speed * 0.24;
  if (node.routeTags.includes('safe')) score += nudges.caution * 0.24;
  if (node.routeTags.includes('mission') || node.type === 'boss' || node.type === 'exit') {
    score += nudges.mission * 0.24;
  }
  return score;
}

function branchDirectionLabel(node: DungeonNode, options: DungeonNode[]): string {
  const averageX = options.reduce((sum, option) => sum + option.x, 0) / Math.max(1, options.length);
  const averageY = options.reduce((sum, option) => sum + option.y, 0) / Math.max(1, options.length);

  if (node.x < averageX - 120) return '左路';
  if (node.x > averageX + 120) return '右路';
  if (node.y < averageY - 120) return '上路';
  if (node.y > averageY + 120) return '下路';
  return '正前';
}

export function previewBranchDecision(
  options: DungeonNode[],
  party: Adventurer[],
  intent: DivinIntent,
  nudges: ExplorationNudges
): BranchState {
  const living = party.filter((member) => member.alive);
  const preferences: RoutePreference[] = [];
  const aggregate = Object.fromEntries(options.map((node) => [node.id, 0]));
  const votes = Object.fromEntries(options.map((node) => [node.id, 0]));

  for (const character of living) {
    const scoreByNodeId: Record<string, number> = {};
    const tagsByNodeId: Record<string, string[]> = {};

    for (const node of options) {
      const trait = routeTraitModifier(character, node);
      const state = routeStateModifier(character, node);
      const classBias = routeClassBias(character, node);
      const divine = routeSignalScore(node, intent.parsedSignals) * (character.faith / 100) * 0.42;
      const intervention = routeInterventionModifier(node, nudges);
      const randomness = 0;

      scoreByNodeId[node.id] =
        divine + trait.score + state.score + classBias.score + intervention + randomness;
      tagsByNodeId[node.id] = [...trait.tags, ...state.tags, ...classBias.tags];
    }

    const chosenNodeId = Object.entries(scoreByNodeId).reduce(
      (best, [id, score]) => (score > scoreByNodeId[best] ? id : best),
      options[0].id
    );
    const chosenNode = options.find((node) => node.id === chosenNodeId) ?? options[0];
    const loyaltyWeight = character.loyalty / 100;

    for (const node of options) {
      aggregate[node.id] += scoreByNodeId[node.id] * loyaltyWeight;
    }

    votes[chosenNodeId] += 1;
    preferences.push({
      characterId: character.id,
      characterName: character.name,
      chosenNodeId,
      chosenNodeName: chosenNode.name,
      directionLabel: branchDirectionLabel(chosenNode, options),
      reasonTags: tagsByNodeId[chosenNodeId].slice(0, 2),
      scoreByNodeId,
    });
  }

  const majorityNodeId = Object.entries(aggregate).reduce(
    (best, [id, score]) => (score > aggregate[best] ? id : best),
    options[0].id
  );

  return {
    nodeId: 'branch',
    preferences,
    majorityNodeId,
    options: options.map((node) => ({
      nodeId: node.id,
      nodeName: node.name,
      directionLabel: branchDirectionLabel(node, options),
      votes: votes[node.id],
      aggregateScore: aggregate[node.id] / Math.max(1, living.length),
      tags: node.routeTags,
    })),
  };
}

function targetWeakestEnemy(battle: BattleState) {
  return battle.enemies
    .filter((enemy) => enemy.alive)
    .sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
}

function targetLowestAlly(battle: BattleState) {
  return battle.party
    .filter((member) => member.alive)
    .sort((left, right) => left.hp / left.maxHp - right.hp / right.maxHp)[0];
}

function scoreBattleAction(
  actor: BattleState['party'][number],
  actionType: BattleActionType,
  battle: BattleState,
  intent: DivinIntent
): BattleAction {
  const weakestEnemy = targetWeakestEnemy(battle);
  const weakestAlly = targetLowestAlly(battle);
  const signals = intent.parsedSignals;
  const hpRatio = actor.hp / actor.maxHp;
  const lowAlly = weakestAlly ? weakestAlly.hp / weakestAlly.maxHp < 0.5 : false;

  let score = 0.2;
  let targetId: string | undefined;
  let summary = '';

  if (actionType === 'attack') {
    score += 0.45 + signals.aggression * 0.35 + signals.missionFocus * 0.2;
    if (actor.class === 'Knight' || actor.class === 'Rogue' || actor.class === 'Ranger') score += 0.14;
    if (weakestEnemy) targetId = weakestEnemy.id;
    summary = '準備進攻。';
  }

  if (actionType === 'protect_ally') {
    score += 0.25 + signals.survivalPriority * 0.35;
    if (lowAlly) score += 0.35;
    if (actor.class === 'Knight' || actor.class === 'Ranger') score += 0.18;
    if (weakestAlly) targetId = weakestAlly.id;
    summary = '打算掩護隊友。';
  }

  if (actionType === 'heal') {
    score += 0.18 + signals.mercyPriority * 0.4 + signals.survivalPriority * 0.25;
    if (lowAlly) score += 0.44;
    if (actor.class === 'Healer') score += 0.28;
    if (actor.class === 'Mage' && actor.traits.includes('Devout')) score += 0.12;
    if (weakestAlly) targetId = weakestAlly.id;
    summary = '想先穩住傷勢。';
  }

  if (actionType === 'defend') {
    score += 0.2 + signals.survivalPriority * 0.32;
    if (hpRatio < 0.45) score += 0.36;
    if (actor.class === 'Knight' || actor.class === 'Healer') score += 0.12;
    summary = '準備收緊陣型。';
  }

  if (actionType === 'study_enemy') {
    score += 0.15 + signals.stealthPreference * 0.16 + signals.missionFocus * 0.1;
    if (battle.round <= 2) score += 0.18;
    if (actor.class === 'Mage' || actor.class === 'Rogue' || actor.class === 'Ranger') score += 0.18;
    if (battle.omenFocus === 'study') score += 0.32;
    if (weakestEnemy) targetId = weakestEnemy.id;
    summary = '觀察敵人破綻。';
  }

  if (actionType === 'press_forward') {
    score += 0.22 + signals.urgency * 0.35 + signals.aggression * 0.18;
    if (weakestEnemy && weakestEnemy.hp / weakestEnemy.maxHp < 0.5) score += 0.25;
    if (actor.class === 'Rogue' || actor.class === 'Knight') score += 0.14;
    if (battle.omenFocus === 'attack') score += 0.28;
    if (weakestEnemy) targetId = weakestEnemy.id;
    summary = '準備追擊壓線。';
  }

  if (battle.omenFocus === 'guard' && (actionType === 'protect_ally' || actionType === 'defend')) {
    score += 0.28;
  }

  if (actor.traits.includes('Brave') && (actionType === 'attack' || actionType === 'press_forward')) {
    score += 0.18;
  }
  if (actor.traits.includes('Fearful') && (actionType === 'defend' || actionType === 'protect_ally')) {
    score += 0.16;
  }
  if (actor.traits.includes('Compassionate') && (actionType === 'heal' || actionType === 'protect_ally')) {
    score += 0.16;
  }
  if (actor.traits.includes('Curious') && actionType === 'study_enemy') {
    score += 0.14;
  }
  if (actor.traits.includes('Wary') && (actionType === 'defend' || actionType === 'protect_ally')) {
    score += 0.14;
  }
  if (actor.traits.includes('Greedy') && actionType === 'press_forward') {
    score += 0.06;
  }
  if (hpRatio < 0.35 && (actionType === 'attack' || actionType === 'press_forward')) {
    score -= 0.28;
  }

  return {
    actorId: actor.id,
    actorName: actor.name,
    actionType,
    targetId,
    score,
    summary,
  };
}

export function chooseBattleAction(
  actor: BattleState['party'][number],
  battle: BattleState,
  intent: DivinIntent
): BattleAction {
  const candidates: BattleActionType[] = [
    'attack',
    'protect_ally',
    'heal',
    'defend',
    'study_enemy',
    'press_forward',
  ];

  return candidates
    .map((actionType) => scoreBattleAction(actor, actionType, battle, intent))
    .reduce((best, candidate) => (candidate.score > best.score ? candidate : best));
}

export function topTags(tags: string[], max = 2): string[] {
  return tags.slice(0, max);
}
