import { RequestItem } from "@/shared/api/requests";
import { RequestCard } from "./RequestCard";
import { Spinner, EmptyState } from "@/shared/ui/primitives";

export function RequestList({
  items,
  isLoading,
  emptyTitle = "Zayavkalar topilmadi",
  emptySubtitle,
}: {
  items: RequestItem[] | undefined;
  isLoading: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
}) {
  if (isLoading) return <Spinner label="Yuklanmoqda..." />;
  if (!items || items.length === 0) return <EmptyState title={emptyTitle} subtitle={emptySubtitle} />;

  return (
    <div className="px-4 pb-4">
      {items.map((r) => (
        <RequestCard key={r.id} request={r} />
      ))}
    </div>
  );
}
