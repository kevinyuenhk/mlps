import type { RunState } from '../types';
import { countDivineAlignmentRate, evaluateMissionResult } from '../game/expeditionManager';
import MobileShell from '../components/MobileShell';
import { missionResultColor, missionResultLabel } from '../utils/helpers';

interface Props {
  state: RunState;
  onRestart: () => void;
}

export default function ResultScreen({ state, onRestart }: Props) {
  const result = evaluateMissionResult(state);
  const alignmentRate = Math.round(countDivineAlignmentRate(state) * 100);
  const survivors = state.party.filter((member) => member.alive);
  const divergences = state.resolutions.filter((resolution) => !resolution.followedDivineIntent);

  return (
    <MobileShell>
      <div className="flex min-h-[calc(100dvh-24px)] flex-col gap-4 rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,#263340_0%,#0d1118_34%,#05070b_100%)] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-center">
          <div className="text-[10px] uppercase tracking-[0.34em] text-stone-500">遠征結果</div>
          <div className={`mt-3 text-4xl font-semibold ${missionResultColor(result)}`}>
            {missionResultLabel(result)}
          </div>
          <div className="mt-3 text-sm text-stone-400">
            首領 {state.bossCleared ? '已擊敗' : '未擊敗'} ・ 撤離 {state.escaped ? '成功' : '失敗'} ・ 神器 {state.relicRecovered ? '已奪回' : '未奪回'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            ['生還', `${survivors.length}/${state.party.length}`],
            ['戰利品', `${state.totalLoot}`],
            ['契合率', `${alignmentRate}%`],
            ['偏離', `${divergences.length}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-center">
              <div className="text-[10px] uppercase tracking-[0.26em] text-stone-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-100">{value}</div>
            </div>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">隊伍收尾</div>
            <div className="space-y-2">
              {state.party.map((member) => (
                <div key={member.id} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-semibold text-stone-100">{member.name}</div>
                    <div className={member.alive ? 'text-[12px] text-emerald-200' : 'text-[12px] text-rose-300'}>
                      {member.alive ? '存活' : '倒下'}
                    </div>
                  </div>
                  <div className="mt-1 text-[12px] text-stone-400">
                    體力 {member.hp}/{member.maxHp} ・ 壓力 {member.stress}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">路徑時間線</div>
            <div className="space-y-3">
              {state.pathTaken.map((mapId, index) => {
                const map = state.maps.find((entry) => entry.id === mapId);
                return (
                  <div key={`${mapId}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/20 text-sm">
                        {map?.icon ?? '•'}
                      </div>
                      {index < state.pathTaken.length - 1 && <div className="mt-1 h-8 w-px bg-white/10" />}
                    </div>
                    <div className="flex-1 rounded-[18px] border border-white/10 bg-black/20 px-3 py-3">
                      <div className="text-sm font-semibold text-stone-100">{map?.name ?? mapId}</div>
                      <div className="mt-1 text-[12px] text-stone-400">{map?.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">神諭摩擦</div>
            <div className="text-sm text-stone-400">
              {divergences.length === 0
                ? '本次非戰鬥決策幾乎都順著神意。'
                : `${divergences.length} 次非戰鬥決策偏離了原先神諭。`}
            </div>
            <div className="mt-3 space-y-2 text-sm text-stone-300">
              {divergences.map((resolution) => (
                <div key={resolution.nodeId} className="rounded-[18px] border border-white/10 bg-black/20 px-3 py-2">
                  {resolution.nodeName}：{resolution.divergenceNote}
                </div>
              ))}
            </div>
          </section>
        </div>

        <button className="btn-primary w-full" onClick={onRestart}>
          重新遠征
        </button>
      </div>
    </MobileShell>
  );
}
