"use client";

import { useCallback, useEffect, useRef, useState, use } from "react";
import "@quesoconjamon/memocard";

// ── Types ────────────────────────────────────────────────────

interface Redemption {
  id: string;
  userName: string;
  userInput: string;
  reward: { id: string; title: string; cost: number };
  redeemedAt: string;
}

interface ChannelUpdate {
  channel: string;
  title: string;
  category: string;
  language: string;
}

interface CardDropEvent {
  queueId: string;
  card: {
    id: string;
    level: number;
    attack: number;
    defense: number;
    agility: number;
  };
  template: {
    name: string;
    description: string | null;
    image_url: string;
    rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
    category: string | null;
  };
  subscriberName: string;
}

interface OverlayQueueItem {
  id: string;
  streamerId: string;
  cardId: string;
  templateData: {
    name: string;
    description: string | null;
    image_url: string;
    rarity: string;
    category: string | null;
  };
  cardStats: {
    level: number;
    attack: number;
    defense: number;
    agility: number;
  };
  subscriberName: string;
  status: "pending" | "revealed" | "dismissed";
  createdAt: string;
}

interface QueuedCard {
  queueId: string;
  card: CardDropEvent["card"];
  template: CardDropEvent["template"];
  subscriberName: string;
  status: "pending" | "centered" | "revealed";
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

// ── Helpers ──────────────────────────────────────────────────

const MAX_VISIBLE_QUEUE = 4;

function queueItemToQueued(item: OverlayQueueItem): QueuedCard {
  return {
    queueId: item.id,
    card: { id: item.cardId, ...item.cardStats },
    template: item.templateData as QueuedCard["template"],
    subscriberName: item.subscriberName,
    status: "pending",
  };
}

function sseEventToQueued(event: CardDropEvent): QueuedCard {
  return {
    queueId: event.queueId,
    card: event.card,
    template: event.template,
    subscriberName: event.subscriberName,
    status: "pending",
  };
}

// ── Component ────────────────────────────────────────────────

export default function OverlayPage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  const { key } = use(params);
  const apiUrl = useRef(process.env.NEXT_PUBLIC_API_URL);

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [channelUpdate, setChannelUpdate] = useState<ChannelUpdate | null>(null);
  const [connected, setConnected] = useState(false);
  const [cardQueue, setCardQueue] = useState<QueuedCard[]>([]);
  const [battleResult, setBattleResult] = useState<BattleResolvedEvent | null>(null);

  // ── Queue operations ─────────────────────────────────────

  const addToQueue = useCallback((card: QueuedCard) => {
    setCardQueue((prev) => {
      if (prev.some((c) => c.queueId === card.queueId)) return prev;
      return [...prev, card];
    });
  }, []);

  const patchStatus = useCallback(
    async (queueId: string, status: "revealed" | "dismissed") => {
      try {
        await fetch(`${apiUrl.current}/overlay/${key}/queue/${queueId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
      } catch {
        // silent — overlay should not break on PATCH failure
      }
    },
    [key],
  );

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl.current}/overlay/${key}/queue`);
      if (!res.ok) return;
      const items: OverlayQueueItem[] = await res.json();
      items.forEach((item) => addToQueue(queueItemToQueued(item)));
    } catch {
      // silent
    }
  }, [key, addToQueue]);

  // ── Click handlers ───────────────────────────────────────

  const handleQueueClick = useCallback((queueId: string) => {
    setCardQueue((prev) => {
      const hasCentered = prev.some((c) => c.status === "centered" || c.status === "revealed");
      if (hasCentered) return prev;
      return prev.map((c) =>
        c.queueId === queueId ? { ...c, status: "centered" as const } : c,
      );
    });
  }, []);

  const handleCenteredClick = useCallback(
    (queueId: string) => {
      setCardQueue((prev) =>
        prev.map((c) =>
          c.queueId === queueId ? { ...c, status: "revealed" as const } : c,
        ),
      );
      patchStatus(queueId, "revealed");
    },
    [patchStatus],
  );

  const handleDismiss = useCallback(
    (queueId: string) => {
      setCardQueue((prev) => prev.filter((c) => c.queueId !== queueId));
      patchStatus(queueId, "dismissed");
    },
    [patchStatus],
  );

  // ── SSE connection ───────────────────────────────────────

  useEffect(() => {
    const source = new EventSource(`${apiUrl.current}/overlay/${key}/events`);

    source.addEventListener("connected", () => {
      setConnected(true);
      fetchQueue();
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
      setTimeout(() => setChannelUpdate(null), 8000);
    });

    source.addEventListener("card.drop", (e) => {
      const data: CardDropEvent = JSON.parse(e.data);
      addToQueue(sseEventToQueued(data));
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
  }, [key, addToQueue, fetchQueue]);

  // ── Derived state ────────────────────────────────────────

  const centeredCard = cardQueue.find(
    (c) => c.status === "centered" || c.status === "revealed",
  );
  const pendingCards = cardQueue.filter((c) => c.status === "pending");
  const visibleQueue = pendingCards.slice(0, MAX_VISIBLE_QUEUE);
  const hiddenCount = pendingCards.length - visibleQueue.length;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent">
      {/* Channel update */}
      {channelUpdate && (
        <div className="animate-fade-in absolute top-8 left-1/2 -translate-x-1/2 rounded-xl border border-blue-500/30 bg-zinc-900/90 px-6 py-4 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
            Canal actualizado
          </p>
          <p className="mt-1 text-lg font-bold text-white">
            {channelUpdate.title}
          </p>
          <p className="text-sm text-zinc-400">{channelUpdate.category}</p>
        </div>
      )}

      {/* Redemptions */}
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

      {/* Centered / revealed card */}
      {centeredCard && (
        <div
          className="animate-card-to-center absolute left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center"
          onClick={() =>
            centeredCard.status === "centered"
              ? handleCenteredClick(centeredCard.queueId)
              : handleDismiss(centeredCard.queueId)
          }
        >
          <memo-card
            data-id={centeredCard.card.id}
            data-name={centeredCard.template.name}
            data-description={centeredCard.template.description ?? ""}
            data-image={centeredCard.template.image_url}
            data-category={centeredCard.template.category ?? ""}
            data-level={String(centeredCard.card.level)}
            data-attack={String(centeredCard.card.attack)}
            data-defense={String(centeredCard.card.defense)}
            data-flipped={centeredCard.status !== "revealed" ? "" : undefined}
            data-interactive={centeredCard.status === "centered" ? "" : undefined}
            style={{
              // @ts-expect-error -- CSS custom property for web component
              "--size": "300px",
            }}
          />
          <p className="mt-3 text-center text-sm text-zinc-400">
            <span className="font-medium text-white">
              {centeredCard.subscriberName}
            </span>{" "}
            {centeredCard.status === "revealed"
              ? "received a card!"
              : "click to reveal"}
          </p>
        </div>
      )}

      {/* Queue bar */}
      {pendingCards.length > 0 && (
        <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-end gap-3">
          {visibleQueue.map((card) => (
            <div
              key={card.queueId}
              className="animate-card-enter-queue cursor-pointer transition-transform hover:scale-105"
              onClick={() => handleQueueClick(card.queueId)}
            >
              <memo-card
                data-id={card.card.id}
                data-name={card.template.name}
                data-image={card.template.image_url}
                data-category={card.template.category ?? ""}
                data-level={String(card.card.level)}
                data-attack={String(card.card.attack)}
                data-defense={String(card.card.defense)}
                data-flipped=""
                style={{
                  // @ts-expect-error -- CSS custom property for web component
                  "--size": "120px",
                }}
              />
              <p className="mt-1 text-center text-xs text-zinc-400">
                {card.subscriberName}
              </p>
            </div>
          ))}
          {hiddenCount > 0 && (
            <div className="flex h-[120px] w-[85px] items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 backdrop-blur-sm">
              <span className="text-lg font-bold text-zinc-400">
                +{hiddenCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Battle result */}
      {battleResult && (
        <div className="animate-fade-in absolute right-8 top-8 z-40 w-64 rounded-xl border border-yellow-500/30 bg-zinc-900/90 p-5 shadow-2xl backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            Battle Winner!
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
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
