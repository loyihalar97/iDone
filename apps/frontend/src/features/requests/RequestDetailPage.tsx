import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CATEGORY_LABELS_UZ, Role, RequestStatus } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { usersApi } from "@/shared/api";
import { Card, Button, Spinner } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge } from "@/shared/ui/Badges";
import { useAuth } from "@/shared/hooks/useAuth";
import { telegram } from "@/shared/telegram/webapp";

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");

  const { data: request, isLoading } = useQuery({
    queryKey: ["requests", id],
    queryFn: () => requestsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const { data: technicians } = useQuery({
    queryKey: ["technicians", request?.branchId],
    queryFn: () => usersApi.technicians(request?.branchId).then((r) => r.data),
    enabled: user?.role === Role.CHIEF_TECHNICIAN && !!request,
  });

  const assignMutation = useMutation({
    mutationFn: () => requestsApi.assignTechnician(id!, selectedTechnicianId),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["requests", id] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (nextStatus: RequestStatus) => {
      let afterPhotoUrl: string | undefined;
      if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN) {
        if (!afterFile) throw new Error("Natija rasmi majburiy");
        const { data } = await mediaApi.upload(afterFile);
        afterPhotoUrl = data.url;
      }
      return requestsApi.changeStatus(id!, nextStatus, afterPhotoUrl);
    },
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["requests", id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: () => telegram.HapticFeedback.notificationOccurred("error"),
  });

  if (isLoading || !request) return <Spinner label="Yuklanmoqda..." />;

  const canAssign = user?.role === Role.CHIEF_TECHNICIAN && request.status === RequestStatus.NEW;
  const canStart =
    (user?.role === Role.TECHNICIAN || user?.role === Role.CHIEF_TECHNICIAN) &&
    request.status === RequestStatus.NEW;
  const canComplete = user?.role === Role.TECHNICIAN && request.status === RequestStatus.IN_PROGRESS;
  const canChiefApprove =
    user?.role === Role.CHIEF_TECHNICIAN && request.status === RequestStatus.COMPLETED_BY_TECHNICIAN;
  const canDirectorAccept =
    user?.role === Role.DIRECTOR && request.status === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN;

  return (
    <div className="px-4 pb-8 pt-2 space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg text-tg-text">{request.branch.name}</h2>
          <StatusBadge status={request.status} />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <PriorityBadge priority={request.priority} />
          <span className="text-sm text-tg-hint">{CATEGORY_LABELS_UZ[request.category]}</span>
        </div>
        <p className="text-tg-text mb-3">{request.description}</p>
        <img src={request.beforePhotoUrl} alt="Muammo" className="w-full h-48 object-cover rounded-xl mb-2" />
        <p className="text-xs text-tg-hint">Yaratdi: {request.createdBy.fullName}</p>
        {request.technician && (
          <p className="text-xs text-tg-hint">Texnik: {request.technician.fullName}</p>
        )}
      </Card>

      {request.afterPhotoUrl && (
        <Card>
          <p className="text-sm font-medium text-tg-text mb-2">Natija rasmi</p>
          <img src={request.afterPhotoUrl} alt="Natija" className="w-full h-48 object-cover rounded-xl" />
        </Card>
      )}

      {canAssign && (
        <Card>
          <label className="block text-sm font-medium text-tg-text mb-2">Texnikni biriktirish</label>
          <select
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            className="w-full bg-tg-bg border border-black/10 rounded-xl px-3 py-2.5 text-tg-text mb-3"
          >
            <option value="">Texnikni tanlang</option>
            {technicians?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
          <Button
            className="w-full"
            disabled={!selectedTechnicianId || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            Biriktirish
          </Button>
        </Card>
      )}

      {canStart && (
        <Button className="w-full" onClick={() => statusMutation.mutate(RequestStatus.IN_PROGRESS)}>
          Ishni boshlash
        </Button>
      )}

      {canComplete && (
        <Card>
          <label className="block text-sm font-medium text-tg-text mb-2">
            Natija rasmi (majburiy)
          </label>
          <input
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
          />
          <Button
            className="w-full mt-3"
            disabled={!afterFile || statusMutation.isPending}
            onClick={() => statusMutation.mutate(RequestStatus.COMPLETED_BY_TECHNICIAN)}
          >
            {statusMutation.isPending ? "Yuborilmoqda..." : "Bajarildi"}
          </Button>
        </Card>
      )}

      {canChiefApprove && (
        <Button className="w-full" onClick={() => statusMutation.mutate(RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN)}>
          Tasdiqlash
        </Button>
      )}

      {canDirectorAccept && (
        <Button className="w-full" onClick={() => statusMutation.mutate(RequestStatus.ACCEPTED_BY_DIRECTOR)}>
          Qabul qilish (zayavka yopiladi)
        </Button>
      )}
    </div>
  );
}
