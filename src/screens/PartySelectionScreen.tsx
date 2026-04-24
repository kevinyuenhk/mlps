import { useState } from 'react';
import type { Adventurer } from '../types';
import { ADVENTURER_POOL } from '../data/adventurers';
import AdventurerCard from '../components/AdventurerCard';

interface Props {
  onConfirm: (selectedIds: string[]) => void;
}

const MAX_PARTY = 3;

export default function PartySelectionScreen({ onConfirm }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggleSelect(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_PARTY) {
      setSelected([...selected, id]);
    }
  }

  const canContinue = selected.length === MAX_PARTY;

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Temple of Awakening</div>
          <h1 className="text-2xl font-bold text-gray-100">Summon Your Party</h1>
          <p className="text-sm text-gray-500 mt-1">
            Choose 3 adventurers to send into the Abandoned Graveyard.
          </p>
        </div>

        {/* Mission summary */}
        <div className="panel p-4 text-sm w-full sm:w-64 sm:shrink-0">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Mission</div>
          <div className="font-semibold text-amber-300 mb-1">Recover the Sacred Relic</div>
          <div className="text-gray-500 text-xs leading-relaxed">
            Region: Abandoned Graveyard<br/>
            Danger: High<br/>
            Est. duration: Unknown
          </div>
        </div>
      </div>

      {/* Party slot indicators */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <span className="text-sm text-gray-500">Party slots:</span>
        {Array.from({ length: MAX_PARTY }, (_, i) => {
          const member = selected[i]
            ? ADVENTURER_POOL.find((a) => a.id === selected[i])
            : null;
          return (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                member
                  ? 'border-amber-600 bg-amber-950/30 text-amber-300'
                  : 'border-gray-700 bg-gray-900 text-gray-700'
              }`}
            >
              {member ? member.name : `Slot ${i + 1}`}
            </div>
          );
        })}
        <span className="text-xs text-gray-600 ml-auto">
          {selected.length}/{MAX_PARTY} selected
        </span>
      </div>

      {/* Adventurer pool */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 flex-1">
        {ADVENTURER_POOL.map((a) => (
          <AdventurerCard
            key={a.id}
            adventurer={a}
            selected={selected.includes(a.id)}
            selectable={true}
            onClick={() => toggleSelect(a.id)}
          />
        ))}
      </div>

      {/* Trait legend */}
      <div className="panel p-3">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Trait Guide</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-4 gap-y-1 text-xs text-gray-500">
          {[
            ['Brave', 'Rushes danger; avoids retreat'],
            ['Loyal', 'Mission-focused; votes carry weight'],
            ['Stubborn', 'Commits hard; resists retreat'],
            ['Compassionate', 'Prioritizes mercy; may slow party'],
            ['Fearful', 'Prefers safety; avoids combat'],
            ['Devout', 'Divine commands amplified 30%'],
            ['Greedy', 'Tempted by treasure; ignores warnings'],
            ['Clever', 'Favors tactical/scout options'],
            ['Skeptical', 'Halves divine influence'],
            ['Curious', 'Drawn to investigate/explore'],
            ['Rational', 'Prefers measured low-risk options'],
            ['Fragile', 'Penalized at high-risk when low HP'],
            ['Calm', 'Steady; stress affects them less'],
            ['Dutiful', 'Follows orders; mission-first'],
            ['Wary', 'Strongly prefers safe routes'],
          ].map(([name, effect]) => (
            <div key={name} className="flex gap-1">
              <span className="font-medium text-gray-400 shrink-0">{name}:</span>
              <span>{effect}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Continue */}
      <div className="flex justify-end">
        <button
          disabled={!canContinue}
          onClick={() => onConfirm(selected)}
          className="btn-primary px-6 sm:px-8 w-full sm:w-auto"
        >
          {canContinue
            ? `Continue with ${selected.map((id) => ADVENTURER_POOL.find((a) => a.id === id)?.name).join(', ')}`
            : `Select ${MAX_PARTY - selected.length} more adventurer${MAX_PARTY - selected.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
