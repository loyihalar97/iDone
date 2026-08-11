import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Category, Priority, CATEGORY_LABELS_UZ, PRIORITY_LABELS_UZ } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { usersApi } from "@/shared/api";
import { Button, Card, Label, Select, Textarea, Thumb } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { useAuth } from "@/shared/hooks/useAuth";
import { Camera, Send } from "lucide-react";

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
    <div className="px-4 pb-8 pt-2 space-y-3">
      <Card>
        <Label>Muammo kategoriyasi</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {Object.entries(CATEGORY_LABELS_UZ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Card>

      <Card>
        <Label>Muammo tavsifi</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="Muammoni batafsil yozing..."
        />
      </Card>

      <Card>
        <Label>Muhimlik darajasi</Label>
        <div className="grid grid-cols-4 gap-2">
          {Object.entries(PRIORITY_LABELS_UZ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setPriority(value as Priority)}
              className={`py-2 rounded-control text-xs font-medium border transition ${
                priority === value
                  ? "bg-tg-button text-tg-buttonText border-tg-button"
                  : "border-line text-tg-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Bosh texnik (ixtiyoriy)</Label>
        <Select value={chiefTechnicianId} onChange={(e) => setChiefTechnicianId(e.target.value)}>
          <option value="">Avtomatik — barcha bosh texniklarga yuboriladi</option>
          {chiefTechnicians?.map((ct) => (
            <option key={ct.id} value={ct.id}>
              {ct.fullName}
            </option>
          ))}
        </Select>
      </Card>

      <Card>
        <Label>Muammo rasmi (majburiy)</Label>
        <label className="flex items-center gap-2 border border-dashed border-lineStrong rounded-control px-3 py-2.5 text-sm text-tg-hint cursor-pointer">
          <Camera size={16} strokeWidth={1.75} />
          {file ? file.name : "Rasm yoki video tanlang"}
          <input
            type="file"
            accept="image/*,video/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
        {preview && (
          <Thumb src={preview} alt="Oldindan ko'rish" className="mt-3 w-full h-40 object-cover rounded-control" />
        )}
      </Card>

      {submitError && <p className="text-sm text-red-600 px-1">{submitError}</p>}

      <Button
        icon={Send}
        className="w-full"
        disabled={!isValid || createMutation.isPending}
        onClick={() => createMutation.mutate()}
      >
        {createMutation.isPending ? "Yuborilmoqda..." : "Yuborish"}
      </Button>
    </div>
  );
}
