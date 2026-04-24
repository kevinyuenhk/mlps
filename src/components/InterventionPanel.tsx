import type { GameEvent, InterventionType, RunState } from '../types';

interface Props {
  state: RunState;
  currentEvent: GameEvent | null;
  onIntervene: (type: InterventionType, optionId?: string) => void;
  eventResolved: boolean;
}

interface InterventionDef {
  type: InterventionType;
  label: string;
  shortDesc: string;
  cost: number;
  icon: string;
}

const DEFS: InterventionDef[] = [
  {
    type: 'omen',
    label: 'Send Omen',
    shortDesc: 'Nudge party toward an option. Select option after clicking.',
    cost: 1,
    icon: '👁',
  },
  {
    type: 'blessing',
    label: 'Bestow Blessing',
    shortDesc: 'Strengthen unity. Party votes are more cohesive this round.',
    cost: 1,
    icon: '✦',
  },
  {
    type: 'miracle',
    label: 'Invoke Miracle',
    shortDesc: 'Heal all (+20 HP, −20 stress). Powerful but costly.',
    cost: 2,
    icon: '⚡',
  },
];

export default function InterventionPanel({
  state,
  currentEvent,
  onIntervene,
  eventResolved,
}: Props) {
  const { divinePower, activeBlessing, interventionsUsed, activeOmenOptionId, activeBlessingBoost } = state;

  const firstOmenFree =
    activeBlessing === 'guiding_omen' &&
    !interventionsUsed.some((i) => i.type === 'omen');

  function canAfford(cost: number, type: InterventionType): boolean {
    const effectiveCost = type === 'omen' && firstOmenFree ? 0 : cost;
    return divinePower >= effectiveCost;
  }

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {DEFS.map((def) => {
        const effectiveCost = def.type === 'omen' && firstOmenFree ? 0 : def.cost;
        const affordable = canAfford(def.cost, def.type);
        const alreadyActive =
          (def.type === 'omen' && activeOmenOptionId !== null) ||
          (def.type === 'blessing' && activeBlessingBoost);
        const disabled = !affordable || eventResolved || alreadyActive;

        return (
          <div key={def.type} className="relative group">
            <button
              disabled={disabled}
              onClick={() => {
                if (def.type === 'omen') {
                  // Omen requires selecting an option — we trigger a prompt via parent
                  onIntervene('omen');
                } else {
                  onIntervene(def.type);
                }
              }}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all',
                alreadyActive
                  ? 'bg-violet-900 border-violet-600 text-violet-300'
                  : affordable && !eventResolved
                  ? 'bg-gray-800 border-gray-600 hover:border-amber-500 hover:text-amber-300 text-gray-300'
                  : 'bg-gray-900 border-gray-700 text-gray-600 cursor-not-allowed',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span>{def.icon}</span>
              <span>{def.label}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  effectiveCost === 0
                    ? 'bg-green-900 text-green-400'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {effectiveCost === 0 ? 'FREE' : `${effectiveCost}⚡`}
              </span>
              {alreadyActive && (
                <span className="text-xs text-violet-400">Active</span>
              )}
            </button>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-52 bg-gray-800 border border-gray-600 rounded-lg p-2 text-xs text-gray-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
              {def.shortDesc}
              {def.type === 'omen' && currentEvent && (
                <div className="mt-1 text-gray-500">
                  Options: {currentEvent.options.map((o) => o.label).join(', ')}
                </div>
              )}
              {firstOmenFree && def.type === 'omen' && (
                <div className="mt-1 text-green-400">
                  Guiding Omen: first use is free!
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
