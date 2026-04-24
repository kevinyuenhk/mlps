import type { Adventurer, ParsedSignals } from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return clamp((value / total) * 100, 0, 100);
}

export function signalLabel(key: keyof ParsedSignals): string {
  const labels: Record<keyof ParsedSignals, string> = {
    survivalPriority: '求生優先',
    mercyPriority: '慈悲優先',
    greedAllowance: '貪慾容忍',
    aggression: '攻擊傾向',
    urgency: '緊迫程度',
    stealthPreference: '潛行偏好',
    missionFocus: '任務專注',
  };
  return labels[key];
}

export function signalColor(value: number): string {
  if (value >= 0.7) return 'text-amber-400';
  if (value >= 0.4) return 'text-amber-200';
  return 'text-gray-500';
}

export function riskColor(level: string): string {
  switch (level) {
    case 'high': return 'text-red-400';
    case 'medium': return 'text-amber-400';
    case 'low': return 'text-green-400';
    default: return 'text-gray-400';
  }
}

export function hpColor(hp: number, maxHp: number): string {
  const ratio = hp / maxHp;
  if (ratio > 0.6) return 'bg-green-500';
  if (ratio > 0.3) return 'bg-amber-500';
  return 'bg-red-500';
}

export function stressColor(stress: number): string {
  if (stress > 70) return 'bg-red-500';
  if (stress > 40) return 'bg-amber-500';
  return 'bg-blue-500';
}

export function goalLabel(goal: string): string {
  const labels: Record<string, string> = {
    recover_relic: '取回神器',
    rescue_survivors: '救援倖存者',
    purge_corruption: '清除腐敗',
    scout_graveyard: '偵察墓地',
  };
  return labels[goal] ?? goal;
}

export function priorityLabel(p: string): string {
  const labels: Record<string, string> = {
    survival: '優先求生',
    help_wounded: '救助傷者',
    avoid_conflict: '避免衝突',
    seek_wealth: '尋找財富',
    move_quickly: '快速行進',
  };
  return labels[p] ?? p;
}

export function riskLabel(r: string): string {
  const labels: Record<string, string> = {
    low: '低風險',
    medium: '中等風險',
    high: '高風險',
  };
  return labels[r] ?? r;
}

export function characterClassIcon(cls: string): string {
  const icons: Record<string, string> = {
    Knight: '⚔️',
    Healer: '✨',
    Rogue: '🗡️',
    Mage: '🔮',
    Ranger: '🏹',
  };
  return icons[cls] ?? '👤';
}

export function aliveCount(party: Adventurer[]): number {
  return party.filter((a) => a.alive).length;
}

export function formatScore(n: number): string {
  return n.toFixed(2);
}

export function missionResultLabel(result: string): string {
  switch (result) {
    case 'success': return '任務成功';
    case 'partial': return '部分成功';
    case 'failure': return '任務失敗';
    default: return result;
  }
}

export function missionResultColor(result: string): string {
  switch (result) {
    case 'success': return 'text-green-400';
    case 'partial': return 'text-amber-400';
    case 'failure': return 'text-red-400';
    default: return 'text-gray-400';
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
    Clever: '機智',
    Skeptical: '懷疑',
    Curious: '好奇',
    Rational: '理性',
    Fragile: '脆弱',
    Calm: '冷靜',
    Dutiful: '盡責',
    Wary: '謹慎',
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
