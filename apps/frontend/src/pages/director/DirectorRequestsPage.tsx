import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { requestsApi } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { Button } from "@/shared/ui/primitives";

export function DirectorRequestsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["requests", "director"],
    queryFn: () => requestsApi.list({ pageSize: 50 }).then((r) => r.data),
  });

  return (
    <div>
      <div className="px-4 pt-2 pb-4">
        <Link to="/director/new">
          <Button className="w-full">+ Yangi zayavka</Button>
        </Link>
      </div>
      <RequestList
        items={data?.items}
        isLoading={isLoading}
        emptyTitle="Hali zayavka yaratmagansiz"
        emptySubtitle="Yangi texnik muammo bo'lsa, yuqoridagi tugma orqali zayavka yarating"
      />
    </div>
  );
}
