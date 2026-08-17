import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Priority, PRIORITY_LABELS_UZ, Role, ROLE_LABELS_UZ, RequestStatus } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { usersApi } from "@/shared/api";
import { Card, Button, Spinner, Label, Select, Textarea, Thumb } from "@/shared/ui/primitives";
import { PriorityBadge, StatusBadge } from "@/shared/ui/Badges";
import { useCategoryLabels } from "@/shared/hooks/useCategories";
import { useAuth } from "@/shared/hooks/useAuth";
import { telegram } from "@/shared/telegram/webapp";
import {
  Camera,
  Play,
  UserPlus,
  CheckCheck,
  PackageCheck,
  Banknote,
  MessageSquareWarning,
  AlertTriangle,
  Repeat,
} from "lucide-react";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { labelFor } = useCategoryLabels();
  const queryClient = useQueryClient();
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  // Harajat summasi — texnik (ixtiyoriy) va bosh texnik (ixtiyoriy, tahrirlash).
  const [technicianExpense, setTechnicianExpense] = useState("");
  const [expenseInput, setExpenseInput] = useState("");
  const [expenseTouched, setExpenseTouched] = useState(false);
  const [commentText, setCommentText] = useState("");

  const { data: request, isLoading } = useQuery({
    queryKey: ["requests", id],
    queryFn: () => requestsApi.getById(id!).then((r) => r.data),
    enabled: !!id,
  });

  const isChief = user?.role === Role.CHIEF_TECHNICIAN;

  const { data: technicians } = useQuery({
    queryKey: ["technicians", request?.branchId],
    queryFn: () => usersApi.technicians(request?.branchId).then((r) => r.data),
    enabled: isChief && !!request,
  });

  const { data: comments } = useQuery({
    queryKey: ["requests", id, "comments"],
    queryFn: () => requestsApi.comments(id!).then((r) => r.data),
    enabled: !!id,
  });

  function onMutationError(err: any) {
    telegram.HapticFeedback.notificationOccurred("error");
    telegram.showAlert(err?.response?.data?.error?.message ?? err.message ?? "Xatolik yuz berdi");
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["requests", id] });
    queryClient.invalidateQueries({ queryKey: ["requests"] });
  }

  const assignMutation = useMutation({
    mutationFn: () => requestsApi.assignTechnician(id!, selectedTechnicianId),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setSelectedTechnicianId("");
      invalidate();
    },
    onError: onMutationError,
  });

  const priorityMutation = useMutation({
    mutationFn: (priority: Priority) => requestsApi.changePriority(id!, priority),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      invalidate();
    },
    onError: onMutationError,
  });

  const commentMutation = useMutation({
    mutationFn: () => requestsApi.addComment(id!, commentText.trim(), true),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["requests", id, "comments"] });
      invalidate();
    },
    onError: onMutationError,
  });

  const statusMutation = useMutation({
    mutationFn: async (nextStatus: RequestStatus) => {
      let afterPhotoUrl: string | undefined;
      let expenseAmount: number | undefined;

      if (nextStatus === RequestStatus.COMPLETED_BY_TECHNICIAN) {
        if (!afterFile) throw new Error("Natija rasmi majburiy");
        const { data } = await mediaApi.upload(afterFile);
        afterPhotoUrl = data.url;

        // Texnik harajat kiritishi IXTIYORIY — kiritmasa server 0 yozadi.
        if (technicianExpense.trim() !== "") {
          const parsed = Number(technicianExpense.replace(/\s/g, ""));
          if (Number.isNaN(parsed) || parsed < 0) {
            throw new Error("Harajat summasi noto'g'ri kiritilgan");
          }
          expenseAmount = parsed;
        }
      }

      if (nextStatus === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN) {
        // Bosh texnik uchun summa MAJBURIY EMAS — faqat o'zgartirgan bo'lsa yuboriladi.
        if (expenseTouched && expenseInput.trim() !== "") {
          const parsed = Number(expenseInput.replace(/\s/g, ""));
          if (Number.isNaN(parsed) || parsed < 0) {
            throw new Error("Harajat summasi noto'g'ri kiritilgan");
          }
          expenseAmount = parsed;
        }
      }

      return requestsApi.changeStatus(id!, nextStatus, afterPhotoUrl, expenseAmount);
    },
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      invalidate();
    },
    onError: onMutationError,
  });

  if (isLoading || !request) return <Spinner label="Yuklanmoqda..." />;

  const isAssignedTechnician =
    user?.role === Role.TECHNICIAN && request.technician?.id === user.id;
  const isChiefAsWorker = isChief && request.technician?.id === user?.id;

  const isOpen = request.status !== RequestStatus.CLOSED;

  // Bosh texnik texnikni istalgan paytda (zayavka yopilmaguncha) o'zgartira oladi.
  const canAssign = isChief && isOpen;
  const canChangePriority = isChief && isOpen;
  const canComment = isChief;

  const canStart =
    (isAssignedTechnician || isChiefAsWorker) && request.status === RequestStatus.NEW;
  const canComplete =
    (isAssignedTechnician || isChiefAsWorker) && request.status === RequestStatus.IN_PROGRESS;
  const canChiefFinish = isChief && request.status === RequestStatus.COMPLETED_BY_TECHNICIAN;
  const ACCEPT_ROLES: Role[] = [
    Role.DIRECTOR,
    Role.BRANCH_MANAGER,
    Role.REGIONAL_MANAGER,
    Role.EXECUTIVE,
  ];
  const canDirectorAccept =
    !!user &&
    ACCEPT_ROLES.includes(user.role) &&
    request.status === RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN;

  const blockerComments = (comments ?? []).filter((c) => c.isBlocker);

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
        <p className="text-[12px] font-medium text-inkFaint">
          Yaratdi: {request.createdBy.fullName}
          {request.createdBy.role
            ? ` (${ROLE_LABELS_UZ[request.createdBy.role as Role] ?? request.createdBy.role})`
            : ""}
        </p>
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

      {/* Bajarish imkonsizligi haqidagi izohlar — barcha ko'ra oladiganlarga. */}
      {blockerComments.length > 0 && (
        <Card className="!border-priority-critical/30">
          <Label>Bajarish imkonsizligi sabablari</Label>
          <div className="space-y-2.5">
            {blockerComments.map((c) => (
              <div key={c.id} className="rounded-control bg-priority-critical/5 px-3 py-2.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle size={13} strokeWidth={2.25} className="text-priority-critical" />
                  <span className="text-[11.5px] font-bold text-tg-text">{c.author.fullName}</span>
                  <span className="font-num text-[10.5px] text-inkFaint ml-auto">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-[13px] text-tg-text leading-relaxed">{c.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {canChangePriority && (
        <Card>
          <Label>Muhimlik darajasini o'zgartirish</Label>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(PRIORITY_LABELS_UZ).map(([value, label]) => {
              const isActive = request.priority === value;
              return (
                <button
                  key={value}
                  disabled={priorityMutation.isPending || isActive}
                  onClick={() => priorityMutation.mutate(value as Priority)}
                  className={`py-2.5 rounded-control text-[12.5px] font-bold border-[1.5px] transition disabled:opacity-100 ${
                    isActive
                      ? "border-accent bg-accentSoft text-accent"
                      : "border-lineStrong text-inkSoft active:opacity-70"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {canAssign && (
        <Card>
          <Label>
            {request.technician ? "Texnikni o'zgartirish" : "Texnikni biriktirish"}
          </Label>
          <Select
            value={selectedTechnicianId}
            onChange={(e) => setSelectedTechnicianId(e.target.value)}
            className="mb-3"
          >
            <option value="">Texnikni tanlang</option>
            {technicians?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
                {t.id === user?.id ? " (o'zim)" : ""}
                {t.role === Role.CHIEF_TECHNICIAN && t.id !== user?.id ? " (bosh texnik)" : ""}
              </option>
            ))}
          </Select>
          <Button
            icon={request.technician ? Repeat : UserPlus}
            className="w-full"
            disabled={!selectedTechnicianId || assignMutation.isPending}
            onClick={() => assignMutation.mutate()}
          >
            {request.technician ? "O'zgartirish" : "Biriktirish"}
          </Button>
        </Card>
      )}

      {canComment && (
        <Card>
          <Label>Bu ishni bajarish imkonsiz (izoh)</Label>
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={3}
            placeholder="Sababini yozing — filial direktoriga xabar bo'lib boradi..."
          />
          <p className="text-[11.5px] text-tg-hint mt-2 mb-3">
            Texnik biriktirilmaydi, zayavka holati o'zgarmaydi. Izoh filial direktorining bot
            chatiga yuboriladi.
          </p>
          <Button
            icon={MessageSquareWarning}
            variant="secondary"
            className="w-full"
            disabled={commentText.trim().length < 3 || commentMutation.isPending}
            onClick={() => commentMutation.mutate()}
          >
            {commentMutation.isPending ? "Yuborilmoqda..." : "Izohni yuborish"}
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

          <Label className="mt-4">Ishlatilgan harajat (ixtiyoriy)</Label>
          <div className="relative">
            <Banknote
              size={16}
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-inkFaint"
            />
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={technicianExpense}
              onChange={(e) => setTechnicianExpense(e.target.value)}
              placeholder="Masalan: 150000"
              className="w-full bg-tg-secondaryBg border border-line rounded-control pl-9 pr-14 py-2.5 text-[14px] font-semibold text-tg-text outline-none focus:border-accent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-inkFaint">
              so'm
            </span>
          </div>
          <p className="text-[11.5px] text-tg-hint mt-2">
            Bo'sh qoldirsangiz harajat avtomatik 0 deb yoziladi.
          </p>

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
          <Label>Harajat summasi (ixtiyoriy — tahrirlash)</Label>
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
              value={
                expenseTouched
                  ? expenseInput
                  : request.expenseAmount !== null && request.expenseAmount !== undefined
                    ? String(request.expenseAmount)
                    : ""
              }
              onChange={(e) => {
                setExpenseTouched(true);
                setExpenseInput(e.target.value);
              }}
              placeholder="Masalan: 150000"
              className="w-full bg-tg-secondaryBg border border-line rounded-control pl-9 pr-14 py-2.5 text-[14px] font-semibold text-tg-text outline-none focus:border-accent"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-inkFaint">
              so'm
            </span>
          </div>
          <p className="text-[11.5px] text-tg-hint mb-3">
            Texnik kiritgan summa ko'rsatilgan. O'zgartirish shart emas — shundayligicha
            yakunlashingiz mumkin.
          </p>
          <Button
            icon={CheckCheck}
            className="w-full"
            disabled={statusMutation.isPending}
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
