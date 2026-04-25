import type { EncounterZone, Interactable, MapConnection, MapData, PartyGuidance, PartyTokenState, PathData, Vec2 } from '../types';

const SNAP_DISTANCE = 10;

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function getPath(map: MapData, pathId: string): PathData | undefined {
  return map.paths.find((path) => path.id === pathId);
}

export function pointInsideRadius(point: Vec2, target: Vec2, radius: number): boolean {
  return distance(point, target) <= radius;
}

function connectionScore(connection: MapConnection, guidance: PartyGuidance): number {
  let score = connection.weight;
  if (connection.tags.includes('speed')) score += guidance.speed * 0.32;
  if (connection.tags.includes('safe')) score += guidance.caution * 0.32;
  if (connection.tags.includes('mission') || connection.tags.includes('boss')) score += guidance.mission * 0.28;
  if (guidance.omenTargetMapId && connection.targetMapId === guidance.omenTargetMapId) score += 1.4;
  return Math.max(0.05, score);
}

export function chooseConnection(path: PathData, guidance: PartyGuidance): MapConnection | null {
  if (path.connections.length === 0) return null;

  const weighted = path.connections.map((connection) => ({
    connection,
    score: connectionScore(connection, guidance),
  }));
  const total = weighted.reduce((sum, entry) => sum + entry.score, 0);
  let roll = Math.random() * total;

  for (const entry of weighted) {
    roll -= entry.score;
    if (roll <= 0) {
      return entry.connection;
    }
  }

  return weighted[weighted.length - 1]?.connection ?? null;
}

export function moveTokenAlongPath(
  token: PartyTokenState,
  path: PathData,
  deltaMs: number
): { token: PartyTokenState; reachedPathEnd: boolean } {
  let remaining = (token.speed * deltaMs) / 1000;
  let nextToken = { ...token };

  while (remaining > 0) {
    const targetPoint = path.points[nextToken.waypointIndex + 1];
    if (!targetPoint) {
      return { token: nextToken, reachedPathEnd: true };
    }

    const dx = targetPoint.x - nextToken.x;
    const dy = targetPoint.y - nextToken.y;
    const segmentLength = Math.hypot(dx, dy);

    if (segmentLength <= SNAP_DISTANCE || remaining >= segmentLength) {
      nextToken = {
        ...nextToken,
        x: targetPoint.x,
        y: targetPoint.y,
        waypointIndex: nextToken.waypointIndex + 1,
        facing: segmentLength > 0 ? { x: dx / segmentLength, y: dy / segmentLength } : nextToken.facing,
      };
      remaining -= Math.max(segmentLength, 0);
      continue;
    }

    const ratio = remaining / segmentLength;
    nextToken = {
      ...nextToken,
      x: nextToken.x + dx * ratio,
      y: nextToken.y + dy * ratio,
      facing: { x: dx / segmentLength, y: dy / segmentLength },
    };
    remaining = 0;
  }

  return { token: nextToken, reachedPathEnd: false };
}

export function spawnTokenOnPath(map: MapData, spawn: Vec2, speed = 96): PartyTokenState {
  return {
    currentMapId: map.id,
    currentPathId: map.startPathId,
    waypointIndex: 0,
    x: spawn.x,
    y: spawn.y,
    speed,
    facing: { x: 1, y: 0 },
  };
}

export function findEncounterAtPoint(
  map: MapData,
  point: Vec2,
  blockedZoneIds: Set<string>,
  currentTimeMs: number,
  cooldowns: Record<string, number>,
  clearedMapIds: string[]
): EncounterZone | null {
  if (clearedMapIds.includes(map.id) && map.type === 'boss') return null;

  for (const zone of map.encounters) {
    if (blockedZoneIds.has(zone.id)) continue;
    if ((cooldowns[zone.id] ?? 0) > currentTimeMs) continue;
    if (pointInsideRadius(point, zone, zone.radius) && Math.random() < zone.chance) {
      return zone;
    }
  }

  return null;
}

export function findInteractableAtPoint(
  map: MapData,
  point: Vec2,
  clearedInteractableIds: string[]
): Interactable | null {
  return (
    map.interactables.find((interactable) => {
      if (interactable.once && clearedInteractableIds.includes(interactable.id)) return false;
      return pointInsideRadius(point, interactable, interactable.radius);
    }) ?? null
  );
}

export function nearestExitLabel(map: MapData, point: Vec2): string | null {
  let best: { label: string; distance: number } | null = null;

  for (const exit of map.exits) {
    const d = distance(point, exit);
    if (!best || d < best.distance) {
      best = { label: exit.label, distance: d };
    }
  }

  return best?.label ?? null;
}
