# Yangilanishlar

## 2026-09-14 — Railway xarajatini kamaytirish: rasmlar va trafik

Railway Usage ko'tarilib ketgani uchun rasm oqimi va chiquvchi trafik
qaytadan ko'rib chiqildi.

### 1. Rasmlar zayavka yopilgan zahoti o'chiriladi

Ilgari rasmlar yopilgandan keyin ham **7 kun** diskda turardi. Endi
zayavka yopilishi bilan rasmlar **diskdan ham, bazadan ham darhol**
o'chiriladi (`MEDIA_RETENTION_DAYS` standarti `7` → `0`).

Bu xavfsiz, chunki "zayavka yopildi" xabari Telegramga rasmlar bilan
birga **yetkazilib bo'lgandan keyin** o'chiriladi — Telegram rasmni o'z
serveriga yuklab oladi, shuning uchun bot chatida rasmlar avvalgidek
ko'rinib turaveradi. Faqat ilova ichidagi yopilgan zayavkada rasm
ko'rinmaydi.

Natijada volume hajmi endi faqat **ochiq** zayavkalar hajmida turadi.

### 2. Har bir rasm — maksimum 0.2 MB

Siqish chegarasi 1 MB dan **0.2 MB** ga tushirildi (`MAX_IMAGE_KB=200`),
maksimal kenglik 1920 → **1280 px**. Sinovda 4.5 MB lik surat **20–170 KB**
oralig'iga tushdi va sifat ko'zga sezilarli darajada yomonlashmadi.

Nega kenglik ham kamaytirildi: 0.2 MB ga faqat sifatni pasaytirib yetish
rasmni "bulg'aydi". 1280 px @ sifat 72 chiqqan rasm 1600 px @ sifat 45 dan
ancha toza ko'rinadi, hajmi esa bir xil. 1280 px telefon ekrani (odatda
1080 px) uchun, hatto kattalashtirib ko'rganda ham, yetarli.

Siqish algoritmi ham tezlashtirildi: boshlang'ich sifat 85 dan 72 ga
tushirildi, shuning uchun odatiy surat **bir marta** siqiladi (ilgari
2-3 marta qayta siqilardi) — bu deyarli har bir yuklashda tejalgan CPU.

### 3. Ro'yxat uchun kichik nusxalar (thumbnail)

Bu — **eng katta trafik tejalishi**. Zayavkalar ro'yxatida har bir karta
40×40 px rasmcha ko'rsatadi, lekin brauzer TO'LIQ rasmni yuklab olardi.
100 ta zayavkali sahifa ~50 MB trafik degani edi.

Endi yuklash paytida `*_thumb.jpg` (320 px, ~20 KB) yaratiladi va ro'yxat
faqat shuni yuklaydi (`loading="lazy"` bilan). Xuddi shu sahifa endi
~2 MB. Eski (thumbnail'siz) rasmlar uchun avtomatik to'liq rasmga
qaytiladi — hech narsa buzilmaydi.

### 4. Kesh sarlavhalari

| Nima | Kesh |
|---|---|
| Rasmlar (`/uploads/...`) | 30 kun, `immutable` |
| Frontend fayllari (hash'li nomlar) | 1 yil, `immutable` |
| `index.html` | keshlanmaydi (yangilanish darhol yetib boradi) |

Ilgari hech qanday kesh sarlavhasi yo'q edi — ilova har ochilganda 400 KB
lik JS va barcha rasmlar qaytadan yuklanardi.

### 5. Ortiqcha so'rov va so'rovlarni yengillashtirish

- **Zayavkalar ro'yxati** endi har bir zayavkaning barcha izohlarini
  mualliflari bilan tortmaydi — kartada faqat "izoh bormi?" belgisi kerak.
  Eksport va hisobotlar esa avvalgidek to'liq izohlar bilan ishlaydi.
- **Texniklar nazorati** sahifasi har 30 soniyada emas, **3 daqiqada**
  yangilanadi va ilova fonda bo'lganda umuman so'rov yubormaydi. Ochiq
  turgan bitta telefon kuniga ~2900 ta so'rov o'rniga ~480 ta yuboradi.
- **Hisobot rejalashtiruvchisi** har bir foydalanuvchi uchun alohida
  so'rov qilmaydi: bitta so'rov bilan kim allaqachon olganini aniqlab,
  hammasi olgan bo'lsa darhol chiqadi. Tekshiruv oralig'i 10 → 30 daqiqa.
- **`/health`** so'rovlari endi loglanmaydi (Railway uni doimiy tekshiradi).

### Yangi sozlamalar

| O'zgaruvchi | Standart | Ma'nosi |
|---|---|---|
| `MEDIA_RETENTION_DAYS` | `0` | `0` — yopilgan zahoti; `N` — N kundan keyin; `-1` — hech qachon |
| `MAX_IMAGE_KB` | `200` | Rasmning maksimal hajmi (0.2 MB) |
| `THUMBNAIL_WIDTH` | `320` | Kichik nusxa kengligi. `0` — yaratilmasin |
| `MAX_UPLOAD_MB` | `15` | Siqishdan oldingi maksimal fayl hajmi (ilgari 25) |
| `MEDIA_CLEANUP_INTERVAL_MINUTES` | `720` | Fon tekshiruvi oralig'i (ilgari 360) |
| `REPORT_CHECK_INTERVAL_MINUTES` | `30` | Hisobot tekshiruvi oralig'i (ilgari 10) |

Hech qanday o'zgaruvchi kiritish shart emas — standart qiymatlar
allaqachon tejamkor. Eski xatti-harakatni qaytarish kerak bo'lsa
(masalan rasmlar 7 kun tursin), `MEDIA_RETENTION_DAYS=7` qo'ying.

## 2026-09-14 — Ikki tilli tizim: O'zbekcha / Ruscha

Endi har bir xodim **o'zi uchun tilni tanlaydi** va butun tizim o'sha tilga
o'tadi — nafaqat interfeys, balki Telegram xabarlari va hisobotlar ham.

### Foydalanuvchi nimani ko'radi

1. **Birinchi kirishda** til tanlash oynasi chiqadi (O'zbekcha / Русский).
2. Keyin sarlavhaning o'ng chetidagi **UZ / RU** tugmasi orqali tilni
   istalgan paytda almashtirish mumkin — sahifa qayta yuklanmaydi.
3. Tanlov **serverda saqlanadi** (`users.language`), shuning uchun boshqa
   qurilmadan kirganda ham o'sha til ochiladi.

### Nima tarjima qilindi

| Bo'lim | Holati |
|---|---|
| Barcha ekranlar, tugmalar, filtrlar, bo'sh ro'yxat matnlari | ✅ |
| Holat, muhimlik, lavozim nomlari | ✅ |
| Server xato xabarlari (`X-Lang` header orqali) | ✅ |
| Telegram bildirishnomalari — **har bir xodimga o'z tilida** | ✅ |
| PDF va Excel eksport (ustunlar, sana formati, "Jami harajat") | ✅ |
| Avtomatik haftalik/oylik hisobotlar (oy nomi ham) | ✅ |
| Bot javoblari (`/start`, `/help`, `/app`) va buyruqlar ro'yxati | ✅ |

Diqqatga sazovor jihat: bitta zayavka ochilganda **turli xodimlarga turli
tilda** xabar boradi — direktorga o'zbekcha, bosh texnikka ruscha, chunki
matn har bir qabul qiluvchining tiliga qarab quriladi.

### Kategoriyalar (topshiriq turlari)

Kategoriyalar endi **ikkita nomga** ega: o'zbekcha va ruscha. Superadmin
ularni "Kategoriyalar" bo'limida kiritadi. Standart 7 ta kategoriyaning
ruscha nomlari deploy paytida avtomatik to'ldiriladi. Ruscha nomi
kiritilmagan kategoriya admin ro'yxatida "Ruscha nomi yo'q" belgisi bilan
ko'rinadi va rus tilidagi foydalanuvchiga o'zbekcha nomi ko'rsatiladi.

### Texnik o'zgarishlar

- `users.language` (`uz` | `ru` | `null`) va `task_categories.label_ru`
  ustunlari qo'shildi — `prisma db push` deploy paytida avtomatik qo'llaydi,
  qo'lda migratsiya kerak emas, mavjud ma'lumot yo'qolmaydi.
- `PATCH /api/users/me/language` — tilni saqlash endpointi.
- Mini App har bir so'rovda `X-Lang: uz|ru` header yuboradi.
- Tarjimalar: `apps/frontend/src/shared/i18n/{uz,ru}.ts` (interfeys),
  `apps/backend/src/core/i18n/messages.ts` (xabar va hisobotlar),
  `packages/shared-types/src/enums.ts` (holat/lavozim/muhimlik).
- `ru.ts` `uz.ts`ning tipidan meros oladi: ruscha tarjimasi yozilmagan yangi
  matn bo'lsa, loyiha kompilyatsiya bo'lmaydi — interfeys yarim tarjima
  holatda qololmaydi.

**Eski foydalanuvchilar uchun:** `language` ustuni bo'sh bo'lgani uchun ular
keyingi kirishda bir marta til tanlash oynasini ko'radi.

## 2026-09-14 — Railway xotira/CPU sarfini kamaytirish (audit)

Railway'da oylik xarajat kutilganidan yuqori bo'lib chiqdi (Compute Usage
limitiga yaqinlashgan). Metrics grafiklarini tekshirganda, `app` servisining
RAM sarfi haftalar davomida **hech qachon pasaymay** ~150MB dan ~480MB gacha
asta-sekin o'sib borgani aniqlandi. Audit natijasida topilgan va tuzatilgan
muammolar:

1. **Rasm siqish kodi (`media.service.ts`) eng katta sabab edi.** `sharp`
   (libvips) kutubxonasi standart holatda dekodlangan rasmlarni ichki keshda
   saqlaydi — bu kesh Node'ning V8 heap'idan tashqarida (native xotirada)
   turadi va oddiy garbage collector uni tozalay olmaydi. Bizda har bir rasm
   faqat bir marta siqilib, qayta ishlatilmaydi, shuning uchun bu kesh
   foydasiz edi va faqat RSS xotirani asta-sekin oshirib borar edi.
   → `sharp.cache(false)` va `sharp.concurrency(1)` qo'shildi; siqish
   funksiyasi endi faylni diskdan faqat **bir marta** o'qiydi (oldin har
   urinishda qayta o'qir edi).
2. **`purgeOrphanFiles` cheklovsiz edi** — papkadagi barcha fayllarni va
   bazadagi barcha rasmli zayavkalarni bir vaqtda xotiraga yuklardi. Vaqt
   o'tib fayllar soni ko'paysa, bu funksiya har 6 soatda katta CPU/xotira
   portlashiga olib kelishi mumkin edi. → 2000 tadan batch bilan ishlaydigan
   qilindi.
3. **Prisma connection pool** standart bo'yicha juda katta bo'lishi mumkin
   edi (CPU soniga bog'liq). → `DATABASE_URL`ga avtomatik
   `connection_limit=5` qo'shildi (`DB_CONNECTION_LIMIT` env orqali
   sozlanadi).
4. **Tarmoq (egress) xarajatini kamaytirish uchun** `compression`
   middleware qo'shildi — JSON javoblar va statik fayllar endi gzip bilan
   siqib yuboriladi.
5. **Node xotira shifti** — Dockerfile'ga
   `NODE_OPTIONS=--max-old-space-size=384` qo'shildi, bu V8'ni belgilangan
   chegaradan oshib ketishdan saqlaydi va muntazam GC'ni majburlaydi.

**Kutilayotgan natija:** keyingi deploy'dan so'ng RAM grafigi endi doimiy
o'smasdan, past darajada (taxminan 150-250MB) barqaror turishi kerak.
Buni tasdiqlash uchun deploy'dan 3-5 kun keyin Railway → Metrics → Memory
grafigini qayta tekshiring.

## 2026-08-17 — Avtomatik haftalik va oylik PDF hisobotlar

Tizim endi hisobotlarni **o'zi yuboradi** — hech kim tugma bosishi shart emas.

| Hisobot | Qachon | Qamrovi |
|---|---|---|
| **Haftalik** | Har dushanba **07:00** | O'tgan hafta: dushanba 00:00 – yakshanba 23:59 |
| **Oylik** | Oyning **oxirgi kuni 16:00** | Oyning 1-sanasidan 16:00 gacha |

Vaqtlar **Toshkent vaqti** (UTC+5) bo'yicha — server UTC'da ishlasa ham to'g'ri.

**Kim oladi:** Superadmin, Filial direktori, Hududiy rahbar. Har biri o'zining
ko'rish doirasidagi ma'lumotni oladi:

- Superadmin — barcha filiallar
- Hududiy rahbar — o'ziga biriktirilgan filiallar
- Filial direktori — o'z filiali

**Nima keladi:** PDF fayl (qo'lda eksport bilan bir xil ustunlar) + qisqa
xulosa yozuvi: jami zayavkalar soni, yopilganlari, ochiqlari va umumiy harajat.
Davrda birorta zayavka bo'lmasa — PDF o'rniga qisqa matnli xabar keladi.

**Ishonchlilik:**

- **Takrorlanmaydi.** Har bir (foydalanuvchi + davr) juftligi `audit_logs` ga
  yoziladi; qayta deploy yoki restart bo'lsa ham bir xil hisobot ikki marta
  yuborilmaydi.
- **O'tkazib yubormaydi.** Klassik cron o'rniga "yetib olish" usuli: server
  aynan o'sha lahzada o'chiq yoki uxlab yotgan bo'lsa (Railway App Sleeping),
  uyg'onishi bilan yuborilmagan hisobotni yuboradi (72 soat ichida).
- **Bittasi yiqilsa — qolganlari boradi.** Foydalanuvchi botni bloklagan yoki
  `/start` bosmagan bo'lsa, faqat o'shanga yuborilmaydi.

**Qo'lda sinash uchun endpointlar:**

- `POST /api/reports/run/me?type=weekly` — hisobotni faqat o'zingizga yuboradi
- `POST /api/reports/run?type=weekly` — barcha qabul qiluvchilarga (Superadmin)
- `GET /api/reports/period?type=monthly` — davr chegaralarini ko'rsatadi

**Sozlamalar:** `REPORTS_ENABLED`, `REPORT_WEEKLY_HOUR`, `REPORT_MONTHLY_HOUR`,
`REPORT_TZ_OFFSET_MINUTES`, `REPORT_CHECK_INTERVAL_MINUTES`,
`REPORT_MAX_CATCHUP_HOURS` (barchasi ixtiyoriy — standart qiymatlar bilan ishlaydi).

---

## 2026-08-17 — Rasmlarni saqlash muddati (retention)

**Muammo:** Railway konteyneri efemer — har deployda fayl tizimi tozalanadi va
yuklangan rasmlar yo'qolardi. Bundan tashqari zayavka yopilgan zahoti rasmlar
darhol o'chirib tashlanardi, shuning uchun tarixda ular ko'rinmasdi.

**Yechim:**

- Railway'da `/app/uploads` ga **volume** ulanadi (qo'llanma: `RAILWAY.md`,
  3-bo'lim, 4-qadam) — rasmlar deploydan keyin ham saqlanib qoladi.
- Zayavka yopilganda rasmlar endi **darhol o'chirilmaydi**: ular
  `MEDIA_RETENTION_DAYS` kun (standart — **7 kun**) ilovada ko'rinib turadi.
- Muddat o'tgach fon vazifasi (`modules/media/media.cleanup.ts`) fayllarni
  diskdan va URL'larni bazadan tozalaydi. Rasmlar Telegram bot chatida esa
  doimo qoladi.
- O'sha vazifa **"yetim" fayllarni** ham tozalaydi: foydalanuvchi rasm yuklab,
  zayavkani yubormasdan chiqib ketgan holatlar (24 soatdan keyin o'chiriladi).

**Yangi sozlamalar:**

| O'zgaruvchi | Standart | Ma'nosi |
|---|---|---|
| `MEDIA_RETENTION_DAYS` | `7` | Yopilgandan keyin necha kun saqlanadi. `0` — darhol o'chirilsin (eski xatti-harakat), `-1` — hech qachon o'chirilmasin |
| `MEDIA_CLEANUP_INTERVAL_MINUTES` | `360` | Tozalash vazifasi necha daqiqada bir ishlaydi |

> Eslatma: allaqachon yo'qolgan eski rasmlarni tiklab bo'lmaydi — ular
> konteyner diski bilan birga o'chib ketgan. Volume ulangandan keyin
> yuklanadigan rasmlar saqlanib qoladi.

---

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
