import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { requestsApi, RequestFilters, RequestItem } from "@/shared/api/requests";
import { RequestList } from "@/features/requests/RequestList";
import { RequestFiltersBar } from "@/features/requests/RequestFilters";
import { telegram, confirmDialog } from "@/shared/telegram/webapp";
import { Inbox } from "lucide-react";

export function SuperadminRequestsPage() {
  const [filters, setFilters] = useState<RequestFilters>({ pageSize: 50 });
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["requests", "superadmin", filters],
    queryFn: () => requestsApi.list(filters).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => requestsApi.remove(id),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: () => telegram.HapticFeedback.notificationOccurred("error"),
  });

  async function handleDelete(request: RequestItem) {
    const ok = await confirmDialog(
      `"${request.branch.name}" zayavkasini butunlay o'chirasizmi? Bu amalni ortga qaytarib bo'lmaydi.`
    );
    if (ok) deleteMutation.mutate(request.id);
  }

  return (
    <div>
      <RequestFiltersBar filters={filters} onChange={setFilters} />
      <RequestList
        items={data?.items}
        isLoading={isLoading}
        emptyTitle="Zayavkalar topilmadi"
        emptyIcon={Inbox}
        onDelete={handleDelete}
      />
    </div>
  );
}
