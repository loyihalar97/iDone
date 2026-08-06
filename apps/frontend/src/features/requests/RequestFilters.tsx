import { useQuery } from "@tanstack/react-query";
import { STATUS_LABELS_UZ, Priority, RequestStatus } from "@app/shared-types";
import { branchesApi } from "@/shared/api";
import { RequestFilters as Filters } from "@/shared/api/requests";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function RequestFiltersBar({ filters, onChange }: Props) {
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
  });

  return (
    <div className="px-4 pt-2 pb-3 flex gap-2 overflow-x-auto">
      <select
        value={filters.status ?? ""}
        onChange={(e) => onChange({ ...filters, status: (e.target.value || undefined) as RequestStatus })}
        className="bg-tg-secondaryBg border border-black/10 rounded-lg px-2 py-1.5 text-xs text-tg-text flex-shrink-0"
      >
        <option value="">Barcha statuslar</option>
        {Object.entries(STATUS_LABELS_UZ).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      <select
        value={filters.branchId ?? ""}
        onChange={(e) => onChange({ ...filters, branchId: e.target.value || undefined })}
        className="bg-tg-secondaryBg border border-black/10 rounded-lg px-2 py-1.5 text-xs text-tg-text flex-shrink-0"
      >
        <option value="">Barcha filiallar</option>
        {branches?.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <select
        value={filters.priority ?? ""}
        onChange={(e) => onChange({ ...filters, priority: (e.target.value || undefined) as Priority })}
        className="bg-tg-secondaryBg border border-black/10 rounded-lg px-2 py-1.5 text-xs text-tg-text flex-shrink-0"
      >
        <option value="">Barcha darajalar</option>
        <option value={Priority.LOW}>Past</option>
        <option value={Priority.MEDIUM}>O'rta</option>
        <option value={Priority.HIGH}>Yuqori</option>
        <option value={Priority.CRITICAL}>Kritik</option>
      </select>
    </div>
  );
}
