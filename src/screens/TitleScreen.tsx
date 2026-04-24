interface Props {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 opacity-80" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-900/10 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 max-w-lg text-center">
        {/* Divine symbol */}
        <div className="text-5xl sm:text-7xl animate-pulse-slow select-none">⚡</div>

        {/* Title */}
        <div>
          <h1 className="text-4xl sm:text-5xl font-bold text-amber-400 tracking-tight mb-2 font-serif">
            神聖遠征
          </h1>
          <p className="text-base sm:text-lg text-gray-400">
            你是一名初生的神明。
          </p>
        </div>

        {/* Tagline */}
        <div className="border border-gray-700 rounded-xl p-4 sm:p-5 bg-gray-900/60 backdrop-blur">
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
            派遣信徒深入鬧鬼墓地，取回神聖神器。
            你無法操縱凡人——你只能引導、祝福，並祈求他們服從。
          </p>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm text-center w-full">
          {[
            { icon: '🗣', label: '下達神諭', desc: '透過神諭設定意圖' },
            { icon: '👁', label: '觀察與理解', desc: '隊伍會自行詮釋你的意志' },
            { icon: '⚡', label: '謹慎干預', desc: '奇蹟次數有限' },
          ].map((p) => (
            <div key={p.label} className="panel p-3 flex sm:flex-col flex-row items-center gap-3 sm:gap-1 text-left sm:text-center">
              <span className="text-xl shrink-0">{p.icon}</span>
              <div>
                <div className="text-xs font-medium text-gray-300">{p.label}</div>
                <div className="text-xs text-gray-600">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="btn-primary text-base sm:text-lg px-10 py-3 w-full max-w-xs"
        >
          開始你的統治
        </button>

        <p className="text-xs text-gray-700">
          一次遠征 · 一局遊戲 · 約10分鐘
        </p>
      </div>
    </div>
  );
}
