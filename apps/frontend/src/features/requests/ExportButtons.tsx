import { useState } from "react";
import { requestsApi, RequestFilters } from "@/shared/api/requests";
import { telegram } from "@/shared/telegram/webapp";
import { FileText, FileSpreadsheet } from "lucide-react";

/**
 * Tarixni PDF yoki XLSX formatda eksport qilish tugmalari.
 * Fayl foydalanuvchining Telegram bot chatiga hujjat sifatida yuboriladi.
 */
export function ExportButtons({ filters = {} }: { filters?: RequestFilters }) {
  const [pending, setPending] = useState<"pdf" | "xlsx" | null>(null);

  async function handleExport(format: "pdf" | "xlsx") {
    if (pending) return;
    setPending(format);
    try {
      const { data } = await requestsApi.exportHistory(format, filters);
      telegram.HapticFeedback.notificationOccurred("success");
      telegram.showAlert(
        `✅ ${data.count} ta zayavka ${format.toUpperCase()} faylga eksport qilindi va bot chatingizga yuborildi.`
      );
    } catch (err: any) {
      telegram.HapticFeedback.notificationOccurred("error");
      telegram.showAlert(err?.response?.data?.error?.message ?? "Eksport qilib bo'lmadi");
    } finally {
      setPending(null);
    }
  }

  const base =
    "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-control border-[1.5px] border-lineStrong text-[12.5px] font-bold text-inkSoft transition active:opacity-70 disabled:opacity-50";

  return (
    <div className="px-4 pb-3 flex gap-2">
      <button className={base} disabled={!!pending} onClick={() => handleExport("pdf")}>
        <FileText size={15} strokeWidth={2} />
        {pending === "pdf" ? "Yuborilmoqda..." : "PDF eksport"}
      </button>
      <button className={base} disabled={!!pending} onClick={() => handleExport("xlsx")}>
        <FileSpreadsheet size={15} strokeWidth={2} />
        {pending === "xlsx" ? "Yuborilmoqda..." : "Excel eksport"}
      </button>
    </div>
  );
}
