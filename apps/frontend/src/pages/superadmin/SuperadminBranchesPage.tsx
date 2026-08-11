import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesApi } from "@/shared/api";
import { Card, Button, Spinner, Label, Input } from "@/shared/ui/primitives";
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
    <div className="px-4 pt-2 pb-8 space-y-3">
      <Card>
        <Label>Yangi filial qo'shish</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Filial nomi"
          className="mb-2"
        />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Manzil (ixtiyoriy)"
          className="mb-3"
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
            <div>
              <p className="font-medium text-tg-text text-sm">{b.name}</p>
              {b.address && <p className="text-xs text-tg-hint mt-0.5">{b.address}</p>}
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-line text-xs font-medium text-tg-text"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? "bg-status-directorAccepted" : "bg-status-closed"}`} />
              {b.isActive ? "Faol" : "Faol emas"}
            </button>
          </Card>
        ))
      )}
    </div>
  );
}
