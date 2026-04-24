import type { RunState } from '../types';
import {
  evaluateMissionResult,
  countDivineAlignmentRate,
} from '../game/expeditionManager';
import {
  missionResultLabel,
  missionResultColor,
  hpColor,
  stressColor,
  characterClassIcon,
  goalLabel,
  priorityLabel,
} from '../utils/helpers';
import OracleSummary from '../components/OracleSummary';

interface Props {
  state: RunState;
  onRestart: () => void;
}

export default function ResultScreen({ state, onRestart }: Props) {
  const missionResult = evaluateMissionResult(state);
  const alignmentRate = countDivineAlignmentRate(state);
  const survivors = state.party.filter((a) => a.alive);
  const fallen = state.party.filter((a) => !a.alive);

  const resultBg = {
    success: 'from-green-950 via-gray-950 to-gray-950',
    partial: 'from-amber-950 via-gray-950 to-gray-950',
    failure: 'from-red-950 via-gray-950 to-gray-950',
  }[missionResult];

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-b ${resultBg}`}>
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-8 text-center">
        <div className="text-5xl mb-3">
          {missionResult === 'success' ? '🏆' : missionResult === 'partial' ? '⚖️' : '💀'}
        </div>
        <h1 className={`text-4xl font-bold mb-2 ${missionResultColor(missionResult)}`}>
          {missionResultLabel(missionResult)}
        </h1>
        <p className="text-gray-400 text-sm">
          {missionResult === 'success'
            ? 'The relic has been recovered. Your followers proved worthy.'
            : missionResult === 'partial'
            ? 'Something was achieved — but the mission was not fully completed.'
            : 'The expedition faltered. Your will went unheeded, or the cost was too great.'}
        </p>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-6">

        {/* Quick stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: 'Relic Status',
              value: state.relicRecovered ? 'Recovered' : 'Lost',
              color: state.relicRecovered ? 'text-amber-400' : 'text-red-400',
            },
            {
              label: 'Survivors',
              value: `${survivors.length} / ${state.party.length}`,
              color: survivors.length > 0 ? 'text-green-400' : 'text-red-400',
            },
            {
              label: 'Divine Alignment',
              value: `${Math.round(alignmentRate * 100)}%`,
              color: alignmentRate >= 0.6 ? 'text-amber-400' : 'text-gray-400',
            },
            {
              label: 'Interventions Used',
              value: `${state.interventionsUsed.length}`,
              color: 'text-violet-400',
            },
          ].map((stat) => (
            <div key={stat.label} className="panel p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Party outcomes */}
          <div className="panel p-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
              Party Outcomes
            </h2>
            <div className="space-y-4">
              {state.party.map((char) => {
                const pool = state.resolutions.flatMap((r) =>
                  r.characterDecisions.filter((cd) => cd.characterId === char.id)
                );
                const followedCount = state.resolutions.filter(
                  (r) =>
                    r.characterDecisions.find((cd) => cd.characterId === char.id)
                      ?.preferredOptionId === r.chosenOptionId
                ).length;
                const totalEvents = state.resolutions.length;
                const alligmentPct =
                  totalEvents > 0 ? Math.round((followedCount / totalEvents) * 100) : 0;

                const hpPct = Math.round((char.hp / char.maxHp) * 100);

                return (
                  <div
                    key={char.id}
                    className={`p-3 rounded-lg bg-gray-800 border ${
                      char.alive ? 'border-gray-700' : 'border-red-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{characterClassIcon(char.class)}</span>
                        <div>
                          <span className="font-semibold text-gray-100">{char.name}</span>
                          <span className="text-xs text-gray-500 ml-1">{char.class}</span>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        {char.alive ? (
                          <span className="text-green-400">Survived</span>
                        ) : (
                          <span className="text-red-400">Fallen</span>
                        )}
                      </div>
                    </div>

                    {/* Trait badges */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {char.traits.map((t) => (
                        <span key={t} className="trait-badge">{t}</span>
                      ))}
                    </div>

                    {/* Stat bars */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <div className="flex justify-between text-gray-600 mb-0.5">
                          <span>HP</span><span>{char.hp}/{char.maxHp}</span>
                        </div>
                        <div className="stat-bar-wrap">
                          <div
                            className={`h-full rounded-full ${hpColor(char.hp, char.maxHp)}`}
                            style={{ width: `${hpPct}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-600 mb-0.5">
                          <span>Stress</span><span>{char.stress}</span>
                        </div>
                        <div className="stat-bar-wrap">
                          <div
                            className={`h-full rounded-full ${stressColor(char.stress)}`}
                            style={{ width: `${char.stress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Faith: <span className="text-violet-400">{char.faith}</span></span>
                      <span>Loyalty: <span className="text-amber-400">{char.loyalty}</span></span>
                      <span>
                        Agreement with party:{' '}
                        <span className={alligmentPct >= 60 ? 'text-green-400' : 'text-amber-400'}>
                          {alligmentPct}%
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divine influence report */}
          <div className="space-y-4">
            {state.divinIntent && (
              <div className="panel p-4">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-3">
                  Your Divine Intent
                </h2>
                <OracleSummary intent={state.divinIntent} compact />
              </div>
            )}

            <div className="panel p-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-3">
                Divine Influence Report
              </h2>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-gray-500">Overall alignment:</span>
                  <span
                    className={alignmentRate >= 0.6 ? 'text-amber-400' : 'text-gray-400'}
                  >
                    {Math.round(alignmentRate * 100)}% of decisions matched divine intent
                  </span>
                </div>
                {state.interventionsUsed.length > 0 && (
                  <div>
                    <div className="text-gray-500 mb-1">Interventions used:</div>
                    <ul className="space-y-0.5 pl-2">
                      {state.interventionsUsed.map((iv, i) => (
                        <li key={i} className="text-gray-500">
                          · {iv.type.charAt(0).toUpperCase() + iv.type.slice(1)}
                          {iv.optionId ? ` (Omen → ${iv.optionId})` : ''}
                          {' '}at node {iv.nodeIndex + 1}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="text-gray-500">
                  Starting blessing:{' '}
                  <span className="text-violet-400">{state.activeBlessing?.replace(/_/g, ' ')}</span>
                </div>
              </div>
            </div>

            <div className="panel p-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-3">
                Divine Power Remaining
              </h2>
              <div className="flex gap-1.5">
                {Array.from({ length: state.maxDivinePower }, (_, i) => (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-full border ${
                      i < state.divinePower
                        ? 'bg-amber-400 border-amber-300'
                        : 'bg-gray-800 border-gray-600'
                    }`}
                  />
                ))}
                <span className="text-xs text-gray-500 ml-2">
                  {state.divinePower} / {state.maxDivinePower} unspent
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline: key decisions */}
        <div className="panel p-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-4">
            Expedition Timeline
          </h2>
          {state.resolutions.length === 0 ? (
            <p className="text-gray-600 text-sm">No events resolved.</p>
          ) : (
            <div className="space-y-4">
              {state.resolutions.map((res, i) => {
                const diverged = !res.followedDivineIntent;
                return (
                  <div
                    key={res.eventId}
                    className={`p-3 rounded-lg border ${
                      diverged
                        ? 'border-amber-800 bg-amber-950/20'
                        : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-xs text-gray-600 mr-2">
                          Event {i + 1} — {res.nodeName}
                        </span>
                        <span className="text-sm font-semibold text-gray-200">
                          {res.chosenOptionLabel}
                        </span>
                      </div>
                      {diverged ? (
                        <span className="text-xs text-amber-500 shrink-0">⚠ Diverged</span>
                      ) : (
                        <span className="text-xs text-green-600 shrink-0">✓ Aligned</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mb-2 italic">{res.outcomeText}</p>

                    {res.divergenceNote && (
                      <p className="text-xs text-amber-600">{res.divergenceNote}</p>
                    )}

                    {/* Per-character stances */}
                    <div className="flex flex-wrap gap-3 mt-2">
                      {res.characterDecisions.map((dec) => {
                        const chose = dec.preferredOptionId === res.chosenOptionId;
                        const topTag = dec.tags[res.chosenOptionId]?.[0];
                        return (
                          <div
                            key={dec.characterId}
                            className={`text-xs ${chose ? 'text-gray-300' : 'text-gray-600'}`}
                            title={topTag ?? ''}
                          >
                            <span className="font-medium">{dec.characterName}</span>
                            {chose ? (
                              <span className="text-green-600 ml-1">★ agreed</span>
                            ) : (
                              <span className="text-amber-600 ml-1">
                                · wanted{' '}
                                {
                                  res.characterDecisions
                                    .find((d) => d.characterId === dec.characterId)
                                    ?.preferredOptionId
                                }
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {res.interventionUsed && (
                      <div className="text-xs text-violet-400 mt-1">
                        {res.interventionUsed === 'omen' ? '👁 Omen applied' : '✦ Blessing applied'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Notable divergences */}
        {state.resolutions.some((r) => !r.followedDivineIntent) && (
          <div className="panel p-4 border-amber-800">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-amber-600 mb-3">
              ⚠ Notable Divergences from Divine Will
            </h2>
            <div className="space-y-2">
              {state.resolutions
                .filter((r) => !r.followedDivineIntent)
                .map((r) => (
                  <div key={r.eventId} className="text-xs text-amber-700 leading-relaxed">
                    · {r.nodeName}: {r.divergenceNote}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Restart */}
        <div className="text-center py-4">
          <button onClick={onRestart} className="btn-primary px-10 text-base">
            Begin a New Run
          </button>
          <p className="text-xs text-gray-700 mt-3">
            A different party, oracle, or intervention will produce a different story.
          </p>
        </div>
      </div>
    </div>
  );
}
