import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, TaskCategory } from "@/shared/api";
import { Card, Button, Spinner, Label, Input, StatusPill } from "@/shared/ui/primitives";
import { SwipeRow } from "@/shared/ui/SwipeRow";
import { telegram, confirmDialog } from "@/shared/telegram/webapp";
import { Plus, Pencil, Trash2, Power, Check, X } from "lucide-react";

export function SuperadminCategoriesPage() {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", "manage"],
    queryFn: () => categoriesApi.manage().then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["categories"] });

  const createMutation = useMutation({
    mutationFn: () => categoriesApi.create({ label }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setLabel("");
      invalidate();
    },
    onError: (err: any) =>
      telegram.showAlert(err?.response?.data?.error?.message ?? "Qo'shib bo'lmadi"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      categoriesApi.update(id, { isActive }),
    onSuccess: () => invalidate(),
  });

  const editMutation = useMutation({
    mutationFn: () => categoriesApi.update(editingId!, { label: editLabel }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      invalidate();
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? "O'chirib bo'lmadi");
    },
  });

  function startEdit(c: TaskCategory) {
    setEditingId(c.id);
    setEditLabel(c.label);
  }

  async function handleDelete(c: TaskCategory) {
    const ok = await confirmDialog(`"${c.label}" kategoriyasini o'chirasizmi?`);
    if (ok) deleteMutation.mutate(c.id);
  }

  return (
    <div className="px-4 pt-2 pb-8 space-y-2.5">
      <Card className="!bg-accentSoft/40 border-accentSoft">
        <Label className="!text-accentDark">Yangi kategoriya (topshiriq turi)</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Masalan: Chiroq almashtirish"
          className="mb-3 !bg-tg-bg"
        />
        <Button
          icon={Plus}
          className="w-full"
          disabled={label.trim().length < 2 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Qo'shish
        </Button>
      </Card>

      <p className="text-[11.5px] text-tg-hint px-1">
        Bu ro'yxat zayavka yaratishda tanlanadi. Tahrirlash, faollik yoki o'chirish uchun kartani
        chapga suring. Ishlatilayotgan kategoriyani o'chirib bo'lmaydi — uni faolsizlantiring.
      </p>

      {isLoading ? (
        <Spinner />
      ) : (
        categories?.map((c) =>
          editingId === c.id ? (
            <Card key={c.id} className="!bg-tg-secondaryBg">
              <Label>Kategoriyani tahrirlash</Label>
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Kategoriya nomi"
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button
                  icon={Check}
                  className="flex-1 !text-xs"
                  disabled={editLabel.trim().length < 2 || editMutation.isPending}
                  onClick={() => editMutation.mutate()}
                >
                  Saqlash
                </Button>
                <Button
                  variant="ghost"
                  icon={X}
                  className="flex-1 !text-xs !border !border-lineStrong"
                  onClick={() => setEditingId(null)}
                >
                  Bekor
                </Button>
              </div>
            </Card>
          ) : (
            <SwipeRow
              key={c.id}
              actions={[
                {
                  key: "edit",
                  label: "Tahrir",
                  icon: Pencil,
                  className: "bg-status-progress text-white",
                  onClick: () => startEdit(c),
                },
                {
                  key: "toggle",
                  label: c.isActive ? "Nofaol" : "Faol",
                  icon: Power,
                  className: "bg-inkFaint text-white",
                  onClick: () => toggleMutation.mutate({ id: c.id, isActive: !c.isActive }),
                },
                {
                  key: "delete",
                  label: "O'chir",
                  icon: Trash2,
                  className: "bg-priority-critical text-white",
                  onClick: () => handleDelete(c),
                },
              ]}
            >
              <Card className="flex items-center justify-between">
                <p className="font-extrabold text-tg-text text-[14px] truncate">{c.label}</p>
                <StatusPill active={c.isActive} />
              </Card>
            </SwipeRow>
          )
        )
      )}
    </div>
  );
}
