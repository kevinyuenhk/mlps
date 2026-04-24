import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import { DungeonScene, type DungeonSceneCallbacks, type DungeonSceneSnapshot, VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from '../phaser/DungeonScene';
import { createDungeonGame } from '../phaser/config';

interface Props {
  snapshot: DungeonSceneSnapshot;
  onPositionSync?: DungeonSceneCallbacks['onPositionSync'];
  onEncounter?: DungeonSceneCallbacks['onEncounter'];
  onExit?: DungeonSceneCallbacks['onExit'];
  onInteractable?: DungeonSceneCallbacks['onInteractable'];
}

export default function PhaserContainer({
  snapshot,
  onPositionSync,
  onEncounter,
  onExit,
  onInteractable,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<DungeonScene | null>(null);
  const latestCallbacksRef = useRef<DungeonSceneCallbacks>({});
  const latestSnapshotRef = useRef<DungeonSceneSnapshot | null>(null);
  const [isHostReady, setIsHostReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const updateReadyState = () => {
      const rect = host.getBoundingClientRect();
      setIsHostReady(rect.width > 0 && rect.height > 0);
    };

    updateReadyState();

    const observer = new ResizeObserver(() => updateReadyState());
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hostRef.current || gameRef.current || !isHostReady) return;

    const scene = new DungeonScene();
    sceneRef.current = scene;

    const game = createDungeonGame(hostRef.current, scene);
    scene.setCallbacks(latestCallbacksRef.current);
    if (latestSnapshotRef.current) {
      scene.applySnapshot(latestSnapshotRef.current);
    }

    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
  }, [isHostReady]);

  useEffect(() => {
    const callbacks = { onPositionSync, onEncounter, onExit, onInteractable };
    latestCallbacksRef.current = callbacks;
    sceneRef.current?.setCallbacks(callbacks);
  }, [onPositionSync, onEncounter, onExit, onInteractable]);

  useEffect(() => {
    latestSnapshotRef.current = snapshot;
    sceneRef.current?.applySnapshot(snapshot);
  }, [snapshot]);

  return (
    <div
      ref={hostRef}
      className="h-full w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#06080d]"
      style={{ minHeight: 360, aspectRatio: `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}` }}
    />
  );
}
