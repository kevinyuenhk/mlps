import type {
  OracleConfig,
  DivinIntent,
  ParsedSignals,
  Adventurer,
} from '../types';

/**
 * Oracle Parser
 * ─────────────
 * Converts player-defined OracleConfig into a normalized ParsedSignals object.
 *
 * Signal values range 0–1. They represent how strongly the god's will
 * leans in each direction. The decision engine reads these values to score
 * how well each event option aligns with divine intent.
 *
 * HOW TO EXTEND:
 *   Add keywords to KEYWORD_RULES with a modifier map.
 *   Add new SecondaryPriority entries to PRIORITY_MODIFIERS.
 */

// ─────────────────────────────────────────────────────────────────
// Base signal seeds from primary goal
// ─────────────────────────────────────────────────────────────────

const PRIMARY_GOAL_SEEDS: Record<string, Partial<ParsedSignals>> = {
  recover_relic: {
    missionFocus: 0.85,
    urgency: 0.5,
    survivalPriority: 0.4,
    aggression: 0.3,
  },
  rescue_survivors: {
    missionFocus: 0.6,
    mercyPriority: 0.85,
    survivalPriority: 0.6,
    urgency: 0.4,
  },
  purge_corruption: {
    aggression: 0.8,
    missionFocus: 0.7,
    survivalPriority: 0.2,
    urgency: 0.5,
  },
  scout_graveyard: {
    stealthPreference: 0.8,
    missionFocus: 0.5,
    survivalPriority: 0.5,
    urgency: 0.2,
  },
};

// ─────────────────────────────────────────────────────────────────
// Modifiers from secondary priorities
// ─────────────────────────────────────────────────────────────────

const PRIORITY_MODIFIERS: Record<string, Partial<ParsedSignals>> = {
  survival: { survivalPriority: +0.3, aggression: -0.15 },
  help_wounded: { mercyPriority: +0.35, urgency: -0.1 },
  avoid_conflict: { stealthPreference: +0.3, aggression: -0.25 },
  seek_wealth: { greedAllowance: +0.4 },
  move_quickly: { urgency: +0.3, stealthPreference: -0.1 },
};

// ─────────────────────────────────────────────────────────────────
// Modifiers from risk tolerance
// ─────────────────────────────────────────────────────────────────

const RISK_MODIFIERS: Record<string, Partial<ParsedSignals>> = {
  low: { survivalPriority: +0.2, aggression: -0.2, stealthPreference: +0.1 },
  medium: {},
  high: { aggression: +0.2, survivalPriority: -0.15, urgency: +0.1 },
};

// ─────────────────────────────────────────────────────────────────
// Keyword parsing for free-text addendum
// ─────────────────────────────────────────────────────────────────

interface KeywordRule {
  keywords: string[];
  modifiers: Partial<ParsedSignals>;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['save', 'rescue', 'help', 'protect'],
    modifiers: { mercyPriority: +0.15, survivalPriority: +0.1 },
  },
  {
    keywords: ['do not fight', 'avoid battle', 'avoid conflict', 'no combat', 'stay hidden'],
    modifiers: { aggression: -0.2, stealthPreference: +0.2 },
  },
  {
    keywords: ['treasure', 'loot', 'gold', 'wealth', 'riches'],
    modifiers: { greedAllowance: +0.2 },
  },
  {
    keywords: ['hurry', 'quickly', 'fast', 'rush', 'speed', 'urgent'],
    modifiers: { urgency: +0.2 },
  },
  {
    keywords: ['safe', 'survive', 'careful', 'cautious', 'caution'],
    modifiers: { survivalPriority: +0.2, aggression: -0.1 },
  },
  {
    keywords: ['complete the mission', 'relic first', 'the relic', 'mission only', 'stay focused'],
    modifiers: { missionFocus: +0.15, greedAllowance: -0.1 },
  },
  {
    keywords: ['attack', 'destroy', 'fight', 'aggressive', 'crush'],
    modifiers: { aggression: +0.2, survivalPriority: -0.1 },
  },
  {
    keywords: ['stealth', 'sneak', 'quiet', 'silent', 'unseen'],
    modifiers: { stealthPreference: +0.2, aggression: -0.1 },
  },
];

function applyKeywordParsing(text: string, signals: ParsedSignals): void {
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    const matched = rule.keywords.some((kw) => lower.includes(kw));
    if (matched) {
      for (const [key, delta] of Object.entries(rule.modifiers)) {
        const k = key as keyof ParsedSignals;
        signals[k] = clamp(signals[k] + (delta ?? 0));
      }
    }
  }
}

function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}

function applyPartial(
  signals: ParsedSignals,
  partial: Partial<ParsedSignals>
): void {
  for (const [key, delta] of Object.entries(partial)) {
    const k = key as keyof ParsedSignals;
    signals[k] = clamp(signals[k] + (delta ?? 0));
  }
}

// ─────────────────────────────────────────────────────────────────
// Main parser entry point
// ─────────────────────────────────────────────────────────────────

export function parseOracle(config: OracleConfig): DivinIntent {
  const signals: ParsedSignals = {
    survivalPriority: 0.3,
    mercyPriority: 0.2,
    greedAllowance: 0.1,
    aggression: 0.3,
    urgency: 0.4,
    stealthPreference: 0.2,
    missionFocus: 0.5,
  };

  // Apply primary goal seeds
  const goalSeeds = PRIMARY_GOAL_SEEDS[config.primaryGoal] ?? {};
  applyPartial(signals, goalSeeds);

  // Apply secondary priority modifiers
  for (const priority of config.secondaryPriorities) {
    const mods = PRIORITY_MODIFIERS[priority] ?? {};
    applyPartial(signals, mods);
  }

  // Apply risk tolerance modifiers
  const riskMods = RISK_MODIFIERS[config.riskTolerance] ?? {};
  applyPartial(signals, riskMods);

  // Parse free-text addendum
  if (config.addendumText.trim().length > 0) {
    applyKeywordParsing(config.addendumText, signals);
  }

  return {
    primaryGoal: config.primaryGoal,
    priorities: config.secondaryPriorities,
    riskTolerance: config.riskTolerance,
    addendumText: config.addendumText,
    parsedSignals: signals,
  };
}

// ─────────────────────────────────────────────────────────────────
// Character interpretation preview
// ─────────────────────────────────────────────────────────────────

/**
 * Returns 2–3 human-readable lines explaining how a character will
 * likely interpret the oracle, given their traits and faith.
 */
export function generateCharacterInterpretation(
  character: Adventurer,
  intent: DivinIntent
): string[] {
  const lines: string[] = [];
  const { traits, faith, riskBias, name } = character;
  const s = intent.parsedSignals;

  // Faith relationship with divine intent
  if (traits.includes('Devout')) {
    lines.push(
      `${name} receives the divine word as sacred law and will prioritize it above personal instinct.`
    );
  } else if (traits.includes('Skeptical')) {
    lines.push(
      `${name} regards divine guidance with suspicion — they'll follow it only when it aligns with self-interest.`
    );
  } else if (faith >= 70) {
    lines.push(
      `${name} holds strong faith and will weight your commands heavily when making choices.`
    );
  } else if (faith <= 35) {
    lines.push(
      `${name}'s weak faith means your oracle will influence them only mildly; their own instincts lead.`
    );
  } else {
    lines.push(
      `${name} will balance your instructions against their own judgment — expect reasonable compliance.`
    );
  }

  // Key trait conflicts or alignments
  if (traits.includes('Compassionate') && s.mercyPriority >= 0.5) {
    lines.push(
      `Their compassion aligns strongly with your mercy priority — they'll drive the party toward helping others.`
    );
  } else if (traits.includes('Compassionate') && s.mercyPriority < 0.3) {
    lines.push(
      `Their compassionate nature may conflict with your mission-first directive; expect hesitation at moral dilemmas.`
    );
  }

  if (traits.includes('Greedy') && s.greedAllowance < 0.2) {
    lines.push(
      `Greed will pull ${name} toward wealth even when you've forbidden it — watch for deviation at temptation events.`
    );
  } else if (traits.includes('Greedy') && s.greedAllowance >= 0.4) {
    lines.push(
      `${name}'s greed aligns with your tolerance for wealth-seeking; they'll pursue it eagerly.`
    );
  }

  if (traits.includes('Fearful') && s.aggression >= 0.5) {
    lines.push(
      `Your aggressive intent will clash with ${name}'s fear — they may resist or slow combat decisions.`
    );
  }

  if (traits.includes('Brave') && s.survivalPriority >= 0.7) {
    lines.push(
      `${name}'s bravery may override your survival-first command; they'll instinctively press forward when caution is needed.`
    );
  }

  if (traits.includes('Stubborn') && riskBias === 'high') {
    lines.push(
      `Once ${name} commits to a course, they rarely reverse — useful in a fight, dangerous near precipices.`
    );
  }

  if (traits.includes('Loyal') && s.missionFocus >= 0.6) {
    lines.push(`${name}'s loyalty reinforces your mission focus — they'll pull the party toward the objective.`);
  }

  if (traits.includes('Rational') && s.aggression >= 0.6) {
    lines.push(
      `${name} will calculate risk carefully before committing to your aggressive directive — expect moderation.`
    );
  }

  // Default closing line if only one was generated
  if (lines.length === 1) {
    if (riskBias === 'high') {
      lines.push(`As a risk-tolerant adventurer, ${name} will skew toward bold options when stakes are unclear.`);
    } else if (riskBias === 'low') {
      lines.push(`${name}'s cautious nature will favor safe choices even when you've asked for urgency.`);
    } else {
      lines.push(`${name} will generally follow the consensus of the party when divine guidance is ambiguous.`);
    }
  }

  return lines.slice(0, 3);
}
