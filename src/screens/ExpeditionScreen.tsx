import { useMemo, useState } from 'react';
import MobileShell from '../components/MobileShell';
import PhaserContainer from '../components/PhaserContainer';
import {
  applyExplorationNudge,
  getExplorationGuidance,
  resolveMapInteractable,
  syncExplorationPosition,
  transitionToMap,
  triggerMapEncounter,
} from '../game/expeditionManager';
import type { RunState } from '../types';

interface Props {
  state: RunState;
  onStateChange: (next: RunState) => void;
}

function HpPips({ current, max }: { current: number; max: number }) {
  const total = 5;
  const filled = Math.max(0, Math.min(total, Math.round((current / max) * total)));

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={[
            'h-1.5 w-2 rounded-full',
            index < filled ? 'bg-emerald-400' : 'bg-white/15',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

export default function ExpeditionScreen({ state, onStateChange }: Props) {
  const [nearestExitLabel, setNearestExitLabel] = useState<string | null>(null);
  const currentMap = useMemo(
    () => state.maps.find((map) => map.id === state.currentMapId) ?? null,
    [state.currentMapId, state.maps]
  );
  const latestLog = state.expeditionLog[state.expeditionLog.length - 1];
  const currentContext = latestLog?.text ?? currentMap?.description ?? '隊伍在長廊中緩慢推進。';
  const mobileContext = [currentContext, nearestExitLabel ? `朝 ${nearestExitLabel} 推進` : null]
    .filter(Boolean)
    .join(' ・ ');

  if (!currentMap) return null;

  return (
    <MobileShell>
      <div className="flex h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[#04070c] shadow-[0_32px_120px_rgba(0,0,0,0.52)]">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-white/10 bg-[#090d14] px-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-none text-stone-50">{currentMap.name}</div>
            <div className="mt-1 flex items-center gap-1.5 overflow-hidden">
              {state.party.map((member) => (
                <div
                  key={member.id}
                  className={[
                    'flex min-w-0 items-center gap-1 rounded-full px-1.5 py-0.5',
                    member.alive ? 'bg-white/5 text-stone-200' : 'bg-rose-500/10 text-rose-200',
                  ].join(' ')}
                >
                  <span className="max-w-[2.5rem] truncate text-[9px] leading-none">{member.name}</span>
                  <HpPips current={member.hp} max={member.maxHp} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 text-[11px] text-stone-100">
            <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-2 py-1 leading-none">
              ⚡{state.divinePower}
            </div>
            <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 leading-none">
              💰{state.totalLoot}
            </div>
          </div>
        </header>

        <div className="w-full flex-1 min-h-[300px] bg-[#06080d] p-2">
          <PhaserContainer
            snapshot={{
              maps: state.maps,
              currentMapId: state.currentMapId,
              token: state.token,
              explorationPhase: state.explorationPhase,
              guidance: getExplorationGuidance(state),
              clearedInteractableIds: state.clearedInteractableIds,
              discoveredExitIds: state.discoveredExitIds,
              encounterCooldowns: state.encounterCooldowns,
              clearedMapIds: state.clearedMapIds,
              revealedAreas: state.revealedAreas,
            }}
            onPositionSync={(payload) => {
              setNearestExitLabel(payload.nearestExitLabel);
              onStateChange(syncExplorationPosition(state, payload));
            }}
            onEncounter={(payload) => onStateChange(triggerMapEncounter(state, payload))}
            onExit={(payload) => onStateChange(transitionToMap(state, payload))}
            onInteractable={(payload) => onStateChange(resolveMapInteractable(state, payload))}
          />
        </div>

        <footer className="shrink-0 border-t border-white/10 bg-[linear-gradient(180deg,rgba(12,15,21,0.98),rgba(7,9,13,1))] px-3 py-3">
          <div className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-stone-200">{mobileContext}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onStateChange(applyExplorationNudge(state, 'speed'))}
              className={[
                'rounded-[16px] border px-2 py-2 text-sm text-stone-100',
                state.explorationNudges.speed ? 'border-sky-300/40 bg-sky-300/10 text-sky-100' : 'border-white/10 bg-white/5',
              ].join(' ')}
            >
              催速
            </button>
            <button
              type="button"
              onClick={() => onStateChange(applyExplorationNudge(state, 'caution'))}
              className={[
                'rounded-[16px] border px-2 py-2 text-sm text-stone-100',
                state.explorationNudges.caution
                  ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
                  : 'border-white/10 bg-white/5',
              ].join(' ')}
            >
              求穩
            </button>
            <button
              type="button"
              onClick={() => onStateChange(applyExplorationNudge(state, 'mission'))}
              className={[
                'rounded-[16px] border px-2 py-2 text-sm text-stone-100',
                state.explorationNudges.mission
                  ? 'border-amber-300/40 bg-amber-300/10 text-amber-100'
                  : 'border-white/10 bg-white/5',
              ].join(' ')}
            >
              任務
            </button>
          </div>
        </footer>
      </div>
    </MobileShell>
  );
}
