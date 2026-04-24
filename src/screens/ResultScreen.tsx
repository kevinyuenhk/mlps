import type { RunState } from '../types';
import {
  countDivineAlignmentRate,
  evaluateMissionResult,
} from '../game/expeditionManager';
import {
  characterClassIcon,
  classDisplayName,
  hpColor,
  missionResultColor,
  missionResultLabel,
  stressColor,
} from '../utils/helpers';

interface Props {
  state: RunState;
  onRestart: () => void;
}

export default function ResultScreen({ state, onRestart }: Props) {
  const result = evaluateMissionResult(state);
  const alignmentRate = Math.round(countDivineAlignmentRate(state) * 100);
  const survivors = state.party.filter((member) => member.alive);
  const injuries = state.party.filter((member) => member.alive && member.hp / member.maxHp < 0.5);
  const divergences = state.resolutions.filter((resolution) => !resolution.followedDivineIntent);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#2d2418_0%,#11131a_30%,#090c11_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="panel panel-strong p-6 text-center">
          <div className="text-xs uppercase tracking-[0.35em] text-stone-500">突擊報告</div>
          <h1 className={`mt-3 text-4xl font-semibold ${missionResultColor(result)}`}>
            {missionResultLabel(result)}
          </h1>
          <div className="mt-3 text-sm text-stone-400">
            首領 {state.bossCleared ? '已擊敗' : '未擊敗'} • 出口 {state.escaped ? '已抵達' : '未抵達'} • 神器 {state.relicRecovered ? '已奪回' : '已遺失'}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ['首領', state.bossCleared ? '已擊敗' : '未擊敗'],
            ['生還', `${survivors.length}/${state.party.length}`],
            ['受傷', `${injuries.length}`],
            ['戰利品', `${state.totalLoot}`],
            ['契合率', `${alignmentRate}%`],
            ['偏離次數', `${divergences.length}`],
          ].map(([label, value]) => (
            <div key={label} className="panel p-4 text-center">
              <div className="text-xs uppercase tracking-[0.25em] text-stone-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold text-stone-100">{value}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="panel p-4">
            <div className="mb-4 text-sm font-semibold text-stone-100">隊伍結局</div>
            <div className="space-y-3">
              {state.party.map((member) => (
                <div key={member.id} className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-700 bg-stone-900 text-xl">
                      {characterClassIcon(member.class)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-stone-100">{member.name}</div>
                      <div className="text-xs text-stone-500">{classDisplayName(member.class)}</div>
                    </div>
                    <div className={`text-xs uppercase tracking-[0.25em] ${member.alive ? 'text-emerald-200' : 'text-rose-300'}`}>
                      {member.alive ? '存活' : '倒下'}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-stone-500">
                        <span>體力</span>
                        <span className="text-stone-300">{member.hp}/{member.maxHp}</span>
                      </div>
                      <div className="stat-bar-wrap h-2 bg-stone-800">
                        <div className={`h-full rounded-full ${hpColor(member.hp, member.maxHp)}`} style={{ width: `${(member.hp / member.maxHp) * 100}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-stone-500">
                        <span>壓力</span>
                        <span className="text-stone-300">{member.stress}</span>
                      </div>
                      <div className="stat-bar-wrap h-2 bg-stone-800">
                        <div className={`h-full rounded-full ${stressColor(member.stress)}`} style={{ width: `${member.stress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">行進路線</div>
              <div className="flex flex-wrap gap-2">
                {state.pathTaken.map((nodeId) => {
                  const node = state.nodes.find((entry) => entry.id === nodeId);
                  return (
                    <span key={nodeId} className="rounded-full border border-stone-700 px-3 py-2 text-xs text-stone-300">
                      {node?.icon} {node?.name}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">房間總覽</div>
              <div className="space-y-2">
                {state.resolutions.map((resolution) => (
                  <div key={resolution.nodeId} className="rounded-2xl border border-stone-800 bg-stone-950/60 px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-stone-100">{resolution.nodeName}</div>
                        <div className="text-xs text-stone-500">{resolution.chosenOptionLabel}</div>
                      </div>
                      <div className={`text-xs uppercase tracking-[0.2em] ${resolution.followedDivineIntent ? 'text-emerald-200' : 'text-amber-200'}`}>
                        {resolution.followedDivineIntent ? '契合' : '偏離'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">神諭摩擦</div>
              <div className="text-sm text-stone-400">
                {divergences.length === 0
                  ? '無重大偏離，隊伍大致遵從神諭。'
                  : `${divergences.length} 次房間決策偏離了神諭路線。`}
              </div>
              <div className="mt-3 space-y-2 text-sm text-stone-500">
                {divergences.map((resolution) => (
                  <div key={resolution.nodeId}>{resolution.nodeName}: {resolution.divergenceNote}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button className="btn-primary mx-auto px-8 py-3" onClick={onRestart}>
          重新突擊
        </button>
      </div>
    </div>
  );
}
