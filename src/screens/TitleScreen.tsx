interface Props {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#3a2d1d_0%,#161616_32%,#0a0d12_72%)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.03)_50%,transparent_100%)] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_center,rgba(240,184,85,0.18),transparent_70%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-1 text-xs uppercase tracking-[0.35em] text-amber-100/80">
              神諭遠征 MVP
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-serif text-5xl leading-none text-stone-100 sm:text-6xl lg:text-7xl">
                地牢突擊
                <span className="mt-2 block text-amber-200/90">神在上，隊在下。</span>
              </h1>
              <p className="max-w-2xl text-base text-stone-300/75 sm:text-lg">
                選三名冒險者、設神諭、闖房間、打倒守護者、逃出生天。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['🧭', '3 選', '5 人中選 3'],
                ['🗺️', '分支地圖', '迷霧節點與路線抉擇'],
                ['✨', '神諭驅動', '神諭、祝福、奇蹟'],
              ].map(([icon, label, text]) => (
                <div key={label} className="panel panel-strong p-4">
                  <div className="mb-2 text-2xl">{icon}</div>
                  <div className="text-sm font-semibold text-stone-100">{label}</div>
                  <div className="text-xs text-stone-400">{text}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onStart} className="btn-primary px-8 py-3 text-base">
                開始突擊
              </button>
              <div className="text-sm text-stone-400">6-8 房 • 首領 + 逃脫 • AI 角色性格驅動</div>
            </div>
          </div>

          <div className="panel panel-strong p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-stone-500">流程</div>
                <div className="text-lg font-semibold text-stone-100">一覽</div>
              </div>
              <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
                MVP 重構
              </div>
            </div>
            <div className="space-y-3">
              {[
                '標題',
                '選隊',
                '設神諭',
                '突擊地牢',
                '首領',
                '逃脫',
                '報告',
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-2xl border border-stone-800 bg-stone-950/40 px-3 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-700 bg-stone-900 text-sm text-amber-200">
                    {index + 1}
                  </div>
                  <div className="text-sm text-stone-200">{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
