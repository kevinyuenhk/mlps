import type { ReactNode } from 'react';

interface Props {
  title?: string;
  children?: ReactNode;
}

export default function InterventionPanel({ title = '神聖介入', children }: Props) {
  return (
    <div className="panel p-4">
      <div className="mb-3 text-[11px] uppercase tracking-[0.25em] text-stone-500">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
