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
import MobileShell from '../components/MobileShell';
import OracleSummary from '../components/OracleSummary';
import { classDisplayName, characterClassIcon } from '../utils/helpers';

interface Props {
  party: Adventurer[];
  onConfirm: (config: OracleConfig) => void;
  onBack: () => void;
}

const PRIMARY_GOALS: Array<{ id: PrimaryGoal; label: string; note: string }> = [
  { id: 'recover_relic', label: '奪回神器', note: '任務焦點最高。' },
  { id: 'rescue_survivors', label: '營救生還者', note: '偏慈悲與保全。' },
  { id: 'purge_corruption', label: '淨化邪穢', note: '更偏進攻。' },
  { id: 'scout_graveyard', label: '偵察墓城', note: '偏情報與潛行。' },
];

const SECONDARY: Array<{ id: SecondaryPriority; label: string }> = [
  { id: 'survival', label: '求生' },
  { id: 'help_wounded', label: '救援' },
  { id: 'avoid_conflict', label: '避戰' },
  { id: 'seek_wealth', label: '搜刮' },
  { id: 'move_quickly', label: '加速' },
];

const BLESSINGS: Array<{ id: BlessingType; label: string; note: string }> = [
  { id: 'shielding_light', label: '護盾之光', note: '首次危險傷害減半。' },
  { id: 'healing_grace', label: '治癒恩典', note: '開局回體降壓。' },
  { id: 'guiding_omen', label: '引導神諭', note: '首次徵兆免費。' },
];

export default function OracleSetupScreen({ party, onConfirm, onBack }: Props) {
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
    <MobileShell>
      <div className="flex min-h-[calc(100dvh-24px)] flex-col gap-4 rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(12,17,24,0.96),rgba(5,7,11,1))] p-4 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div>
          <div className="text-[10px] uppercase tracking-[0.34em] text-stone-500">神諭設置</div>
          <h1 className="mt-2 text-3xl font-semibold text-stone-100">設定本次神意</h1>
          <p className="mt-2 text-sm text-stone-400">
            你提供的是傾向，不是命令。隊伍會把神意與自身個性混合，自己作出探索與戰鬥判斷。
          </p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">主要目標</div>
            <div className="space-y-2">
              {PRIMARY_GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => setPrimaryGoal(goal.id)}
                  className={[
                    'tap-btn w-full rounded-[20px] border px-4 py-3 text-left transition',
                    primaryGoal === goal.id
                      ? 'border-amber-300/60 bg-amber-300/10'
                      : 'border-white/10 bg-black/20',
                  ].join(' ')}
                >
                  <div className="text-sm font-semibold text-stone-100">{goal.label}</div>
                  <div className="mt-1 text-[12px] text-stone-400">{goal.note}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-stone-100">次要優先</div>
              <div className="text-[11px] text-stone-500">最多 2 項</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                      'tap-btn rounded-[18px] border px-3 py-3 text-sm transition',
                      active
                        ? 'border-amber-300/60 bg-amber-300/10 text-amber-100'
                        : blocked
                        ? 'border-white/5 bg-black/10 text-stone-600'
                        : 'border-white/10 bg-black/20 text-stone-200',
                    ].join(' ')}
                  >
                    {priority.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">風險容忍</div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as RiskTolerance[]).map((risk) => (
                <button
                  key={risk}
                  type="button"
                  onClick={() => setRiskTolerance(risk)}
                  className={[
                    'tap-btn rounded-[18px] border px-3 py-3 text-sm tracking-[0.18em] transition',
                    riskTolerance === risk
                      ? 'border-amber-300/60 bg-amber-300/10 text-amber-100'
                      : 'border-white/10 bg-black/20 text-stone-200',
                  ].join(' ')}
                >
                  {risk === 'low' ? '穩健' : risk === 'medium' ? '均衡' : '冒進'}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">出發祝福</div>
            <div className="space-y-2">
              {BLESSINGS.map((blessing) => (
                <button
                  key={blessing.id}
                  type="button"
                  onClick={() => setStartingBlessing(blessing.id)}
                  className={[
                    'tap-btn w-full rounded-[20px] border px-4 py-3 text-left transition',
                    startingBlessing === blessing.id
                      ? 'border-sky-300/55 bg-sky-300/10'
                      : 'border-white/10 bg-black/20',
                  ].join(' ')}
                >
                  <div className="text-sm font-semibold text-stone-100">{blessing.label}</div>
                  <div className="mt-1 text-[12px] text-stone-400">{blessing.note}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">附註</div>
            <textarea
              rows={3}
              value={addendumText}
              onChange={(event) => setAddendumText(event.target.value.slice(0, 120))}
              placeholder="例如：安全、快速、任務優先、潛行、救援。"
              className="w-full rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-stone-600 focus:border-amber-300/45"
            />
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">神意讀數</div>
            <OracleSummary intent={intent} compact />
          </section>

          <section className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-3 text-sm font-semibold text-stone-100">角色解讀</div>
            <div className="space-y-2">
              {interpretations.map(({ member, lines }) => (
                <div key={member.id} className="rounded-[20px] border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#0d1219] text-lg">
                      {characterClassIcon(member.class)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-stone-100">{member.name}</div>
                      <div className="text-[12px] text-stone-400">{classDisplayName(member.class)}</div>
                    </div>
                    <div className="text-right text-[11px] text-stone-500">
                      <div>信仰 {member.faith}</div>
                      <div>忠誠 {member.loyalty}</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-stone-300">
                    {lines.map((line) => (
                      <div key={line}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onBack}
            className="tap-btn rounded-[18px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-stone-200"
          >
            返回
          </button>
          <button className="btn-primary" onClick={() => onConfirm(config)}>
            開始遠征
          </button>
        </div>
      </div>
    </MobileShell>
  );
}
