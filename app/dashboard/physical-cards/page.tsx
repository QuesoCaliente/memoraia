import { getMyPhysicalCards } from "@/app/lib/api";
import { PhysicalCardList } from "./physical-card-list";
import Link from "next/link";

export default async function PhysicalCardsPage() {
  const physicalCards = await getMyPhysicalCards();

  return (
    <div className="flex min-h-screen flex-col items-center justify-start bg-zinc-950 p-8 text-white">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Physical Cards</h1>
          <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
        <p className="text-sm text-zinc-400">
          Request physical versions of your digital cards. Track your orders below.
        </p>
        <PhysicalCardList initialRequests={physicalCards.data} total={physicalCards.total} />
      </div>
    </div>
  );
}
