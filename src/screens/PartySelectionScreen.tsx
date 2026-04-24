import { useState } from 'react';
import type { Adventurer } from '../types';
import { ADVENTURER_POOL } from '../data/adventurers';
import AdventurerCard from '../components/AdventurerCard';
import MobileShell from '../components/MobileShell';
import { characterClassIcon } from '../utils/helpers';

interface Props {
  onConfirm: (party: Adventurer[]) => void;
  onBack: () => void;
}

const PARTY_SIZE = 3;

export default function PartySelectionScreen({ onConfirm, onBack }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((entry) => entry !== id));
      return;
    }

    if (selectedIds.length < PARTY_SIZE) {
      setSelectedIds([...selectedIds, id]);
    }
  }

  const selectedParty = selectedIds
    .map((id) => ADVENTURER_POOL.find((member) => member.id === id))
    .filter((member): member is Adventurer => Boolean(member));

  return (
    <MobileShell>
      <div className="flex min-h-[calc(100dvh-24px)] flex-col gap-4 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,24,0.96),rgba(5,7,11,1))] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.34em] text-stone-500">隊伍編成</div>
          <h1 className="mt-2 text-3xl font-semibold text-stone-100">選擇 3 名冒險者</h1>
          <p className="mt-2 text-sm text-stone-400">
            角色會依自己的性格與神諭信號作決定。你只負責選人，不直接發號施令。
          </p>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-stone-100">已選隊伍</div>
            <div className="text-[11px] text-stone-400">{selectedParty.length}/3</div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: PARTY_SIZE }, (_, index) => {
              const member = selectedParty[index];
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-black/20 px-3 py-3"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#0d1219] text-lg">
                    {member ? characterClassIcon(member.class) : '+'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-stone-100">
                      {member ? member.name : `位置 ${index + 1}`}
                    </div>
                    <div className="text-[12px] text-stone-400">
                      {member ? member.shortBio.split('。')[0] : '尚未選定'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {ADVENTURER_POOL.map((adventurer) => (
            <AdventurerCard
              key={adventurer.id}
              adventurer={adventurer}
              selected={selectedIds.includes(adventurer.id)}
              selectable
              onClick={() => toggle(adventurer.id)}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onBack}
            className="tap-btn rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-200"
          >
            返回
          </button>
          <button
            className="btn-primary"
            disabled={selectedIds.length !== PARTY_SIZE}
            onClick={() => onConfirm(selectedParty)}
          >
            {selectedIds.length === PARTY_SIZE ? '確定隊伍' : `還差 ${PARTY_SIZE - selectedIds.length} 人`}
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
