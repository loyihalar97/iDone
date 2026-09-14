/**
 * Rasm URL'lari bilan ishlash yordamchilari.
 *
 * Server har bir yuklangan rasm uchun kichik nusxa (thumbnail) yaratadi va
 * uni asosiy rasm yonida `<nom>_thumb.jpg` ko'rinishida saqlaydi. Kichik
 * nusxa bazada alohida saqlanmaydi — uning manzili asosiy rasm URL'idan
 * hisoblab olinadi.
 *
 * Nega: zayavkalar ro'yxatida har bir karta 40×40 px rasmcha ko'rsatadi.
 * To'liq rasmni (0.2 MB gacha) yuklash o'rniga ~20 KB lik nusxani yuklash
 * trafikni o'nlab marta kamaytiradi (Railway egress xarajati).
 */

/** To'liq rasm URL'idan kichik nusxa URL'ini hosil qiladi. */
export function thumbUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  // So'rov parametrlari bo'lsa ularni saqlab qolamiz.
  const [base, query] = url.split("?");
  if (!base.includes("/uploads/")) return url;
  const thumb = base.replace(/(\.[^./]+)?$/, "_thumb.jpg");
  return query ? `${thumb}?${query}` : thumb;
}
