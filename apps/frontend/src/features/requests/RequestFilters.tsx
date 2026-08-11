import { useQuery } from "@tanstack/react-query";
import { STATUS_LABELS_UZ, Priority, RequestStatus } from "@app/shared-types";
import { branchesApi } from "@/shared/api";
import { RequestFilters as Filters } from "@/shared/api/requests";
import { Select } from "@/shared/ui/primitives";

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

const STATUS_CHIPS: { value: RequestStatus | undefined; label: string }[] = [
  { value: undefined, label: "Barchasi" },
  ...Object.entries(STATUS_LABELS_UZ).map(([value, label]) => ({
    value: value as RequestStatus,
    label,
  })),
];

export function RequestFiltersBar({ filters, onChange }: Props) {
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
  });

  return (
    <div className="pt-2 pb-3">
      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar">
        {STATUS_CHIPS.map((chip) => {
          const isActive = filters.status === chip.value;
          return (
            <button
              key={chip.label}
              onClick={() => onChange({ ...filters, status: chip.value })}
              className={`flex-shrink-0 whitespace-nowrap text-sm font-semibold px-4 py-2 rounded-pill transition active:scale-[0.97] ${
                isActive
                  ? "bg-accent text-white shadow-accent"
                  : "bg-accentSoft text-accentDark"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <div className="px-4 pt-2 flex gap-2 overflow-x-auto no-scrollbar">
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
    </div>
  );
}
