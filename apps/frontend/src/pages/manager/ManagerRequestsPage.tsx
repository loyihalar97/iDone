import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { RequestStatus, Role } from "@app/shared-types";
import { requestsApi, RequestFilters } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { RequestFiltersBar } from "@/features/requests/RequestFilters";
import { ExportButtons } from "@/features/requests/ExportButtons";
import { Button } from "@/shared/ui/primitives";
import { useAuth } from "@/shared/hooks/useAuth";
import { Inbox, Plus } from "lucide-react";

/**
 * Rahbar / Hududiy rahbar / Filial menejeri uchun ochiq zayavkalar ro'yxati.
 * Ko'rish doirasi serverda rol bo'yicha cheklanadi:
 *  - Rahbar — barcha filiallar;
 *  - Hududiy rahbar — unga biriktirilgan filiallar;
 *  - Filial menejeri — o'z filiali.
 */
export function ManagerRequestsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<RequestFilters>({ pageSize: 100 });

  const { data, isLoading } = useQuery({
    queryKey: ["requests", "manager", filters],
    queryFn: () => requestsApi.list(filters).then((r) => r.data),
  });

  const openItems = data?.items.filter((r) => r.status !== RequestStatus.CLOSED);

  return (
    <div>
      <RequestFiltersBar
        filters={filters}
        onChange={setFilters}
        showPeopleFilters={user?.role === Role.EXECUTIVE}
      />
      <ExportButtons filters={filters} />
      <RequestList
        items={openItems}
        isLoading={isLoading}
        emptyTitle="Ochiq zayavkalar yo'q"
        emptySubtitle="Filtrlarni o'zgartirib ko'ring yoki yangi zayavka oching"
        emptyIcon={Inbox}
      />
      <div className="px-4 pb-4">
        <Link to="/manager/new">
          <Button icon={Plus} className="w-full !text-base !py-3.5">
            Yangi zayavka
          </Button>
        </Link>
      </div>
    </div>
  );
}
