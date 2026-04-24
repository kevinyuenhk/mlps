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
  | 'room'
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

export type RouteTag =
  | 'mission'
  | 'safe'
  | 'danger'
  | 'loot'
  | 'mercy'
  | 'speed'
  | 'knowledge'
  | 'boss';

export interface Vec2 {
  x: number;
  y: number;
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
  width: number;
  height: number;
  biome?: string;
  connections: string[];
  nextNodeIds: string[];
  routeTags: RouteTag[];
  encounterChance: number;
  discovered: boolean;
  cleared: boolean;
}

export type ExpeditionNode = DungeonNode;

export interface DungeonCorridor {
  id: string;
  from: string;
  to: string;
  path: Vec2[];
  length: number;
}

export interface DungeonMap {
  width: number;
  height: number;
  rooms: DungeonNode[];
  corridors: DungeonCorridor[];
  spawnPoint: Vec2;
  bossRoomId: string;
  exitRoomId: string;
}

export interface MapConnection {
  pathId?: string;
  exitId?: string;
  label: string;
  weight: number;
  tags: RouteTag[];
  targetMapId?: string;
}

export interface PathData {
  id: string;
  points: Vec2[];
  width: number;
  tags: RouteTag[];
  connections: MapConnection[];
}

export interface EncounterZone {
  id: string;
  x: number;
  y: number;
  radius: number;
  chance: number;
  enemyPool: string[];
  cooldown: number;
  variant?: 'normal' | 'boss';
  once?: boolean;
}

export interface ExitPoint {
  id: string;
  x: number;
  y: number;
  radius: number;
  targetMapId: string;
  targetSpawnPoint: Vec2;
  label: string;
  visible: boolean;
}

export interface Interactable {
  id: string;
  kind: 'chest' | 'shrine' | 'npc' | 'altar';
  name: string;
  x: number;
  y: number;
  radius: number;
  description: string;
  once?: boolean;
  loot?: number;
  heal?: number;
  stressRelief?: number;
  faithDelta?: number;
}

export interface MapObstacle {
  id: string;
  kind: 'rect' | 'circle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  color: number;
  alpha?: number;
}

export interface MapDecoration {
  id: string;
  kind: 'torch' | 'bone' | 'pillar' | 'banner' | 'shrine';
  x: number;
  y: number;
  width: number;
  height: number;
  color: number;
  alpha?: number;
}

export interface WorldZone {
  id: string;
  name: string;
  xStart: number;
  xEnd: number;
  bgColor: number;
  accentColor: number;
  type: RoomType;
}

export interface MapData {
  id: string;
  order: number;
  name: string;
  shortName: string;
  description: string;
  type: RoomType;
  icon: string;
  width: number;
  height: number;
  bgColor: number;
  accentColor: number;
  encounterRate: number;
  special: string;
  spawnPoint: Vec2;
  startPathId: string;
  paths: PathData[];
  encounters: EncounterZone[];
  exits: ExitPoint[];
  interactables: Interactable[];
  obstacles: MapObstacle[];
  decorations: MapDecoration[];
  zones?: WorldZone[];
}

export interface MapLink {
  from: string;
  to: string;
}

export interface FogRevealPoint extends Vec2 {
  radius: number;
}

export interface PartyGuidance {
  speed: number;
  caution: number;
  mission: number;
  omenTargetMapId: string | null;
}

export interface PartyTokenState {
  currentMapId: string;
  currentPathId: string;
  waypointIndex: number;
  x: number;
  y: number;
  speed: number;
  facing: Vec2;
  targetNodeId?: string | null;
  corridorId?: string | null;
  waypoints?: Vec2[];
}

export interface BranchState {
  nodeId: string;
  options: BranchOptionSummary[];
  preferences: RoutePreference[];
  majorityNodeId: string;
}

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

export type ExplorationPhase = 'walking' | 'paused' | 'transitioning' | 'event';
export type GamePhase =
  | 'title'
  | 'party_select'
  | 'oracle_setup'
  | 'exploration'
  | 'battle'
  | 'post_battle'
  | 'results';

export interface RoutePreference {
  characterId: string;
  characterName: string;
  chosenNodeId: string;
  chosenNodeName: string;
  directionLabel: string;
  reasonTags: string[];
  scoreByNodeId: Record<string, number>;
}

export interface BranchOptionSummary {
  nodeId: string;
  nodeName: string;
  directionLabel: string;
  votes: number;
  aggregateScore: number;
  tags: RouteTag[];
}

export type ExplorationNudgeType = 'speed' | 'caution' | 'mission' | 'omen';
export type InterventionType = 'omen' | 'blessing' | 'miracle';

export interface Intervention {
  type: InterventionType;
  label: string;
  description: string;
  cost: number;
  flavorText: string;
}

export interface ExplorationNudges {
  speed: number;
  caution: number;
  mission: number;
  omenNodeId: string | null;
}

export interface EnemyUnit {
  id: string;
  name: string;
  role: 'skirmisher' | 'guardian' | 'caster' | 'boss';
  hp: number;
  maxHp: number;
  stress: number;
  maxStress: number;
  alive: boolean;
  guard: number;
  studied: boolean;
}

export interface BattlePartyMember extends Adventurer {
  guard: number;
  resolveBoost: number;
  studiedTargetId: string | null;
  protectedById: string | null;
}

export type BattleActionType =
  | 'attack'
  | 'protect_ally'
  | 'heal'
  | 'defend'
  | 'study_enemy'
  | 'press_forward';

export interface BattleAction {
  actorId: string;
  actorName: string;
  actionType: BattleActionType;
  targetId?: string;
  score: number;
  summary: string;
}

export type BattleOmenFocus = 'attack' | 'guard' | 'study' | null;

export interface BattleState {
  roomId: string;
  roomName: string;
  variant: 'normal' | 'boss';
  round: number;
  party: BattlePartyMember[];
  enemies: EnemyUnit[];
  log: string[];
  omenFocus: BattleOmenFocus;
  blessingShield: number;
  miracleUsedThisBattle: boolean;
  lastRoundActions: BattleAction[];
}

export interface BattleSummary {
  roomId: string;
  roomName: string;
  variant: 'normal' | 'boss';
  result: 'victory' | 'defeat';
  rounds: number;
  log: string[];
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'arrival' | 'decision' | 'outcome' | 'intervention' | 'battle' | 'system';
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
  dungeonMap: DungeonMap | null;
  nodes: DungeonNode[];
  maps: MapData[];
  mapLinks: MapLink[];
  currentMapId: string;
  exploredMapIds: string[];
  visitedMapIds: string[];
  clearedMapIds: string[];
  clearedInteractableIds: string[];
  discoveredExitIds: string[];
  encounterCooldowns: Record<string, number>;
  revealedAreas: Record<string, FogRevealPoint[]>;
  pathTaken: string[];
  token: PartyTokenState;
  explorationPhase: ExplorationPhase;
  pendingBranch: BranchState | null;
  explorationNudges: ExplorationNudges;
  resolutions: EventResolution[];
  battleState: BattleState | null;
  lastBattleSummary: BattleSummary | null;
  relicRecovered: boolean;
  bossCleared: boolean;
  escaped: boolean;
  totalLoot: number;
  expeditionLog: LogEntry[];
  interventionsUsed: Array<{ type: InterventionType; nodeId: string; optionId?: string }>;
  activeBlessing: BlessingType | null;
  expeditionComplete: boolean;
}

export interface TraitMeta {
  name: TraitName;
  description: string;
  effectSummary: string;
}
