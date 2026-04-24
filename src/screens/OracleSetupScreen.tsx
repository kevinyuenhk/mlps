import { useState, useMemo } from 'react';
import type {
  Adventurer,
  BlessingType,
  OracleConfig,
  PrimaryGoal,
  SecondaryPriority,
  RiskTolerance,
} from '../types';
import { parseOracle, generateCharacterInterpretation } from '../game/oracleParser';
import OracleSummary from '../components/OracleSummary';
import { classDisplayName } from '../utils/helpers';

interface Props {
  party: Adventurer[];
  onConfirm: (config: OracleConfig) => void;
}

const PRIMARY_GOALS: { id: PrimaryGoal; label: string; desc: string }[] = [
  { id: 'recover_relic', label: '取回神器', desc: '首要指令：不惜一切取回神器。' },
  { id: 'rescue_survivors', label: '救援倖存者', desc: '慈悲優先——拯救任何找到的生靈。' },
  { id: 'purge_corruption', label: '清除腐敗', desc: '消滅亡靈污染；神器為次要目標。' },
  { id: 'scout_graveyard', label: '偵察墓地', desc: '情報是目標——隱蔽地收集資訊。' },
];

const SECONDARY_PRIORITIES: { id: SecondaryPriority; label: string }[] = [
  { id: 'survival', label: '優先求生' },
  { id: 'help_wounded', label: '救助傷者' },
  { id: 'avoid_conflict', label: '避免衝突' },
  { id: 'seek_wealth', label: '尋找財富' },
  { id: 'move_quickly', label: '快速行進' },
];

const BLESSINGS: { id: BlessingType; label: string; desc: string }[] = [
  { id: 'shielding_light', label: '護盾之光', desc: '首個危險事件：體力傷害降低50%。' },
  { id: 'healing_grace', label: '治癒恩典', desc: '全隊起始體力+15，壓力−10。' },
  { id: 'guiding_omen', label: '引導神諭', desc: '第一次使用神諭免費。' },
];

const MAX_SECONDARY = 2;

export default function OracleSetupScreen({ party, onConfirm }: Props) {
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>('recover_relic');
  const [secondaryPriorities, setSecondaryPriorities] = useState<SecondaryPriority[]>([]);
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance>('medium');
  const [addendumText, setAddendumText] = useState('');
  const [blessing, setBlessing] = useState<BlessingType>('shielding_light');

  const config: OracleConfig = {
    primaryGoal,
    secondaryPriorities,
    riskTolerance,
    addendumText,
    startingBlessing: blessing,
  };

  const intent = useMemo(() => parseOracle(config), [primaryGoal, secondaryPriorities, riskTolerance, addendumText]);

  const characterInterpretations = useMemo(
    () => party.map((char) => ({ char, lines: generateCharacterInterpretation(char, intent) })),
    [party, intent]
  );

  function toggleSecondary(p: SecondaryPriority) {
    if (secondaryPriorities.includes(p)) {
      setSecondaryPriorities(secondaryPriorities.filter((x) => x !== p));
    } else if (secondaryPriorities.length < MAX_SECONDARY) {
      setSecondaryPriorities([...secondaryPriorities, p]);
    }
  }

  function handleConfirm() {
    onConfirm(config);
  }

  const riskLabels: Record<RiskTolerance, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };

  const riskColors: Record<RiskTolerance, string> = {
    low: 'text-green-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 gap-4 sm:gap-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">神諭密室</div>
        <h1 className="text-2xl font-bold text-gray-100">定義你的神聖意圖</h1>
        <p className="text-sm text-gray-500 mt-1">
          你的指令將透過每位信徒的性格和信仰來詮釋。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1">
        {/* LEFT: Oracle config form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-5">

          {/* A. Primary Goal */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              A. 主要目標
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRIMARY_GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setPrimaryGoal(g.id)}
                  className={[
                    'text-left p-3 rounded-lg border transition-all',
                    primaryGoal === g.id
                      ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600',
                  ].join(' ')}
                >
                  <div className="font-medium text-sm mb-0.5">{g.label}</div>
                  <div className="text-xs opacity-70">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* B. Secondary Priorities */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
              B. 次要優先事項
            </h3>
            <p className="text-xs text-gray-600 mb-3">最多選擇 {MAX_SECONDARY} 項。</p>
            <div className="flex flex-wrap gap-2">
              {SECONDARY_PRIORITIES.map((p) => {
                const active = secondaryPriorities.includes(p.id);
                const disabled = !active && secondaryPriorities.length >= MAX_SECONDARY;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleSecondary(p.id)}
                    disabled={disabled}
                    className={[
                      'px-3 py-1.5 rounded-lg border text-sm transition-all',
                      active
                        ? 'border-amber-500 bg-amber-950/30 text-amber-300'
                        : disabled
                        ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                        : 'border-gray-700 text-gray-400 hover:border-gray-600',
                    ].join(' ')}
                  >
                    {p.label}
                    {active && ' ✓'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Risk Tolerance */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              C. 風險承受度
            </h3>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as RiskTolerance[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskTolerance(r)}
                  className={[
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                    riskTolerance === r
                      ? `border-current ${riskColors[r]} bg-gray-800`
                      : 'border-gray-700 text-gray-500 hover:border-gray-600',
                  ].join(' ')}
                >
                  {riskLabels[r]}
                </button>
              ))}
            </div>
          </div>

          {/* D. Free-text Addendum */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
              D. 神聖補充
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              選填。關鍵字會被解析以調整意圖：「救援」、「避免戰鬥」、「財寶」、「快速」、「安全」、「神器優先」、「潛行」等。
            </p>
            <textarea
              value={addendumText}
              onChange={(e) => setAddendumText(e.target.value.slice(0, 100))}
              placeholder="例如：除非必要，不要戰鬥。拯救任何找到的倖存者。"
              rows={2}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 resize-none focus:outline-none focus:border-amber-600 transition-colors"
            />
            <div className="text-xs text-gray-700 text-right mt-1">{addendumText.length}/100</div>
          </div>

          {/* E. Starting Blessing */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              E. 起始祝福
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {BLESSINGS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBlessing(b.id)}
                  className={[
                    'text-left p-3 rounded-lg border transition-all',
                    blessing === b.id
                      ? 'border-violet-500 bg-violet-950/30 text-violet-300'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600',
                  ].join(' ')}
                >
                  <div className="font-medium text-sm mb-0.5">{b.label}</div>
                  <div className="text-xs opacity-70">{b.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Live preview */}
        <div className="space-y-4">
          {/* Divine intent summary */}
          <div className="panel p-4">
            <div className="panel-header -mx-4 -mt-4 mb-3">神聖意志摘要</div>
            <OracleSummary intent={intent} compact />
          </div>

          {/* Character interpretations */}
          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              隊伍如何詮釋此意圖
            </div>
            <div className="space-y-4">
              {characterInterpretations.map(({ char, lines }) => (
                <div key={char.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-200">{char.name}</span>
                    <span className="text-xs text-gray-600">{classDisplayName(char.class)}</span>
                    <span className="ml-auto text-xs text-gray-600">
                      信仰 {char.faith}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {lines.map((line, i) => (
                      <li key={i} className="text-xs text-gray-500 leading-relaxed">
                        · {line}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleConfirm} className="btn-primary px-8 text-base w-full sm:w-auto">
          開始遠征
        </button>
      </div>
    </div>
  );
}
