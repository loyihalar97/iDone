# Railway'ga arzon deploy qilish qo'llanmasi

Bu loyiha **bitta servis** (yagona konteyner) sifatida ishlashga moslashtirildi:
backend API + Telegram bot + frontend statik fayllar — hammasi bitta Node
jarayonida. Bu Railway'da to'lanadigan oylik summani sezilarli kamaytiradi.

---

## 1. Nima o'zgardi (va nega arzonroq)

**Ilgari:** 4 ta doimiy ishlaydigan servis edi:

| Servis | Taxminiy RAM |
|---|---|
| backend (Node) | ~250 MB |
| bot (Node, alohida) | ~120 MB |
| frontend (nginx) | ~20 MB |
| Postgres | ~256 MB |

**Hozir:** 2 ta servis:

| Servis | Taxminiy RAM |
|---|---|
| app (backend + bot + frontend, bitta konteyner) | ~250–300 MB |
| Postgres | ~256 MB |

Bot endi alohida servis emas — u backend jarayonining ichida ishlaydi
(webhook rejimida). Frontend ham alohida nginx emas — statik fayllar backend
tomonidan beriladi. Natijada 3 ta Node/nginx servis o'rniga **1 tasi** qoladi.

---

## 2. Railway narxi qanday hisoblanadi (2026)

Railway **ishlatilgan resurs** uchun oladi (sekundlab):

- **Xotira (RAM):** ~$0.0000039 / GB-sekund ≈ **$10 / GB oyiga** (24/7 ishlasa)
- **CPU:** ~$0.0000077 / vCPU-sekund ≈ **$20 / vCPU oyiga** (agar 100% band bo'lsa)

Muhim jihat: **CPU faqat haqiqatan hisoblash bo'lganda** oladi. Bo'sh turgan
Node server CPU'ni deyarli ishlatmaydi — shuning uchun asosiy xarajat **RAM**.
Hobby reja $5/oy — bu minimal to'lov bo'lib, ichiga $5 usage kiradi.

### Taxminiy oylik hisob (bu loyiha, kam trafik)

| Element | Taxminiy xarajat |
|---|---|
| app RAM (~0.3 GB, 24/7) | ~$3 |
| app CPU (bo'sh turadi) | ~$0.2–0.5 |
| Postgres RAM (~0.25 GB) | ~$2.5 |
| Postgres disk (~1 GB) | ~$0.25 |
| **Jami** | **≈ $5–7 / oy** |

Bu sizning $5–10 byudjetingizga to'g'ri keladi. (Narxlar o'zgarishi mumkin —
[railway.com/pricing](https://railway.com/pricing) dan tekshiring.)

---

## 3. Deploy bosqichlari

1. **Postgres qo'shing.** Railway loyihangizda `+ New → Database → PostgreSQL`.
   `DATABASE_URL` avtomatik beriladi.

2. **App servisini qo'shing.** `+ New → GitHub Repo` → shu repo'ni tanlang.
   Railway root'dagi `Dockerfile` va `railway.json` ni avtomatik topadi.
   (Root Directory'ni **bo'sh** qoldiring — butun repo build qilinadi.)

3. **Environment o'zgaruvchilarini kiriting** (app servisida, Variables):

   ```
   DATABASE_URL           = ${{Postgres.DATABASE_URL}}   # Railway reference
   JWT_SECRET             = <uzun tasodifiy satr>
   TELEGRAM_BOT_TOKEN     = <@BotFather tokeni>
   PUBLIC_BASE_URL        = https://<app-domeningiz>.up.railway.app
   USE_WEBHOOK            = true
   NODE_ENV               = production

   # ixtiyoriy — rasmlarni saqlash muddati (standart: 7 kun)
   MEDIA_RETENTION_DAYS   = 7

   # ixtiyoriy — avtomatik hisobotlar (standart qiymatlar bilan ishlaydi)
   REPORT_WEEKLY_HOUR     = 7    # dushanba 07:00 (Toshkent vaqti)
   REPORT_MONTHLY_HOUR    = 16   # oy oxirgi kuni 16:00
   ```

   > Hisobot vaqtlari **mahalliy vaqt** (UTC+5) bo'yicha hisoblanadi —
   > Railway konteyneri UTC'da ishlasa ham to'g'ri ishlaydi.

   > `PUBLIC_BASE_URL` — app servisining Settings → Networking → Public Domain
   > dan olingan manzil. `DATABASE_URL` uchun Railway "reference variable"
   > ishlating: `${{Postgres.DATABASE_URL}}`.

4. **Rasmlar uchun Volume ulang (MUHIM).** Railway konteyneri efemer —
   har bir deploy yoki restartda fayl tizimi noldan yaratiladi. Volume
   ulanmasa, yuklangan rasmlar keyingi deployda **yo'qoladi**.

   App servisi → `Settings` → `Volumes` → `+ New Volume`:

   | Maydon | Qiymat |
   |---|---|
   | Mount path | `/app/uploads` |
   | Size | 1–5 GB (Hobby'da maksimum 5 GB) |

   > Mount path aynan `/app/uploads` bo'lishi shart: konteynerda `WORKDIR /app`,
   > kod esa `LOCAL_UPLOAD_DIR` (standart `uploads`) ni shunga nisbatan hisoblaydi.
   >
   > Volume **ishlatilgan hajm** bo'yicha $0.15/GB/oy hisoblanadi (provizion
   > qilingan hajm uchun emas) — bu loyihada amalda oyiga bir necha tsent.
   >
   > Eslatma: volume ulangan servisda Railway zero-downtime deploy qila olmaydi —
   > har deployda bir necha soniya uzilish bo'ladi. Bu ilova uchun muammo emas.

5. **Deploy.** Konteyner ishga tushganda avtomatik ravishda:
   - eski `category` ustunini xavfsiz ko'chiradi (premigrate),
   - `prisma db push` bilan sxemani bazaga qo'llaydi,
   - standart kategoriyalarni yaratadi,
   - botni webhook'ga ulaydi va serverni ishga tushiradi.

6. **Superadmin'ni belgilang.** Birinchi marta botga `/start` bosgan
   foydalanuvchi bazaga qo'shiladi. So'ng bazada o'sha foydalanuvchining
   `role` ustunini `superadmin` ga o'zgartiring (yoki `apps/backend/prisma/seed.ts`
   dagi `telegramId` ni o'zingiznikiga qo'yib `npm run prisma:seed` ni ishga
   tushiring).

7. **BotFather Menu Button.** Bot avtomatik ravishda menyu tugmasini
   `PUBLIC_BASE_URL` ga o'rnatadi — qo'lda sozlash shart emas.

---

## 4. Xarajatni yanada kamaytirish (ixtiyoriy)

- **App Sleeping (Serverless).** App servisi Settings'ida "Serverless" /
  "App Sleeping" ni yoqing. Trafik bo'lmaganda servis uxlaydi va RAM xarajati
  deyarli nolga tushadi; so'rov kelganda avtomatik uyg'onadi. Kam ishlatiladigan
  ichki tool uchun juda foydali. (Telegram webhook uxlab qolgan xabarni qayta
  yuboradi, shuning uchun xabarlar yo'qolmaydi.) **Postgres uxlamaydi.**

  > Avtomatik hisobotlar bunga moslashtirilgan: servis aynan dushanba 07:00 da
  > uxlab yotgan bo'lsa ham, uyg'onishi bilan yuborilmagan hisobotni yuboradi
  > (`REPORT_MAX_CATCHUP_HOURS`, standart 72 soat ichida).

- **Webhook rejimi (long-polling emas).** Allaqachon `USE_WEBHOOK=true` bilan
  yoqilgan. Long-polling doimiy so'rov tsiklini ushlab turadi va ko'proq
  resurs yeydi — webhook esa faqat xabar kelganda ishlaydi.

- **Bitta replica.** `railway.json` da `numReplicas: 1`. Ko'paytirmang.

- **Region.** Foydalanuvchilaringizga yaqin bitta region tanlang (ortiqcha
  replica/region qo'shmang).

- **Disk hajmi (volume).** Zayavka yopilgandan so'ng rasmlar `MEDIA_RETENTION_DAYS`
  kun (standart — **7 kun**) ilovada ko'rinib turadi, so'ng fon vazifasi ularni
  diskdan va bazadan avtomatik tozalaydi. Rasmlar Telegram bot chatida esa
  doimo saqlanib qoladi. Shu sababli volume hajmi faqat "ochiq + oxirgi bir
  haftada yopilgan" zayavkalar hajmida turadi va o'smaydi.

  Sozlash uchun o'zgaruvchilar:

  | O'zgaruvchi | Standart | Ma'nosi |
  |---|---|---|
  | `MEDIA_RETENTION_DAYS` | `7` | Yopilgandan keyin necha kun saqlanadi. `0` — darhol o'chirilsin, `-1` — hech qachon o'chirilmasin |
  | `MEDIA_CLEANUP_INTERVAL_MINUTES` | `360` | Tozalash vazifasi necha daqiqada bir ishlaydi |

  Vazifa bir vaqtning o'zida "yetim" fayllarni ham (rasm yuklanib, zayavka
  yuborilmagan holatlar) 24 soatdan keyin o'chiradi.

- **Byudjet limiti.** Railway'da Usage → Limits orqali oylik "hard limit"
  (masalan $10) qo'ying — kutilmagan xarajatning oldini oladi.

---

## 5. Lokal test (yagona image)

```bash
TELEGRAM_BOT_TOKEN=... docker compose up --build
# http://localhost:4000
```

Yoki hot-reload bilan development:

```bash
npm install
npm run dev:backend    # http://localhost:4000
npm run dev:frontend   # http://localhost:5173
```

> Eslatma: `apps/bot` papkasi endi deploy uchun ishlatilmaydi (bot backend
> ichiga ko'chirildi), lekin havola sifatida repo'da qoldirildi.
