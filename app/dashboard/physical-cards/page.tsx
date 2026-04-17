import { getMyPhysicalCards } from "@/app/lib/api";
import { PhysicalCardList } from "./physical-card-list";

export default async function PhysicalCardsPage() {
  const physicalCards = await getMyPhysicalCards();

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Physical Cards</h1>
        <p className="text-sm text-muted-foreground">
          Request physical versions of your digital cards. Track your orders
          below.
        </p>
      </div>
      <PhysicalCardList
        initialRequests={physicalCards.data}
        total={physicalCards.total}
      />
    </div>
  );
}
