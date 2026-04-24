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

interface Props {
  party: Adventurer[];
  onConfirm: (config: OracleConfig) => void;
}

const PRIMARY_GOALS: { id: PrimaryGoal; label: string; desc: string }[] = [
  { id: 'recover_relic', label: 'Recover the Relic', desc: 'Primary directive: secure the relic above all.' },
  { id: 'rescue_survivors', label: 'Rescue Survivors', desc: 'Mercy takes precedence — save any living souls found.' },
  { id: 'purge_corruption', label: 'Purge Corruption', desc: 'Destroy the undead taint; the relic is secondary.' },
  { id: 'scout_graveyard', label: 'Scout the Graveyard', desc: 'Intelligence is the goal — gather information stealthily.' },
];

const SECONDARY_PRIORITIES: { id: SecondaryPriority; label: string }[] = [
  { id: 'survival', label: 'Prioritize Survival' },
  { id: 'help_wounded', label: 'Help the Wounded' },
  { id: 'avoid_conflict', label: 'Avoid Conflict' },
  { id: 'seek_wealth', label: 'Seek Wealth' },
  { id: 'move_quickly', label: 'Move Quickly' },
];

const BLESSINGS: { id: BlessingType; label: string; desc: string }[] = [
  { id: 'shielding_light', label: 'Shielding Light', desc: 'First harmful event: HP loss reduced by 50%.' },
  { id: 'healing_grace', label: 'Healing Grace', desc: 'Party starts with +15 HP and –10 stress.' },
  { id: 'guiding_omen', label: 'Guiding Omen', desc: 'Your first Omen intervention is free.' },
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

  const riskColors: Record<RiskTolerance, string> = {
    low: 'text-green-400',
    medium: 'text-amber-400',
    high: 'text-red-400',
  };

  return (
    <div className="min-h-screen flex flex-col p-6 gap-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-gray-500 mb-1">Oracle Chamber</div>
        <h1 className="text-2xl font-bold text-gray-100">Define Your Divine Intent</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your commands will be interpreted by each follower through the lens of their traits and faith.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        {/* LEFT: Oracle config form */}
        <div className="lg:col-span-2 space-y-5">

          {/* A. Primary Goal */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              A. Primary Goal
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
              B. Secondary Priorities
            </h3>
            <p className="text-xs text-gray-600 mb-3">Choose up to {MAX_SECONDARY}.</p>
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
              C. Risk Tolerance
            </h3>
            <div className="flex gap-3">
              {(['low', 'medium', 'high'] as RiskTolerance[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRiskTolerance(r)}
                  className={[
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-all capitalize',
                    riskTolerance === r
                      ? `border-current ${riskColors[r]} bg-gray-800`
                      : 'border-gray-700 text-gray-500 hover:border-gray-600',
                  ].join(' ')}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* D. Free-text Addendum */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
              D. Divine Addendum
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              Optional. Keywords are parsed to refine intent: "save", "avoid battle", "treasure", "hurry", "safe", "relic first", "stealth", etc.
            </p>
            <textarea
              value={addendumText}
              onChange={(e) => setAddendumText(e.target.value.slice(0, 100))}
              placeholder="e.g. Do not fight unless necessary. Save any survivors you find."
              rows={2}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-700 resize-none focus:outline-none focus:border-amber-600 transition-colors"
            />
            <div className="text-xs text-gray-700 text-right mt-1">{addendumText.length}/100</div>
          </div>

          {/* E. Starting Blessing */}
          <div className="panel p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              E. Starting Blessing
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
            <div className="panel-header -mx-4 -mt-4 mb-3">Divine Intent Summary</div>
            <OracleSummary intent={intent} compact />
          </div>

          {/* Character interpretations */}
          <div className="panel p-4">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
              How Your Party Interprets This
            </div>
            <div className="space-y-4">
              {characterInterpretations.map(({ char, lines }) => (
                <div key={char.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-gray-200">{char.name}</span>
                    <span className="text-xs text-gray-600">{char.class}</span>
                    <span className="ml-auto text-xs text-gray-600">
                      Faith {char.faith}
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
        <button onClick={handleConfirm} className="btn-primary px-8 text-base">
          Begin Expedition
        </button>
      </div>
    </div>
  );
}
