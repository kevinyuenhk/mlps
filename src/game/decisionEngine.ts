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

/**
 * Decision Engine
 * ───────────────
 * For every event, this module computes each character's preference score
 * across all available options. Scores drive the party decision.
 *
 * Score formula:
 *   optionScore =
 *     baseOptionWeight
 *     + traitModifiers          (sum of traitBonuses for this character's traits)
 *     + divineAlignmentScore    (dot product of option signals × divine intent, scaled by faith)
 *     + stateModifiers          (HP, stress penalty/bonus)
 *     + classBias               (class tendencies)
 *     + interventionModifier    (Omen boost from player)
 *     + randomness              (small ±0.05 noise as tie-breaker only)
 *
 * HOW TO EXTEND:
 *   Add trait entries to traitBonuses in events.ts.
 *   Add class biases in CLASS_BIASES below.
 *   Increase/decrease randomness constant if desired.
 */

const RANDOMNESS_RANGE = 0.05; // ±0.05 maximum random noise

// ─────────────────────────────────────────────────────────────────
// Class biases
// ─────────────────────────────────────────────────────────────────

/**
 * Per-class bonus for options that carry certain risk or type tags.
 * These represent trained instincts independent of divine guidance.
 */
const CLASS_BIASES: Record<
  AdventurerClass,
  Record<string, number>
> = {
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

// ─────────────────────────────────────────────────────────────────
// Trait modifiers
// ─────────────────────────────────────────────────────────────────

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
    if (bonus >= 0.3) {
      tags.push(`${trait} strongly favors this choice.`);
    } else if (bonus >= 0.15) {
      tags.push(`${trait} favors this choice.`);
    } else if (bonus <= -0.3) {
      tags.push(`${trait} strongly resists this choice.`);
    } else if (bonus <= -0.15) {
      tags.push(`${trait} resists this choice.`);
    }
  }

  return { score, tags };
}

// ─────────────────────────────────────────────────────────────────
// Divine intent alignment
// ─────────────────────────────────────────────────────────────────

function computeDivineAlignment(
  character: Adventurer,
  option: EventOption,
  signals: ParsedSignals
): { score: number; tags: string[] } {
  const tags: string[] = [];

  // Dot product: how much this option resonates with divine intent signals
  let rawAlignment = 0;
  for (const [key, weight] of Object.entries(option.signalAlignment)) {
    const intentValue = signals[key as keyof ParsedSignals] ?? 0;
    rawAlignment += intentValue * (weight as number);
  }

  // Faith multiplier — more faith = stronger divine signal
  const faithMultiplier = character.faith / 100;

  // Devout amplifies divine weight by 30%
  const devoutMult = character.traits.includes('Devout') ? 1.3 : 1.0;

  // Skeptical halves divine influence
  const skepticMult = character.traits.includes('Skeptical') ? 0.5 : 1.0;

  const finalScore = rawAlignment * faithMultiplier * devoutMult * skepticMult * 0.7;

  if (rawAlignment > 0.3 && finalScore > 0.1) {
    tags.push('This aligns with divine guidance.');
  }
  if (character.traits.includes('Devout') && rawAlignment > 0.2) {
    tags.push('Devout faith amplifies the divine signal.');
  }
  if (character.traits.includes('Skeptical')) {
    tags.push('Skepticism dulls the pull of divine intent.');
  }

  return { score: finalScore, tags };
}

// ─────────────────────────────────────────────────────────────────
// State modifiers (HP, stress)
// ─────────────────────────────────────────────────────────────────

function computeStateModifiers(
  character: Adventurer,
  option: EventOption
): { score: number; tags: string[] } {
  const tags: string[] = [];
  let score = 0;

  const hpRatio = character.hp / character.maxHp;
  const stressRatio = character.stress / 100;

  // Low HP increases caution
  if (option.riskLevel === 'high' && hpRatio < 0.4) {
    score -= 0.35;
    tags.push('Low HP reduces willingness to risk further harm.');
  } else if (option.riskLevel === 'high' && hpRatio < 0.6) {
    score -= 0.15;
    tags.push('HP below half tempers the appetite for danger.');
  }

  // Fragile trait extra penalty on high risk
  if (character.traits.includes('Fragile') && option.riskLevel === 'high') {
    score -= 0.2;
    tags.push('Fragile constitution makes high-risk options unappealing.');
  }

  // High stress pushes toward caution or retreat
  if (stressRatio > 0.7) {
    if (option.riskLevel === 'high') {
      score -= 0.2;
      tags.push('High stress makes further danger feel overwhelming.');
    }
    if (option.riskLevel === 'low') {
      score += 0.15;
      tags.push('High stress increases desire for the safer path.');
    }
  }

  // Calm reduces stress penalties
  if (character.traits.includes('Calm') && stressRatio > 0.5) {
    score += 0.1; // calm mitigates stress impact
    tags.push('Calm disposition resists the pull of panic.');
  }

  return { score, tags };
}

// ─────────────────────────────────────────────────────────────────
// Class bias
// ─────────────────────────────────────────────────────────────────

function computeClassBias(
  character: Adventurer,
  option: EventOption
): { score: number; tags: string[] } {
  const tags: string[] = [];
  const biases = CLASS_BIASES[character.class] ?? {};
  const bias = biases[option.id] ?? 0;
  if (Math.abs(bias) >= 0.15) {
    if (bias > 0) {
      tags.push(`${character.class} training instinctively favors this approach.`);
    } else {
      tags.push(`${character.class} training instinctively resists this approach.`);
    }
  }
  return { score: bias, tags };
}

// ─────────────────────────────────────────────────────────────────
// Per-character option scoring
// ─────────────────────────────────────────────────────────────────

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
  if (interventionBoost > 0.1) allTags.push('A divine omen nudges toward this choice.');

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

// ─────────────────────────────────────────────────────────────────
// Full party decision resolution
// ─────────────────────────────────────────────────────────────────

export interface PartyDecisionResult {
  characterDecisions: CharacterDecision[];
  aggregateScores: Record<string, number>;
  winningOptionId: string;
  divinePreferredOptionId: string;
  followedDivineIntent: boolean;
  divergenceNote?: string;
}

/**
 * Runs the full decision engine for an event.
 *
 * @param event - The current game event
 * @param party - Living party members
 * @param intent - Parsed divine intent
 * @param activeOmenOptionId - If player used Omen, which option gets a boost
 * @param activeBlessingBoost - If player used Blessing, party loyalty is boosted
 */
export function resolvePartyDecision(
  event: GameEvent,
  party: Adventurer[],
  intent: DivinIntent,
  activeOmenOptionId: string | null,
  activeBlessingBoost: boolean
): PartyDecisionResult {
  const living = party.filter((c) => c.alive);
  const characterDecisions: CharacterDecision[] = [];

  // Score each option for each character
  for (const character of living) {
    const scores: Record<string, number> = {};
    const tags: Record<string, string[]> = {};
    const breakdown: Record<string, DecisionBreakdown> = {};

    for (const option of event.options) {
      const interventionBoost =
        activeOmenOptionId === option.id ? 0.5 : 0;
      const result = scoreOption(character, option, intent, interventionBoost);
      scores[option.id] = result.score;
      tags[option.id] = result.tags;
      breakdown[option.id] = result.breakdown;
    }

    // Determine which option this character prefers
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

  // Aggregate scores weighted by character loyalty
  // Blessing boosts effective loyalty by 20 points for this resolution
  const aggregateScores: Record<string, number> = {};
  for (const option of event.options) {
    aggregateScores[option.id] = 0;
  }

  for (const decision of characterDecisions) {
    const character = living.find((c) => c.id === decision.characterId)!;
    const effectiveLoyalty = Math.min(
      100,
      character.loyalty + (activeBlessingBoost ? 20 : 0)
    );
    const loyaltyWeight = effectiveLoyalty / 100;

    for (const option of event.options) {
      aggregateScores[option.id] +=
        (decision.scores[option.id] ?? 0) * loyaltyWeight;
    }
  }

  // Normalize by party size
  const partySize = living.length;
  for (const key of Object.keys(aggregateScores)) {
    aggregateScores[key] /= partySize;
  }

  // Determine winning option
  const winningOptionId = Object.entries(aggregateScores).reduce(
    (best, [id, score]) => (score > aggregateScores[best] ? id : best),
    event.options[0].id
  );

  // Determine divine-preferred option (purely from divine signals, no traits/state)
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
    divergenceNote = `The party chose "${winner?.label}" despite your intent toward "${divine?.label}".`;
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

// ─────────────────────────────────────────────────────────────────
// Helper: pick most explanatory tags for display (max N)
// ─────────────────────────────────────────────────────────────────

export function topTags(tags: string[], max = 3): string[] {
  return tags.slice(0, max);
}
