import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesApi, Branch } from "@/shared/api";
import { Card, Button, Spinner, Label, Input, StatusPill } from "@/shared/ui/primitives";
import { SwipeRow } from "@/shared/ui/SwipeRow";
import { telegram, confirmDialog } from "@/shared/telegram/webapp";
import { Plus, Pencil, Trash2, Power, Check, X } from "lucide-react";

export function SuperadminBranchesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => branchesApi.list(false).then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["branches"] });

  const createMutation = useMutation({
    mutationFn: () => branchesApi.create({ name, address: address || undefined }),
    onSuccess: () => {
      setName("");
      setAddress("");
      invalidate();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      branchesApi.update(id, { isActive }),
    onSuccess: () => invalidate(),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      branchesApi.update(editingId!, { name: editName, address: editAddress || undefined }),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      setEditingId(null);
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.remove(id),
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      invalidate();
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? "O'chirib bo'lmadi");
    },
  });

  function startEdit(b: Branch) {
    setEditingId(b.id);
    setEditName(b.name);
    setEditAddress(b.address ?? "");
  }

  async function handleDelete(b: Branch) {
    const ok = await confirmDialog(`"${b.name}" filialini o'chirasizmi?`);
    if (ok) deleteMutation.mutate(b.id);
  }

  return (
    <div className="px-4 pt-2 pb-8 space-y-2.5">
      <Card className="!bg-accentSoft/40 border-accentSoft">
        <Label className="!text-accentDark">Yangi filial qo'shish</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Filial nomi"
          className="mb-2 !bg-tg-bg"
        />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Manzil (ixtiyoriy)"
          className="mb-3 !bg-tg-bg"
        />
        <Button
          icon={Plus}
          className="w-full"
          disabled={name.trim().length < 2 || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Qo'shish
        </Button>
      </Card>

      <p className="text-[11.5px] text-tg-hint px-1">
        Tahrirlash, faollik yoki o'chirish uchun kartani chapga suring.
      </p>

      {isLoading ? (
        <Spinner />
      ) : (
        branches?.map((b) =>
          editingId === b.id ? (
            <Card key={b.id} className="!bg-tg-secondaryBg">
              <Label>Filialni tahrirlash</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Filial nomi"
                className="mb-2"
              />
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                placeholder="Manzil (ixtiyoriy)"
                className="mb-3"
              />
              <div className="flex gap-2">
                <Button
                  icon={Check}
                  className="flex-1 !text-xs"
                  disabled={editName.trim().length < 2 || editMutation.isPending}
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
              key={b.id}
              actions={[
                {
                  key: "edit",
                  label: "Tahrir",
                  icon: Pencil,
                  className: "bg-status-progress text-white",
                  onClick: () => startEdit(b),
                },
                {
                  key: "toggle",
                  label: b.isActive ? "Nofaol" : "Faol",
                  icon: Power,
                  className: "bg-inkFaint text-white",
                  onClick: () => toggleMutation.mutate({ id: b.id, isActive: !b.isActive }),
                },
                {
                  key: "delete",
                  label: "O'chir",
                  icon: Trash2,
                  className: "bg-priority-critical text-white",
                  onClick: () => handleDelete(b),
                },
              ]}
            >
              <Card className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-extrabold text-tg-text text-[14px] truncate">{b.name}</p>
                  {b.address && (
                    <p className="text-[12px] text-tg-hint mt-0.5 truncate">{b.address}</p>
                  )}
                </div>
                <StatusPill active={b.isActive} />
              </Card>
            </SwipeRow>
          )
        )
      )}
    </div>
  );
}
