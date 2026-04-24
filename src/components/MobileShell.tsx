import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function MobileShell({ children }: Props) {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-[radial-gradient(circle_at_top,#202a34_0%,#0a0d12_34%,#04060a_100%)] px-3 py-3 text-stone-100">
      <div className="mx-auto w-full max-w-[430px]">{children}</div>
    </div>
  );
}
