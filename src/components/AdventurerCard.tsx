import type { Adventurer } from '../types';
import { characterClassIcon, hpColor, stressColor } from '../utils/helpers';

interface Props {
  adventurer: Adventurer;
  selected?: boolean;
  selectable?: boolean;
  onClick?: () => void;
  showStats?: boolean;
}

export default function AdventurerCard({
  adventurer: a,
  selected = false,
  selectable = false,
  onClick,
  showStats = false,
}: Props) {
  const hpPct = Math.round((a.hp / a.maxHp) * 100);
  const riskLabel = a.riskBias === 'high' ? 'Bold' : a.riskBias === 'low' ? 'Cautious' : 'Measured';
  const riskColors: Record<string, string> = {
    high: 'text-red-400',
    medium: 'text-amber-400',
    low: 'text-green-400',
  };

  return (
    <div
      onClick={selectable ? onClick : undefined}
      className={[
        'panel p-4 flex flex-col gap-3 transition-all',
        selectable && 'cursor-pointer hover:border-gray-500',
        selected && 'card-selected border-amber-600',
        !a.alive && 'opacity-50',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{characterClassIcon(a.class)}</span>
            <div>
              <div className="font-semibold text-gray-100">{a.name}</div>
              <div className="text-xs text-gray-500">{a.class}</div>
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xs font-medium ${riskColors[a.riskBias]}`}>{riskLabel}</div>
          <div className="text-xs text-gray-500">Risk Bias</div>
        </div>
      </div>

      {/* Traits */}
      <div className="flex flex-wrap gap-1">
        {a.traits.map((t) => (
          <span key={t} className="trait-badge">{t}</span>
        ))}
      </div>

      {/* Faith + Loyalty bars */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <div className="flex justify-between text-gray-500 mb-1">
            <span>Faith</span>
            <span>{a.faith}</span>
          </div>
          <div className="stat-bar-wrap">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${a.faith}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-gray-500 mb-1">
            <span>Loyalty</span>
            <span>{a.loyalty}</span>
          </div>
          <div className="stat-bar-wrap">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${a.loyalty}%` }}
            />
          </div>
        </div>
      </div>

      {/* HP + Stress (expedition mode) */}
      {showStats && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="flex justify-between text-gray-500 mb-1">
              <span>HP</span>
              <span>{a.hp}/{a.maxHp}</span>
            </div>
            <div className="stat-bar-wrap">
              <div
                className={`h-full rounded-full transition-all ${hpColor(a.hp, a.maxHp)}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-gray-500 mb-1">
              <span>Stress</span>
              <span>{a.stress}</span>
            </div>
            <div className="stat-bar-wrap">
              <div
                className={`h-full rounded-full transition-all ${stressColor(a.stress)}`}
                style={{ width: `${a.stress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bio */}
      <p className="text-xs text-gray-500 leading-relaxed">{a.shortBio}</p>

      {selected && selectable && (
        <div className="text-xs text-amber-400 font-medium text-center">✓ Selected</div>
      )}
      {!a.alive && (
        <div className="text-xs text-red-400 font-medium text-center">✗ Fallen</div>
      )}
    </div>
  );
}
