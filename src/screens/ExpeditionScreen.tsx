import { useState, useCallback } from 'react';
import type { InterventionType, RunState } from '../types';
import { getEventById } from '../data/events';
import {
  resolveCurrentEvent,
  applyIntervention,
  advanceNode,
} from '../game/expeditionManager';
import PartyPanel from '../components/PartyPanel';
import NodeMap from '../components/NodeMap';
import EventModal from '../components/EventModal';
import ExpeditionLog from '../components/ExpeditionLog';
import InterventionPanel from '../components/InterventionPanel';
import OracleSummary from '../components/OracleSummary';

interface Props {
  state: RunState;
  onStateChange: (next: RunState) => void;
  onExpeditionComplete: () => void;
}

type MobileTab = 'party' | 'expedition' | 'log';

export default function ExpeditionScreen({
  state,
  onStateChange,
  onExpeditionComplete,
}: Props) {
  const [selectingOmen, setSelectingOmen] = useState(false);
  const [eventResolved, setEventResolved] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('expedition');

  const currentNode = state.nodes[state.currentNodeIndex];
  const currentEvent = currentNode?.eventId ? getEventById(currentNode.eventId) : null;

  const currentResolution = eventResolved
    ? state.resolutions.find((r) => r.eventId === currentNode?.eventId) ?? null
    : null;

  function handleIntervene(type: InterventionType, optionId?: string) {
    if (type === 'omen' && !optionId) {
      setSelectingOmen(true);
      return;
    }
    const next = applyIntervention(state, type, optionId);
    onStateChange(next);
    if (type === 'omen') setSelectingOmen(false);
  }

  function handleOmenSelect(optionId: string) {
    handleIntervene('omen', optionId);
  }

  const handleResolve = useCallback(() => {
    if (!currentEvent) return;
    const next = resolveCurrentEvent(state);
    onStateChange(next);
    setEventResolved(true);
    setSelectingOmen(false);
  }, [state, currentEvent, onStateChange]);

  function handleAdvance() {
    setEventResolved(false);
    setSelectingOmen(false);

    const next = advanceNode(state);
    onStateChange(next);

    if (next.expeditionComplete) {
      onExpeditionComplete();
    }
  }

  const isEntranceNode = currentNode?.id === 'entrance';

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-gray-950">
      {/* Top bar: node map */}
      <div className="border-b border-gray-700 bg-gray-900 px-3 md:px-4 py-2 shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">
              荒廢墓地
            </div>
            {state.relicRecovered && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-700">
                ✓ 神器
              </span>
            )}
          </div>
          <div className="flex-1 overflow-x-auto">
            <NodeMap nodes={state.nodes} currentIndex={state.currentNodeIndex} />
          </div>
        </div>
      </div>

      {/* Main body */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Party panel */}
        <div
          className={[
            mobileTab === 'party' ? 'flex' : 'hidden',
            'md:flex flex-col w-full md:w-60 shrink-0 md:border-r border-gray-700 overflow-hidden',
          ].join(' ')}
        >
          <PartyPanel
            party={state.party}
            divinePower={state.divinePower}
            maxDivinePower={state.maxDivinePower}
          />
        </div>

        {/* CENTER: Event + node info */}
        <div
          className={[
            mobileTab === 'expedition' ? 'flex' : 'hidden',
            'md:flex flex-1 flex-col overflow-hidden min-w-0',
          ].join(' ')}
        >
          {/* Node description bar */}
          <div className="border-b border-gray-700 px-4 py-2.5 bg-gray-900/50 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{currentNode?.icon}</span>
              <div>
                <div className="text-sm font-semibold text-gray-200">{currentNode?.name}</div>
                <div className="text-xs text-gray-500 leading-tight">{currentNode?.description}</div>
              </div>
            </div>
          </div>

          {/* Scrollable event area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* ENTRANCE: no event */}
            {isEntranceNode && (
              <div className="panel p-6 text-center animate-fade-in">
                <div className="text-5xl mb-4">🚪</div>
                <h2 className="text-xl font-bold text-gray-100 mb-2">墓門待啟</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-md mx-auto">
                  你的隊伍站在荒廢墓地前。霧氣穿過鐵門繚繞而上。
                  神聖神器就在深處某處等待。
                </p>
                <p className="text-xs text-gray-600 mb-5">
                  你有 {state.divinePower} 點神力。可在事件解決前使用干預。
                </p>
                <button onClick={handleAdvance} className="btn-primary">
                  進入墓地
                </button>
              </div>
            )}

            {/* EVENT: pending */}
            {!isEntranceNode && currentEvent && !eventResolved && (
              <EventModal
                event={currentEvent}
                state={state}
                resolution={null}
                onResolve={handleResolve}
                onOmenSelect={handleOmenSelect}
                selectingOmen={selectingOmen}
              />
            )}

            {/* EVENT: resolved */}
            {!isEntranceNode && currentEvent && eventResolved && currentResolution && (
              <>
                <EventModal
                  event={currentEvent}
                  state={state}
                  resolution={currentResolution}
                  onResolve={handleResolve}
                  onOmenSelect={handleOmenSelect}
                  selectingOmen={false}
                />
                <button onClick={handleAdvance} className="btn-primary w-full">
                  {state.currentNodeIndex >= state.nodes.length - 1
                    ? '查看最終報告'
                    : '繼續遠征 →'}
                </button>
              </>
            )}
          </div>

          {/* Intervention bar */}
          {currentEvent && !eventResolved && (
            <div className="border-t border-gray-700 px-3 py-3 bg-gray-900/50 shrink-0">
              <div className="text-xs text-gray-600 text-center mb-2 uppercase tracking-wide">
                神聖干預
              </div>
              <InterventionPanel
                state={state}
                currentEvent={currentEvent}
                onIntervene={handleIntervene}
                eventResolved={eventResolved}
              />
            </div>
          )}
        </div>

        {/* RIGHT: Log + Oracle */}
        <div
          className={[
            mobileTab === 'log' ? 'flex' : 'hidden',
            'md:flex flex-col w-full md:w-72 shrink-0 md:border-l border-gray-700 overflow-hidden',
          ].join(' ')}
        >
          <div className="flex-1 overflow-hidden">
            <ExpeditionLog entries={state.expeditionLog} />
          </div>
          {state.divinIntent && (
            <div className="border-t border-gray-700 p-3 shrink-0 max-h-64 overflow-y-auto">
              <div className="text-xs uppercase tracking-wide text-gray-600 mb-2">你的意圖</div>
              <OracleSummary intent={state.divinIntent} compact />
            </div>
          )}
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden flex border-t border-gray-700 bg-gray-900 shrink-0">
        {(
          [
            { id: 'party', icon: '👥', label: '隊伍' },
            { id: 'expedition', icon: '⚔️', label: '探險' },
            { id: 'log', icon: '📜', label: '日誌' },
          ] as { id: MobileTab; icon: string; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={[
              'flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs transition-colors',
              mobileTab === tab.id
                ? 'text-amber-400 bg-gray-800'
                : 'text-gray-500 hover:text-gray-400',
            ].join(' ')}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
