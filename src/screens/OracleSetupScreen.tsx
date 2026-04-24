import { useMemo, useState } from 'react';
import type {
  Adventurer,
  BlessingType,
  OracleConfig,
  PrimaryGoal,
  RiskTolerance,
  SecondaryPriority,
} from '../types';
import { generateCharacterInterpretation, parseOracle } from '../game/oracleParser';
import OracleSummary from '../components/OracleSummary';
import { classDisplayName, characterClassIcon } from '../utils/helpers';

interface Props {
  party: Adventurer[];
  onConfirm: (config: OracleConfig) => void;
}

const PRIMARY_GOALS: Array<{ id: PrimaryGoal; label: string; note: string }> = [
  { id: 'recover_relic', label: '奪回遺物', note: '最高任務專注。' },
  { id: 'rescue_survivors', label: '救援', note: '慈悲優先路線。' },
  { id: 'purge_corruption', label: '清除腐敗', note: '更強侵略性，更少克制。' },
  { id: 'scout_graveyard', label: '偵察', note: '潛行與情報優先。' },
];

const SECONDARY: Array<{ id: SecondaryPriority; label: string }> = [
  { id: 'survival', label: '求生' },
  { id: 'help_wounded', label: '救助傷者' },
  { id: 'avoid_conflict', label: '避免衝突' },
  { id: 'seek_wealth', label: '搜刮' },
  { id: 'move_quickly', label: '加速前進' },
];

const BLESSINGS: Array<{ id: BlessingType; label: string; note: string }> = [
  { id: 'shielding_light', label: '護盾之光', note: '首個受傷房間傷害減半。' },
  { id: 'healing_grace', label: '治癒恩典', note: '以更健康、更平靜的狀態出發。' },
  { id: 'guiding_omen', label: '引導神諭', note: '首次神諭免費使用。' },
];

export default function OracleSetupScreen({ party, onConfirm }: Props) {
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('recover_relic');
  const [secondaryPriorities, setSecondaryPriorities] = useState<SecondaryPriority[]>(['survival']);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('medium');
  const [startingBlessing, setStartingBlessing] = useState<BlessingType>('shielding_light');
  const [addendumText, setAddendumText] = useState('');

  const config: OracleConfig = {
    primaryGoal,
    secondaryPriorities,
    riskTolerance,
    addendumText,
    startingBlessing,
  };

  const intent = useMemo(() => parseOracle(config), [config]);
  const interpretations = useMemo(
    () =>
      party.map((member) => ({
        member,
        lines: generateCharacterInterpretation(member, intent),
      })),
    [intent, party]
  );

  function togglePriority(priority: SecondaryPriority) {
    if (secondaryPriorities.includes(priority)) {
      setSecondaryPriorities(secondaryPriorities.filter((entry) => entry !== priority));
      return;
    }

    if (secondaryPriorities.length < 2) {
      setSecondaryPriorities([...secondaryPriorities, priority]);
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#101319_0%,#0a0d12_100%)] px-4 py-6 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <div className="text-xs uppercase tracking-[0.35em] text-stone-500">神諭設定</div>
          <h1 className="mt-2 text-3xl font-semibold text-stone-100">設定突擊信號</h1>
          <p className="mt-2 text-sm text-stone-400">簡化輸入。隊伍將透過信仰、職業、狀態和特質詮釋這些信號。</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <section className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">主要目標</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {PRIMARY_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setPrimaryGoal(goal.id)}
                    className={[
                      'rounded-2xl border px-4 py-4 text-left transition',
                      primaryGoal === goal.id
                        ? 'border-amber-300/70 bg-amber-300/10'
                        : 'border-stone-800 bg-stone-950/50 hover:border-stone-600',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold text-stone-100">{goal.label}</div>
                    <div className="mt-1 text-xs text-stone-500">{goal.note}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-stone-100">次要優先事項</div>
                <div className="text-xs text-stone-500">最多選 2 項</div>
              </div>
              <div className="flex flex-wrap gap-2">
                {SECONDARY.map((priority) => {
                  const active = secondaryPriorities.includes(priority.id);
                  const blocked = !active && secondaryPriorities.length >= 2;
                  return (
                    <button
                      key={priority.id}
                      type="button"
                      onClick={() => togglePriority(priority.id)}
                      disabled={blocked}
                      className={[
                        'rounded-full border px-4 py-2 text-sm transition',
                        active
                          ? 'border-amber-300/70 bg-amber-300/10 text-amber-100'
                          : blocked
                          ? 'border-stone-900 bg-stone-950/30 text-stone-700'
                          : 'border-stone-700 bg-stone-950/50 text-stone-300 hover:border-stone-500',
                      ].join(' ')}
                    >
                      {priority.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">風險容忍度</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {(['low', 'medium', 'high'] as RiskTolerance[]).map((risk) => {
                  const riskLabel: Record<RiskTolerance, string> = { low: '低', medium: '中', high: '高' };
                  return (
                  <button
                    key={risk}
                    type="button"
                    onClick={() => setRiskTolerance(risk)}
                    className={[
                      'rounded-2xl border px-4 py-4 text-center text-sm uppercase tracking-[0.2em] transition',
                      riskTolerance === risk
                        ? 'border-amber-300/70 bg-amber-300/10 text-amber-100'
                        : 'border-stone-800 bg-stone-950/50 text-stone-400 hover:border-stone-600',
                    ].join(' ')}
                  >
                    {riskLabel[risk]}
                  </button>
                  );
                })}
              </div>
            </section>

            <section className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">起始祝福</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {BLESSINGS.map((blessing) => (
                  <button
                    key={blessing.id}
                    type="button"
                    onClick={() => setStartingBlessing(blessing.id)}
                    className={[
                      'rounded-2xl border px-4 py-4 text-left transition',
                      startingBlessing === blessing.id
                        ? 'border-violet-300/70 bg-violet-300/10'
                        : 'border-stone-800 bg-stone-950/50 hover:border-stone-600',
                    ].join(' ')}
                  >
                    <div className="text-sm font-semibold text-stone-100">{blessing.label}</div>
                    <div className="mt-1 text-xs text-stone-500">{blessing.note}</div>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">附加指令</div>
              <textarea
                rows={2}
                value={addendumText}
                onChange={(event) => setAddendumText(event.target.value.slice(0, 120))}
                placeholder="選填關鍵字：安全、快速、救援、潛行、神器優先……"
                className="w-full rounded-2xl border border-stone-700 bg-stone-950/70 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-600 focus:border-amber-300/60"
              />
            </section>
          </div>

          <div className="space-y-5">
            <div className="panel p-4">
              <div className="mb-3 text-sm font-semibold text-stone-100">神諭讀數</div>
              <OracleSummary intent={intent} compact />
            </div>

            <div className="panel p-4">
              <div className="mb-4 text-sm font-semibold text-stone-100">隊伍詮釋</div>
              <div className="space-y-3">
                {interpretations.map(({ member, lines }) => (
                  <div key={member.id} className="rounded-2xl border border-stone-800 bg-stone-950/60 p-3">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-700 bg-stone-900 text-lg">
                        {characterClassIcon(member.class)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-stone-100">{member.name}</div>
                        <div className="text-xs text-stone-500">{classDisplayName(member.class)}</div>
                      </div>
                      <div className="text-right text-xs text-stone-500">
                        信仰 {member.faith}
                        <div>忠誠 {member.loyalty}</div>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-stone-400">
                      {lines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn-primary w-full py-3 text-base" onClick={() => onConfirm(config)}>
              進入地牢
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
