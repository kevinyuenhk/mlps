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
    survivalPriority: 'Survival',
    mercyPriority: 'Mercy',
    greedAllowance: 'Greed',
    aggression: 'Aggression',
    urgency: 'Urgency',
    stealthPreference: 'Stealth',
    missionFocus: 'Mission Focus',
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
    recover_relic: 'Recover the Relic',
    rescue_survivors: 'Rescue Survivors',
    purge_corruption: 'Purge Corruption',
    scout_graveyard: 'Scout the Graveyard',
  };
  return labels[goal] ?? goal;
}

export function priorityLabel(p: string): string {
  const labels: Record<string, string> = {
    survival: 'Prioritize Survival',
    help_wounded: 'Help the Wounded',
    avoid_conflict: 'Avoid Conflict',
    seek_wealth: 'Seek Wealth',
    move_quickly: 'Move Quickly',
  };
  return labels[p] ?? p;
}

export function riskLabel(r: string): string {
  const labels: Record<string, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
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
    case 'success': return 'Mission Successful';
    case 'partial': return 'Partial Success';
    case 'failure': return 'Mission Failed';
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
