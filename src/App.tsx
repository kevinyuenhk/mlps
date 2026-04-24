import { useState } from 'react';
import type { Adventurer, OracleConfig } from './types';
import { parseOracle } from './game/oracleParser';
import { createBlankRunState, createInitialRunState } from './game/expeditionManager';

import TitleScreen from './screens/TitleScreen';
import PartySelectionScreen from './screens/PartySelectionScreen';
import OracleSetupScreen from './screens/OracleSetupScreen';
import ExpeditionScreen from './screens/ExpeditionScreen';
import BattleScreen from './screens/BattleScreen';
import PostBattleScreen from './screens/PostBattleScreen';
import ResultScreen from './screens/ResultScreen';

export default function App() {
  const [runState, setRunState] = useState(createBlankRunState());

  const selectedParty = runState.selectedAdventurerIds
    .map((id) => runState.party.find((member) => member.id === id))
    .filter((member): member is Adventurer => Boolean(member));

  function handleOracleConfirm(config: OracleConfig) {
    const intent = parseOracle(config);
    const initialState = createInitialRunState(
      runState.selectedAdventurerIds,
      intent,
      config.startingBlessing
    );
    setRunState({ ...initialState, oracleConfig: config });
  }

  if (runState.phase === 'title') {
    return (
      <TitleScreen
          onStart={() => setRunState((state) => ({ ...state, phase: 'party_select' }))}
        />
    );
  }

  if (runState.phase === 'party_select') {
    return (
      <PartySelectionScreen
        onBack={() => setRunState(createBlankRunState())}
        onConfirm={(party) => {
          setRunState((state) => ({
            ...state,
            phase: 'oracle_setup',
            selectedAdventurerIds: party.map((member) => member.id),
            party,
          }));
        }}
      />
    );
  }

  if (runState.phase === 'oracle_setup') {
    return (
      <OracleSetupScreen
        party={selectedParty}
        onBack={() => setRunState((state) => ({ ...state, phase: 'party_select' }))}
        onConfirm={(config) => handleOracleConfirm(config)}
      />
    );
  }

  if (runState.phase === 'exploration') {
    return <ExpeditionScreen state={runState} onStateChange={setRunState} />;
  }

  if (runState.phase === 'battle') {
    return <BattleScreen state={runState} onStateChange={setRunState} />;
  }

  if (runState.phase === 'post_battle') {
    return <PostBattleScreen state={runState} onStateChange={setRunState} />;
  }

  return (
    <ResultScreen
      state={runState}
      onRestart={() => setRunState(createBlankRunState())}
    />
  );
}
