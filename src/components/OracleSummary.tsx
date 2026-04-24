import type { DivinIntent, ParsedSignals } from '../types';
import {
  goalLabel,
  priorityLabel,
  riskLabel,
  signalIcon,
  signalLabel,
} from '../utils/helpers';

interface Props {
  intent: DivinIntent;
  compact?: boolean;
}

const SIGNAL_KEYS: (keyof ParsedSignals)[] = [
  'missionFocus',
  'survivalPriority',
  'mercyPriority',
  'aggression',
  'urgency',
  'stealthPreference',
  'greedAllowance',
];

function SignalBar({ signal, value }: { signal: keyof ParsedSignals; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-stone-500">
        <span className="flex items-center gap-2">
          <span>{signalIcon(signal)}</span>
          <span>{signalLabel(signal)}</span>
        </span>
        <span className="text-stone-300">{Math.round(value * 100)}%</span>
      </div>
      <div className="stat-bar-wrap h-2 bg-stone-800">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#f2ca74,#a17734)]"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function OracleSummary({ intent, compact = false }: Props) {
  const wrapperClass = compact ? 'space-y-4' : 'panel p-4 space-y-4';

  return (
    <div className={wrapperClass}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
          {goalLabel(intent.primaryGoal)}
        </span>
        <span className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">
          {riskLabel(intent.riskTolerance)}
        </span>
        {intent.priorities.map((priority) => (
          <span key={priority} className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-400">
            {priorityLabel(priority)}
          </span>
        ))}
      </div>

      <div className="grid gap-3">
        {SIGNAL_KEYS.map((signal) => (
          <SignalBar key={signal} signal={signal} value={intent.parsedSignals[signal]} />
        ))}
      </div>

      {intent.addendumText.trim() && (
        <div className="rounded-2xl border border-stone-800 bg-stone-950/70 px-3 py-3 text-sm text-stone-400">
          {intent.addendumText}
        </div>
      )}
    </div>
  );
}
