import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Priority, Role } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { branchesApi } from "@/shared/api";
import { useCategoryOptions } from "@/shared/hooks/useCategories";
import { Button, Card, EmptyState, Label, Select, Textarea, Thumb } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { useAuth } from "@/shared/hooks/useAuth";
import { HOME_BY_ROLE, needsBranchPicker } from "@/shared/lib/roles";
import { useI18n } from "@/shared/i18n";
import { Camera, Send, Building2 } from "lucide-react";

const PRIORITY_ACTIVE_STYLE: Record<Priority, string> = {
  [Priority.LOW]: "border-priority-low bg-priority-low/10 text-priority-low",
  [Priority.MEDIUM]: "border-priority-medium bg-priority-medium/10 text-priority-medium",
  [Priority.HIGH]: "border-priority-high bg-priority-high/10 text-priority-high",
  [Priority.CRITICAL]: "border-priority-critical bg-priority-critical/10 text-priority-critical",
};

const PRIORITY_ORDER: Priority[] = [
  Priority.LOW,
  Priority.MEDIUM,
  Priority.HIGH,
  Priority.CRITICAL,
];

export function NewRequestForm() {
  const { user } = useAuth();
  const { t, priorityText } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [branchId, setBranchId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categories } = useCategoryOptions();

  const showBranchPicker = !!user && needsBranchPicker(user.role);
  // Rahbar va Superadmin barcha filiallarni ko'radi; Hududiy rahbar — faqat
  // o'ziga biriktirilganlarini (ular /auth/me javobida keladi).
  const loadsAllBranches =
    !!user && (user.role === Role.EXECUTIVE || user.role === Role.SUPERADMIN);

  const { data: allBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(true).then((r) => r.data),
    enabled: loadsAllBranches,
  });

  const branchOptions = useMemo(() => {
    if (!user) return [];
    if (loadsAllBranches) return (allBranches ?? []).map((b) => ({ id: b.id, name: b.name }));
    return user.managedBranches ?? [];
  }, [user, loadsAllBranches, allBranches]);

  // Kategoriyalar yuklangach, birinchisini standart tanlaymiz.
  useEffect(() => {
    if (!category && categories && categories.length > 0) {
      setCategory(categories[0].value);
    }
  }, [categories, category]);

  // Filial ro'yxati yuklangach, birinchisini standart tanlaymiz.
  useEffect(() => {
    if (showBranchPicker && !branchId && branchOptions.length > 0) {
      setBranchId(branchOptions[0].id);
    }
  }, [showBranchPicker, branchId, branchOptions]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error(t.newRequest.photoRequired);

      const { data: uploaded } = await mediaApi.upload(file);
      // Direktor/Filial menejeri uchun filial serverda profildan olinadi.
      return requestsApi.create({
        ...(showBranchPicker ? { branchId } : {}),
        category,
        description,
        priority,
        beforePhotoUrl: uploaded.url,
      });
    },
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      navigate(user ? HOME_BY_ROLE[user.role] : "/");
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      setSubmitError(err?.response?.data?.error?.message ?? err.message ?? t.common.error);
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const isValid =
    description.trim().length >= 3 && !!file && !!category && (!showBranchPicker || !!branchId);

  // Filial Superadmin tomonidan biriktiriladi — biriktirilmagan direktor va
  // filial menejeri zayavka ocha olmaydi.
  if (!showBranchPicker && !user?.branchId) {
    return (
      <EmptyState
        title={t.newRequest.noBranchTitle}
        subtitle={t.newRequest.noBranchSubtitle}
        icon={Building2}
      />
    );
  }

  // Hududiy rahbarga birorta ham filial biriktirilmagan holat.
  if (showBranchPicker && user?.role === Role.REGIONAL_MANAGER && branchOptions.length === 0) {
    return (
      <EmptyState
        title={t.newRequest.noBranchesTitle}
        subtitle={t.newRequest.noBranchesSubtitle}
        icon={Building2}
      />
    );
  }

  return (
    <div className="px-4 pb-8 pt-2 space-y-3">
      {showBranchPicker && (
        <Card>
          <Label>{t.newRequest.branch}</Label>
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branchOptions.length === 0 && (
              <option value="">{t.newRequest.branchNotFound}</option>
            )}
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Card>
      )}

      <Card>
        <Label>{t.newRequest.category}</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {(categories ?? []).map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Card>

      <Card>
        <Label>{t.newRequest.description}</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder={t.newRequest.descriptionPlaceholder}
        />
      </Card>

      <Card>
        <Label>{t.newRequest.priority}</Label>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITY_ORDER.map((value) => {
            const isActive = priority === value;
            return (
              <button
                key={value}
                onClick={() => setPriority(value)}
                className={`py-2.5 rounded-control text-[12.5px] font-bold border-[1.5px] transition ${
                  isActive ? PRIORITY_ACTIVE_STYLE[value] : "border-lineStrong text-inkSoft"
                }`}
              >
                {priorityText(value)}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <Label>{t.newRequest.photo}</Label>
        <label className="flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-lineStrong rounded-control px-3 py-6 text-center text-[12.5px] font-semibold text-inkFaint cursor-pointer">
          <Camera size={20} strokeWidth={1.75} />
          {file ? file.name : t.newRequest.pickFile}
          <input
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {preview && (
          <Thumb
            src={preview}
            alt={t.newRequest.preview}
            className="mt-3 w-full h-40 object-cover rounded-control"
          />
        )}
      </Card>

      {submitError && <p className="text-sm font-medium text-priority-critical px-1">{submitError}</p>}

      <Button
        icon={Send}
        className="w-full"
        disabled={!isValid || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        {createMutation.isPending ? t.common.sending : t.newRequest.submit}
      </Button>
    </div>
  );
}
