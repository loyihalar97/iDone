import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/shared/api";
import { useI18n } from "@/shared/i18n";

export interface CategoryOption {
  value: string;
  label: string;
}

/**
 * Faol kategoriyalar ro'yxati (zayavka yaratish / filtrlash uchun).
 *
 * Kategoriya nomlari serverdan tanlangan tilda keladi, shuning uchun til
 * kesh kalitiga (`queryKey`) kiritilgan — til almashtirilganda ro'yxat
 * avtomatik qayta yuklanadi.
 */
export function useCategoryOptions() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ["categories", "active", lang],
    queryFn: () => categoriesApi.list().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * key -> label xaritasi va yorliqni topuvchi funksiya.
 * Noma'lum (o'chirilgan) kalit uchun kalitning o'zi qaytariladi.
 */
export function useCategoryLabels() {
  const { data } = useCategoryOptions();
  const map = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of data ?? []) m[c.value] = c.label;
    return m;
  }, [data]);

  const labelFor = (key: string) => map[key] ?? key;
  return { map, labelFor };
}
