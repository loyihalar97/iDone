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
import { Camera, Play, UserPlus, CheckCheck, PackageCheck, Banknote } from "lucide-react";

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { labelFor } = useCategoryLabels();
  const queryClient = useQueryClient();
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  // Bosh texnik "Ishni yakunlash"da kiritadigan harajat summasi (majburiy, 0 mumkin).
  const [expenseInput, setExpenseInput] = useState("");

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
      let expenseAmount: number | undefined;
      if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN) {
        if (!afterFile) throw new Error("Natija rasmi majburiy");
        const { data } = await mediaApi.upload(afterFile);
        afterPhotoUrl = data.url;
      }
      if (nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN) {
        const parsed = Number(expenseInput.replace(/\s/g, ""));
        if (expenseInput.trim() === "" || Number.isNaN(parsed) || parsed < 0) {
          throw new Error("Harajat summasini kiriting. Harajat bo'lmasa 0 kiriting.");
        }
        expenseAmount = parsed;
      }
      return requestsApi.changeStatus(id!, nextStatus, afterPhotoUrl, expenseAmount);
    },
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["requests", id] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? err.message ?? "Xatolik yuz berdi");
    },
  });

  if (isLoading || !request) return <Spinner label="Yuklanmoqda..." />;

  const isAssignedTechnician =
    user?.role === Role.TECHNICIAN && request.technician?.id === user.id;

  const canAssign = user?.role === Role.CHIEF_TECHNICIAN && request.status === RequestStatus.NEW;
  // Texnik (biriktirilgan bo'lsa) yoki Bosh texnik ishni boshlaydi.
  const canStart =
    (isAssignedTechnician || user?.role === Role.CHIEF_TECHNICIAN) &&
    request.status === RequestStatus.NEW;
  // Texnik ishni tugatib, natija rasmi bilan yakunlaydi (Bosh texnik ham mumkin).
  const canComplete =
    (isAssignedTechnician || user?.role === Role.CHIEF_TECHNICIAN) &&
    request.status === RequestStatus.IN_PROGRESS;
  // Bosh texnik harajat summasini kiritib ishni yakunlaydi.
  const canChiefFinish =
    user?.role === Role.CHIEF_TECHNICIAN && request.status === RequestStatus.COMPLETED_BY_TECHNICIAN;
  const canDirectorAccept =
    user?.role === Role.DIRECTOR && request.status === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN;

  const expenseValid = (() => {
    const parsed = Number(expenseInput.replace(/\s/g, ""));
    return expenseInput.trim() !== "" && !Number.isNaN(parsed) && parsed >= 0;
  })();

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
        {request.chiefTechnician && (
          <p className="text-[12px] font-medium text-inkFaint">
            Bosh texnik: {request.chiefTechnician.fullName}
          </p>
        )}
        {request.technician && (
          <p className="text-[12px] font-medium text-inkFaint">Texnik: {request.technician.fullName}</p>
        )}
        {request.expenseAmount !== null && request.expenseAmount !== undefined && (
          <p className="text-[12px] font-bold text-tg-text mt-1">
            💵 Harajat: {request.expenseAmount.toLocaleString("uz-UZ")} so'm
          </p>
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
        <Button
          icon={Play}
          className="w-full"
          disabled={statusMutation.isPending}
          onClick={() => statusMutation.mutate(RequestStatus.IN_PROGRESS)}
        >
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
            {statusMutation.isPending ? "Yuborilmoqda..." : "Ishni yakunlash"}
          </Button>
        </Card>
      )}

      {canChiefFinish && (
        <Card>
          <Label>Ishlatilgan harajatlar summasi (majburiy)</Label>
          <div className="relative mb-1">
            <Banknote
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-inkFaint"
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={expenseInput}
              onChange={(e) => setExpenseInput(e.target.value)}
              placeholder="Masalan: 150000 (harajat bo'lmasa 0)"
              className="w-full bg-tg-secondaryBg border border-line rounded-control pl-9 pr-14 py-2.5 text-[14px] font-semibold text-tg-text outline-none focus:border-accent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-inkFaint">
              so'm
            </span>
          </div>
          <p className="text-[11.5px] text-tg-hint mb-3">
            Harajat bo'lmagan bo'lsa 0 kiriting. Summasiz ishni yakunlab bo'lmaydi.
          </p>
          <Button
            icon={CheckCheck}
            className="w-full"
            disabled={!expenseValid || statusMutation.isPending}
            onClick={() => statusMutation.mutate(RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN)}
          >
            {statusMutation.isPending ? "Yuborilmoqda..." : "Ishni yakunlash"}
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
