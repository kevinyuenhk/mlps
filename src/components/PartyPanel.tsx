import type { Adventurer } from '../types';
import { characterClassIcon, hpColor, stressColor } from '../utils/helpers';

interface Props {
  party: Adventurer[];
  divinePower: number;
  maxDivinePower: number;
}

function MiniBar({
  value,
  max,
  colorClass,
}: {
  value: number;
  max: number;
  colorClass: string;
}) {
  return (
    <div className="stat-bar-wrap w-full">
      <div
        className={`h-full rounded-full transition-all ${colorClass}`}
        style={{ width: `${Math.max(0, (value / max) * 100)}%` }}
      />
    </div>
  );
}

function CharacterRow({ a }: { a: Adventurer }) {
  return (
    <div className={`p-3 rounded-lg bg-gray-800 border border-gray-700 ${!a.alive ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{characterClassIcon(a.class)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-medium text-gray-100 truncate">{a.name}</span>
            <span className="text-xs text-gray-500 ml-1">{a.class}</span>
          </div>
        </div>
        {!a.alive && <span className="text-xs text-red-400 shrink-0">✗</span>}
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {a.traits.map((t) => (
          <span key={t} className="text-xs px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
            {t}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="grid grid-cols-[40px_1fr_32px] items-center gap-1 text-xs text-gray-500">
          <span>HP</span>
          <MiniBar value={a.hp} max={a.maxHp} colorClass={hpColor(a.hp, a.maxHp)} />
          <span className="text-right">{a.hp}</span>
        </div>
        <div className="grid grid-cols-[40px_1fr_32px] items-center gap-1 text-xs text-gray-500">
          <span>Stress</span>
          <MiniBar value={a.stress} max={100} colorClass={stressColor(a.stress)} />
          <span className="text-right">{a.stress}</span>
        </div>
        <div className="grid grid-cols-[40px_1fr_32px] items-center gap-1 text-xs text-gray-500">
          <span>Faith</span>
          <MiniBar value={a.faith} max={100} colorClass="bg-violet-500" />
          <span className="text-right">{a.faith}</span>
        </div>
      </div>
    </div>
  );
}

export default function PartyPanel({ party, divinePower, maxDivinePower }: Props) {
  const powerDots = Array.from({ length: maxDivinePower }, (_, i) => i < divinePower);

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header">Party</div>

      {/* Divine Power */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500">Divine Power</span>
          <span className="text-xs text-amber-400 font-semibold">
            {divinePower} / {maxDivinePower}
          </span>
        </div>
        <div className="flex gap-1.5">
          {powerDots.map((filled, i) => (
            <div
              key={i}
              className={`h-3 w-3 rounded-full border ${
                filled
                  ? 'bg-amber-400 border-amber-300'
                  : 'bg-gray-800 border-gray-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {party.map((a) => (
          <CharacterRow key={a.id} a={a} />
        ))}
      </div>
    </div>
  );
}
