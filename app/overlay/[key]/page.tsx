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

interface DroppedCard {
  id: string;
  templateId: string;
  name: string;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  imageUrl: string;
  level: number;
  attack: number;
  defense: number;
  agility: number;
}

interface CardDropEvent {
  card: DroppedCard;
  subscriberName: string;
}

interface WinnerCardTemplate {
  id: string;
  name: string;
  rarity: string;
  imageUrl: string;
}

interface WinnerCard {
  id: string;
  ownerId: string;
  templateId: string;
  level: number;
  xp: number;
  attack: number;
  defense: number;
  agility: number;
  obtainedVia: string;
  isActive: boolean;
  destroyedAt: string | null;
  destroyedReason: string | null;
  obtainedAt: string;
  template: WinnerCardTemplate;
}

interface BattleResolvedEvent {
  id: string;
  status: "finished";
  winnerCard: WinnerCard;
  xpGained: number;
  finishedAt: string;
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
  const [cardDrop, setCardDrop] = useState<CardDropEvent | null>(null);
  const [battleResult, setBattleResult] = useState<BattleResolvedEvent | null>(null);

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

    source.addEventListener("card.drop", (e) => {
      const data: CardDropEvent = JSON.parse(e.data);
      setCardDrop(data);
      setTimeout(() => setCardDrop(null), 10000);
    });

    source.addEventListener("battle.resolved", (e) => {
      const data: BattleResolvedEvent = JSON.parse(e.data);
      setBattleResult(data);
      setTimeout(() => setBattleResult(null), 12000);
    });

    source.onerror = () => {
      setConnected(false);
    };

    return () => source.close();
  }, [key]);

  const rarityBorder: Record<string, string> = {
    common: "border-zinc-400",
    uncommon: "border-green-400",
    rare: "border-blue-400",
    epic: "border-purple-400",
    legendary: "border-yellow-400",
  };

  const rarityText: Record<string, string> = {
    common: "text-zinc-400",
    uncommon: "text-green-400",
    rare: "text-blue-400",
    epic: "text-purple-400",
    legendary: "text-yellow-400",
  };

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

      {cardDrop && (
        <div
          className={`animate-card-drop absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-sm ${rarityBorder[cardDrop.card.rarity]}`}
        >
          <img
            src={cardDrop.card.imageUrl}
            alt={cardDrop.card.name}
            className="mx-auto h-40 w-28 rounded-lg object-cover shadow-lg"
          />
          <p className={`mt-3 text-center text-xl font-bold ${rarityText[cardDrop.card.rarity]}`}>
            {cardDrop.card.name}
          </p>
          <p className={`text-center text-xs font-semibold uppercase tracking-widest ${rarityText[cardDrop.card.rarity]}`}>
            {cardDrop.card.rarity}
          </p>
          <div className="mt-2 flex justify-center gap-4 text-sm text-zinc-300">
            <span>
              <span className="font-semibold text-red-400">ATK</span>{" "}
              {cardDrop.card.attack}
            </span>
            <span>
              <span className="font-semibold text-blue-400">DEF</span>{" "}
              {cardDrop.card.defense}
            </span>
            <span>
              <span className="font-semibold text-green-400">AGI</span>{" "}
              {cardDrop.card.agility}
            </span>
          </div>
          <p className="mt-3 text-center text-sm text-zinc-400">
            <span className="font-medium text-white">{cardDrop.subscriberName}</span>{" "}
            received a card!
          </p>
        </div>
      )}

      {battleResult && (
        <div className="animate-fade-in absolute right-8 top-8 z-40 w-64 rounded-xl border border-yellow-500/30 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            Battle Winner!
          </p>
          <img
            src={battleResult.winnerCard.template.imageUrl}
            alt={battleResult.winnerCard.template.name}
            className="mx-auto mt-2 h-32 w-24 rounded-lg object-cover shadow-lg"
          />
          <p className="mt-2 text-center text-lg font-bold text-white">
            {battleResult.winnerCard.template.name}
          </p>
          <p className="text-center text-sm text-zinc-400">
            Level {battleResult.winnerCard.level}
          </p>
          <div className="mt-1 flex justify-center">
            <span className="rounded-full bg-yellow-500/20 px-3 py-0.5 text-xs font-semibold text-yellow-400">
              +{battleResult.xpGained} XP
            </span>
          </div>
          <div className="mt-2 flex justify-center gap-4 text-sm text-zinc-300">
            <span>
              <span className="font-semibold text-red-400">ATK</span>{" "}
              {battleResult.winnerCard.attack}
            </span>
            <span>
              <span className="font-semibold text-blue-400">DEF</span>{" "}
              {battleResult.winnerCard.defense}
            </span>
            <span>
              <span className="font-semibold text-green-400">AGI</span>{" "}
              {battleResult.winnerCard.agility}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
