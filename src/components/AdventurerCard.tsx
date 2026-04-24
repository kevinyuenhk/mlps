import type { Adventurer } from '../types';
import {
  characterClassIcon,
  classDisplayName,
  traitDisplayName,
} from '../utils/helpers';

interface Props {
  adventurer: Adventurer;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
}

export default function AdventurerCard({
  adventurer,
  selected = false,
  selectable = false,
  onClick,
}: Props) {
  const riskTone = {
    high: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
    medium: 'text-amber-200 border-amber-500/30 bg-amber-500/10',
    low: 'text-emerald-200 border-emerald-500/30 bg-emerald-500/10',
  }[adventurer.riskBias];

  return (
    <button
      type="button"
      onClick={selectable ? onClick : undefined}
      className={[
        'panel group flex h-full flex-col gap-4 p-4 text-left transition',
        selectable ? 'hover:border-stone-500 hover:bg-stone-900/80' : '',
        selected ? 'card-selected border-amber-300/80 bg-amber-200/5' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-700 bg-stone-900 text-2xl">
            {characterClassIcon(adventurer.class)}
          </div>
          <div>
            <div className="text-lg font-semibold text-stone-100">{adventurer.name}</div>
            <div className="text-sm text-stone-400">{classDisplayName(adventurer.class)}</div>
          </div>
        </div>
        <div className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.25em] ${riskTone}`}>
          {adventurer.riskBias}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-3">
          <div className="text-stone-500">Faith</div>
          <div className="mt-1 text-lg font-semibold text-violet-200">{adventurer.faith}</div>
        </div>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-3">
          <div className="text-stone-500">Loyalty</div>
          <div className="mt-1 text-lg font-semibold text-amber-200">{adventurer.loyalty}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {adventurer.traits.map((trait) => (
          <span key={trait} className="trait-badge">
            {traitDisplayName(trait)}
          </span>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-stone-400">{adventurer.shortBio}</p>

      <div className="mt-auto flex items-center justify-between text-xs">
        <div className="text-stone-500">
          HP {adventurer.hp}/{adventurer.maxHp} • Stress {adventurer.stress}
        </div>
        {selected && <div className="font-semibold text-amber-200">Selected</div>}
      </div>
    </button>
  );
}
