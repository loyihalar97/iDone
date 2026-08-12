import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Priority, PRIORITY_LABELS_UZ } from "@app/shared-types";
import { requestsApi, mediaApi } from "@/shared/api/requests";
import { usersApi } from "@/shared/api";
import { useCategoryOptions } from "@/shared/hooks/useCategories";
import { Button, Card, Label, Select, Textarea, Thumb } from "@/shared/ui/primitives";
import { telegram } from "@/shared/telegram/webapp";
import { useAuth } from "@/shared/hooks/useAuth";
import { Camera, Send } from "lucide-react";

const PRIORITY_ACTIVE_STYLE: Record<Priority, string> = {
  [Priority.LOW]: "border-priority-low bg-priority-low/10 text-priority-low",
  [Priority.MEDIUM]: "border-priority-medium bg-priority-medium/10 text-priority-medium",
  [Priority.HIGH]: "border-priority-high bg-priority-high/10 text-priority-high",
  [Priority.CRITICAL]: "border-priority-critical bg-priority-critical/10 text-priority-critical",
};

export function NewRequestForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [chiefTechnicianId, setChiefTechnicianId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: categories } = useCategoryOptions();

  // Kategoriyalar yuklangach, birinchisini standart tanlaymiz.
  useEffect(() => {
    if (!category && categories && categories.length > 0) {
      setCategory(categories[0].value);
    }
  }, [categories, category]);

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

  const isValid = description.trim().length >= 3 && !!file && !!category;

  return (
    <div className="px-4 pb-8 pt-2 space-y-3">
      <Card>
        <Label>Muammo kategoriyasi</Label>
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {(categories ?? []).map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
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
          {Object.entries(PRIORITY_LABELS_UZ).map(([value, label]) => {
            const isActive = priority === value;
            return (
              <button
                key={value}
                onClick={() => setPriority(value as Priority)}
                className={`py-2.5 rounded-control text-[12.5px] font-bold border-[1.5px] transition ${
                  isActive ? PRIORITY_ACTIVE_STYLE[value as Priority] : "border-lineStrong text-inkSoft"
                }`}
              >
                {label}
              </button>
            );
          })}
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
        <label className="flex flex-col items-center justify-center gap-2 border-[1.5px] border-dashed border-lineStrong rounded-control px-3 py-6 text-center text-[12.5px] font-semibold text-inkFaint cursor-pointer">
          <Camera size={20} strokeWidth={1.75} />
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

      {submitError && <p className="text-sm font-medium text-priority-critical px-1">{submitError}</p>}

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
