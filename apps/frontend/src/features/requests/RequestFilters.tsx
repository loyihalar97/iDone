import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { STATUS_LABELS_UZ, Priority, RequestStatus } from "@app/shared-types";
import { branchesApi } from "@/shared/api";
import { RequestFilters as Filters } from "@/shared/api/requests";
import { Select } from "@/shared/ui/primitives";
import { SlidersHorizontal } from "lucide-react";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const STATUS_CHIPS: { value: RequestStatus | undefined; label: string }[] = [
  { value: undefined, label: "Barchasi" },
  { value: RequestStatus.NEW, label: STATUS_LABELS_UZ[RequestStatus.NEW] },
  { value: RequestStatus.IN_PROGRESS, label: STATUS_LABELS_UZ[RequestStatus.IN_PROGRESS] },
  { value: RequestStatus.CLOSED, label: STATUS_LABELS_UZ[RequestStatus.CLOSED] },
];

export function RequestFiltersBar({ filters, onChange }: Props) {
  const [showMore, setShowMore] = useState(false);
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
  });

  const hasExtraFilters = !!filters.branchId || !!filters.priority;

  return (
    <div className="pt-3 pb-3">
      <div className="px-4 flex items-center gap-2">
        <div className="flex-1 flex gap-0.5 bg-tg-secondaryBg border border-line rounded-control p-1 overflow-x-auto no-scrollbar">
          {STATUS_CHIPS.map((chip) => {
            const isActive = filters.status === chip.value;
            return (
              <button
                key={chip.label}
                onClick={() => onChange({ ...filters, status: chip.value })}
                className={`flex-1 flex-shrink-0 whitespace-nowrap text-[12.5px] font-bold px-3 py-2 rounded-[9px] transition ${
                  isActive ? "bg-tg-text text-tg-bg" : "text-inkSoft"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowMore((v) => !v)}
          className={`relative flex-shrink-0 w-10 h-10 rounded-control flex items-center justify-center transition border ${
            showMore || hasExtraFilters
              ? "bg-accentSoft text-accent border-transparent"
              : "bg-tg-bg text-inkFaint border-line"
          }`}
          aria-label="Qo'shimcha filtrlar"
        >
          <SlidersHorizontal size={16} strokeWidth={2.25} />
          {hasExtraFilters && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
          )}
        </button>
      </div>

      {showMore && (
        <div className="px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar">
          <Select
            value={filters.status ?? ""}
            onChange={(e) => onChange({ ...filters, status: (e.target.value || undefined) as RequestStatus })}
            className="!w-auto flex-shrink-0 !rounded-pill text-xs py-2 bg-tg-secondaryBg"
          >
            <option value="">Barcha statuslar</option>
            {Object.entries(STATUS_LABELS_UZ).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Select
            value={filters.branchId ?? ""}
            onChange={(e) => onChange({ ...filters, branchId: e.target.value || undefined })}
            className="!w-auto flex-shrink-0 !rounded-pill text-xs py-2 bg-tg-secondaryBg"
          >
            <option value="">Barcha filiallar</option>
            {branches?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>

          <Select
            value={filters.priority ?? ""}
            onChange={(e) => onChange({ ...filters, priority: (e.target.value || undefined) as Priority })}
            className="!w-auto flex-shrink-0 !rounded-pill text-xs py-2 bg-tg-secondaryBg"
          >
            <option value="">Barcha darajalar</option>
            <option value={Priority.LOW}>Past</option>
            <option value={Priority.MEDIUM}>O'rta</option>
            <option value={Priority.HIGH}>Yuqori</option>
            <option value={Priority.CRITICAL}>Kritik</option>
          </Select>
        </div>
      )}
    </div>
  );
}
