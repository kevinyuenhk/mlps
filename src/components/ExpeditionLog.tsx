import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
}

const TYPE_STYLES: Record<LogEntry['type'], string> = {
  arrival: 'text-gray-400',
  event: 'text-amber-300 font-medium',
  decision: 'text-gray-300',
  outcome: 'text-gray-400 italic',
  intervention: 'text-violet-400',
  info: 'text-gray-500',
};

export default function ExpeditionLog({ entries }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="panel flex flex-col h-full overflow-hidden">
      <div className="panel-header">Expedition Log</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 text-xs leading-relaxed">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`${TYPE_STYLES[entry.type]} animate-fade-in`}
          >
            {entry.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
