# Yangilanishlar

## 2026-08-17 — Yangi lavozimlar, ko'p bosh texnik, izohlar

### 1. Uch yangi lavozim

| Lavozim | Filial doirasi | Zayavka ochish | Tarix + hisobot | Qo'shimcha |
|---|---|---|---|---|
| **Hududiy rahbar** (`regional_manager`) | o'ziga biriktirilgan **bir nechta filial** | shu filiallarga | shu filiallar bo'yicha, PDF/XLSX | — |
| **Rahbar** (`executive`) | **barcha filiallar** | barchasiga | barchasi, PDF/XLSX | texniklar nazorati + texnik / yaratuvchi / lavozim kesimidagi hisobotlar |
| **Filial menejeri** (`branch_manager`) | o'z filiali | o'z filialiga | o'z filiali, PDF/XLSX | ishni qabul qilib yopa oladi |

- Uchala lavozim ham `/manager/*` panelidan foydalanadi: **Ochiq zayavkalar**, **Tarix va
  hisobotlar**, **Yangi zayavka**, **Statistika** (Rahbarga qo'shimcha — **Texniklar**).
- Hududiy rahbarga filiallar Superadmin panelidagi xodim tahririda **checkbox ro'yxati** orqali
  biriktiriladi (kamida bitta filial majburiy). Bazada yangi `user_branches` jadvali.
- Statistika (`/dashboard/stats`) ham shu doiralar bo'yicha cheklanadi. Hududiy rahbar bir
  nechta filialga ega bo'lgani uchun unga "filiallar kesimi" taqsimoti ham ko'rsatiladi.

### 2. Bir nechta Bosh texnik

- "Tizimda faqat bitta faol Bosh texnik" cheklovi **olib tashlandi**.
- Yangi zayavka endi hech kimga biriktirilmagan holda ochiladi va **barcha faol Bosh
  texniklarga** bot orqali xabar boradi. Kim birinchi bo'lib texnik biriktirsa — o'sha
  zayavkaning mas'ul Bosh texnigi bo'lib qoladi.
- Bosh texnik zayavka yopilmaguncha biriktirilgan texnikni **o'zgartira oladi** (eski texnikka
  ham xabar boradi).
- Bosh texnik ishni **o'ziga** biriktira oladi — texniklar ro'yxatida Bosh texniklar ham
  ko'rinadi ("o'zim" deb belgilanadi).

### 3. Harajat summasi

- Endi **texnik** ham harajat summasini kirita oladi ("Ishni yakunlash" formasida, ixtiyoriy).
- Texnik summani kiritmasa — avtomatik **0** yoziladi.
- Bosh texnik uchun summa **majburiy emas**: texnik kiritgan qiymat oldindan to'ldirilgan
  holda chiqadi, xohlasa tahrirlaydi, xohlasa shundayligicha yakunlaydi.

### 4. "Bajarish imkonsiz" izohi

- Bosh texnik zayavkaga **texnik biriktirmasdan** sabab izohini yoza oladi.
- Zayavka **holati o'zgarmaydi** (`Yangi` bo'lib qolaveradi) — keyinchalik texnik biriktirish
  mumkin.
- Izoh filial direktori, filial menejeri va zayavka egasining **Telegram bot chatiga** xabar
  bo'lib boradi.
- Izohlar zayavka sahifasida alohida blokda ko'rinadi, ro'yxatdagi kartada esa "Izoh bor"
  belgisi chiqadi. Hisobotlarda (PDF/XLSX) alohida "Izoh" ustuni bor.

### 5. Muhimlik darajasini o'zgartirish

- Bosh texnik zayavka sahifasidan muhimlik darajasini o'zgartira oladi.
- O'zgarish audit log'ga yoziladi; zayavka egasi, biriktirilgan texnik va filial rahbarlariga
  bot orqali xabar boradi.

### 6. Hisobotlar

- PDF va XLSX eksportga **"Lavozimi"** (zayavkani ochgan xodimning lavozimi) va **"Izoh"**
  ustunlari qo'shildi; "Direktor" ustuni "Yaratuvchi" deb qayta nomlandi.
- Rahbar, Bosh texnik va Superadmin uchun filtrlar paneliga **texnik**, **yaratuvchi** va
  **lavozim** kesimlari qo'shildi — hisobot shu filtrlar bilan yuklanadi.

### 7. Texnik o'zgarishlar

- Prisma: `Role` enum'ga `regional_manager`, `executive`, `branch_manager`;
  `NotificationType` ga `request_comment`, `priority_changed`;
  yangi `user_branches` va `request_comments` jadvallari.
  Deploy'dagi `prisma db push` ularni avtomatik qo'llaydi.
- Yangi backend moduli: `core/access/scope.ts` — rol asosidagi ko'rish doirasi bitta joyda
  hisoblanadi (`list`, `getById`, `export`, `dashboard` shu orqali ishlaydi).
- Yangi endpointlar: `PATCH /requests/:id/priority`, `POST /requests/:id/comments`,
  `GET /requests/:id/comments` (batafsil: `docs/API.md`).
- `GET /auth/me` javobiga `managedBranches` (Hududiy rahbarga biriktirilgan filiallar) qo'shildi.
- Ilgari filial biriktirilmagan foydalanuvchi uchun `branchId = "__none__"` yuborilardi (bu
  Postgres'da uuid xatosiga olib kelishi mumkin edi) — endi bo'sh ro'yxat ishlatiladi.

---

# Yangilanishlar (2026-08-13)

Ushbu versiyada har bir lavozim paneli yangi talablarga moslashtirildi.

## Superadmin panel

- **Texnikka "Barcha filiallar"ni biriktirish** mumkin bo'ldi: xodim tahririda filial
  tanlanmasa (bo'sh qoldirilsa) texnik barcha filiallarga biriktirilgan hisoblanadi.
  Filial endi faqat **Direktor** uchun majburiy.

## Direktor panel

- Zayavka ochadi va bajarilgan ishni qabul qilib yopadi.
- **Bosh texnik tanlash olib tashlandi** — Bosh texnik zayavkaga avtomatik belgilanadi.
- **Filial biriktirilmagan direktor zayavka ocha olmaydi** — formada tushunarli
  ogohlantirish ko'rsatiladi (filialni Superadmin biriktiradi). Server ham tekshiradi.
- Faqat **o'z filialiga tegishli** tarixni ko'radi.
- **Tarixni PDF va XLSX** formatlarda eksport qila oladi ("Tugatilgan" bo'limida) —
  fayl Telegram bot chatiga hujjat sifatida yuboriladi.

## Bosh texnik panel

- **Mas'ul texnikni belgilaydi** — belgilangan texnikning bot chatiga xabar boradi.
- **Texniklar nazorati**: har bir texnikning filiali va ish yuklamasi (yangi / jarayonda /
  yakunlagan / yopilgan) ko'rinadi.
- **Drag-and-drop tartiblash**: ochiq zayavkalarni sudrab o'z ixtiyoricha tartiblaydi.
- Full history ko'radi va **PDF/XLSX eksport** qila oladi.

## Texnik panel

- Bosh texnik ish biriktirganda **bot chatiga xabar keladi**.
- **"Ishni boshlash"** bosadi — Bosh texnikka boshlangani haqida xabar boradi.
- Ish tugagach **"Ishni yakunlash"** bosadi (natija rasmi majburiy).
- Faqat **o'ziga biriktirilgan** ishlar tarixini ko'radi va **PDF/XLSX eksport** qila oladi.
