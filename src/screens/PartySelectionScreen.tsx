import { useState } from 'react';
import { ADVENTURER_POOL } from '../data/adventurers';
import AdventurerCard from '../components/AdventurerCard';
import { characterClassIcon } from '../utils/helpers';

interface Props {
  onConfirm: (selectedIds: string[]) => void;
}

const PARTY_SIZE = 3;

export default function PartySelectionScreen({ onConfirm }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(selected.filter((entry) => entry !== id));
      return;
    }

    if (selected.length < PARTY_SIZE) {
      setSelected([...selected, id]);
    }
  }

  const selectedParty = selected
    .map((id) => ADVENTURER_POOL.find((member) => member.id === id))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1d1f29_0%,#10141a_38%,#090b10_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            <div className="text-xs uppercase tracking-[0.35em] text-stone-500">選隊</div>
            <h1 className="mt-2 text-3xl font-semibold text-stone-100">選擇 3 名冒險者</h1>
            <p className="mt-2 text-sm text-stone-400">
              組建突擊小隊闖地牢。性格和職業本能會影響每個房間的投票。
            </p>
          </div>

          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-stone-100">出擊隊伍</div>
              <div className="text-xs text-stone-500">{selected.length}/3</div>
            </div>
            <div className="space-y-2">
              {Array.from({ length: PARTY_SIZE }, (_, index) => {
                const member = selectedParty[index];
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700 bg-stone-900 text-lg">
                      {member ? characterClassIcon(member.class) : '+'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-stone-200">
                        {member ? member.name : `位置 ${index + 1}`}
                      </div>
                      <div className="text-xs text-stone-500">
                        {member ? member.shortBio.split('。')[0] : '選擇隊員'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {ADVENTURER_POOL.map((adventurer) => (
            <AdventurerCard
              key={adventurer.id}
              adventurer={adventurer}
              selected={selected.includes(adventurer.id)}
              selectable
              onClick={() => toggle(adventurer.id)}
            />
          ))}
        </div>

        <div className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-stone-400">
            當前隊伍：
            <span className="ml-2 text-stone-100">
              {selectedParty.length > 0
                ? selectedParty.map((member) => member?.name ?? '').filter(Boolean).join(', ')
                : '未選'}
            </span>
          </div>
          <button
            className="btn-primary px-8 py-3"
            disabled={selected.length !== PARTY_SIZE}
            onClick={() => onConfirm(selected)}
          >
            {selected.length === PARTY_SIZE ? '確認出擊' : `再選 ${PARTY_SIZE - selected.length} 人`}
          </button>
        </div>
      </div>
    </div>
  );
}
