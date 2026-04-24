import type { GameEvent, InterventionType, RunState } from '../types';

interface Props {
  state: RunState;
  currentEvent: GameEvent;
  onIntervene: (type: InterventionType, optionId?: string) => void;
}

const INTERVENTIONS: Array<{
  type: InterventionType;
  label: string;
  note: string;
  cost: number;
  icon: string;
}> = [
  { type: 'omen', label: '神諭', note: '引導行動。', cost: 1, icon: '👁️' },
  { type: 'blessing', label: '祝福', note: '提升隊伍忠誠權重。', cost: 1, icon: '✨' },
  { type: 'miracle', label: '奇蹟', note: '全隊體力+20，壓力-20。', cost: 2, icon: '✚' },
];

export default function InterventionPanel({ state, currentEvent, onIntervene }: Props) {
  const firstOmenFree =
    state.activeBlessing === 'guiding_omen' &&
    !state.interventionsUsed.some((entry) => entry.type === 'omen');

  return (
    <div className="grid gap-2">
      <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">神聖干預</div>
      <div className="grid gap-2 sm:grid-cols-3">
        {INTERVENTIONS.map((intervention) => {
          const cost = intervention.type === 'omen' && firstOmenFree ? 0 : intervention.cost;
          const disabled = state.divinePower < cost;
          const active =
            (intervention.type === 'omen' && state.activeOmenOptionId) ||
            (intervention.type === 'blessing' && state.activeBlessingBoost);

          return (
            <button
              key={intervention.type}
              type="button"
              onClick={() => onIntervene(intervention.type)}
              disabled={disabled || Boolean(active)}
              className={[
                'rounded-2xl border px-3 py-3 text-left transition',
                disabled || active
                  ? 'border-stone-800 bg-stone-950/60 text-stone-600'
                  : 'border-stone-700 bg-stone-950/80 text-stone-200 hover:border-amber-300/50',
              ].join(' ')}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-base">{intervention.icon}</span>
                <span className="text-[11px] uppercase tracking-[0.22em] text-amber-100">
                  {cost === 0 ? '免費' : `${cost} 點`}
                </span>
              </div>
              <div className="text-sm font-semibold">{intervention.label}</div>
              <div className="mt-1 text-xs text-stone-500">{intervention.note}</div>
            </button>
          );
        })}
      </div>

      {state.activeOmenOptionId && (
        <div className="rounded-2xl border border-violet-300/30 bg-violet-300/10 px-3 py-2 text-xs text-violet-100">
          神諭已鎖定：{''}
          {currentEvent.options.find((option) => option.id === state.activeOmenOptionId)?.label}
        </div>
      )}
    </div>
  );
}
