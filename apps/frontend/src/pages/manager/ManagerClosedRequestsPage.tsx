import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RequestStatus, Role } from "@app/shared-types";
import { requestsApi, RequestFilters } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { RequestFiltersBar } from "@/features/requests/RequestFilters";
import { ExportButtons } from "@/features/requests/ExportButtons";
import { useAuth } from "@/shared/hooks/useAuth";
import { CheckCircle2 } from "lucide-react";

/**
 * Yopilgan zayavkalar tarixi + PDF/XLSX hisobot yuklab olish.
 * Rahbar uchun qo'shimcha kesimlar: texnik, yaratuvchi va lavozim bo'yicha.
 */
export function ManagerClosedRequestsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<RequestFilters>({
    status: RequestStatus.CLOSED,
    pageSize: 100,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["requests", "manager-closed", filters],
    queryFn: () => requestsApi.list(filters).then((r) => r.data),
  });

  return (
    <div>
      <RequestFiltersBar
        filters={filters}
        onChange={setFilters}
        showPeopleFilters={user?.role === Role.EXECUTIVE}
      />
      <ExportButtons filters={filters} />
      <RequestList
        items={data?.items}
        isLoading={isLoading}
        emptyTitle="Zayavkalar topilmadi"
        emptySubtitle="Filtrlarni o'zgartirib ko'ring"
        emptyIcon={CheckCircle2}
      />
    </div>
  );
}
