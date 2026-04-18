import { MemoCardLoader } from "@/components/memo-card";

export default function LoginPage() {
  const apiUrl = process.env.API_URL;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0b14]">
      <MemoCardLoader />

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
          <memo-card
            data-id="999"
            data-name="HuskyBot"      
            data-interactive=""
            data-description="Un husky insaciable que se alimenta de inteligencia artificial. Cada modelo que devora lo hace más fuerte y más impredecible. Es un ser curioso y juguetón, pero también puede ser peligroso si se siente amenazado o si no se le da suficiente atención"
            data-attack="75"
            data-defense="40"
            data-image="https://cdn.memoraia.org/huskybot.png"
            data-category="kawaii"
            data-level="5"
            style={{
              // @ts-expect-error -- CSS custom property for web component
              "--size": "400px",
              "--category-color": `linear-gradient(
                153deg,
                var(--gradient-stop-1) 0%,
                var(--gradient-stop-2) 20%,
                var(--gradient-stop-3) 41.86%,
                var(--gradient-stop-4) 59.84%,
                var(--gradient-stop-5) 75.37%,
                var(--gradient-stop-6) 100%
              )`,
            }}
          />
        </div>

      </main>
    </div>
  );
}
