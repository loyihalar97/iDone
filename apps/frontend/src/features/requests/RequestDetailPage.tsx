import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Role, RequestStatus } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { usersApi } from "@/shared/api";
import { Card, Button, Spinner, Label, Select, Thumb } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge } from "@/shared/ui/Badges";
import { useCategoryLabels } from "@/shared/hooks/useCategories";
import { useAuth } from "@/shared/hooks/useAuth";
import { telegram } from "@/shared/telegram/webapp";
import { Camera, Play, UserPlus, CheckCheck, PackageCheck } from "lucide-react";

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { labelFor } = useCategoryLabels();
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
  const canComplete = user?.role === Role.CHIEF_TECHNICIAN && request.status === RequestStatus.IN_PROGRESS;
  const canDirectorAccept =
    user?.role === Role.DIRECTOR && request.status === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN;

  return (
    <div className="px-4 pb-8 pt-2 space-y-3">
      <Card>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="font-extrabold text-[16px] text-tg-text tracking-tight2">{request.branch.name}</h2>
          <StatusBadge status={request.status} />
        </div>
        <div className="flex items-center gap-2 mb-3.5">
          <PriorityBadge priority={request.priority} />
          <span className="text-[13px] font-semibold text-tg-hint">{labelFor(request.category)}</span>
        </div>
        <p className="text-[14px] text-tg-text mb-3.5 leading-relaxed">{request.description}</p>
        <Thumb
          src={request.beforePhotoUrl}
          alt="Muammo"
          className="w-full h-48 object-cover rounded-control mb-3"
        />
        <p className="text-[12px] font-medium text-inkFaint">Yaratdi: {request.createdBy.fullName}</p>
        {request.technician && (
          <p className="text-[12px] font-medium text-inkFaint">Texnik: {request.technician.fullName}</p>
        )}
      </Card>

      {request.afterPhotoUrl && (
        <Card>
          <Label>Natija rasmi</Label>
          <Thumb
            src={request.afterPhotoUrl ?? undefined}
            alt="Natija"
            className="w-full h-48 object-cover rounded-control"
          />
        </Card>
      )}

      {canAssign && (
        <Card>
          <Label>Texnikni biriktirish</Label>
          <Select
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            className="mb-3"
          >
            <option value="">Texnikni tanlang</option>
            {technicians?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </Select>
          <Button
            icon={UserPlus}
            className="w-full"
            disabled={!selectedTechnicianId || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            Biriktirish
          </Button>
        </Card>
      )}

      {canStart && (
        <Button icon={Play} className="w-full" onClick={() => statusMutation.mutate(RequestStatus.IN_PROGRESS)}>
          Ishni boshlash
        </Button>
      )}

      {canComplete && (
        <Card>
          <Label>Natija rasmi (majburiy)</Label>
          <label className="flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-lineStrong rounded-control px-3 py-6 text-center text-[12.5px] font-semibold text-inkFaint cursor-pointer">
            <Camera size={20} strokeWidth={1.75} />
            {afterFile ? afterFile.name : "Rasm yoki video tanlang"}
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
          </label>
          <Button
            icon={CheckCheck}
            className="w-full mt-3"
            disabled={!afterFile || statusMutation.isPending}
            onClick={() => statusMutation.mutate(RequestStatus.COMPLETED_BY_TECHNICIAN)}
          >
            {statusMutation.isPending ? "Yuborilmoqda..." : "Tugatildi"}
          </Button>
        </Card>
      )}

      {canDirectorAccept && (
        <Button
          icon={PackageCheck}
          className="w-full"
          onClick={() => statusMutation.mutate(RequestStatus.ACCEPTED_BY_DIRECTOR)}
        >
          Qabul qilish (zayavka yopiladi)
        </Button>
      )}
    </div>
  );
}
