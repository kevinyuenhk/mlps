import type { Adventurer } from '../types';
import {
  characterClassIcon,
  classDisplayName,
  hpColor,
  stressColor,
  traitDisplayName,
} from '../utils/helpers';

interface Props {
  party: Adventurer[];
  divinePower: number;
  maxDivinePower: number;
  compact?: boolean;
}

function StatBar({
  label,
  value,
  max,
  colorClass,
}: {
  label: string;
  value: number;
  max: number;
  colorClass: string;
}) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px] tracking-[0.22em] text-stone-500">
        <span>{label}</span>
        <span className="text-stone-300">{Math.round(value)}</span>
      </div>
      <div className="stat-bar-wrap h-2 bg-stone-800">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function PartyPanel({ party, divinePower, maxDivinePower, compact = false }: Props) {
  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="panel-header">隊伍狀態</div>
      <div className="border-b border-stone-800 px-4 py-4">
        <div className="mb-2 flex items-center justify-between text-xs tracking-[0.25em] text-stone-500">
          <span>神力</span>
          <span className="text-sky-100">
            {divinePower}/{maxDivinePower}
          </span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: maxDivinePower }, (_, index) => (
            <div
              key={index}
              className={[
                'h-3 flex-1 rounded-full border',
                index < divinePower ? 'border-sky-300/60 bg-sky-300/80' : 'border-stone-700 bg-stone-900',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto ${compact ? 'space-y-2 p-2' : 'space-y-3 p-3'}`}>
        {party.map((member) => (
          <div
            key={member.id}
            className={[
              'rounded-2xl border bg-stone-950/70',
              compact ? 'p-2.5' : 'p-3',
              member.alive ? 'border-stone-800' : 'border-rose-500/30 opacity-60',
            ].join(' ')}
          >
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-stone-700 bg-stone-900 text-lg">
                {characterClassIcon(member.class)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-stone-100">{member.name}</div>
                <div className="text-xs text-stone-500">{classDisplayName(member.class)}</div>
              </div>
              <div className="text-right text-[11px] tracking-[0.22em] text-stone-500">
                {member.alive ? '就緒' : '倒下'}
              </div>
            </div>

            <div className="space-y-2">
              <StatBar label="體力" value={member.hp} max={member.maxHp} colorClass={hpColor(member.hp, member.maxHp)} />
              <StatBar label="壓力" value={member.stress} max={100} colorClass={stressColor(member.stress)} />
            </div>

            {!compact && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {member.traits.map((trait) => (
                  <span key={trait} className="trait-badge">
                    {traitDisplayName(trait)}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
