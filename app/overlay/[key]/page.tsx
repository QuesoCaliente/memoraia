"use client";

import { useEffect, useState, use } from "react";

interface Redemption {
  id: string;
  userName: string;
  userInput: string;
  reward: {
    id: string;
    title: string;
    cost: number;
  };
  redeemedAt: string;
}

interface ChannelUpdate {
  channel: string;
  title: string;
  category: string;
  language: string;
}

export default function OverlayPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [channelUpdate, setChannelUpdate] = useState<ChannelUpdate | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const source = new EventSource(`${apiUrl}/overlay/${key}/events`);

    source.addEventListener("connected", () => {
      setConnected(true);
    });

    source.addEventListener("redemption", (e) => {
      const data: Redemption = JSON.parse(e.data);
      setRedemptions((prev) => [data, ...prev]);

      setTimeout(() => {
        setRedemptions((prev) => prev.filter((r) => r.id !== data.id));
      }, 10000);
    });

    source.addEventListener("channel.update", (e) => {
      const data: ChannelUpdate = JSON.parse(e.data);
      setChannelUpdate(data);

      setTimeout(() => {
        setChannelUpdate(null);
      }, 8000);
    });

    source.onerror = () => {
      setConnected(false);
    };

    return () => source.close();
  }, [key]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent">
      {channelUpdate && (
        <div className="animate-fade-in absolute top-8 left-1/2 -translate-x-1/2 rounded-xl border border-blue-500/30 bg-zinc-900/90 px-6 py-4 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
            Canal actualizado
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {channelUpdate.title}
          </p>
          <p className="text-sm text-zinc-400">
            {channelUpdate.category}
          </p>
        </div>
      )}

      {redemptions.map((r) => (
        <div
          key={r.id}
          className="animate-fade-in absolute bottom-8 left-1/2 -translate-x-1/2 rounded-xl border border-purple-500/30 bg-zinc-900/90 px-6 py-4 shadow-2xl backdrop-blur-sm"
        >
          <p className="text-lg font-bold text-purple-400">{r.reward.title}</p>
          <p className="text-sm text-zinc-300">
            <span className="font-medium text-white">{r.userName}</span>
            {" canjeó por "}
            <span className="font-medium text-yellow-400">
              {r.reward.cost} pts
            </span>
          </p>
          {r.userInput && (
            <p className="mt-1 text-sm italic text-zinc-400">
              &quot;{r.userInput}&quot;
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
