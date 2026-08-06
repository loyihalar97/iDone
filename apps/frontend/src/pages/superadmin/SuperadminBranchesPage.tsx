import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { branchesApi } from "@/shared/api";
import { Card, Button, Spinner } from "@/shared/ui/primitives";

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
    <div className="px-4 pt-2 pb-8 space-y-4">
      <Card>
        <p className="font-medium text-tg-text mb-3">Yangi filial qo'shish</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Filial nomi"
          className="w-full bg-tg-bg border border-black/10 rounded-xl px-3 py-2.5 text-tg-text mb-2"
        />
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Manzil (ixtiyoriy)"
          className="w-full bg-tg-bg border border-black/10 rounded-xl px-3 py-2.5 text-tg-text mb-3"
        />
        <Button
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
              <p className="font-medium text-tg-text">{b.name}</p>
              {b.address && <p className="text-xs text-tg-hint">{b.address}</p>}
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: b.id, isActive: !b.isActive })}
              className={`text-xs px-3 py-1.5 rounded-full ${
                b.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
              }`}
            >
              {b.isActive ? "Faol" : "Faol emas"}
            </button>
          </Card>
        ))
      )}
    </div>
  );
}
