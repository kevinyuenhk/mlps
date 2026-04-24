import type {
  OracleConfig,
  DivinIntent,
  ParsedSignals,
  Adventurer,
} from '../types';

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

const PRIORITY_MODIFIERS: Record<string, Partial<ParsedSignals>> = {
  survival: { survivalPriority: 0.3, aggression: -0.15 },
  help_wounded: { mercyPriority: 0.35, urgency: -0.1 },
  avoid_conflict: { stealthPreference: 0.3, aggression: -0.25 },
  seek_wealth: { greedAllowance: 0.4 },
  move_quickly: { urgency: 0.3, stealthPreference: -0.1 },
};

const RISK_MODIFIERS: Record<string, Partial<ParsedSignals>> = {
  low: { survivalPriority: 0.2, aggression: -0.2, stealthPreference: 0.1 },
  medium: {},
  high: { aggression: 0.2, survivalPriority: -0.15, urgency: 0.1 },
};

interface KeywordRule {
  keywords: string[];
  modifiers: Partial<ParsedSignals>;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['save', 'rescue', 'help', 'protect', '救援', '保護', '救助', '幫助'],
    modifiers: { mercyPriority: 0.15, survivalPriority: 0.1 },
  },
  {
    keywords: ['avoid battle', 'avoid conflict', 'no combat', 'stay hidden', '避免戰鬥', '避免衝突', '潛行'],
    modifiers: { aggression: -0.2, stealthPreference: 0.2 },
  },
  {
    keywords: ['treasure', 'loot', 'gold', 'wealth', '財寶', '黃金', '財富', '寶藏'],
    modifiers: { greedAllowance: 0.2 },
  },
  {
    keywords: ['hurry', 'quickly', 'fast', 'rush', 'urgent', '加速', '快速', '緊急'],
    modifiers: { urgency: 0.2 },
  },
  {
    keywords: ['safe', 'survive', 'careful', 'cautious', '安全', '謹慎', '小心', '求生'],
    modifiers: { survivalPriority: 0.2, aggression: -0.1 },
  },
  {
    keywords: ['relic first', 'mission only', 'stay focused', '任務優先', '神器優先', '完成任務'],
    modifiers: { missionFocus: 0.15, greedAllowance: -0.1 },
  },
  {
    keywords: ['attack', 'destroy', 'fight', 'aggressive', '攻擊', '消滅', '戰鬥', '進攻'],
    modifiers: { aggression: 0.2, survivalPriority: -0.1 },
  },
  {
    keywords: ['stealth', 'sneak', 'quiet', 'silent', '潛行', '靜默', '隱蔽'],
    modifiers: { stealthPreference: 0.2, aggression: -0.1 },
  },
];

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function applyPartial(signals: ParsedSignals, partial: Partial<ParsedSignals>): void {
  for (const [key, delta] of Object.entries(partial)) {
    const signalKey = key as keyof ParsedSignals;
    signals[signalKey] = clamp(signals[signalKey] + (delta ?? 0));
  }
}

function applyKeywordParsing(text: string, signals: ParsedSignals): void {
  const lower = text.toLowerCase();

  for (const rule of KEYWORD_RULES) {
    if (!rule.keywords.some((keyword) => lower.includes(keyword))) continue;
    applyPartial(signals, rule.modifiers);
  }
}

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

  applyPartial(signals, PRIMARY_GOAL_SEEDS[config.primaryGoal] ?? {});

  for (const priority of config.secondaryPriorities) {
    applyPartial(signals, PRIORITY_MODIFIERS[priority] ?? {});
  }

  applyPartial(signals, RISK_MODIFIERS[config.riskTolerance] ?? {});

  if (config.addendumText.trim()) {
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

export function generateCharacterInterpretation(
  character: Adventurer,
  intent: DivinIntent
): string[] {
  const lines: string[] = [];
  const signals = intent.parsedSignals;

  if (character.traits.includes('Devout')) {
    lines.push('將神諭信號視為直接命令。');
  } else if (character.traits.includes('Skeptical')) {
    lines.push('只在神諭符合自身利益時才遵從。');
  } else if (character.faith >= 70) {
    lines.push('高信仰使神諭信號更具分量。');
  } else if (character.faith <= 35) {
    lines.push('低信仰意味著本能常勝過神諭。');
  } else {
    lines.push('在神諭意圖與個人判斷間取得平衡。');
  }

  if (character.traits.includes('Compassionate') && signals.mercyPriority >= 0.5) {
    lines.push('可能推動救援型行動。');
  } else if (character.traits.includes('Greedy') && signals.greedAllowance < 0.2) {
    lines.push('可能無視命令偏向搜刮。');
  } else if (character.traits.includes('Fearful') && signals.aggression >= 0.5) {
    lines.push('激進路線會讓此角色壓力大增。');
  } else if (character.traits.includes('Brave') && signals.survivalPriority >= 0.7) {
    lines.push('即使需要謹慎，仍可能過度投入。');
  } else if (character.riskBias === 'low') {
    lines.push('預設傾向安全路線。');
  } else if (character.riskBias === 'high') {
    lines.push('預設傾向大膽行動。');
  } else {
    lines.push('通常支持隊伍的主流判斷。');
  }

  return lines.slice(0, 2);
}
