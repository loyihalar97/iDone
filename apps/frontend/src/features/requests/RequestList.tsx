import { LucideIcon, Trash2 } from "lucide-react";
import { RequestItem } from "@/shared/api/requests";
import { RequestCard } from "./RequestCard";
import { Spinner, EmptyState } from "@/shared/ui/primitives";
import { SwipeRow } from "@/shared/ui/SwipeRow";

export function RequestList({
  items,
  isLoading,
  emptyTitle = "Zayavkalar topilmadi",
  emptySubtitle,
  emptyIcon,
  onDelete,
}: {
  items: RequestItem[] | undefined;
  isLoading: boolean;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: LucideIcon;
  /** Berilsa — har bir karta chapga surilganda "O'chirish" amali ko'rinadi. */
  onDelete?: (request: RequestItem) => void;
}) {
  if (isLoading) return <Spinner label="Yuklanmoqda..." />;
  if (!items || items.length === 0)
    return <EmptyState title={emptyTitle} subtitle={emptySubtitle} icon={emptyIcon} />;

  return (
    <div className="px-4 pb-4 space-y-3">
      {items.map((r) =>
        onDelete ? (
          <SwipeRow
            key={r.id}
            actions={[
              {
                key: "delete",
                label: "O'chirish",
                icon: Trash2,
                className: "bg-priority-critical text-white",
                onClick: () => onDelete(r),
              },
            ]}
          >
            <RequestCard request={r} />
          </SwipeRow>
        ) : (
          <RequestCard key={r.id} request={r} />
        )
      )}
    </div>
  );
}
