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
  survival: { survivalPriority: +0.3, aggression: -0.15 },
  help_wounded: { mercyPriority: +0.35, urgency: -0.1 },
  avoid_conflict: { stealthPreference: +0.3, aggression: -0.25 },
  seek_wealth: { greedAllowance: +0.4 },
  move_quickly: { urgency: +0.3, stealthPreference: -0.1 },
};

const RISK_MODIFIERS: Record<string, Partial<ParsedSignals>> = {
  low: { survivalPriority: +0.2, aggression: -0.2, stealthPreference: +0.1 },
  medium: {},
  high: { aggression: +0.2, survivalPriority: -0.15, urgency: +0.1 },
};

interface KeywordRule {
  keywords: string[];
  modifiers: Partial<ParsedSignals>;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['save', 'rescue', 'help', 'protect', '救援', '保護', '救助', '幫助'],
    modifiers: { mercyPriority: +0.15, survivalPriority: +0.1 },
  },
  {
    keywords: ['do not fight', 'avoid battle', 'avoid conflict', 'no combat', 'stay hidden',
               '不得戰鬥', '避免戰鬥', '避免衝突', '潛行', '保持隱蔽'],
    modifiers: { aggression: -0.2, stealthPreference: +0.2 },
  },
  {
    keywords: ['treasure', 'loot', 'gold', 'wealth', 'riches', '財寶', '黃金', '財富', '寶藏'],
    modifiers: { greedAllowance: +0.2 },
  },
  {
    keywords: ['hurry', 'quickly', 'fast', 'rush', 'speed', 'urgent', '加速', '快速', '趕快', '緊急'],
    modifiers: { urgency: +0.2 },
  },
  {
    keywords: ['safe', 'survive', 'careful', 'cautious', 'caution', '安全', '謹慎', '小心', '求生'],
    modifiers: { survivalPriority: +0.2, aggression: -0.1 },
  },
  {
    keywords: ['complete the mission', 'relic first', 'the relic', 'mission only', 'stay focused',
               '任務優先', '神器優先', '專注任務', '完成任務'],
    modifiers: { missionFocus: +0.15, greedAllowance: -0.1 },
  },
  {
    keywords: ['attack', 'destroy', 'fight', 'aggressive', 'crush', '攻擊', '消滅', '戰鬥', '進攻'],
    modifiers: { aggression: +0.2, survivalPriority: -0.1 },
  },
  {
    keywords: ['stealth', 'sneak', 'quiet', 'silent', 'unseen', '潛行', '靜默', '隱蔽', '悄悄'],
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

function applyPartial(signals: ParsedSignals, partial: Partial<ParsedSignals>): void {
  for (const [key, delta] of Object.entries(partial)) {
    const k = key as keyof ParsedSignals;
    signals[k] = clamp(signals[k] + (delta ?? 0));
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

  const goalSeeds = PRIMARY_GOAL_SEEDS[config.primaryGoal] ?? {};
  applyPartial(signals, goalSeeds);

  for (const priority of config.secondaryPriorities) {
    const mods = PRIORITY_MODIFIERS[priority] ?? {};
    applyPartial(signals, mods);
  }

  const riskMods = RISK_MODIFIERS[config.riskTolerance] ?? {};
  applyPartial(signals, riskMods);

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

export function generateCharacterInterpretation(
  character: Adventurer,
  intent: DivinIntent
): string[] {
  const lines: string[] = [];
  const { traits, faith, riskBias, name } = character;
  const s = intent.parsedSignals;

  if (traits.includes('Devout')) {
    lines.push(`${name}將神意視為神聖法令，會將其凌駕於個人本能之上。`);
  } else if (traits.includes('Skeptical')) {
    lines.push(`${name}以懷疑的眼光看待神聖指引——只有當神意與自身利益一致時，才會從命。`);
  } else if (faith >= 70) {
    lines.push(`${name}信仰深厚，在做出選擇時會將您的指令置於重要地位。`);
  } else if (faith <= 35) {
    lines.push(`${name}信仰薄弱，神諭的影響力對他們僅屬輕微；其本能才是行動的主導。`);
  } else {
    lines.push(`${name}會在您的指令與自身判斷之間尋求平衡——可以期待合理的服從。`);
  }

  if (traits.includes('Compassionate') && s.mercyPriority >= 0.5) {
    lines.push(`他們的慈悲心與您的仁慈優先方向高度契合——他們將引導隊伍走向援助他人的選擇。`);
  } else if (traits.includes('Compassionate') && s.mercyPriority < 0.3) {
    lines.push(`他們慈悲的天性可能與您「任務優先」的指令相衝突；道德兩難面前，預期他們會猶豫不決。`);
  }

  if (traits.includes('Greedy') && s.greedAllowance < 0.2) {
    lines.push(`貪慾將驅使${name}在您明令禁止的情況下仍追逐財富——在誘惑事件中請留意偏軌行為。`);
  } else if (traits.includes('Greedy') && s.greedAllowance >= 0.4) {
    lines.push(`${name}的貪婪與您對財富追求的寬容相符；他們將積極進取地追逐財富。`);
  }

  if (traits.includes('Fearful') && s.aggression >= 0.5) {
    lines.push(`您的侵略性意圖將與${name}的恐懼相衝突——他們可能在戰鬥決策中抵制或拖延。`);
  }

  if (traits.includes('Brave') && s.survivalPriority >= 0.7) {
    lines.push(`${name}的勇氣可能會凌駕您「求生優先」的指令；在需要謹慎之處，他們的本能會促使他們奮勇前進。`);
  }

  if (traits.includes('Stubborn') && riskBias === 'high') {
    lines.push(`一旦${name}定下方向，便極難回頭——在戰鬥中大有用處，在懸崖邊卻危機四伏。`);
  }

  if (traits.includes('Loyal') && s.missionFocus >= 0.6) {
    lines.push(`${name}的忠誠強化了您對任務的專注——他們將引領隊伍邁向目標。`);
  }

  if (traits.includes('Rational') && s.aggression >= 0.6) {
    lines.push(`${name}在執行您激進的指令前會謹慎評估風險——預期他們會有所節制。`);
  }

  if (lines.length === 1) {
    if (riskBias === 'high') {
      lines.push(`身為一個願意冒險的探險者，當賭注不明確時，${name}會傾向於採取大膽的選項。`);
    } else if (riskBias === 'low') {
      lines.push(`${name}謹慎的天性將使其即便在您要求緊迫行動時，仍偏向穩妥的選擇。`);
    } else {
      lines.push(`當神聖指引模糊不清時，${name}通常會遵循隊伍的共識。`);
    }
  }

  return lines.slice(0, 3);
}
