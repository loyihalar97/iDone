import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesApi } from "@/shared/api";
import { Card, Button, Spinner, Label, Input, StatusPill } from "@/shared/ui/primitives";
import { Plus } from "lucide-react";

export function SuperadminBranchesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const { data: branches, isLoading } = useQuery({
    queryKey: ["branches", "all"],
    queryFn: () => branchesApi.list(false).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => branchesApi.create({ name, address: address || undefined }),
    onSuccess: () => {
      setName("");
      setAddress("");
      queryClient.invalidateQueries({ queryKey: ["branches"] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      branchesApi.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });

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

      {isLoading ? (
        <Spinner />
      ) : (
        branches?.map((b) => (
          <Card key={b.id} className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="font-extrabold text-tg-text text-[14px] truncate">{b.name}</p>
              {b.address && <p className="text-[12px] text-tg-hint mt-0.5 truncate">{b.address}</p>}
            </div>
            <button onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}>
              <StatusPill active={b.isActive} />
            </button>
          </Card>
        ))
      )}
    </div>
  );
}
