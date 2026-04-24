import type { DungeonNode } from '../types';
import { roomTypeLabel } from '../utils/helpers';

interface Props {
  nodes: DungeonNode[];
  currentNodeId: string;
  visibleNodeIds: string[];
  resolvedNodeIds: string[];
  pathTaken: string[];
}

function isVisible(visibleNodeIds: string[], nodeId: string) {
  return visibleNodeIds.includes(nodeId);
}

export default function NodeMap({
  nodes,
  currentNodeId,
  visibleNodeIds,
  resolvedNodeIds,
  pathTaken,
}: Props) {
  return (
    <div className="panel relative h-[340px] overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-stone-500">地牢地圖</div>
          <div className="text-sm text-stone-300">迷霧隨推進而散去。</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span>● 當前</span>
          <span>◌ 隱藏</span>
          <span>◆ 首領</span>
        </div>
      </div>

      <div className="relative h-[270px] rounded-[28px] border border-stone-800 bg-[radial-gradient(circle_at_center,#1d1f24_0%,#0d1015_75%)]">
        <svg className="absolute inset-0 h-full w-full">
          {nodes.flatMap((node) =>
            node.nextNodeIds.map((nextId) => {
              const nextNode = nodes.find((entry) => entry.id === nextId);
              if (!nextNode) return null;

              const bothVisible =
                isVisible(visibleNodeIds, node.id) && isVisible(visibleNodeIds, nextId);

              return (
                <line
                  key={`${node.id}-${nextId}`}
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${nextNode.x}%`}
                  y2={`${nextNode.y}%`}
                  stroke={bothVisible ? 'rgba(212, 185, 125, 0.55)' : 'rgba(92, 92, 92, 0.22)'}
                  strokeWidth={pathTaken.includes(nextId) ? 3 : 2}
                  strokeDasharray={bothVisible ? '0' : '4 6'}
                />
              );
            })
          )}
        </svg>

        {nodes.map((node) => {
          const visible = isVisible(visibleNodeIds, node.id);
          const current = node.id === currentNodeId;
          const cleared = resolvedNodeIds.includes(node.id);
          const onPath = pathTaken.includes(node.id);
          const boss = node.type === 'boss';

          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={[
                    'flex h-14 w-14 items-center justify-center border text-xl shadow-[0_0_24px_rgba(0,0,0,0.25)] transition',
                    !visible ? 'rounded-full border-stone-800 bg-stone-950 text-stone-800' : '',
                    visible && !boss ? 'rounded-full border-stone-600 bg-stone-900 text-stone-100' : '',
                    boss && visible ? 'rotate-45 rounded-2xl border-amber-300/70 bg-amber-300/10 text-amber-100' : '',
                    current ? 'ring-4 ring-amber-300/40' : '',
                    cleared ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200' : '',
                  ].join(' ')}
                >
                  <span className={boss ? '-rotate-45' : ''}>{visible ? node.icon : '•'}</span>
                </div>
                <div className="text-center">
                  <div className={`text-xs font-medium ${visible ? 'text-stone-200' : 'text-stone-700'}`}>
                    {visible ? node.name : '隱藏'}
                  </div>
                  <div className={`text-[11px] uppercase tracking-[0.2em] ${visible ? 'text-stone-500' : 'text-stone-800'}`}>
                    {visible ? roomTypeLabel(node.type) : '迷霧'}
                  </div>
                  {onPath && visible && (
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-amber-200">已過</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
