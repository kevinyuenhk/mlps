// ============================================================
// Core domain types for the God Adventurer MVP
// ============================================================

export type TraitName =
  | 'Brave'
  | 'Loyal'
  | 'Stubborn'
  | 'Compassionate'
  | 'Fearful'
  | 'Devout'
  | 'Greedy'
  | 'Clever'
  | 'Skeptical'
  | 'Curious'
  | 'Rational'
  | 'Fragile'
  | 'Calm'
  | 'Dutiful'
  | 'Wary';

export type AdventurerClass = 'Knight' | 'Healer' | 'Rogue' | 'Mage' | 'Ranger';

export interface Adventurer {
  id: string;
  name: string;
  class: AdventurerClass;
  traits: TraitName[];
  faith: number;     // 0–100: how strongly they respond to divine commands
  loyalty: number;   // 0–100: how much their vote counts in party decisions
  hp: number;
  maxHp: number;
  stress: number;    // 0–100: high stress reduces rational behavior
  alive: boolean;
  riskBias: 'low' | 'medium' | 'high';
  shortBio: string;
}

// --------------------------------------------------------
// Oracle / Divine Intent
// --------------------------------------------------------

export type PrimaryGoal =
  | 'recover_relic'
  | 'rescue_survivors'
  | 'purge_corruption'
  | 'scout_graveyard';

export type SecondaryPriority =
  | 'survival'
  | 'help_wounded'
  | 'avoid_conflict'
  | 'seek_wealth'
  | 'move_quickly';

export type RiskTolerance = 'low' | 'medium' | 'high';
export type BlessingType = 'shielding_light' | 'healing_grace' | 'guiding_omen';

export interface OracleConfig {
  primaryGoal: PrimaryGoal;
  secondaryPriorities: SecondaryPriority[];
  riskTolerance: RiskTolerance;
  addendumText: string;
  startingBlessing: BlessingType;
}

/** Normalized numerical signals derived from oracle config */
export interface ParsedSignals {
  survivalPriority: number;   // 0–1
  mercyPriority: number;      // 0–1
  greedAllowance: number;     // 0–1
  aggression: number;         // 0–1
  urgency: number;            // 0–1
  stealthPreference: number;  // 0–1
  missionFocus: number;       // 0–1
}

export interface DivinIntent {
  primaryGoal: PrimaryGoal;
  priorities: SecondaryPriority[];
  riskTolerance: RiskTolerance;
  addendumText: string;
  parsedSignals: ParsedSignals;
}

// --------------------------------------------------------
// Events
// --------------------------------------------------------

export type EventType =
  | 'route_choice'
  | 'moral_dilemma'
  | 'temptation'
  | 'combat'
  | 'boss'
  | 'extraction';

export interface EventOption {
  id: string;
  label: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  /** Inherent appeal of this option, independent of character/intent */
  baseWeight: number;
  /** How well this option aligns with each signal — used for divine intent scoring */
  signalAlignment: Partial<ParsedSignals>;
  /** Per-trait bonus (+) or penalty (−) when scoring this option */
  traitBonuses: Partial<Record<TraitName, number>>;
  outcome: EventOutcome;
}

export interface EventOutcome {
  hpChange: number;          // applied to each living party member
  stressChange: number;
  loyaltyChange: number;
  faithChange: number;
  narrativeResult: string;   // shown after resolution
  relicProgress: boolean;    // does this option secure the relic? (boss event)
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  nodeId: string;
  options: EventOption[];
}

// --------------------------------------------------------
// Expedition map
// --------------------------------------------------------

export interface ExpeditionNode {
  id: string;
  name: string;
  description: string;
  eventId?: string;
  position: number;  // 0-based index in node sequence
  icon: string;      // emoji for map display
}

// --------------------------------------------------------
// Decision engine output
// --------------------------------------------------------

export interface DecisionBreakdown {
  baseWeight: number;
  traitModifiers: number;
  divineAlignment: number;
  stateModifiers: number;
  classBias: number;
  interventionModifier: number;
  randomness: number;
}

export interface CharacterDecision {
  characterId: string;
  characterName: string;
  preferredOptionId: string;
  scores: Record<string, number>;      // optionId → score
  tags: Record<string, string[]>;      // optionId → explanation tags
  breakdown: Record<string, DecisionBreakdown>;
}

export interface EventResolution {
  eventId: string;
  nodeId: string;
  nodeName: string;
  chosenOptionId: string;
  chosenOptionLabel: string;
  characterDecisions: CharacterDecision[];
  aggregateScores: Record<string, number>;
  narrativeLog: string;
  outcomeText: string;
  /** Did the chosen option match what divine intent would have preferred? */
  followedDivineIntent: boolean;
  /** Dominant signal driving the divine-preferred option */
  divinePreferredOptionId: string;
  divergenceNote?: string;
  hpChangePerMember: number;
  stressChangePerMember: number;
  interventionUsed?: InterventionType;
  relicSecured: boolean;
}

// --------------------------------------------------------
// Interventions
// --------------------------------------------------------

export type InterventionType = 'omen' | 'blessing' | 'miracle';

export interface Intervention {
  type: InterventionType;
  label: string;
  description: string;
  cost: number;
  flavorText: string;
}

// --------------------------------------------------------
// Run state
// --------------------------------------------------------

export type GamePhase =
  | 'title'
  | 'party_selection'
  | 'oracle_setup'
  | 'expedition'
  | 'result';

export interface RunState {
  phase: GamePhase;
  selectedAdventurerIds: string[];
  party: Adventurer[];
  divinIntent: DivinIntent | null;
  oracleConfig: OracleConfig | null;
  divinePower: number;
  maxDivinePower: number;
  currentNodeIndex: number;
  nodes: ExpeditionNode[];
  resolutions: EventResolution[];
  relicRecovered: boolean;
  expeditionLog: LogEntry[];
  interventionsUsed: Array<{ type: InterventionType; nodeIndex: number; optionId?: string }>;
  activeBlessing: BlessingType | null;
  expeditionComplete: boolean;
  /** Omen active: boosts a specific option's aggregate score */
  activeOmenOptionId: string | null;
  /** Blessing active: temporary loyalty/loyalty boost for next resolution */
  activeBlessingBoost: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'arrival' | 'event' | 'decision' | 'outcome' | 'intervention' | 'info';
  text: string;
}

// --------------------------------------------------------
// Trait metadata
// --------------------------------------------------------

export interface TraitMeta {
  name: TraitName;
  description: string;
  effectSummary: string;
}
