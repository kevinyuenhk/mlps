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
import { traitDisplayName, classDisplayName } from '../utils/helpers';

const RANDOMNESS_RANGE = 0.05;

const CLASS_BIASES: Record<AdventurerClass, Record<string, number>> = {
  Knight: {
    fight_through: 0.25,
    press_attack: 0.25,
    defensive_formation: 0.2,
    force_through: 0.15,
    cross_carefully: 0.1,
    investigate_treasure: -0.15,
    withdraw: -0.2,
  },
  Healer: {
    help_keeper: 0.3,
    carry_wounded: 0.35,
    fight_through: -0.2,
    press_attack: -0.25,
    safe_detour: 0.15,
    withdraw: 0.1,
  },
  Rogue: {
    investigate_treasure: 0.25,
    quick_scout: 0.2,
    interrogate_keeper: 0.2,
    safe_detour: 0.05,
    fight_through: -0.1,
    force_through: -0.1,
  },
  Mage: {
    interrogate_keeper: 0.25,
    quick_scout: 0.15,
    conserve_and_flank: 0.2,
    defensive_formation: 0.15,
    fight_through: -0.15,
    force_through: -0.2,
  },
  Ranger: {
    safe_detour: 0.2,
    cross_carefully: 0.15,
    withdraw: 0.1,
    defensive_formation: 0.1,
    force_through: -0.1,
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
    if (bonus >= 0.3) {
      tags.push(`${name}強烈傾向此選擇。`);
    } else if (bonus >= 0.15) {
      tags.push(`${name}傾向此選擇。`);
    } else if (bonus <= -0.3) {
      tags.push(`${name}強烈抗拒此選擇。`);
    } else if (bonus <= -0.15) {
      tags.push(`${name}抗拒此選擇。`);
    }
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
  const devoutMult = character.traits.includes('Devout') ? 1.3 : 1.0;
  const skepticMult = character.traits.includes('Skeptical') ? 0.5 : 1.0;
  const finalScore = rawAlignment * faithMultiplier * devoutMult * skepticMult * 0.7;

  if (rawAlignment > 0.3 && finalScore > 0.1) {
    tags.push('此選擇符合神意指引。');
  }
  if (character.traits.includes('Devout') && rawAlignment > 0.2) {
    tags.push('虔誠的信仰放大了神聖訊號。');
  }
  if (character.traits.includes('Skeptical')) {
    tags.push('懷疑主義削弱了神意的牽引力。');
  }

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
    tags.push('體力極低，令人不願再承受更多傷害。');
  } else if (option.riskLevel === 'high' && hpRatio < 0.6) {
    score -= 0.15;
    tags.push('體力低於半數，對危險的渴望有所削減。');
  }

  if (character.traits.includes('Fragile') && option.riskLevel === 'high') {
    score -= 0.2;
    tags.push('脆弱的體質使高風險選項更難以承受。');
  }

  if (stressRatio > 0.7) {
    if (option.riskLevel === 'high') {
      score -= 0.2;
      tags.push('極高的壓力使進一步的危險令人難以承受。');
    }
    if (option.riskLevel === 'low') {
      score += 0.15;
      tags.push('極高的壓力使安全路線更具吸引力。');
    }
  }

  if (character.traits.includes('Calm') && stressRatio > 0.5) {
    score += 0.1;
    tags.push('冷靜的性格抵擋了恐慌的侵蝕。');
  }

  return { score, tags };
}

function computeClassBias(
  character: Adventurer,
  option: EventOption
): { score: number; tags: string[] } {
  const tags: string[] = [];
  const biases = CLASS_BIASES[character.class] ?? {};
  const bias = biases[option.id] ?? 0;
  if (Math.abs(bias) >= 0.15) {
    const cls = classDisplayName(character.class);
    if (bias > 0) {
      tags.push(`${cls}的訓練本能地傾向這種做法。`);
    } else {
      tags.push(`${cls}的訓練本能地抗拒這種做法。`);
    }
  }
  return { score: bias, tags };
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
  interventionBoost: number
): OptionScore {
  const trait = computeTraitScore(character.traits, option);
  const divine = computeDivineAlignment(character, option, intent.parsedSignals);
  const state = computeStateModifiers(character, option);
  const classBias = computeClassBias(character, option);

  const randomness = (Math.random() - 0.5) * RANDOMNESS_RANGE * 2;
  const allTags: string[] = [];

  if (trait.tags.length) allTags.push(...trait.tags);
  if (divine.tags.length) allTags.push(...divine.tags);
  if (state.tags.length) allTags.push(...state.tags);
  if (classBias.tags.length) allTags.push(...classBias.tags);
  if (interventionBoost > 0.1) allTags.push('神聖神諭引導著向此選擇靠攏。');

  const totalScore =
    option.baseWeight +
    trait.score +
    divine.score +
    state.score +
    classBias.score +
    interventionBoost +
    randomness;

  const breakdown: DecisionBreakdown = {
    baseWeight: option.baseWeight,
    traitModifiers: trait.score,
    divineAlignment: divine.score,
    stateModifiers: state.score,
    classBias: classBias.score,
    interventionModifier: interventionBoost,
    randomness,
  };

  return { score: totalScore, tags: allTags, breakdown };
}

export interface PartyDecisionResult {
  characterDecisions: CharacterDecision[];
  aggregateScores: Record<string, number>;
  winningOptionId: string;
  divinePreferredOptionId: string;
  followedDivineIntent: boolean;
  divergenceNote?: string;
}

export function resolvePartyDecision(
  event: GameEvent,
  party: Adventurer[],
  intent: DivinIntent,
  activeOmenOptionId: string | null,
  activeBlessingBoost: boolean
): PartyDecisionResult {
  const living = party.filter((c) => c.alive);
  const characterDecisions: CharacterDecision[] = [];

  for (const character of living) {
    const scores: Record<string, number> = {};
    const tags: Record<string, string[]> = {};
    const breakdown: Record<string, DecisionBreakdown> = {};

    for (const option of event.options) {
      const interventionBoost = activeOmenOptionId === option.id ? 0.5 : 0;
      const result = scoreOption(character, option, intent, interventionBoost);
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

  const aggregateScores: Record<string, number> = {};
  for (const option of event.options) {
    aggregateScores[option.id] = 0;
  }

  for (const decision of characterDecisions) {
    const character = living.find((c) => c.id === decision.characterId)!;
    const effectiveLoyalty = Math.min(100, character.loyalty + (activeBlessingBoost ? 20 : 0));
    const loyaltyWeight = effectiveLoyalty / 100;

    for (const option of event.options) {
      aggregateScores[option.id] += (decision.scores[option.id] ?? 0) * loyaltyWeight;
    }
  }

  const partySize = living.length;
  for (const key of Object.keys(aggregateScores)) {
    aggregateScores[key] /= partySize;
  }

  const winningOptionId = Object.entries(aggregateScores).reduce(
    (best, [id, score]) => (score > aggregateScores[best] ? id : best),
    event.options[0].id
  );

  const divineScores: Record<string, number> = {};
  for (const option of event.options) {
    let divineScore = 0;
    for (const [key, weight] of Object.entries(option.signalAlignment)) {
      const sv = intent.parsedSignals[key as keyof ParsedSignals] ?? 0;
      divineScore += sv * (weight as number);
    }
    divineScores[option.id] = divineScore;
  }

  const divinePreferredOptionId = Object.entries(divineScores).reduce(
    (best, [id, score]) => (score > divineScores[best] ? id : best),
    event.options[0].id
  );

  const followedDivineIntent = winningOptionId === divinePreferredOptionId;

  let divergenceNote: string | undefined;
  if (!followedDivineIntent) {
    const winner = event.options.find((o) => o.id === winningOptionId);
    const divine = event.options.find((o) => o.id === divinePreferredOptionId);
    divergenceNote = `隊伍選擇了「${winner?.label}」，違背了您欲達成「${divine?.label}」的意圖。`;
  }

  return {
    characterDecisions,
    aggregateScores,
    winningOptionId,
    divinePreferredOptionId,
    followedDivineIntent,
    divergenceNote,
  };
}

export function topTags(tags: string[], max = 3): string[] {
  return tags.slice(0, max);
}
