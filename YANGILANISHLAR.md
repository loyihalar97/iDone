# Yangilanishlar (2026-08-13)

Ushbu versiyada har bir lavozim paneli yangi talablarga moslashtirildi.

## Superadmin panel

- **Texnikka "Barcha filiallar"ni biriktirish** mumkin bo'ldi: xodim tahririda filial
  tanlanmasa (bo'sh qoldirilsa) texnik barcha filiallarga biriktirilgan hisoblanadi.
  Filial endi faqat **Direktor** uchun majburiy.
- Tizimda **faqat bitta faol Bosh texnik** bo'lishi mumkin — ikkinchisini tayinlashga
  urinilsa tushunarli xato qaytadi (zayavkalar unga avtomatik biriktirilgani uchun).

## Direktor panel

- Zayavka ochadi va bajarilgan ishni qabul qilib yopadi (avvalgidek).
- **Bosh texnik tanlash olib tashlandi** — Bosh texnik zayavkaga AVTOMATIK belgilanadi.
- **Filial biriktirilmagan direktor zayavka ocha olmaydi** — formada tushunarli
  ogohlantirish ko'rsatiladi (filialni Superadmin biriktiradi). Server ham tekshiradi.
- Faqat **o'z filialiga tegishli** tarixni ko'radi.
- **Tarixni PDF va XLSX** formatlarda eksport qila oladi ("Tugatilgan" bo'limida) —
  fayl Telegram bot chatiga hujjat sifatida yuboriladi.

## Bosh texnik panel

- Zayavka ochilishi bilan avtomatik belgilanadi va bot chatiga xabar oladi.
- **Mas'ul texnikni belgilaydi** — belgilangan texnikning bot chatiga xabar boradi.
- **Texniklar nazorati**: yangi "Texniklar" bo'limida har bir texnikning filiali va
  ish yuklamasi (yangi / jarayonda / yakunlagan / yopilgan) ko'rinadi.
- **"Ishni yakunlash" bosishdan oldin harajat summasini kiritish MAJBURIY** —
  harajat bo'lmasa 0 kiritiladi. Summa zayavkada, tarixda va eksportda ko'rinadi.
- **Drag-and-drop tartiblash**: "Ish ketma-ketligini tartiblash" tugmasi orqali ochiq
  zayavkalarni sudrab o'z ixtiyoricha tartiblaydi; tartib barcha ro'yxatlarda saqlanadi.
- Full history ko'radi va **PDF/XLSX eksport** qila oladi.

## Texnik panel

- Bosh texnik ish biriktirganda **bot chatiga xabar keladi**.
- **"Ishni boshlash"** bosadi — Bosh texnikka boshlangani haqida xabar boradi.
- Ish tugagach **"Ishni yakunlash"** bosadi (natija rasmi majburiy) — Bosh texnikka
  yakunlangani haqida xabar boradi.
- Faqat **o'ziga biriktirilgan** ishlar tarixini ko'radi va **PDF/XLSX eksport** qila oladi.

## Yangi ish oqimi

1. Direktor zayavka ochadi → Bosh texnik avtomatik belgilanadi (bot xabari).
2. Bosh texnik mas'ul texnikni belgilaydi (texnikka bot xabari).
3. Texnik "Ishni boshlash" → Bosh texnikka xabar.
4. Texnik "Ishni yakunlash" (natija rasmi bilan) → Bosh texnikka xabar.
5. Bosh texnik harajat summasini kiritib "Ishni yakunlash" → Direktorga xabar.
6. Direktor "Qabul qilish" → zayavka avtomatik yopiladi (hammaga yakuniy karta).

## Texnik o'zgarishlar

- `requests` jadvaliga `expense_amount` (harajat, so'm) va `sort_order` (drag-and-drop
  tartibi) ustunlari qo'shildi; `NotificationType` ga `technician_started` qo'shildi.
  Deploy'dagi `prisma db push` ularni avtomatik qo'llaydi — qo'shimcha migratsiya kerak emas.
- Yangi endpointlar: `PATCH /requests/reorder`, `GET /requests/export?format=pdf|xlsx`,
  `GET /users/technicians/overview` (batafsil: `docs/API.md`).
- Eksport fayllari serverda `exceljs` / `pdfkit` bilan yaratilib, foydalanuvchining bot
  chatiga `sendDocument` orqali yuboriladi (PDFda kirillcha matn uchun DejaVu shrifti
  `apps/backend/src/assets/fonts` ichida keladi).
- Frontendga `@dnd-kit` (drag-and-drop) qo'shildi.
