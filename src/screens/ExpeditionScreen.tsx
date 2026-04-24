import { useMemo, useState } from 'react';
import type { EventOption, InterventionType, RunState } from '../types';
import { getEventById } from '../data/events';
import { previewPartyDecision } from '../game/decisionEngine';
import {
  applyIntervention,
  moveToNode,
  resolveCurrentEvent,
} from '../game/expeditionManager';
import PartyPanel from '../components/PartyPanel';
import NodeMap from '../components/NodeMap';
import InterventionPanel from '../components/InterventionPanel';
import OracleSummary from '../components/OracleSummary';
import ExpeditionLog from '../components/ExpeditionLog';
import { riskColor, roomTypeIcon, roomTypeLabel } from '../utils/helpers';

interface Props {
  state: RunState;
  onStateChange: (next: RunState) => void;
  onExpeditionComplete: () => void;
}

function OptionCard({
  option,
  selectedForOmen,
  omenMode,
  votes,
  onSelectOmen,
}: {
  option: EventOption;
  selectedForOmen: boolean;
  omenMode: boolean;
  votes: number;
  onSelectOmen: (optionId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => omenMode && onSelectOmen(option.id)}
      className={[
        'w-full rounded-2xl border px-4 py-3 text-left transition',
        selectedForOmen ? 'border-violet-300/60 bg-violet-300/10' : 'border-stone-800 bg-stone-950/70',
        omenMode ? 'hover:border-violet-300/60' : '',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{option.intentIcon}</span>
            <span className="text-sm font-semibold text-stone-100">{option.label}</span>
          </div>
          <div className="mt-1 text-xs text-stone-500">{option.description}</div>
        </div>
        <div className="text-right">
          <div className={`inline-flex rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${riskColor(option.riskLevel)}`}>
            {option.riskLevel}
          </div>
          <div className="mt-2 text-xs text-stone-500">{votes} 票</div>
        </div>
      </div>
    </button>
  );
}

export default function ExpeditionScreen({ state, onStateChange, onExpeditionComplete }: Props) {
  const [selectingOmen, setSelectingOmen] = useState(false);

  const currentNode = state.nodes.find((node) => node.id === state.currentNodeId);
  const currentEvent = currentNode?.eventId ? getEventById(currentNode.eventId) : undefined;
  const currentResolution = state.resolutions.find((resolution) => resolution.nodeId === state.currentNodeId);
  const currentResolved = Boolean(currentResolution);
  const routeChoices =
    currentNode?.nextNodeIds
      .map((nodeId) => state.nodes.find((node) => node.id === nodeId))
      .filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? [];

  const preview = useMemo(() => {
    if (!currentEvent || !state.divinIntent || currentResolved) return null;
    return previewPartyDecision(
      currentEvent,
      state.party,
      state.divinIntent,
      state.activeOmenOptionId,
      state.activeBlessingBoost
    );
  }, [
    currentEvent,
    currentResolved,
    state.activeBlessingBoost,
    state.activeOmenOptionId,
    state.divinIntent,
    state.party,
  ]);

  function handleIntervene(type: InterventionType, optionId?: string) {
    if (type === 'omen' && !optionId) {
      setSelectingOmen(true);
      return;
    }

    onStateChange(applyIntervention(state, type, optionId));
    setSelectingOmen(false);
  }

  function handleResolve() {
    const next = resolveCurrentEvent(state);
    onStateChange(next);
    setSelectingOmen(false);
  }

  function handleMove(nextNodeId: string) {
    const next = moveToNode(state, nextNodeId);
    onStateChange(next);
  }

  function handleViewResults() {
    onExpeditionComplete();
  }

  const voteCountByOption = Object.fromEntries(
    (currentEvent?.options ?? []).map((option) => [
      option.id,
      preview?.characterDecisions.filter((decision) => decision.preferredOptionId === option.id).length ?? 0,
    ])
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0b0e13_0%,#0d1117_100%)] p-3 sm:p-4">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1700px] flex-col gap-3">
        <div className="grid flex-1 gap-3 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
          <div className="min-h-0">
            <PartyPanel
              party={state.party}
              divinePower={state.divinePower}
              maxDivinePower={state.maxDivinePower}
            />
          </div>

          <div className="flex min-h-0 flex-col gap-3">
            <NodeMap
              nodes={state.nodes}
              currentNodeId={state.currentNodeId}
              visibleNodeIds={state.visibleNodeIds}
              resolvedNodeIds={state.resolvedNodeIds}
              pathTaken={state.pathTaken}
            />

            {state.divinIntent && (
              <div className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-stone-500">神諭</div>
                    <div className="text-sm text-stone-300">信號讀數</div>
                  </div>
                  <div className="rounded-full border border-stone-700 px-3 py-1 text-xs text-stone-300">
                    {state.totalLoot} 戰利品
                  </div>
                </div>
                <OracleSummary intent={state.divinIntent} compact />
              </div>
            )}
          </div>

          <div className="min-h-0">
            <div className="panel flex h-full flex-col overflow-hidden">
              <div className="panel-header">遭遇戰</div>
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {currentNode && (
                  <div className="rounded-[28px] border border-stone-800 bg-stone-950/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-700 bg-stone-900 text-2xl">
                          {roomTypeIcon(currentNode.type)}
                        </div>
                        <div>
                          <div className="text-xs uppercase tracking-[0.3em] text-stone-500">
                            {roomTypeLabel(currentNode.type)}
                          </div>
                          <div className="text-xl font-semibold text-stone-100">
                            {currentEvent?.title ?? currentNode.name}
                          </div>
                        </div>
                      </div>
                      {currentNode.type === 'boss' && (
                        <div className="rounded-full border border-amber-300/50 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-amber-100">
                          首領
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-stone-400">
                      {currentEvent?.description ?? currentNode.description}
                    </p>
                  </div>
                )}

                {currentNode?.type === 'entrance' && !currentEvent && (
                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-stone-800 bg-stone-950/70 p-4">
                      <div className="text-sm text-stone-300">
                        隊伍集合在門口。第一個房間可見，更深處的分支仍被迷霧遮蔽。
                      </div>
                    </div>
                    <button className="btn-primary w-full py-3" onClick={() => handleMove('vanguard')}>
                      深入
                    </button>
                  </div>
                )}

                {currentEvent && !currentResolved && (
                  <>
                    {preview && (
                      <div className="rounded-[28px] border border-stone-800 bg-stone-950/70 p-4">
                        <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-stone-500">
                          隊伍意圖
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {preview.characterDecisions.map((decision) => {
                            const preferredOption = currentEvent.options.find(
                              (option) => option.id === decision.preferredOptionId
                            );
                            return (
                              <div
                                key={decision.characterId}
                                className="rounded-full border border-stone-700 bg-stone-900 px-3 py-2 text-xs text-stone-300"
                              >
                                {decision.characterName} → {preferredOption?.intentIcon} {preferredOption?.intentLabel}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {currentEvent.options.map((option) => (
                        <OptionCard
                          key={option.id}
                          option={option}
                          selectedForOmen={state.activeOmenOptionId === option.id}
                          omenMode={selectingOmen}
                          votes={voteCountByOption[option.id] ?? 0}
                          onSelectOmen={(optionId) => handleIntervene('omen', optionId)}
                        />
                      ))}
                    </div>

                    <InterventionPanel state={state} currentEvent={currentEvent} onIntervene={handleIntervene} />

                    {selectingOmen && (
                      <div className="rounded-2xl border border-violet-300/30 bg-violet-300/10 px-3 py-3 text-sm text-violet-100">
                        選擇一張行動卡來鎖定神諭。
                      </div>
                    )}

                    <button className="btn-primary w-full py-3" onClick={handleResolve}>
                      決定
                    </button>
                  </>
                )}

                {currentEvent && currentResolution && (
                  <div className="space-y-4">
                    <div className="rounded-[28px] border border-stone-800 bg-stone-950/70 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="text-sm font-semibold text-stone-100">{currentResolution.chosenOptionLabel}</div>
                        <div className="text-xs text-stone-500">
                          {currentResolution.followedDivineIntent ? '契合' : '偏離'}
                        </div>
                      </div>
                      <div className="text-sm text-stone-400">{currentResolution.outcomeText}</div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-500">
                        <span>體力 {currentResolution.hpChangePerMember >= 0 ? '+' : ''}{currentResolution.hpChangePerMember}</span>
                        <span>壓力 {currentResolution.stressChangePerMember >= 0 ? '+' : ''}{currentResolution.stressChangePerMember}</span>
                        <span>戰利品 +{currentResolution.lootDelta}</span>
                      </div>
                    </div>

                    {routeChoices.length > 0 && !state.expeditionComplete && (
                      <div className="space-y-2">
                        <div className="text-[11px] uppercase tracking-[0.25em] text-stone-500">選擇路線</div>
                        <div className="grid gap-2">
                          {routeChoices.map((route) => (
                            <button
                              key={route.id}
                              type="button"
                              onClick={() => handleMove(route.id)}
                              className="rounded-2xl border border-stone-800 bg-stone-950/70 px-4 py-3 text-left transition hover:border-amber-300/50"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{route.icon}</span>
                                <div>
                                  <div className="text-sm font-semibold text-stone-100">{route.name}</div>
                                  <div className="text-xs text-stone-500">{route.description}</div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {state.expeditionComplete && (
                      <button className="btn-primary w-full py-3" onClick={handleViewResults}>
                        查看報告
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ExpeditionLog entries={state.expeditionLog} />
      </div>
    </div>
  );
}
