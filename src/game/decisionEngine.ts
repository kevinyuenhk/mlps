import type {
  Adventurer,
  AdventurerClass,
  CharacterDecision,
  DecisionBreakdown,
  DivinIntent,
  EventOption,
  GameEvent,
  ParsedSignals,
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

export function topTags(tags: string[], max = 2): string[] {
  return tags.slice(0, max);
}
