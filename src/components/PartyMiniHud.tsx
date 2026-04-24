import type { Adventurer } from '../types';
import { characterClassIcon } from '../utils/helpers';

interface Props {
  party: Adventurer[];
}

function HpDots({ current, max }: { current: number; max: number }) {
  const totalDots = 5;
  const filled = Math.max(0, Math.min(totalDots, Math.round((current / max) * totalDots)));

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalDots }, (_, index) => (
        <span
          key={index}
          className={[
            'h-1.5 w-1.5 rounded-full',
            index < filled ? 'bg-emerald-400' : 'bg-stone-700',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

export default function PartyMiniHud({ party }: Props) {
  return (
    <div className="flex items-center gap-2">
      {party.map((member) => (
        <div
          key={member.id}
          className={[
            'min-w-0 rounded-[20px] border px-2 py-2',
            member.alive ? 'border-white/10 bg-white/5' : 'border-rose-400/20 bg-rose-500/10 opacity-70',
          ].join(' ')}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#0d1219] text-sm">
              <span>{characterClassIcon(member.class)}</span>
              {!member.alive && (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-rose-200">
                  X
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-stone-100">{member.name}</div>
              <HpDots current={member.hp} max={member.maxHp} />
              <div className="mt-1 flex items-center gap-1 text-[10px] text-stone-400">
                <span>壓力 {member.stress}</span>
                {member.traits.slice(0, 1).map((trait) => (
                  <span key={trait} className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px]">
                    {trait.slice(0, 1)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
