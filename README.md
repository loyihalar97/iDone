# Texnik Xizmat Ko'rsatish — Telegram Mini App

Restoranlar/filiallar tarmog'ida texnik zayavkalarni boshqarish tizimi. To'liq MVP: Telegram Mini App (React), Express/TypeScript backend, PostgreSQL, Telegram bot.

Arxitektura tafsilotlari uchun [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ga qarang.

---

## Loyiha tuzilishi

```
apps/
  backend/    Express + TypeScript + Prisma API server
  bot/        Telegraf bot (bildirishnomalar + Mini App ochish tugmasi)
  frontend/   React + Vite + Tailwind Telegram Mini App
packages/
  shared-types/  Backend/frontend/bot uchun umumiy enum va DTO'lar
```

## Rollar va imkoniyatlar

| Rol | Imkoniyatlar |
|---|---|
| **Filial direktori** | Zayavka yaratadi, o'z filiali zayavkalarini ko'radi, ishni qabul qiladi |
| **Filial menejeri** | O'z filialini kuzatadi, zayavka ochadi, tarix va hisobotlarni ko'radi/yuklaydi |
| **Hududiy rahbar** | O'ziga biriktirilgan **bir nechta filialni** kuzatadi, ularga zayavka ochadi, tarix va hisobotlarni yuklaydi |
| **Rahbar** | **Barcha filiallarni** kuzatadi, zayavka ochadi, texniklarni nazorat qiladi, texnik/direktor/lavozim kesimida tarix va hisobot oladi |
| **Bosh texnik** | Barcha zayavkalarni ko'radi, texnik biriktiradi/o'zgartiradi (o'ziga ham), muhimlikni o'zgartiradi, bajarish imkonsizligi haqida izoh yozadi, ishni tasdiqlaydi |
| **Texnik** | O'ziga biriktirilgan ishlarni ko'radi, bajaradi, natija rasmi va harajat summasini kiritadi |
| **Superadmin** | Foydalanuvchi/filiallarni boshqaradi, statistika ko'radi, rol tayinlaydi |

Bosh texniklar soni cheklanmagan — bir nechta faol Bosh texnik bo'lishi mumkin. Yangi zayavka
hech kimga biriktirilmagan holda ochiladi va barcha faol Bosh texniklarga ko'rinadi; kim birinchi
bo'lib texnik biriktirsa, o'sha zayavkaning mas'ul Bosh texnigi bo'lib qoladi.

Zayavka hayot sikli: `Yangi → Jarayonda → Texnik tugatdi → Bosh texnik tasdiqladi → Direktor tasdiqladi → Yopildi (avtomatik)`.

---

## 1. Lokal ishga tushirish

### Talablar
- Node.js ≥ 20
- Docker (PostgreSQL uchun, ixtiyoriy — o'rniga mahalliy Postgres ham bo'lishi mumkin)
- Telegram bot tokeni ([@BotFather](https://t.me/BotFather) orqali oling)

### Qadamlar

```bash
# 1. Bog'liqliklarni o'rnatish (monorepo root'da)
npm install

# 2. .env fayllarini nusxalash
cp apps/backend/.env.example apps/backend/.env
cp apps/bot/.env.example apps/bot/.env
cp apps/frontend/.env.example apps/frontend/.env

# .env fayllarini to'ldiring: TELEGRAM_BOT_TOKEN, DATABASE_URL va h.k.

# 3. PostgreSQL'ni ishga tushirish (Docker orqali)
docker compose up -d postgres

# 4. Prisma migratsiyalarini qo'llash
npm run prisma:migrate

# 5. Boshlang'ich ma'lumot (superadmin va namuna filial)
npm run prisma:seed
# ⚠️ apps/backend/prisma/seed.ts ichidagi telegramId'ni o'zingizning
#    haqiqiy Telegram ID'ingizga almashtiring (@userinfobot orqali bilib oling)

# 6. Backend, bot va frontend'ni alohida terminallarda ishga tushiring
npm run dev:backend   # http://localhost:4000
npm run dev:bot       # http://localhost:4100 (internal)
npm run dev:frontend  # http://localhost:5173
```

### Telegram Mini App'ni lokal test qilish

Telegram faqat HTTPS manzillarni Mini App sifatida ochadi. Lokal test uchun:

```bash
# frontend portini tashqariga chiqarish (masalan cloudflared yoki ngrok orqali)
npx cloudflared tunnel --url http://localhost:5173
```

Olingan HTTPS URL'ni [@BotFather](https://t.me/BotFather) → `/mybots` → botingiz → **Bot Settings → Menu Button** orqali, shuningdek `apps/bot/.env` dagi `MINI_APP_URL` ga qo'ying va botni qayta ishga tushiring.

---

## 2. Production deploy (Railway — yagona servis)

Loyiha endi **bitta servis** sifatida ishlaydi: backend API + Telegram bot +
frontend statik fayllar — hammasi bitta konteynerda (repo ildizidagi
`Dockerfile`). Bu Railway xarajatini sezilarli kamaytiradi (3 ta Node/nginx
servis o'rniga 1 tasi + Postgres).

To'liq bosqichma-bosqich qo'llanma va xarajatni kamaytirish maslahatlari uchun
**[`RAILWAY.md`](RAILWAY.md)** ga qarang. Qisqacha:

1. Railway loyihasida **PostgreSQL** plugin qo'shing (`DATABASE_URL` avtomatik).
2. GitHub repo'ni **app servisi** sifatida ulang — root directory'ni bo'sh
   qoldiring (ildizdagi `Dockerfile` va `railway.json` avtomatik topiladi).
3. Environment o'zgaruvchilarini kiriting (`.env.example` asosida):
   `DATABASE_URL`, `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `PUBLIC_BASE_URL`,
   `USE_WEBHOOK=true`.
4. Deploy — konteyner avtomatik: xavfsiz migratsiya (`premigrate`) → `prisma
   db push` → standart kategoriyalar → bot webhook → server.

Bot menyu tugmasi (`Menu Button`) avtomatik `PUBLIC_BASE_URL` ga o'rnatiladi —
qo'lda sozlash shart emas. Eski `apps/bot` va `apps/frontend` (nginx) servislari
endi deploy uchun kerak emas.

---

## 3. API hujjatlari

Barcha endpointlar `docs/API.md` da tavsiflangan. Qisqacha:

| Endpoint | Tavsif |
|---|---|
| `POST /api/auth/telegram` | Telegram initData orqali kirish, JWT olish |
| `GET /api/requests` | Zayavkalar ro'yxati (rol asosida filtrlangan) |
| `POST /api/requests` | Yangi zayavka yaratish (Direktor) |
| `PATCH /api/requests/:id/assign` | Texnik biriktirish (Bosh texnik) |
| `PATCH /api/requests/:id/status` | Status o'zgartirish (state-machine bo'yicha) |
| `GET /api/dashboard/stats` | Statistika (Superadmin/Bosh texnik) |
| `POST /api/media/upload` | Foto/video yuklash |

## 4. Kengaytirish

Yangi modul (masalan Ombor) qo'shish uchun `apps/backend/src/modules/warehouse/` papkasini yarating va `routes → controller/service → repository` qatlamlarini `requests` moduliga o'xshab tuzing, so'ng `app.ts` da ulang. Batafsil — `docs/ARCHITECTURE.md`.

## 5. Litsenziya

Ichki korporativ foydalanish uchun.
