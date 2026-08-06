import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category, Priority, CATEGORY_LABELS_UZ, PRIORITY_LABELS_UZ } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { usersApi } from "@/shared/api";
import { Button, Card, Spinner } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { useAuth } from "@/shared/hooks/useAuth";

export function NewRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [chiefTechnicianId, setChiefTechnicianId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: chiefTechnicians } = useQuery({
    queryKey: ["chief-technicians"],
    queryFn: () => usersApi.chiefTechnicians().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Muammo rasmi majburiy");
      if (!user?.branchId) throw new Error("Sizga filial biriktirilmagan");

      const { data: uploaded } = await mediaApi.upload(file);
      return requestsApi.create({
        branchId: user.branchId,
        chiefTechnicianId: chiefTechnicianId || undefined,
        category,
        description,
        priority,
        beforePhotoUrl: uploaded.url,
      });
    },
    onSuccess: () => {
      telegram.HapticFeedback.notificationOccurred("success");
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      navigate("/director/requests");
    },
    onError: (err: any) => {
      telegram.HapticFeedback.notificationOccurred("error");
      setSubmitError(err?.response?.data?.error?.message ?? err.message ?? "Xatolik yuz berdi");
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  const isValid = description.trim().length >= 3 && !!file;

  return (
    <div className="px-4 pb-8 pt-2 space-y-4">
      <Card>
        <label className="block text-sm font-medium text-tg-text mb-2">Muammo kategoriyasi</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full bg-tg-bg border border-black/10 rounded-xl px-3 py-2.5 text-tg-text"
        >
          {Object.entries(CATEGORY_LABELS_UZ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-tg-text mb-2">Muammo tavsifi</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Muammoni batafsil yozing..."
          className="w-full bg-tg-bg border border-black/10 rounded-xl px-3 py-2.5 text-tg-text resize-none"
        />
      </Card>

      <Card>
        <label className="block text-sm font-medium text-tg-text mb-2">Muhimlik darajasi</label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(PRIORITY_LABELS_UZ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPriority(value as Priority)}
              className={`py-2 rounded-lg text-xs font-medium border ${
                priority === value
                  ? "bg-tg-button text-tg-buttonText border-tg-button"
                  : "border-black/10 text-tg-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-tg-text mb-2">Bosh texnik (ixtiyoriy)</label>
        <select
          value={chiefTechnicianId}
          onChange={(e) => setChiefTechnicianId(e.target.value)}
          className="w-full bg-tg-bg border border-black/10 rounded-xl px-3 py-2.5 text-tg-text"
        >
          <option value="">Avtomatik — barcha bosh texniklarga yuboriladi</option>
          {chiefTechnicians?.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.fullName}
            </option>
          ))}
        </select>
      </Card>

      <Card>
        <label className="block text-sm font-medium text-tg-text mb-2">Muammo rasmi (majburiy)</label>
        <input type="file" accept="image/*,video/*" capture="environment" onChange={handleFileChange} />
        {preview && (
          <img src={preview} alt="Oldindan ko'rish" className="mt-3 w-full h-40 object-cover rounded-xl" />
        )}
      </Card>

      {submitError && <p className="text-sm text-red-600 px-1">{submitError}</p>}

      <Button
        className="w-full"
        disabled={!isValid || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        {createMutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
      </Button>
    </div>
  );
}
