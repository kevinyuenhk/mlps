import type {
  Adventurer,
  ExplorationPhase,
  Interactable,
  MapData,
  ParsedSignals,
  RiskLevel,
  RoomType,
  RouteTag,
} from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

export function signalLabel(key: keyof ParsedSignals): string {
  const labels: Record<keyof ParsedSignals, string> = {
    survivalPriority: '求生',
    mercyPriority: '慈悲',
    greedAllowance: '貪念',
    aggression: '進攻',
    urgency: '速度',
    stealthPreference: '潛行',
    missionFocus: '任務',
  };
  return labels[key];
}

export function signalIcon(key: keyof ParsedSignals): string {
  const icons: Record<keyof ParsedSignals, string> = {
    survivalPriority: '🛡',
    mercyPriority: '✚',
    greedAllowance: '💰',
    aggression: '⚔',
    urgency: '⚡',
    stealthPreference: '🌫',
    missionFocus: '✦',
  };
  return icons[key];
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'high':
      return 'text-rose-200 border-rose-500/40 bg-rose-500/10';
    case 'medium':
      return 'text-amber-100 border-amber-400/40 bg-amber-400/10';
    case 'low':
      return 'text-emerald-200 border-emerald-500/40 bg-emerald-500/10';
    default:
      return 'text-stone-300 border-stone-500/40 bg-stone-500/10';
  }
}

export function hpColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return 'bg-emerald-500';
  if (ratio > 0.3) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function stressColor(stress: number): string {
  if (stress > 70) return 'bg-rose-500';
  if (stress > 40) return 'bg-amber-500';
  return 'bg-sky-500';
}

export function goalLabel(goal: string): string {
  const labels: Record<string, string> = {
    recover_relic: '奪回神器',
    rescue_survivors: '營救生還者',
    purge_corruption: '淨化邪穢',
    scout_graveyard: '偵察墓城',
  };
  return labels[goal] ?? goal;
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    survival: '求生優先',
    help_wounded: '救援傷者',
    avoid_conflict: '避免衝突',
    seek_wealth: '搜刮財物',
    move_quickly: '加速推進',
  };
  return labels[priority] ?? priority;
}

export function riskLabel(risk: string): string {
  const labels: Record<string, string> = {
    low: '低風險',
    medium: '均衡',
    high: '高風險',
  };
  return labels[risk] ?? risk;
}

export function roomTypeLabel(type: RoomType): string {
  const labels: Record<RoomType, string> = {
    entrance: '入口',
    room: '廊室',
    combat: '交戰',
    hazard: '險境',
    choice: '岔路',
    treasure: '寶庫',
    shrine: '神殿',
    boss: '首領',
    exit: '出口',
  };
  return labels[type];
}

export function explorationPhaseLabel(phase: ExplorationPhase): string {
  const labels: Record<ExplorationPhase, string> = {
    walking: '行軍中',
    paused: '停步',
    transitioning: '轉場中',
    event: '事件中',
  };
  return labels[phase];
}

export function mapSpecialLabel(map: Pick<MapData, 'special'> | null | undefined): string {
  return map?.special ?? '探索中';
}

export function interactableKindLabel(kind: Interactable['kind']): string {
  const labels: Record<Interactable['kind'], string> = {
    chest: '寶箱',
    shrine: '神壇',
    npc: '人物',
    altar: '神龕',
  };
  return labels[kind];
}

export function roomTypeIcon(type: RoomType): string {
  const icons: Record<RoomType, string> = {
    entrance: '🚪',
    room: '🕯️',
    combat: '⚔️',
    hazard: '🪵',
    choice: '🩹',
    treasure: '💰',
    shrine: '✨',
    boss: '👑',
    exit: '🏃',
  };
  return icons[type];
}

export function routeTagLabel(tag: RouteTag): string {
  const labels: Record<RouteTag, string> = {
    mission: '任務',
    safe: '穩健',
    danger: '冒險',
    loot: '財物',
    mercy: '救援',
    speed: '迅捷',
    knowledge: '情報',
    boss: '首領',
  };
  return labels[tag];
}

export function directionLabel(y: number): string {
  if (y < 40) return '上路';
  if (y > 68) return '下路';
  return '正前';
}

export function characterClassIcon(cls: string): string {
  const icons: Record<string, string> = {
    Knight: '🛡️',
    Healer: '✚',
    Rogue: '🗡️',
    Mage: '✦',
    Ranger: '🏹',
  };
  return icons[cls] ?? '•';
}

export function aliveCount(party: Adventurer[]): number {
  return party.filter((member) => member.alive).length;
}

export function missionResultLabel(result: string): string {
  switch (result) {
    case 'success':
      return '任務完成';
    case 'partial':
      return '帶傷歸還';
    case 'failure':
      return '遠征失敗';
    default:
      return result;
  }
}

export function missionResultColor(result: string): string {
  switch (result) {
    case 'success':
      return 'text-emerald-300';
    case 'partial':
      return 'text-amber-100';
    case 'failure':
      return 'text-rose-300';
    default:
      return 'text-stone-200';
  }
}

export function traitDisplayName(trait: string): string {
  const names: Record<string, string> = {
    Brave: '勇敢',
    Loyal: '忠誠',
    Stubborn: '固執',
    Compassionate: '慈悲',
    Fearful: '膽怯',
    Devout: '虔誠',
    Greedy: '貪婪',
    Clever: '機靈',
    Skeptical: '多疑',
    Curious: '好奇',
    Rational: '理性',
    Fragile: '脆弱',
    Calm: '冷靜',
    Dutiful: '盡責',
    Wary: '警慎',
  };
  return names[trait] ?? trait;
}

export function classDisplayName(cls: string): string {
  const names: Record<string, string> = {
    Knight: '騎士',
    Healer: '治癒者',
    Rogue: '盜賊',
    Mage: '法師',
    Ranger: '遊俠',
  };
  return names[cls] ?? cls;
}

export function battleActionLabel(action: string): string {
  const labels: Record<string, string> = {
    attack: '攻擊',
    protect_ally: '掩護',
    heal: '治療',
    defend: '防守',
    study_enemy: '觀察',
    press_forward: '追擊',
  };
  return labels[action] ?? action;
}
