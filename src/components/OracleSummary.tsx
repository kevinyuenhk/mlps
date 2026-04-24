import type { DivinIntent, ParsedSignals } from '../types';
import { signalLabel, goalLabel, priorityLabel, riskLabel } from '../utils/helpers';

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

function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  let barColor = 'bg-gray-600';
  if (value >= 0.65) barColor = 'bg-amber-500';
  else if (value >= 0.4) barColor = 'bg-amber-700';
  else if (value < 0.2) barColor = 'bg-gray-700';

  return (
    <div className="signal-row">
      <span className="w-28 shrink-0 text-gray-400">{label}</span>
      <div className="flex-1 stat-bar-wrap">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-gray-500">{pct}%</span>
    </div>
  );
}

export default function OracleSummary({ intent, compact = false }: Props) {
  return (
    <div className={compact ? '' : 'panel p-4'}>
      {!compact && (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
          Divine Intent
        </h3>
      )}

      <div className="space-y-2 text-xs mb-3">
        <div className="flex gap-2">
          <span className="text-gray-500">Goal:</span>
          <span className="text-amber-300 font-medium">{goalLabel(intent.primaryGoal)}</span>
        </div>
        {intent.priorities.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="text-gray-500 shrink-0">Priorities:</span>
            <div className="flex flex-wrap gap-1">
              {intent.priorities.map((p) => (
                <span key={p} className="trait-badge">{priorityLabel(p)}</span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <span className="text-gray-500">Risk:</span>
          <span className="text-gray-300">{riskLabel(intent.riskTolerance)}</span>
        </div>
        {intent.addendumText && (
          <div className="text-gray-500 italic">"{intent.addendumText}"</div>
        )}
      </div>

      <div className="space-y-1.5">
        {SIGNAL_KEYS.map((key) => (
          <SignalBar
            key={key}
            label={signalLabel(key)}
            value={intent.parsedSignals[key]}
          />
        ))}
      </div>
    </div>
  );
}
