import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { RequestStatus } from "@app/shared-types";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { Button } from "@/shared/ui/primitives";
import { Plus, Inbox } from "lucide-react";

export function DirectorRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "director"],
    queryFn: () => requestsApi.list({ pageSize: 100 }).then((r) => r.data),
  });

  const openItems = data?.items.filter((r) => r.status !== RequestStatus.CLOSED);

  return (
    <div>
      <RequestList
        items={openItems}
        isLoading={isLoading}
        emptyTitle="Ochiq zayavkalar yo'q"
        emptySubtitle="Yangi texnik muammo bo'lsa, pastdagi tugma orqali zayavka yarating"
        emptyIcon={Inbox}
      />
      <div className="px-4 pb-4">
        <Link to="/director/new">
          <Button icon={Plus} className="w-full !text-base !py-3.5">
            Yangi zayavka
          </Button>
        </Link>
      </div>
    </div>
  );
}
