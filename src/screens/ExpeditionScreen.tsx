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

export default function ExpeditionScreen({
  state,
  onStateChange,
  onExpeditionComplete,
}: Props) {
  const [selectingOmen, setSelectingOmen] = useState(false);
  // True while showing the resolution of the most recent event (before advancing)
  const [eventResolved, setEventResolved] = useState(false);

  const currentNode = state.nodes[state.currentNodeIndex];
  const currentEvent = currentNode?.eventId ? getEventById(currentNode.eventId) : null;

  // The resolution for the current node's event (shown after resolving)
  const currentResolution = eventResolved
    ? state.resolutions.find((r) => r.eventId === currentNode?.eventId) ?? null
    : null;

  // ─────────────────────────────────────────────────────────────
  // Interventions
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Event resolution — resolves the current event but stays on the same node
  // so the player can see the outcome before advancing.
  // ─────────────────────────────────────────────────────────────

  const handleResolve = useCallback(() => {
    if (!currentEvent) return;
    const next = resolveCurrentEvent(state);
    onStateChange(next);
    setEventResolved(true);
    setSelectingOmen(false);
  }, [state, currentEvent, onStateChange]);

  // ─────────────────────────────────────────────────────────────
  // Advance to the next node (after viewing resolution, or from entrance/non-event)
  // ─────────────────────────────────────────────────────────────

  function handleAdvance() {
    setEventResolved(false);
    setSelectingOmen(false);

    const next = advanceNode(state);
    onStateChange(next);

    if (next.expeditionComplete) {
      onExpeditionComplete();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Entrance node: no event, just advance into the graveyard
  // ─────────────────────────────────────────────────────────────

  const isEntranceNode = currentNode?.id === 'entrance';

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-950">
      {/* Top bar: node map */}
      <div className="border-b border-gray-700 bg-gray-900 px-4 py-2 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">
              Abandoned Graveyard
            </div>
            {state.relicRecovered && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-900 text-amber-300 border border-amber-700">
                ✓ Relic Secured
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
        <div className="w-60 shrink-0 border-r border-gray-700 flex flex-col overflow-hidden">
          <PartyPanel
            party={state.party}
            divinePower={state.divinePower}
            maxDivinePower={state.maxDivinePower}
          />
        </div>

        {/* CENTER: Event + node info */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Node description bar */}
          <div className="border-b border-gray-700 px-5 py-2.5 bg-gray-900/50 shrink-0">
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
                <h2 className="text-xl font-bold text-gray-100 mb-2">The Gates Await</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-md mx-auto">
                  Your party stands before the Abandoned Graveyard. Fog curls through the iron gates.
                  The sacred relic waits somewhere in the depths.
                </p>
                <p className="text-xs text-gray-600 mb-5">
                  You have {state.divinePower} divine power. Use interventions before each event resolves.
                </p>
                <button onClick={handleAdvance} className="btn-primary">
                  Enter the Graveyard
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

            {/* EVENT: resolved — show outcome then Continue */}
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
                    ? 'View Final Report'
                    : 'Continue the Expedition →'}
                </button>
              </>
            )}
          </div>

          {/* Intervention bar — only when event is pending */}
          {currentEvent && !eventResolved && (
            <div className="border-t border-gray-700 px-4 py-3 bg-gray-900/50 shrink-0">
              <div className="text-xs text-gray-600 text-center mb-2 uppercase tracking-wide">
                Divine Interventions — act before the party decides
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
        <div className="w-72 shrink-0 border-l border-gray-700 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <ExpeditionLog entries={state.expeditionLog} />
          </div>
          {state.divinIntent && (
            <div className="border-t border-gray-700 p-3 shrink-0 max-h-64 overflow-y-auto">
              <div className="text-xs uppercase tracking-wide text-gray-600 mb-2">Your Intent</div>
              <OracleSummary intent={state.divinIntent} compact />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
