# Divine Expedition — God Strategy MVP

A browser-based strategy simulation where you play as a newborn deity guiding a party of adventurers through an autonomous expedition. You cannot control characters directly — only provide divine guidance and limited interventions.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` to play.

## How the Systems Work

### Oracle Parsing (`src/game/oracleParser.ts`)

The Oracle Setup screen converts player choices into a `ParsedSignals` object — 7 normalized (0–1) values:

| Signal | What it represents |
|--------|-------------------|
| `missionFocus` | How strongly the god prioritizes completing the mission |
| `survivalPriority` | How much the god values party safety |
| `mercyPriority` | How much the god values helping others |
| `aggression` | How much the god accepts combat |
| `urgency` | How much the god values speed |
| `stealthPreference` | How much the god prefers avoiding conflict |
| `greedAllowance` | How much the god tolerates treasure-seeking |

**How signals are computed:**
1. **Primary goal seeds** — each goal starts with a base set of signal values
2. **Secondary priority modifiers** — each selected priority adds/subtracts from relevant signals
3. **Risk tolerance modifiers** — `low` boosts survival/stealth, `high` boosts aggression
4. **Keyword parsing** — free-text addendum is scanned for known keywords; matches modify signals

**To add new keywords:** add entries to `KEYWORD_RULES` in `oracleParser.ts`.

---

### Decision Engine (`src/game/decisionEngine.ts`)

For every event, each character scores every option. Higher score = stronger preference.

**Score formula:**

```
optionScore =
  baseWeight                  // inherent appeal of the option
  + traitModifiers            // sum of traitBonuses for character's traits
  + divineAlignmentScore      // signals × alignment, weighted by faith
  + stateModifiers            // HP/stress penalties for risky options
  + classBias                 // class-specific tendency
  + interventionModifier      // Omen boost from player
  + randomness                // ±0.05 noise (tie-breaker only)
```

**Faith multiplier:**
- Characters with high faith weight divine signals more heavily
- `Devout` trait amplifies divine weight by 30%
- `Skeptical` trait halves divine influence

**Aggregation:**
Party votes are weighted by each member's `loyalty` stat. Higher loyalty = vote counts more. The option with the highest weighted aggregate score wins.

Every significant modifier generates a human-readable tag explaining WHY — these appear in the event modal and final report.

---

### Adding New Events (`src/data/events.ts`)

Each `GameEvent` has:
- `type`: `route_choice | moral_dilemma | temptation | combat | boss | extraction`
- `nodeId`: which expedition node it appears at
- `options`: array of `EventOption`

Each `EventOption` needs:
- `signalAlignment`: which divine signals this option resonates with (0–1 per signal)
- `traitBonuses`: positive/negative modifier per trait name
- `baseWeight`: inherent appeal (0–1, ~0.4–0.6 for balance)
- `riskLevel`: `low | medium | high` (affects HP/stress penalty scoring)

**Balance guideline:** Options with similar base weights produce interesting decisions. Very high or low base weights override character trait effects.

---

### Adding New Traits (`src/data/traits.ts` + `src/data/events.ts`)

1. Add the trait name to the `TraitName` union in `src/types/index.ts`
2. Add metadata to `TRAIT_META` in `src/data/traits.ts`
3. Add `traitBonuses` entries for the new trait in relevant events

---

### Expedition Structure

Nodes are defined in `src/data/expedition.ts`. Each node optionally references an event via `eventId`. The expedition manager processes nodes in sequence; event nodes trigger the decision engine.

---

## Architecture

```
src/
  types/         — All TypeScript interfaces and types
  data/          — Static game content (adventurers, events, nodes, traits)
  game/          — Pure logic: oracle parsing, decision engine, expedition management
  screens/       — Top-level page components (one per game phase)
  components/    — Reusable UI pieces
  utils/         — Formatting helpers
```

Game logic is kept separate from UI. The `RunState` object is the single source of truth. All state transitions are pure functions in `src/game/expeditionManager.ts`.
