import type {
  Adventurer,
  ParsedSignals,
  RiskLevel,
  RoomType,
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
    greedAllowance: '貪婪',
    aggression: '好戰',
    urgency: '速度',
    stealthPreference: '潛行',
    missionFocus: '任務',
  };
  return labels[key];
}

export function signalIcon(key: keyof ParsedSignals): string {
  const icons: Record<keyof ParsedSignals, string> = {
    survivalPriority: '🛡️',
    mercyPriority: '🫱',
    greedAllowance: '💰',
    aggression: '⚔️',
    urgency: '⚡',
    stealthPreference: '🌫️',
    missionFocus: '🎯',
  };
  return icons[key];
}

export function riskColor(level: RiskLevel): string {
  switch (level) {
    case 'high':
      return 'text-rose-300 border-rose-500/40 bg-rose-500/10';
    case 'medium':
      return 'text-amber-200 border-amber-500/40 bg-amber-500/10';
    case 'low':
      return 'text-emerald-200 border-emerald-500/40 bg-emerald-500/10';
    default:
      return 'text-slate-300 border-slate-500/40 bg-slate-500/10';
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
    scout_graveyard: '探索地牢',
  };
  return labels[goal] ?? goal;
}

export function priorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    survival: '求生',
    help_wounded: '救援',
    avoid_conflict: '迴避戰鬥',
    seek_wealth: '搜刮',
    move_quickly: '速度',
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
    combat: '戰鬥',
    hazard: '險境',
    choice: '抉擇',
    treasure: '寶藏',
    shrine: '神殿',
    boss: '首領',
    exit: '逃脫',
  };
  return labels[type];
}

export function roomTypeIcon(type: RoomType): string {
  const icons: Record<RoomType, string> = {
    entrance: '🚪',
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
      return '慘勝';
    case 'failure':
      return '任務失敗';
    default:
      return result;
  }
}

export function missionResultColor(result: string): string {
  switch (result) {
    case 'success':
      return 'text-emerald-300';
    case 'partial':
      return 'text-amber-200';
    case 'failure':
      return 'text-rose-300';
    default:
      return 'text-slate-200';
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
