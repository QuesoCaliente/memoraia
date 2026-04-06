export default function LoginPage() {
  const apiUrl = process.env.API_URL;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0b14]">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-blue-600/10 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-16">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-5xl font-bold tracking-tight text-white">
            Memor<span className="text-blue-400">AIA</span>
          </h1>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
            Card Collection System
          </p>
        </div>

        {/* Card visual */}
        <div className="group relative">
          {/* Card border glow */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-blue-500/20 via-transparent to-blue-500/10" />

          {/* Card */}
          <div className="relative flex h-[420px] w-[300px] flex-col items-center justify-between rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#0f1225] to-[#0a0f2e] p-8 shadow-2xl">
            {/* Card inner content */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              {/* Decorative dots */}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="h-2 w-2 rounded-full bg-blue-300" />
              </div>

              {/* Card logo */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl font-bold text-white">M</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.4em] text-zinc-500">
                  MemorAIA
                </span>
              </div>

              {/* Card rarity badge */}
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-blue-400">
                Legendary
              </span>
            </div>

            {/* Card stats */}
            <div className="flex w-full justify-between border-t border-white/[0.06] pt-4 text-[10px] font-medium uppercase tracking-widest text-zinc-600">
              <span>ATK 99</span>
              <span>DEF 99</span>
              <span>AGI 99</span>
            </div>
          </div>
        </div>

        {/* Login CTA */}
        <div className="flex flex-col items-center gap-4">
          <a
            href={`${apiUrl}/auth/twitch`}
            className="flex h-12 items-center gap-3 rounded-lg bg-[#9146FF] px-8 text-sm font-semibold text-white transition-all hover:bg-[#7c3aed] hover:shadow-lg hover:shadow-purple-500/20"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
            </svg>
            Iniciar con Twitch
          </a>
          <p className="text-xs text-zinc-600">
            Colecciona, fusiona y batalla con cartas de tus streamers favoritos
          </p>
        </div>
      </div>
    </div>
  );
}
