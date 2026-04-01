export default function LoginPage() {
  const apiUrl = process.env.API_URL;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-3xl font-bold text-white">MemorAIA</h1>
          <p className="text-center text-zinc-400">
            Overlay de recompensas para tu canal de Twitch
          </p>
        </div>

        <a
          href={`${apiUrl}/auth/twitch`}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-purple-600 font-medium text-white transition-colors hover:bg-purple-700"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
          Login con Twitch
        </a>
      </div>
    </div>
  );
}
