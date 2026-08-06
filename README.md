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
| **Bosh texnik** | Barcha zayavkalarni ko'radi, texnik biriktiradi, ishni tasdiqlaydi |
| **Texnik** | O'ziga biriktirilgan ishlarni ko'radi, bajaradi, natija rasmini yuklaydi |
| **Superadmin** | Foydalanuvchi/filiallarni boshqaradi, statistika ko'radi, rol tayinlaydi |

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

## 2. Production deploy (Railway + Vercel)

### Backend (Railway)
1. Railway'da yangi loyiha yarating, GitHub repo'ni ulang, **root directory**'ni `apps/backend` deb belgilang (yoki repo ildizidagi `Dockerfile` yo'lini ko'rsating).
2. Railway'da PostgreSQL plugin qo'shing — `DATABASE_URL` avtomatik environment variable sifatida beriladi.
3. Qolgan environment variable'larni (`.env.example` asosida) Railway dashboard'da kiriting.
4. Deploy bo'lgach, `prisma migrate deploy` avtomatik ishga tushadi (Dockerfile CMD ichida).

### Bot (Railway)
1. Alohida Railway servisi sifatida `apps/bot/Dockerfile` orqali deploy qiling.
2. `BOT_INTERNAL_URL` (backend'da) va bot manzilini bir-biriga moslang — ikkalasi ham Railway'da bo'lsa, Railway'ning **internal networking** domenidan foydalaning (`http://<service-name>.railway.internal:PORT`).
3. Production'da `USE_WEBHOOK=true` va `WEBHOOK_DOMAIN` ni bot xizmatining ochiq Railway URL'iga o'rnating.

### Frontend (Vercel yoki Railway)
- **Vercel**: repo'ni ulang, root directory `apps/frontend`, build command `npm run build`, output `dist`. `VITE_API_BASE_URL` ni backend'ning production URL'iga o'rnating.
- **Railway**: `apps/frontend/Dockerfile` orqali statik nginx serverini deploy qiling.

Deploy tugagach, frontend URL'ini bot **Menu Button**'iga va `MINI_APP_URL` environment variable'iga qo'ying.

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
