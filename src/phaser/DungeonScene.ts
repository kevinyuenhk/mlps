import * as Phaser from 'phaser';
import { renderFogOfWar } from './fogOfWar';
import { renderMap } from './mapRenderer';
import { chooseConnection, findEncounterAtPoint, findInteractableAtPoint, getPath, moveTokenAlongPath, nearestExitLabel } from './partyController';
import { getMapById } from './mapData';
import type { FogRevealPoint, MapData, PartyGuidance, PartyTokenState } from '../types';

export const VIEWPORT_WIDTH = 1080;
export const VIEWPORT_HEIGHT = 1440;

export interface DungeonSceneSnapshot {
  maps: MapData[];
  currentMapId: string;
  token: PartyTokenState;
  explorationPhase: 'walking' | 'paused' | 'transitioning' | 'event';
  guidance: PartyGuidance;
  clearedInteractableIds: string[];
  discoveredExitIds: string[];
  encounterCooldowns: Record<string, number>;
  clearedMapIds: string[];
  revealedAreas: Record<string, FogRevealPoint[]>;
}

export interface PositionSyncPayload {
  token: PartyTokenState;
  revealPoint: FogRevealPoint;
  nearestExitLabel: string | null;
}

export interface DungeonSceneCallbacks {
  onPositionSync?: (payload: PositionSyncPayload) => void;
  onEncounter?: (payload: { mapId: string; zoneId: string; enemyType: string; variant: 'normal' | 'boss'; token: PartyTokenState }) => void;
  onExit?: (payload: { mapId: string; exitId: string; token: PartyTokenState }) => void;
  onInteractable?: (payload: { mapId: string; interactableId: string; token: PartyTokenState }) => void;
}

export class DungeonScene extends Phaser.Scene {
  private snapshot: DungeonSceneSnapshot | null = null;
  private pendingSnapshot: DungeonSceneSnapshot | null = null;
  private callbacks: DungeonSceneCallbacks = {};
  private isSceneReady = false;
  private activeMapId: string | null = null;
  private renderedStateKey = '';
  private fogLayer!: Phaser.GameObjects.Graphics;
  private worldLayer!: Phaser.GameObjects.Container;
  private partyContainer!: Phaser.GameObjects.Container;
  private mapBanner!: Phaser.GameObjects.Container;
  private mapBannerText!: Phaser.GameObjects.Text;
  private mapBannerSubtext!: Phaser.GameObjects.Text;
  private liveToken: PartyTokenState | null = null;
  private localBlockedZones = new Set<string>();
  private localBlockedInteractables = new Set<string>();
  private lastSyncAt = 0;

  constructor() {
    super('DungeonScene');
  }

  create() {
    this.isSceneReady = true;
    this.cameras.main.setBackgroundColor(0x05070b);

    this.worldLayer = this.add.container(0, 0);
    this.fogLayer = this.add.graphics();
    this.partyContainer = this.createParty();
    this.mapBanner = this.createMapBanner();
    this.partyContainer.setDepth(20);
    this.fogLayer.setDepth(30);
    this.mapBanner.setDepth(40);

    if (this.pendingSnapshot) {
      const next = this.pendingSnapshot;
      this.pendingSnapshot = null;
      this.applySnapshot(next);
    }
  }

  setCallbacks(callbacks: DungeonSceneCallbacks) {
    this.callbacks = callbacks;
  }

  applySnapshot(snapshot: DungeonSceneSnapshot) {
    if (!this.isSceneReady) {
      this.pendingSnapshot = snapshot;
      return;
    }

    this.snapshot = snapshot;

    const renderKey = [
      snapshot.currentMapId,
      snapshot.clearedInteractableIds.join(','),
      snapshot.discoveredExitIds.join(','),
    ].join('|');

    if (this.activeMapId !== snapshot.currentMapId || this.renderedStateKey !== renderKey) {
      this.renderCurrentMap(snapshot);
      this.renderedStateKey = renderKey;
    }

    if (!this.liveToken || this.liveToken.currentMapId !== snapshot.token.currentMapId) {
      this.liveToken = { ...snapshot.token };
      this.partyContainer.setPosition(snapshot.token.x, snapshot.token.y);
    }
  }

  update(_time: number, delta: number) {
    if (!this.snapshot) return;
    const currentMap = getMapById(this.snapshot.currentMapId);
    if (!currentMap) return;

    if (!this.liveToken || this.liveToken.currentMapId !== currentMap.id) {
      this.liveToken = { ...this.snapshot.token };
    }

    if (this.snapshot.explorationPhase === 'walking') {
      this.stepMovement(currentMap, delta);
    } else {
      this.partyContainer.setPosition(this.snapshot.token.x, this.snapshot.token.y);
      this.liveToken = { ...this.snapshot.token };
    }

    this.updatePresentation(currentMap);
  }

  private createParty() {
    const party = this.add.container(0, 0);
    const formation = [
      { x: -34, y: 18, color: 0x4fa3ff, name: '戰' },
      { x: 0, y: -28, color: 0xffbf47, name: '法' },
      { x: 34, y: 20, color: 0x57e389, name: '牧' },
    ];

    formation.forEach((member, index) => {
      const memberContainer = this.add.container(member.x, member.y);
      const glow = this.add.circle(0, 0, 50, member.color, 0.3);
      const shadow = this.add.ellipse(0, 30, 40, 18, 0x020617, 0.52);
      const arrow = this.add.triangle(0, 40, 0, 0, 12, 18, 24, 0, 0xffffff, 0.96);
      arrow.setOrigin(0.5, 0.5);
      arrow.setStrokeStyle(3, 0x1f2937, 0.9);
      const body = this.add.circle(0, 0, 20, member.color, 1);
      body.setStrokeStyle(6, 0xffffff, 0.96);
      const labelBg = this.add.rectangle(0, -40, 34, 22, 0x081018, 0.8);
      labelBg.setStrokeStyle(2, 0xffffff, 0.36);
      const label = this.add.text(0, -40, member.name, {
        fontFamily: '"Noto Sans TC", "PingFang TC", sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: '700',
      });
      label.setOrigin(0.5);
      memberContainer.add([glow, shadow, arrow, body, labelBg, label]);
      party.add(memberContainer);

      this.tweens.add({
        targets: memberContainer,
        y: member.y - 8,
        duration: 620,
        yoyo: true,
        repeat: -1,
        delay: index * 90,
        ease: 'sine.inOut',
      });

      this.tweens.add({
        targets: glow,
        alpha: { from: 0.22, to: 0.42 },
        scaleX: { from: 0.92, to: 1.12 },
        scaleY: { from: 0.92, to: 1.12 },
        duration: 900,
        yoyo: true,
        repeat: -1,
        delay: index * 90,
        ease: 'sine.inOut',
      });
    });

    return party;
  }

  private createMapBanner() {
    const container = this.add.container(24, 22);
    container.setScrollFactor(0);

    const panel = this.add.rectangle(0, 0, 360, 88, 0x05070b, 0.74);
    panel.setOrigin(0, 0);
    panel.setStrokeStyle(3, 0xf1e2b6, 0.24);

    const accent = this.add.rectangle(16, 14, 10, 60, 0xf1e2b6, 0.9);
    accent.setOrigin(0, 0);

    this.mapBannerText = this.add.text(40, 14, '', {
      fontFamily: '"Noto Serif TC", "PingFang TC", serif',
      fontSize: '30px',
      color: '#fff8de',
      fontStyle: '700',
      stroke: '#0f0b08',
      strokeThickness: 4,
    });

    this.mapBannerSubtext = this.add.text(40, 48, '', {
      fontFamily: '"Noto Sans TC", "PingFang TC", sans-serif',
      fontSize: '18px',
      color: '#d6d3c2',
      stroke: '#0f0b08',
      strokeThickness: 3,
    });

    container.add([panel, accent, this.mapBannerText, this.mapBannerSubtext]);
    return container;
  }

  private renderCurrentMap(snapshot: DungeonSceneSnapshot) {
    const map = getMapById(snapshot.currentMapId);
    if (!map) return;

    this.worldLayer.removeAll(true);
    this.localBlockedZones.clear();
    this.localBlockedInteractables.clear();
    this.activeMapId = map.id;

    const mapWorld = renderMap(this, map, {
      discoveredExitIds: snapshot.discoveredExitIds,
      clearedInteractableIds: snapshot.clearedInteractableIds,
    });
    this.worldLayer.add(mapWorld);
    this.mapBannerText.setText(map.name);
    this.mapBannerSubtext.setText(`地圖主題：${map.special}`);

    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.partyContainer, true, 0.08, 0.08);
    this.cameras.main.setZoom(this.scale.height > this.scale.width ? 1.72 : 1.38);
  }

  private stepMovement(map: MapData, delta: number) {
    if (!this.liveToken) return;
    const path = getPath(map, this.liveToken.currentPathId);
    if (!path) return;

    const result = moveTokenAlongPath(this.liveToken, path, delta);
    this.liveToken = result.token;

    if (result.reachedPathEnd) {
      const choice = chooseConnection(path, this.snapshot!.guidance);
      if (choice?.pathId) {
        const nextPath = getPath(map, choice.pathId);
        if (nextPath) {
          this.liveToken = {
            ...this.liveToken,
            currentPathId: nextPath.id,
            waypointIndex: 0,
            x: nextPath.points[0].x,
            y: nextPath.points[0].y,
          };
        }
      } else if (choice?.exitId) {
        this.callbacks.onExit?.({ mapId: map.id, exitId: choice.exitId, token: { ...this.liveToken } });
        return;
      }
    }

    const now = this.time.now;
    const currentPoint = { x: this.liveToken.x, y: this.liveToken.y };

    const interactable = findInteractableAtPoint(map, currentPoint, this.snapshot!.clearedInteractableIds);
    if (interactable && !this.localBlockedInteractables.has(interactable.id)) {
      this.localBlockedInteractables.add(interactable.id);
      this.callbacks.onInteractable?.({ mapId: map.id, interactableId: interactable.id, token: { ...this.liveToken } });
      return;
    }

    const encounter = findEncounterAtPoint(
      map,
      currentPoint,
      this.localBlockedZones,
      now,
      this.snapshot!.encounterCooldowns,
      this.snapshot!.clearedMapIds
    );

    if (encounter) {
      this.localBlockedZones.add(encounter.id);
      const enemyType = encounter.enemyPool[Math.floor(Math.random() * encounter.enemyPool.length)] ?? '墓窟敵影';
      this.cameras.main.flash(160, 255, 255, 255);
      this.callbacks.onEncounter?.({
        mapId: map.id,
        zoneId: encounter.id,
        enemyType,
        variant: encounter.variant ?? 'normal',
        token: { ...this.liveToken },
      });
      return;
    }
  }

  private updatePresentation(map: MapData) {
    if (!this.liveToken || !this.snapshot) return;

    this.partyContainer.setPosition(this.liveToken.x, this.liveToken.y);
    this.partyContainer.setRotation(Math.atan2(this.liveToken.facing.y, this.liveToken.facing.x) * 0.06);

    renderFogOfWar(
      this.fogLayer,
      map.width,
      map.height,
      this.snapshot.revealedAreas[map.id] ?? [],
      { x: this.liveToken.x, y: this.liveToken.y, radius: 180 }
    );

    if (this.time.now - this.lastSyncAt > 180) {
      this.lastSyncAt = this.time.now;
      this.callbacks.onPositionSync?.({
        token: { ...this.liveToken },
        revealPoint: { x: this.liveToken.x, y: this.liveToken.y, radius: 180 },
        nearestExitLabel: nearestExitLabel(map, this.liveToken),
      });
    }
  }
}
