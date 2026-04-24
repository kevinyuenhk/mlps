import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types';

interface Props {
  entries: LogEntry[];
  heightClass?: string;
}

const STYLES: Record<LogEntry['type'], string> = {
  arrival: 'text-stone-300',
  decision: 'text-sky-100',
  outcome: 'text-stone-400',
  intervention: 'text-amber-100',
  battle: 'text-rose-200',
  system: 'text-stone-500',
};

export default function ExpeditionLog({ entries, heightClass = 'max-h-44' }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="panel overflow-hidden">
      <div className="panel-header">遠征紀錄</div>
      <div className={`${heightClass} space-y-2 overflow-y-auto px-4 py-3 text-sm`}>
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
