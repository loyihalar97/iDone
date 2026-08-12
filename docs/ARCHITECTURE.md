# Texnik Xizmat Ko'rsatish Tizimi — Arxitektura Rejasi

> Restoranlar/filiallar tarmog'i uchun Telegram Mini App asosidagi texnik zayavkalarni boshqarish tizimi.
> Enterprise darajada, modulli, kelajakda kengaytiriladigan arxitektura.

---

## 1. Umumiy arxitektura yondashuvi

Loyiha **monorepo** shaklida quriladi (bitta GitHub repo ichida frontend, backend, bot va umumiy tiplar).
Backend **modulli monolit** (modular monolith) sifatida quriladi — har bir domen (zayavkalar, foydalanuvchilar, filiallar, bildirishnomalar) alohida modul bo'lib, kelajakda mikroservisga bo'lib chiqarish oson bo'ladigan tarzda ajratiladi.

Asosiy tamoyillar:

* **Domain-driven** papka strukturasi (texnik jihatga emas, biznes domeniga qarab bo'linish)
* Har bir modul: `routes → controller → service → repository → model` qatlamlariga ega
* Umumiy narsalar (auth, logging, error handling) — `core/` yoki `shared/` da
* Yangi modul qo'shish = yangi papka qo'shish, mavjud kodni deyarli o'zgartirmasdan

---

## 2. Monorepo folder tree

```
texnik-xizmat-mini-app/
├── apps/
│   ├── frontend/                 # Telegram Mini App (React + Vite)
│   │   ├── src/
│   │   │   ├── app/               # App shell, routing, providers
│   │   │   ├── pages/              # Har bir rol uchun sahifalar
│   │   │   │   ├── director/
│   │   │   │   ├── chief-technician/
│   │   │   │   ├── technician/
│   │   │   │   └── superadmin/
│   │   │   ├── features/           # Domenlarga bo'lingan UI logika
│   │   │   │   ├── requests/       # Zayavkalar
│   │   │   │   ├── branches/       # Filiallar
│   │   │   │   ├── users/          # Foydalanuvchilar
│   │   │   │   └── dashboard/      # Statistika
│   │   │   ├── shared/
│   │   │   │   ├── ui/             # Qayta ishlatiladigan komponentlar
│   │   │   │   ├── hooks/
│   │   │   │   ├── api/            # API client (axios/fetch wrapper)
│   │   │   │   └── telegram/       # Telegram WebApp SDK wrapper
│   │   │   ├── types/              # Umumiy tiplar (packages/shared dan import)
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   └── package.json
│   │
│   ├── backend/                  # Express + TypeScript API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Telegram Login, JWT/session
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.middleware.ts
│   │   │   │   ├── requests/       # Zayavkalar moduli (asosiy domen)
│   │   │   │   │   ├── requests.routes.ts
│   │   │   │   │   ├── requests.controller.ts
│   │   │   │   │   ├── requests.service.ts
│   │   │   │   │   ├── requests.repository.ts
│   │   │   │   │   ├── requests.model.ts
│   │   │   │   │   ├── requests.state-machine.ts   # Status o'tishlari logikasi
│   │   │   │   │   └── requests.types.ts
│   │   │   │   ├── branches/       # Filiallar
│   │   │   │   ├── users/          # Foydalanuvchilar va rollar
│   │   │   │   ├── categories/     # Muammo kategoriyalari
│   │   │   │   ├── notifications/  # Telegram bildirishnomalari
│   │   │   │   ├── media/          # Foto/video yuklash (Supabase/Cloudinary)
│   │   │   │   ├── dashboard/      # Statistika va agregatsiya
│   │   │   │   └── audit-log/      # Har bir amalning logi
│   │   │   ├── core/
│   │   │   │   ├── config/         # env, konfiguratsiya
│   │   │   │   ├── database/       # DB connection, migratsiyalar
│   │   │   │   ├── errors/         # Xato klasslari, error handler
│   │   │   │   ├── logger/
│   │   │   │   └── middlewares/    # CORS, rate-limit, validation
│   │   │   ├── shared/
│   │   │   │   ├── utils/
│   │   │   │   └── constants/
│   │   │   ├── app.ts               # Express app sozlash
│   │   │   └── server.ts            # Entry point
│   │   ├── prisma/                  # yoki drizzle/knex — ORM schema
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── tests/
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── bot/                      # Telegram Bot (alohida process)
│       ├── src/
│       │   ├── handlers/           # /start, menyu, yordam
│       │   ├── notifications/      # Backend'dan kelgan eventlarni yuborish
│       │   ├── bot.ts
│       │   └── server.ts           # Webhook endpoint
│       ├── Dockerfile
│       ├── .env.example
│       └── package.json
│
├── packages/
│   ├── shared-types/              # Backend, frontend, bot uchun umumiy TS tiplar
│   │   └── src/
│   │       ├── enums.ts            # RequestStatus, Role, Priority, Category
│   │       └── dto.ts
│   └── config/                    # Umumiy eslint/tsconfig
│
├── docs/
│   ├── ARCHITECTURE.md            # Ushbu hujjat
│   ├── API.md                     # Endpoint spetsifikatsiyasi
│   ├── DB_SCHEMA.md
│   └── DEPLOYMENT.md
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # Lint, test, build tekshiruvi
│
├── docker-compose.yml             # Lokal development uchun (Postgres + backend + bot)
├── .gitignore
├── README.md
└── package.json                   # Monorepo root (npm/pnpm workspaces)
```

---

## 3. Ma'lumotlar bazasi sxemasi (yuqori darajada)

| Jadval | Asosiy maydonlar |
|---|---|
| `users` | id, telegram_id, full_name, role (director/chief_technician/technician/superadmin), branch_id (director/technician uchun), is_active |
| `branches` | id, name, address, is_active |
| `categories` | id, name (Elektr, Santexnika, Konditsioner, va h.k.) |
| `requests` | id, branch_id, created_by, category_id, description, priority (low/medium/high/critical), status, before_photo_url, after_photo_url, chief_technician_id, technician_id, created_at, closed_at |
| `request_status_history` | id, request_id, from_status, to_status, changed_by, changed_at |
| `audit_logs` | id, entity_type, entity_id, action, performed_by, metadata (jsonb), created_at |
| `notifications` | id, user_id, request_id, type, sent_at, is_read |

`request_status_history` va `audit_logs` — talab qilingan "har bir amal logga yozilishi" tamoyilini ta'minlaydi.

---

## 4. Status state-machine

```
New → In Progress → Completed By Technician → Approved By Chief Technician → Accepted By Director → Closed
```

Muhim qoida: **"Closed"** holatiga faqat tizim avtomatik o'tkazadi (Bosh texnik + Direktor tasdiqlaganda). Qo'lda yopish API darajasida taqiqlanadi — bu `requests.state-machine.ts` ichida bir joyda qattiq belgilanadi, shu bilan noto'g'ri o'tishlar oldini oladi.

---

## 5. Kengaytiriladiganlik (kelajakdagi modullar)

Modul papkasi tuzilishi tufayli quyidagilarni qo'shish faqat yangi `modules/<nom>/` papkasini yaratish va uni `app.ts`ga ulashni talab qiladi:

* `modules/warehouse/` — Ombor moduli
* `modules/expenses/` — Xarajatlar moduli
* `modules/inventory/` — Inventarizatsiya moduli
* `modules/maintenance-planning/` — Texnik xizmat rejalashtirish
* `modules/sla/` — SLA nazorat moduli

Har biri `requests` moduliga o'xshab routes/controller/service/repository qatlamlariga ega bo'ladi va umumiy `core/` infratuzilmasidan foydalanadi.

---

## 6. Deployment arxitekturasi

```
GitHub (monorepo)
   │
   ├── Railway: backend (Docker) ── PostgreSQL (Railway plugin)
   ├── Railway: bot (Docker, webhook)
   └── Vercel yoki Railway: frontend (static build)
```

* Backend va bot alohida Railway servislari sifatida deploy qilinadi (mustaqil scale qilish uchun)
* PostgreSQL — Railway ichida, `DATABASE_URL` orqali avtomatik ulanadi
* Frontend build — Vite `dist/` chiqishi, Vercel yoki Railway static hosting
* Barcha maxfiy ma'lumotlar — Environment Variables orqali (`.env.example` fayllari repo'da namuna sifatida)

---

## 7. Keyingi qadam

Ushbu rejaga asoslanib, quyidagi tartibda amalga oshirish tavsiya etiladi:

1. Monorepo skeleton + root konfiguratsiya (`package.json`, workspaces, `.gitignore`)
2. `packages/shared-types` — enumlar va DTOlar
3. Backend: `core/` infratuzilma + `requests` moduli (asosiy domen) to'liq
4. Auth moduli (Telegram Login)
5. Qolgan modullar (branches, users, categories, notifications, media, dashboard, audit-log)
6. Bot
7. Frontend (rol bo'yicha sahifalar)
8. Docker + Railway konfiguratsiyasi + CI

Qaysi qadamdan boshlashni xohlasangiz, ayting — men to'g'ridan-to'g'ri kod yozishni boshlayman.
