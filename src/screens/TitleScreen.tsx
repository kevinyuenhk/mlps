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
            Divine Expedition
          </h1>
          <p className="text-base sm:text-lg text-gray-400">
            You are a newborn god.
          </p>
        </div>

        {/* Tagline */}
        <div className="border border-gray-700 rounded-xl p-4 sm:p-5 bg-gray-900/60 backdrop-blur">
          <p className="text-gray-300 leading-relaxed text-sm sm:text-base">
            Send followers into the haunted graveyard and recover the sacred relic.
            You cannot puppeteer mortals — you can only guide, bless, and hope they obey.
          </p>
        </div>

        {/* Three pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm text-center w-full">
          {[
            { icon: '🗣', label: 'Give Divine Commands', desc: 'Set intent via the Oracle' },
            { icon: '👁', label: 'Watch & Understand', desc: 'Party interprets your will' },
            { icon: '⚡', label: 'Intervene Sparingly', desc: 'Limited miracles remain' },
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
          Begin Your Reign
        </button>

        <p className="text-xs text-gray-700">
          One expedition · One run · ~10 minutes
        </p>
      </div>
    </div>
  );
}
