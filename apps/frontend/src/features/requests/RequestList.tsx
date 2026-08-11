import { LucideIcon } from "lucide-react";
import { RequestItem } from "@/shared/api/requests";
import { RequestCard } from "./RequestCard";
import { Spinner, EmptyState } from "@/shared/ui/primitives";

export function RequestList({
  items,
  isLoading,
  emptyTitle = "Zayavkalar topilmadi",
  emptySubtitle,
  emptyIcon,
}: {
  items: RequestItem[] | undefined;
  isLoading: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: LucideIcon;
}) {
  if (isLoading) return <Spinner label="Yuklanmoqda..." />;
  if (!items || items.length === 0)
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} />;

  return (
    <div className="px-4 pb-4 space-y-3">
      {items.map((r) => (
        <RequestCard key={r.id} request={r} />
      ))}
    </div>
  );
}
