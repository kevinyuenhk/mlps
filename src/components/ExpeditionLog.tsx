import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
}

const STYLES: Record<LogEntry['type'], string> = {
  arrival: 'text-stone-300',
  decision: 'text-amber-100',
  outcome: 'text-stone-400',
  intervention: 'text-violet-200',
  system: 'text-stone-500',
};

export default function ExpeditionLog({ entries }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">戰鬥日誌</div>
      <div className="max-h-36 space-y-2 overflow-y-auto px-4 py-3 text-sm">
        {entries.map((entry) => (
          <div key={entry.id} className={`animate-fade-in ${STYLES[entry.type]}`}>
            {entry.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
