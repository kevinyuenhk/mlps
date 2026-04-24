import { useEffect, useMemo } from 'react';
import type { RunState } from '../types';
import { applyBattleIntervention, runBattleRound } from '../game/expeditionManager';
import MobileShell from '../components/MobileShell';
import PartyMiniHud from '../components/PartyMiniHud';
import { battleActionLabel, hpColor } from '../utils/helpers';

interface Props {
  state: RunState;
  onStateChange: (next: RunState) => void;
}

export default function BattleScreen({ state, onStateChange }: Props) {
  const battle = state.battleState;
  if (!battle) return null;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      onStateChange(runBattleRound(state));
    }, battle.round === 1 ? 1100 : 1400);
    return () => window.clearTimeout(timer);
  }, [battle.round, onStateChange, state]);

  const recentLog = useMemo(() => battle.log.slice(-6).reverse(), [battle.log]);

  return (
    <MobileShell>
      <div
        className={[
          'relative h-[calc(100dvh-24px)] overflow-hidden rounded-[34px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.55)]',
          battle.variant === 'boss'
            ? 'bg-[radial-gradient(circle_at_top,#4b211b_0%,#160d11_36%,#07070a_100%)]'
            : 'bg-[radial-gradient(circle_at_top,#20303c_0%,#0e1118_36%,#05070b_100%)]',
        ].join(' ')}
      >
        <div className="absolute inset-x-0 top-0 z-20 p-3">
          <div className="rounded-[26px] border border-white/10 bg-black/30 px-3 py-3 backdrop-blur">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.32em] text-stone-500">
                  {battle.variant === 'boss' ? '首領戰' : '遭遇戰'}
                </div>
                <div className="mt-1 text-lg font-semibold text-stone-100">{battle.roomName}</div>
              </div>
              <div className="flex gap-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                  <div className="text-[10px] text-stone-500">回合</div>
                  <div className="text-sm font-semibold text-stone-100">{battle.round}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center">
                  <div className="text-[10px] text-stone-500">神力</div>
                  <div className="text-sm font-semibold text-sky-200">{state.divinePower}</div>
                </div>
              </div>
            </div>
            <PartyMiniHud party={state.party} />
          </div>
        </div>

        <div className="absolute inset-x-4 top-[142px] bottom-[252px] z-10 flex flex-col rounded-[30px] border border-white/10 bg-black/20 px-4 py-4">
          <div className="flex items-start justify-between">
            <div className="text-[11px] uppercase tracking-[0.3em] text-stone-500">敵群</div>
            {battle.variant === 'boss' && (
              <div className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] text-amber-100">
                決戰氣壓
              </div>
            )}
          </div>

          <div className="mt-3 grid gap-3">
            {battle.enemies.map((enemy, index) => (
              <div
                key={enemy.id}
                className={[
                  'rounded-[24px] border px-3 py-3',
                  enemy.alive ? 'border-white/10 bg-white/[0.04]' : 'border-emerald-300/20 bg-emerald-300/10 opacity-70',
                  battle.variant === 'boss' && index === 0 ? 'min-h-[98px]' : '',
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-base font-semibold text-stone-100">{enemy.name}</div>
                    <div className="text-[11px] text-stone-400">
                      {enemy.alive ? (enemy.studied ? '已被看穿' : '仍在壓制隊伍') : '已被擊倒'}
                    </div>
                  </div>
                  <div className="text-3xl">{battle.variant === 'boss' && index === 0 ? '👑' : '☠️'}</div>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
                    <span>體力</span>
                    <span className="text-stone-300">
                      {enemy.hp}/{enemy.maxHp}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full ${hpColor(enemy.hp, enemy.maxHp)}`}
                      style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="my-4 rounded-[24px] border border-white/10 bg-black/25 px-3 py-3">
            <div className="mb-2 text-[10px] uppercase tracking-[0.28em] text-stone-500">戰況流</div>
            <div className="max-h-[138px] space-y-1 overflow-y-auto text-[12px] text-stone-200">
              {recentLog.map((line, index) => (
                <div key={`${line}-${index}`}>{line}</div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div className="mb-2 text-[11px] uppercase tracking-[0.3em] text-stone-500">我方傾向</div>
            <div className="grid gap-2">
              {battle.lastRoundActions.length === 0 ? (
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-400">
                  隊伍正在觀察敵勢，準備第一輪。
                </div>
              ) : (
                battle.lastRoundActions.map((action) => (
                  <div
                    key={`${action.actorId}-${action.actionType}`}
                    className="rounded-[18px] border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-stone-200"
                  >
                    {action.actorName} 傾向 {battleActionLabel(action.actionType)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 p-3">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(16,20,28,0.96),rgba(10,12,17,0.98))] p-3 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-stone-500">神聖介入</div>
                <div className="mt-1 text-sm font-semibold text-stone-100">回合自動前進，你只能中途扭轉傾向。</div>
              </div>
              <div className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-stone-300">
                自動回合
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onStateChange(applyBattleIntervention(state, 'omen', 'attack'))}
                className="tap-btn rounded-[18px] border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-stone-100"
              >
                徵兆・逼攻
              </button>
              <button
                type="button"
                onClick={() => onStateChange(applyBattleIntervention(state, 'omen', 'guard'))}
                className="tap-btn rounded-[18px] border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-stone-100"
              >
                徵兆・守勢
              </button>
              <button
                type="button"
                onClick={() => onStateChange(applyBattleIntervention(state, 'omen', 'study'))}
                className="tap-btn rounded-[18px] border border-white/10 bg-white/[0.04] px-2 py-2 text-sm text-stone-100"
              >
                徵兆・觀敵
              </button>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onStateChange(applyBattleIntervention(state, 'blessing'))}
                className="tap-btn rounded-[18px] border border-white/10 bg-sky-300/10 px-2 py-2 text-sm text-sky-100"
              >
                祝福
              </button>
              <button
                type="button"
                onClick={() => onStateChange(applyBattleIntervention(state, 'miracle'))}
                className="tap-btn rounded-[18px] border border-white/10 bg-amber-300/10 px-2 py-2 text-sm text-amber-100"
              >
                奇蹟
              </button>
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
