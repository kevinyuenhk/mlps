import type { BranchState, DungeonNode, PartyTokenState } from '../types';
import { directionLabel, roomTypeLabel, routeTagLabel } from '../utils/helpers';

interface Props {
  nodes: DungeonNode[];
  currentNodeId: string;
  discoveredNodeIds: string[];
  resolvedNodeIds: string[];
  token: PartyTokenState;
  pendingBranch: BranchState | null;
}

function isVisible(discoveredNodeIds: string[], nodeId: string) {
  return discoveredNodeIds.includes(nodeId);
}

export default function NodeMap({
  nodes,
  currentNodeId,
  discoveredNodeIds,
  resolvedNodeIds,
  token,
  pendingBranch,
}: Props) {
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-stone-500">探索模式</div>
          <div className="text-sm text-stone-300">俯視地城平面圖</div>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-500">
          <span>▭ 房間</span>
          <span>━━ 走廊</span>
          <span>● 隊伍</span>
        </div>
      </div>

      <div className="relative h-[520px] overflow-hidden rounded-[30px] border border-stone-800 bg-[radial-gradient(circle_at_center,#1a2029_0%,#0b0f16_70%)]">
        <svg className="absolute inset-0 h-full w-full">
          {nodes.flatMap((node) =>
            node.nextNodeIds.map((nextId) => {
              const nextNode = nodes.find((entry) => entry.id === nextId);
              if (!nextNode) return null;

              const visible =
                isVisible(discoveredNodeIds, node.id) && isVisible(discoveredNodeIds, nextId);

              return (
                <line
                  key={`${node.id}-${nextId}`}
                  x1={`${node.x}%`}
                  y1={`${node.y}%`}
                  x2={`${nextNode.x}%`}
                  y2={`${nextNode.y}%`}
                  stroke={visible ? 'rgba(128,174,230,0.45)' : 'rgba(67,74,84,0.2)'}
                  strokeWidth={visible ? 10 : 6}
                  strokeLinecap="round"
                />
              );
            })
          )}
        </svg>

        {nodes.map((node) => {
          const visible = isVisible(discoveredNodeIds, node.id);
          const current = node.id === currentNodeId;
          const cleared = resolvedNodeIds.includes(node.id);
          const branchInfo = pendingBranch?.options.find((option) => option.nodeId === node.id);

          return (
            <div
              key={node.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${node.x}%`, top: `${node.y}%`, width: `${node.width}%`, height: `${node.height}%` }}
            >
              <div
                className={[
                  'relative h-full rounded-[24px] border transition',
                  !visible ? 'border-stone-900 bg-stone-950/90' : '',
                  visible && node.type !== 'boss' ? 'border-stone-600 bg-slate-900/85' : '',
                  visible && node.type === 'boss' ? 'border-amber-300/60 bg-amber-300/10' : '',
                  current ? 'shadow-[0_0_0_2px_rgba(147,197,253,0.5),0_0_26px_rgba(56,189,248,0.18)]' : '',
                  cleared ? 'border-emerald-400/40' : '',
                ].join(' ')}
              >
                {visible ? (
                  <>
                    <div className="absolute inset-x-3 top-2 flex items-center justify-between text-[11px] text-stone-300">
                      <span>{node.icon}</span>
                      <span>{roomTypeLabel(node.type)}</span>
                    </div>
                    <div className="absolute inset-x-3 bottom-3">
                      <div className="text-sm font-semibold text-stone-100">{node.name}</div>
                      <div className="mt-1 text-[11px] text-stone-500">{directionLabel(node.y)}</div>
                    </div>
                    {branchInfo && (
                      <div className="absolute right-2 top-7 rounded-full border border-sky-300/30 bg-sky-300/10 px-2 py-1 text-[10px] text-sky-100">
                        {branchInfo.votes} 票
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-stone-800">迷霧</div>
                )}
              </div>
            </div>
          );
        })}

        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-in-out"
          style={{
            left: `${token.targetNodeId ? (nodes.find((node) => node.id === token.targetNodeId)?.x ?? token.x) : token.x}%`,
            top: `${token.targetNodeId ? (nodes.find((node) => node.id === token.targetNodeId)?.y ?? token.y) : token.y}%`,
          }}
        >
          <div className="flex gap-1 rounded-full border border-sky-300/40 bg-sky-200/10 px-2 py-1 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
            <span className="h-3 w-3 rounded-full bg-sky-200" />
            <span className="h-3 w-3 rounded-full bg-amber-200" />
            <span className="h-3 w-3 rounded-full bg-emerald-200" />
          </div>
        </div>

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(5,8,12,0.6)_100%)]" />
      </div>

      {pendingBranch && (
        <div className="mt-3 flex flex-wrap gap-2">
          {pendingBranch.options.map((option) => (
            <div
              key={option.nodeId}
              className={`rounded-full border px-3 py-1 text-xs ${
                option.nodeId === pendingBranch.majorityNodeId
                  ? 'border-sky-300/40 bg-sky-300/10 text-sky-100'
                  : 'border-stone-700 bg-stone-950/70 text-stone-300'
              }`}
            >
              {option.nodeName} ・ {option.tags.slice(0, 2).map(routeTagLabel).join(' / ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
