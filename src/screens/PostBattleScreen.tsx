import { useEffect } from 'react';
import type { RunState } from '../types';
import { continueAfterBattle } from '../game/expeditionManager';
import MobileShell from '../components/MobileShell';

interface Props {
  state: RunState;
  onStateChange: (next: RunState) => void;
}

export default function PostBattleScreen({ state, onStateChange }: Props) {
  const summary = state.lastBattleSummary;
  if (!summary) return null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onStateChange(continueAfterBattle(state));
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [onStateChange, state]);

  return (
    <MobileShell>
      <div className="flex h-[calc(100dvh-24px)] flex-col justify-between rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,#22313f_0%,#0d1118_34%,#05070b_100%)] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-center">
          <div className="text-[10px] uppercase tracking-[0.34em] text-stone-500">
            {summary.variant === 'boss' ? '首領戰結算' : '戰鬥結算'}
          </div>
          <div className={`mt-3 text-4xl font-semibold ${summary.result === 'victory' ? 'text-emerald-300' : 'text-rose-300'}`}>
            {summary.result === 'victory' ? '勝利' : '敗退'}
          </div>
          <div className="mt-2 text-sm text-stone-400">
            {summary.roomName} ・ 共 {summary.rounds} 回合
          </div>
        </div>

        <div className="my-4 flex-1 space-y-3 overflow-y-auto">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">隊伍狀態</div>
            <div className="space-y-2">
              {state.party.map((member) => (
                <div key={member.id} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-stone-100">{member.name}</span>
                    <span className={member.alive ? 'text-emerald-200' : 'text-rose-300'}>
                      {member.alive ? '存活' : '倒下'}
                    </span>
                  </div>
                  <div className="mt-1 text-[12px] text-stone-400">
                    體力 {member.hp}/{member.maxHp} ・ 壓力 {member.stress}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">戰後短記</div>
            <div className="space-y-2 text-sm text-stone-300">
              {summary.log.slice(-8).map((line, index) => (
                <div key={`${index}-${line}`} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm text-stone-300">
          {summary.result === 'victory' ? '隊伍正在重整陣型，準備返回探索。' : '遠征即將進入最終結算。'}
        </div>
      </div>
    </MobileShell>
  );
}
