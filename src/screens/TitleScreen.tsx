import MobileShell from '../components/MobileShell';

interface Props {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: Props) {
  return (
    <MobileShell>
      <div className="relative flex min-h-[calc(100dvh-24px)] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,#314252_0%,#131922_34%,#05070b_100%)] p-5 shadow-[0_32px_120px_rgba(0,0,0,0.55)]">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.04)_42%,transparent_72%)] opacity-60" />
        <div className="relative flex flex-1 flex-col">
          <div className="rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-[10px] uppercase tracking-[0.4em] text-sky-100/85">
            自律地城遠征
          </div>

          <div className="mt-8">
            <h1 className="text-5xl leading-none text-stone-100">
              神諭地城
              <span className="mt-2 block text-[28px] text-sky-200/90">你指引，他們自己前進。</span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-stone-300/80">
              三人小隊會自行探索岔路、進入房間、遭遇敵群並展開自律戰鬥。你只能透過神意、徵兆與祝福稍微扭轉結果。
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {[
              ['🗺️', 'Phaser 地城視圖', '房間、走廊、迷霧與隊伍移動全在探索場景內呈現。'],
              ['👣', '自律探索', '角色依個性、信仰、忠誠與神諭自行判斷。'],
              ['⚔️', '自動戰鬥', '回合自動推進，你只在關鍵時刻介入。'],
            ].map(([icon, title, text]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 backdrop-blur">
                <div className="text-2xl">{icon}</div>
                <div className="mt-2 text-sm font-semibold text-stone-100">{title}</div>
                <div className="mt-1 text-[12px] leading-relaxed text-stone-400">{text}</div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <button onClick={onStart} className="btn-primary w-full text-base">
              開始遠征
            </button>
            <div className="mt-3 text-center text-[12px] text-stone-500">手機直式版 ・ 全繁體中文介面</div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
