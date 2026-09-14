import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, TaskCategory } from "@/shared/api";
import { Card, Button, Spinner, Label, Input, StatusPill } from "@/shared/ui/primitives";
import { SwipeRow } from "@/shared/ui/SwipeRow";
import { telegram, confirmDialog } from "@/shared/telegram/webapp";
import { useI18n } from "@/shared/i18n";
import { Language } from "@app/shared-types";
import { Plus, Pencil, Trash2, Power, Check, X, AlertTriangle } from "lucide-react";

/**
 * Kategoriyalarni boshqarish. Har bir kategoriyaning IKKI nomi bor:
 * o'zbekcha va ruscha — foydalanuvchiga o'zi tanlagan tildagi nom
 * ko'rsatiladi (zayavka formasida ham, hisobotlarda ham).
 */
export function SuperadminCategoriesPage() {
  const { t, lang } = useI18n();
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [labelRu, setLabelRu] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editLabelRu, setEditLabelRu] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", "manage"],
    queryFn: () => categoriesApi.manage().then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: () => categoriesApi.create({ label, labelRu: labelRu.trim() || undefined }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setLabel("");
      setLabelRu("");
      invalidate();
    },
    onError: (err: any) =>
      telegram.showAlert(err?.response?.data?.error?.message ?? t.common.notAdded),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesApi.update(id, { isActive }),
    onSuccess: () => invalidate(),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      categoriesApi.update(editingId!, {
        label: editLabel,
        labelRu: editLabelRu.trim() || null,
      }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setEditingId(null);
      invalidate();
    },
    onError: (err: any) =>
      telegram.showAlert(err?.response?.data?.error?.message ?? t.common.notSaved),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      invalidate();
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? t.common.notDeleted);
    },
  });

  function startEdit(c: TaskCategory) {
    setEditingId(c.id);
    setEditLabel(c.label);
    setEditLabelRu(c.labelRu ?? "");
  }

  /** Ro'yxatda kategoriya nomi admin ko'rayotgan tilda ko'rsatiladi. */
  function displayName(c: TaskCategory): string {
    return lang === Language.RU ? c.labelRu?.trim() || c.label : c.label;
  }

  async function handleDelete(c: TaskCategory) {
    const ok = await confirmDialog(t.categories.deleteConfirm(displayName(c)));
    if (ok) deleteMutation.mutate(c.id);
  }

  return (
    <div className="px-4 pt-2 pb-8 space-y-2.5">
      <Card className="!bg-accentSoft/40 border-accentSoft">
        <Label className="!text-accentDark">{t.categories.addTitle}</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t.categories.nameUzPlaceholder}
          className="mb-2 !bg-tg-bg"
        />
        <Input
          value={labelRu}
          onChange={(e) => setLabelRu(e.target.value)}
          placeholder={t.categories.nameRuPlaceholder}
          className="mb-3 !bg-tg-bg"
        />
        <Button
          icon={Plus}
          className="w-full"
          disabled={label.trim().length < 2 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          {t.common.add}
        </Button>
      </Card>

      <p className="text-[11.5px] text-tg-hint px-1 leading-relaxed">{t.categories.hint}</p>

      {isLoading ? (
        <Spinner />
      ) : (
        categories?.map((c) =>
          editingId === c.id ? (
            <Card key={c.id} className="!bg-tg-secondaryBg">
              <Label>{t.categories.editTitle}</Label>
              <Label className="!normal-case !text-inkFaint !mb-1">{t.categories.nameUz}</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder={t.categories.nameUzPlaceholder}
                className="mb-2"
              />
              <Label className="!normal-case !text-inkFaint !mb-1">{t.categories.nameRu}</Label>
              <Input
                value={editLabelRu}
                onChange={(e) => setEditLabelRu(e.target.value)}
                placeholder={t.categories.nameRuPlaceholder}
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button
                  icon={Check}
                  className="flex-1 !text-xs"
                  disabled={editLabel.trim().length < 2 || editMutation.isPending}
                  onClick={() => editMutation.mutate()}
                >
                  {t.common.save}
                </Button>
                <Button
                  variant="ghost"
                  icon={X}
                  className="flex-1 !text-xs !border !border-lineStrong"
                  onClick={() => setEditingId(null)}
                >
                  {t.common.cancel}
                </Button>
              </div>
            </Card>
          ) : (
            <SwipeRow
              key={c.id}
              actions={[
                {
                  key: "edit",
                  label: t.common.edit,
                  icon: Pencil,
                  className: "bg-status-progress text-white",
                  onClick: () => startEdit(c),
                },
                {
                  key: "toggle",
                  label: c.isActive ? t.common.makeInactive : t.common.makeActive,
                  icon: Power,
                  className: "bg-inkFaint text-white",
                  onClick: () => toggleMutation.mutate({ id: c.id, isActive: !c.isActive }),
                },
                {
                  key: "delete",
                  label: t.common.delete,
                  icon: Trash2,
                  className: "bg-priority-critical text-white",
                  onClick: () => handleDelete(c),
                },
              ]}
            >
              <Card className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-extrabold text-tg-text text-[14px] truncate">{c.label}</p>
                  {c.labelRu ? (
                    <p className="text-[12px] text-tg-hint mt-0.5 truncate">{c.labelRu}</p>
                  ) : (
                    // Ruscha nomi yo'q bo'lsa, rus tilidagi foydalanuvchi
                    // o'zbekcha nomni ko'radi — adminni ogohlantiramiz.
                    <p className="inline-flex items-center gap-1 text-[11.5px] text-priority-high mt-0.5">
                      <AlertTriangle size={11} strokeWidth={2.25} />
                      {t.categories.missingRu}
                    </p>
                  )}
                </div>
                <StatusPill active={c.isActive} />
              </Card>
            </SwipeRow>
          )
        )
      )}
    </div>
  );
}
