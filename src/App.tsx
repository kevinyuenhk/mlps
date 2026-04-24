import { useState, useCallback } from 'react';
import type { OracleConfig, RunState } from './types';
import { ADVENTURER_POOL } from './data/adventurers';
import { EXPEDITION_NODES } from './data/expedition';
import { parseOracle } from './game/oracleParser';
import { createInitialRunState } from './game/expeditionManager';

import TitleScreen from './screens/TitleScreen';
import PartySelectionScreen from './screens/PartySelectionScreen';
import OracleSetupScreen from './screens/OracleSetupScreen';
import ExpeditionScreen from './screens/ExpeditionScreen';
import ResultScreen from './screens/ResultScreen';

// ─────────────────────────────────────────────────────────────────
// Root application — manages top-level game phase and run state
// ─────────────────────────────────────────────────────────────────

type Phase = 'title' | 'party_selection' | 'oracle_setup' | 'expedition' | 'result';

function createBlankRunState(): RunState {
  return {
    phase: 'title',
    selectedAdventurerIds: [],
    party: [],
    divinIntent: null,
    oracleConfig: null,
    divinePower: 3,
    maxDivinePower: 3,
    currentNodeIndex: 0,
    nodes: EXPEDITION_NODES,
    resolutions: [],
    relicRecovered: false,
    expeditionLog: [],
    interventionsUsed: [],
    activeBlessing: null,
    expeditionComplete: false,
    activeOmenOptionId: null,
    activeBlessingBoost: false,
  };
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('title');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [runState, setRunState] = useState<RunState>(createBlankRunState());

  // ── Title → Party Selection ────────────────────────────────────

  function handleStart() {
    setPhase('party_selection');
  }

  // ── Party Selection → Oracle Setup ────────────────────────────

  function handlePartyConfirm(ids: string[]) {
    setSelectedIds(ids);
    setPhase('oracle_setup');
  }

  // ── Oracle Setup → Expedition ──────────────────────────────────

  function handleOracleConfirm(config: OracleConfig) {
    const intent = parseOracle(config);
    const initialState = createInitialRunState(selectedIds, intent, config.startingBlessing);
    setRunState({ ...initialState, oracleConfig: config });
    setPhase('expedition');
  }

  // ── Expedition state updates ───────────────────────────────────

  const handleStateChange = useCallback((next: RunState) => {
    setRunState(next);
  }, []);

  // ── Expedition → Result ────────────────────────────────────────

  function handleExpeditionComplete() {
    setPhase('result');
  }

  // ── Result → Restart ──────────────────────────────────────────

  function handleRestart() {
    setSelectedIds([]);
    setRunState(createBlankRunState());
    setPhase('title');
  }

  // ── Derive party for oracle screen ────────────────────────────

  const selectedParty = selectedIds
    .map((id) => ADVENTURER_POOL.find((a) => a.id === id))
    .filter(Boolean) as (typeof ADVENTURER_POOL)[number][];

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  switch (phase) {
    case 'title':
      return <TitleScreen onStart={handleStart} />;

    case 'party_selection':
      return <PartySelectionScreen onConfirm={handlePartyConfirm} />;

    case 'oracle_setup':
      return (
        <OracleSetupScreen
          party={selectedParty}
          onConfirm={handleOracleConfirm}
        />
      );

    case 'expedition':
      return (
        <ExpeditionScreen
          state={runState}
          onStateChange={handleStateChange}
          onExpeditionComplete={handleExpeditionComplete}
        />
      );

    case 'result':
      return <ResultScreen state={runState} onRestart={handleRestart} />;

    default:
      return null;
  }
}
