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
  faith: number;
  loyalty: number;
  hp: number;
  maxHp: number;
  stress: number;
  alive: boolean;
  riskBias: 'low' | 'medium' | 'high';
  shortBio: string;
}

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

export interface ParsedSignals {
  survivalPriority: number;
  mercyPriority: number;
  greedAllowance: number;
  aggression: number;
  urgency: number;
  stealthPreference: number;
  missionFocus: number;
}

export interface DivinIntent {
  primaryGoal: PrimaryGoal;
  priorities: SecondaryPriority[];
  riskTolerance: RiskTolerance;
  addendumText: string;
  parsedSignals: ParsedSignals;
}

export type RoomType =
  | 'entrance'
  | 'combat'
  | 'hazard'
  | 'choice'
  | 'treasure'
  | 'shrine'
  | 'boss'
  | 'exit';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RoomOutcome {
  hpChange: number;
  stressChange: number;
  loyaltyChange: number;
  faithChange: number;
  summary: string;
  relicProgress: boolean;
  loot: number;
}

export interface EventOption {
  id: string;
  label: string;
  description: string;
  riskLevel: RiskLevel;
  baseWeight: number;
  signalAlignment: Partial<ParsedSignals>;
  traitBonuses: Partial<Record<TraitName, number>>;
  intentLabel: string;
  intentIcon: string;
  outcome: RoomOutcome;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  type: Exclude<RoomType, 'entrance'>;
  nodeId: string;
  badge: string;
  icon: string;
  options: EventOption[];
}

export interface DungeonNode {
  id: string;
  name: string;
  description: string;
  type: RoomType;
  eventId?: string;
  icon: string;
  depth: number;
  x: number;
  y: number;
  nextNodeIds: string[];
}

export type ExpeditionNode = DungeonNode;

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
  scores: Record<string, number>;
  tags: Record<string, string[]>;
  breakdown: Record<string, DecisionBreakdown>;
}

export interface EventResolution {
  eventId: string;
  nodeId: string;
  nodeName: string;
  nodeType: RoomType;
  chosenOptionId: string;
  chosenOptionLabel: string;
  characterDecisions: CharacterDecision[];
  aggregateScores: Record<string, number>;
  outcomeText: string;
  followedDivineIntent: boolean;
  divinePreferredOptionId: string;
  divergenceNote?: string;
  hpChangePerMember: number;
  stressChangePerMember: number;
  interventionUsed?: InterventionType;
  relicSecured: boolean;
  lootDelta: number;
}

export type InterventionType = 'omen' | 'blessing' | 'miracle';

export interface Intervention {
  type: InterventionType;
  label: string;
  description: string;
  cost: number;
  flavorText: string;
}

export type GamePhase =
  | 'title'
  | 'party_selection'
  | 'oracle_setup'
  | 'expedition'
  | 'result';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'arrival' | 'decision' | 'outcome' | 'intervention' | 'system';
  text: string;
}

export interface RunState {
  phase: GamePhase;
  selectedAdventurerIds: string[];
  party: Adventurer[];
  divinIntent: DivinIntent | null;
  oracleConfig: OracleConfig | null;
  divinePower: number;
  maxDivinePower: number;
  currentNodeId: string;
  nodes: DungeonNode[];
  visibleNodeIds: string[];
  resolvedNodeIds: string[];
  pathTaken: string[];
  resolutions: EventResolution[];
  relicRecovered: boolean;
  bossCleared: boolean;
  escaped: boolean;
  totalLoot: number;
  expeditionLog: LogEntry[];
  interventionsUsed: Array<{ type: InterventionType; nodeId: string; optionId?: string }>;
  activeBlessing: BlessingType | null;
  expeditionComplete: boolean;
  activeOmenOptionId: string | null;
  activeBlessingBoost: boolean;
}

export interface TraitMeta {
  name: TraitName;
  description: string;
  effectSummary: string;
}
