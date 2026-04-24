import type { ExpeditionNode } from '../types';

interface Props {
  nodes: ExpeditionNode[];
  currentIndex: number;
}

export default function NodeMap({ nodes, currentIndex }: Props) {
  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto py-2 px-1">
      {nodes.map((node, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isUpcoming = i > currentIndex;

        return (
          <div key={node.id} className="flex items-center shrink-0">
            {/* Node */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={[
                  'w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all',
                  isDone && 'bg-gray-700 border-gray-600 opacity-60',
                  isCurrent && 'bg-amber-600 border-amber-400 ring-2 ring-amber-400 ring-offset-2 ring-offset-gray-900',
                  isUpcoming && 'bg-gray-800 border-gray-600 opacity-50',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {isDone ? '✓' : node.icon}
              </div>
              <span
                className={[
                  'text-xs whitespace-nowrap max-w-[80px] text-center leading-tight',
                  isDone && 'text-gray-600',
                  isCurrent && 'text-amber-300 font-medium',
                  isUpcoming && 'text-gray-600',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {node.name}
              </span>
            </div>

            {/* Connector */}
            {i < nodes.length - 1 && (
              <div
                className={[
                  'h-px w-8 mx-1 mt-[-18px]',
                  i < currentIndex ? 'bg-gray-600' : 'bg-gray-700',
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
