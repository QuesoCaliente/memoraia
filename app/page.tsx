export default function LoginPage() {
  const apiUrl = process.env.API_URL;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0b14]">
      {/* Background glow */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/8 blur-[120px]" />

      {/* ── Nav ──────────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 md:px-16">
        <span className="text-lg font-bold text-white">
          Memor<span className="text-blue-400">AIA</span>
        </span>

        <a
          href={`${apiUrl}/auth/twitch`}
          className="flex h-10 items-center gap-2 rounded-lg bg-[#9146FF] px-5 text-sm font-semibold text-white transition-all hover:bg-[#7c3aed] hover:shadow-lg hover:shadow-purple-500/20"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
          Iniciar con Twitch
        </a>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-col items-center px-4 pt-6 md:pt-10">
        {/* ── Card Showcase ────────────────────────────────────── */}
        <div className="relative mt-14 flex items-center justify-center">
          {/* Side card left */}
          <div className="absolute -left-32 z-0 hidden h-[280px] w-[200px] -rotate-6 rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#111428] to-[#0c0f24] opacity-40 blur-[2px] md:block">
            <div className="flex h-full items-center justify-center">
              <div className="h-20 w-16 rounded-lg bg-white/[0.03]" />
            </div>
          </div>

          {/* Side card right */}
          <div className="absolute -right-32 z-0 hidden h-[280px] w-[200px] rotate-6 rounded-2xl border border-white/[0.04] bg-gradient-to-b from-[#111428] to-[#0c0f24] opacity-40 blur-[2px] md:block">
            <div className="flex h-full items-center justify-center">
              <div className="h-20 w-16 rounded-lg bg-white/[0.03]" />
            </div>
          </div>

          {/* Main card */}
          <div className="relative z-10">
            {/* Glow border */}
            <div className="absolute -inset-px rounded-[20px] bg-gradient-to-b from-blue-500/30 via-blue-500/5 to-purple-500/20" />

            <div className="relative flex w-[380px] flex-col rounded-[20px] border border-white/[0.08] bg-[#1a1a2e] p-5 shadow-2xl">
              {/* Header — name + logo */}
              <div className="flex items-center justify-between px-1 pb-3">
                <h3 className="text-lg font-extrabold uppercase tracking-wide text-white">
                  HuskyBot
                </h3>
                <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                  Husky
                </span>
              </div>

              {/* Image */}
              <div className="overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://cdn.memoraia.org/huskybot.png"
                  alt="HuskyBot"
                  className="w-full object-contain"
                />
              </div>

              {/* Description */}
              <p className="mt-4 px-1 text-center text-xs leading-relaxed text-zinc-400">
                Un husky insaciable que se alimenta de inteligencia artificial.
                Cada modelo que devora lo hace más fuerte y más impredecible.
              </p>

              {/* ID badge */}
              <div className="mt-4 flex justify-center">
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1 text-[11px] font-semibold text-zinc-400">
                  #001
                </span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="relative z-10 mt-24 flex flex-col items-center gap-4 border-t border-zinc-800/50 px-4 py-10">
        <span className="text-sm font-bold text-white">
          Memor<span className="text-blue-400">AIA</span>
        </span>
        <p className="max-w-sm text-center text-xs text-zinc-600">
          © 2026 MemorAIA. Colecciona, fusiona y batalla con cartas de tus
          streamers favoritos.
        </p>
        <div className="flex gap-6">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400">
            Términos
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400">
            Privacidad
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 transition-colors hover:text-zinc-400">
            Soporte
          </span>
        </div>
      </footer>
    </div>
  );
}
