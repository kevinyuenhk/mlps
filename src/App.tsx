import { useState } from 'react';
import type { OracleConfig, RunState } from './types';
import { ADVENTURER_POOL } from './data/adventurers';
import { parseOracle } from './game/oracleParser';
import { createInitialRunState } from './game/expeditionManager';

import TitleScreen from './screens/TitleScreen';
import PartySelectionScreen from './screens/PartySelectionScreen';
import OracleSetupScreen from './screens/OracleSetupScreen';
import ExpeditionScreen from './screens/ExpeditionScreen';
import ResultScreen from './screens/ResultScreen';

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
    currentNodeId: 'entrance',
    nodes: [],
    visibleNodeIds: [],
    resolvedNodeIds: [],
    pathTaken: [],
    resolutions: [],
    relicRecovered: false,
    bossCleared: false,
    escaped: false,
    totalLoot: 0,
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

  const selectedParty = selectedIds
    .map((id) => ADVENTURER_POOL.find((member) => member.id === id))
    .filter(Boolean) as (typeof ADVENTURER_POOL)[number][];

  function handleOracleConfirm(config: OracleConfig) {
    const intent = parseOracle(config);
    const initialState = createInitialRunState(selectedIds, intent, config.startingBlessing);
    setRunState({ ...initialState, oracleConfig: config });
    setPhase('expedition');
  }

  if (phase === 'title') {
    return <TitleScreen onStart={() => setPhase('party_selection')} />;
  }

  if (phase === 'party_selection') {
    return (
      <PartySelectionScreen
        onConfirm={(ids) => {
          setSelectedIds(ids);
          setPhase('oracle_setup');
        }}
      />
    );
  }

  if (phase === 'oracle_setup') {
    return <OracleSetupScreen party={selectedParty} onConfirm={handleOracleConfirm} />;
  }

  if (phase === 'expedition') {
    return (
      <ExpeditionScreen
        state={runState}
        onStateChange={setRunState}
        onExpeditionComplete={() => setPhase('result')}
      />
    );
  }

  return (
    <ResultScreen
      state={runState}
      onRestart={() => {
        setSelectedIds([]);
        setRunState(createBlankRunState());
        setPhase('title');
      }}
    />
  );
}
