import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestsApi, RequestFilters } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { RequestFiltersBar } from "@/features/requests/RequestFilters";
import { Inbox } from "lucide-react";

export function SuperadminRequestsPage() {
  const [filters, setFilters] = useState<RequestFilters>({ pageSize: 50 });

  const { data, isLoading } = useQuery({
    queryKey: ["requests", "superadmin", filters],
    queryFn: () => requestsApi.list(filters).then((r) => r.data),
  });

  return (
    <div>
      <RequestFiltersBar filters={filters} onChange={setFilters} />
      <RequestList
        items={data?.items}
        isLoading={isLoading}
        emptyTitle="Zayavkalar topilmadi"
        emptyIcon={Inbox}
      />
    </div>
  );
}
