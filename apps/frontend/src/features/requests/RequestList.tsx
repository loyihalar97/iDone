import { LucideIcon, Trash2 } from "lucide-react";
import { RequestItem } from "@/shared/api/requests";
import { RequestCard } from "./RequestCard";
import { Spinner, EmptyState } from "@/shared/ui/primitives";
import { SwipeRow } from "@/shared/ui/SwipeRow";
import { useI18n } from "@/shared/i18n";

export function RequestList({
  items,
  isLoading,
  emptyTitle,
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
  const { t } = useI18n();

  if (isLoading) return <Spinner label={t.common.loading} />;
  if (!items || items.length === 0)
    return (
      <EmptyState
        title={emptyTitle ?? t.request.emptyNotFound}
        subtitle={emptySubtitle}
        icon={emptyIcon}
      />
    );

  return (
    <div className="px-4 pb-4 space-y-3">
      {items.map((r) =>
        onDelete ? (
          <SwipeRow
            key={r.id}
            actions={[
              {
                key: "delete",
                label: t.common.deleteFull,
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
