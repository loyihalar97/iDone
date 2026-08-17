# API Hujjatlari

Base URL: `{BACKEND_URL}/api`

Autentifikatsiya: `Authorization: Bearer <JWT>` header orqali (login endpointidan tashqari barcha endpointlar uchun majburiy).

---

## Auth

### `POST /auth/telegram`
Telegram Mini App `initData`si orqali kirish. Foydalanuvchi bazada bo'lmasa, `isActive: false` holatida yaratiladi (superadmin faollashtirishi kerak).

**Body:** `{ "initData": "query_id=...&user=...&hash=..." }`
**Response:** `{ "token": "jwt...", "user": { id, fullName, role, branchId, branchName, managedBranches, isActive } }`
> `managedBranches` — Hududiy rahbarga biriktirilgan filiallar: `[{ id, name }]`.

### `GET /auth/me`
Joriy foydalanuvchi ma'lumotlari.

---

## Requests (zayavkalar)

### `POST /requests` — Direktor, Filial menejeri, Hududiy rahbar, Rahbar, Superadmin
```json
{
  "branchId": "uuid (Hududiy rahbar / Rahbar / Superadmin uchun; Direktor va Filial menejerida o'z filialidan olinadi)",
  "category": "electrical | plumbing | ac | kitchen_equipment | it_equipment | furniture | other",
  "description": "string",
  "priority": "low | medium | high | critical",
  "beforePhotoUrl": "https://..."
}
```
> Direktor/Filial menejeriga filial biriktirilmagan bo'lsa zayavka ochilmaydi (400 xato).
> Hududiy rahbar faqat o'ziga biriktirilgan filiallarga zayavka ocha oladi (aks holda 403).
> Bosh texnik OLDINDAN belgilanmaydi: zayavka barcha faol Bosh texniklarga ko'rinadi va
> kim birinchi bo'lib texnik biriktirsa, o'sha mas'ul Bosh texnik bo'lib qoladi.
> Bildirishnoma yaratuvchiga, barcha faol Bosh texniklarga va filial rahbarlariga boradi.

### `GET /requests`
Query: `branchId, status, priority, category, technicianId, chiefTechnicianId, createdById, createdByRole, dateFrom, dateTo, page, pageSize`

Rol asosida avtomatik filtrlanadi:

| Rol | Ko'rish doirasi |
|---|---|
| Direktor, Filial menejeri | o'z filiali |
| Hududiy rahbar | o'ziga biriktirilgan filiallar (`user_branches`) |
| Texnik | faqat o'ziga biriktirilgan ishlar |
| Bosh texnik, Rahbar, Superadmin | barcha filiallar |

`createdById` va `createdByRole` — Rahbar uchun "kim ochgani" va "qaysi lavozim ochgani"
kesimidagi tarix (hisobot) filtrlari.

### `GET /requests/:id`
### `GET /requests/:id/history` — status va audit tarixi

### `PATCH /requests/:id/assign` — Bosh texnik
```json
{ "technicianId": "uuid" }
```
> Zayavka yopilmaguncha texnikni istalgan paytda O'ZGARTIRISH mumkin.
> `technicianId` sifatida Bosh texnikning o'zi ham ko'rsatilishi mumkin (ishni o'ziga biriktirish).
> Mas'ul Bosh texnik belgilanmagan bo'lsa, biriktirayotgan Bosh texnik mas'ul bo'lib qoladi.

### `PATCH /requests/:id/priority` — Bosh texnik
```json
{ "priority": "low | medium | high | critical" }
```
Zayavkaning muhimlik darajasini o'zgartiradi. O'zgarish audit log'ga yoziladi; zayavka egasi,
biriktirilgan texnik va filial rahbarlariga bot orqali xabar boradi. Yopilgan zayavkada ishlamaydi.

### `POST /requests/:id/comments` — Bosh texnik
```json
{ "text": "Ehtiyot qism yo'q, ta'minotchidan kutilmoqda", "isBlocker": true }
```
Bajarish imkonsiz bo'lgan zayavkaga **texnik biriktirmasdan** sabab izohini yozadi.
Zayavka holati O'ZGARMAYDI (`new` bo'lib qolaveradi — keyinchalik texnik biriktirish mumkin).
Izoh filial direktori, filial menejeri va zayavka egasining **bot chatiga** xabar bo'lib boradi.

### `GET /requests/:id/comments`
Zayavka izohlari ro'yxati (zayavkani ko'rish huquqi bor barcha rollar uchun).

### `PATCH /requests/:id/status`
```json
{
  "status": "in_progress | completed_by_technician | approved_by_chief_technician | accepted_by_director",
  "afterPhotoUrl": "https://... (completed_by_technician uchun majburiy — Texnik yuklaydi)",
  "expenseAmount": 150000
}
```
> `closed` statusiga qo'lda o'tish taqiqlangan — u faqat `accepted_by_director`dan keyin avtomatik qo'yiladi.
> `expenseAmount` ni endi TEXNIK ham kiritadi (`completed_by_technician` bilan birga, ixtiyoriy).
> Texnik summani kiritmasa — avtomatik `0` yoziladi.
> Bosh texnik uchun (`approved_by_chief_technician`) summa MAJBURIY EMAS: yuborilmasa mavjud
> qiymat saqlanadi, yuborilsa tahrirlanadi.
> `accepted_by_director` ni Direktor, Filial menejeri, Hududiy rahbar va Rahbar bosishi mumkin
> (har biri o'z ko'rish doirasidagi filiallar bilan cheklangan) — direktori yo'q filialdagi
> zayavka yopilmay qolmasligi uchun.
> `expenseAmount` faqat `completed_by_technician` va `approved_by_chief_technician`
> o'tishlarida qabul qilinadi; boshqa o'tishlarda e'tiborga olinmaydi.
> Oqim: Texnik `in_progress` (Bosh texnikka xabar) → Texnik `completed_by_technician` (Bosh texnikka xabar)
> → Bosh texnik `approved_by_chief_technician` (Direktorga xabar) → Direktor `accepted_by_director` → avtomatik `closed`.

### `PATCH /requests/reorder` — Bosh texnik
```json
{ "orderedIds": ["uuid", "uuid", "..."] }
```
Zayavkalarning drag-and-drop tartibini saqlaydi (`sortOrder`). Ro'yxatlar `sortOrder ASC, createdAt DESC` bo'yicha qaytadi.

### `GET /requests/export?format=pdf|xlsx` — barcha rollar
Query: `format` (majburiy) + `GET /requests` filtrlari. Rol doirasidagi tarixni PDF yoki XLSX
faylga eksport qilib, so'rov yuborgan foydalanuvchining **Telegram bot chatiga hujjat** sifatida yuboradi.
**Response:** `{ "success": true, "count": 42 }`

### `DELETE /requests/:id` — Superadmin
Zayavkani (tarix yozuvini) butunlay o'chiradi. Status tarixi cascade orqali,
bildirishnomalar `SET NULL` orqali tozalanadi; rasm fayllari o'chiriladi.
**Response:** `{ "success": true }`

---

## Media

### `POST /media/upload`
`multipart/form-data`, field nomi: `file`. Ruxsat etilgan: jpg/png/webp/mp4/mov, maksimal 25MB.
**Response:** `{ "url": "https://..." }`

---

## Branches

- `GET /branches?activeOnly=true`
- `POST /branches` — Superadmin — `{ name, address? }`
- `PATCH /branches/:id` — Superadmin — `{ name?, address?, isActive? }`
- `DELETE /branches/:id` — Superadmin — filialga bog'liq xodim/zayavka bo'lsa xato qaytadi (faolsizlantiring)

## Users

- `GET /users?role=&branchId=&isActive=` — Superadmin, Bosh texnik, Rahbar
- `GET /users/technicians?branchId=` — Bosh texnik, Superadmin — filial texniklari + barcha filiallarga biriktirilgan (branchId=null) texniklar **+ Bosh texniklar** (ishni o'ziga biriktirish uchun)
- `GET /users/technicians/overview` — Bosh texnik, Superadmin, Rahbar — texniklar nazorati (har birining ish yuklamasi kesimi)
- `GET /users/chief-technicians` — Direktor, Superadmin
- `PATCH /users/:id/role` — Superadmin — `{ role, branchId?, branchIds?, isActive? }`
  - `role`: `director | branch_manager | regional_manager | executive | chief_technician | technician | superadmin`
  - Direktor va Filial menejeri uchun `branchId` majburiy
  - **Hududiy rahbar** uchun `branchIds` (kamida bitta filial) majburiy — `user_branches` jadvaliga yoziladi
  - Texnikda `branchId: null` = **barcha filiallar**
  - Bosh texniklar soni **cheklanmagan**
- `PATCH /users/:id/active` — Superadmin — `{ isActive }`
- `DELETE /users/:id` — Superadmin — yaratgan zayavkasi/audit tarixi bo'lsa xato qaytadi (faolsizlantiring)

## Categories (kategoriyalar — DB-backed, Superadmin boshqaradi)

- `GET /categories` — faol kategoriyalar `[{ value, label }]`
- `GET /categories/manage` — Superadmin — to'liq ro'yxat `[{ id, key, label, isActive, sortOrder }]`
- `POST /categories` — Superadmin — `{ label, key? }`
- `PATCH /categories/:id` — Superadmin — `{ label?, isActive?, sortOrder? }`
- `DELETE /categories/:id` — Superadmin — ishlatilayotgan bo'lsa xato qaytadi (faolsizlantiring)
- `GET /categories/priorities` — statik ma'lumotnoma
- `GET /categories/statuses` — statik ma'lumotnoma

## Dashboard

- `GET /dashboard/stats` — barcha rollar (doirasi rolga qarab cheklanadi: Direktor/Filial menejeri — o'z filiali, Hududiy rahbar — biriktirilgan filiallari, Texnik — o'z ishlari, Bosh texnik/Rahbar/Superadmin — hammasi)

## Reports (avtomatik hisobotlar)

Tizim **haftalik** (har dushanba `REPORT_WEEKLY_HOUR`, standart **07:00**) va
**oylik** (oyning oxirgi kuni `REPORT_MONTHLY_HOUR`, standart **16:00**) hisobotlarni
PDF fayl sifatida **Superadmin**, **Filial direktori** va **Hududiy rahbar**ning
Telegram bot chatiga avtomatik yuboradi. Vaqt mahalliy (UTC+5) hisoblanadi.

Har bir qabul qiluvchi o'zining ko'rish doirasidagi ma'lumotni oladi
(Superadmin — barcha filiallar, Hududiy rahbar — biriktirilgan filiallari,
Direktor — o'z filiali). Davrda zayavka bo'lmasa PDF o'rniga qisqa matnli
xabar yuboriladi.

Takroriy yuborilmasligi `audit_logs` orqali kafolatlanadi: har bir
(foydalanuvchi + davr) juftligi uchun bitta yozuv (`entityType: "report"`,
`entityId: "weekly-2026-08-10"`).

- `GET /reports/period?type=weekly|monthly` — Superadmin — joriy davr ma'lumoti
  (`key`, `label`, `start`, `end`, `triggerAt`). Sozlamani tekshirish uchun.
- `POST /reports/run?type=weekly|monthly&force=true` — Superadmin — hisobotni
  QO'LDA barcha qabul qiluvchilarga yuboradi.
  **Response:** `{ period, sent, empty, skipped, failed }`
- `POST /reports/run/me?type=weekly|monthly` — Superadmin, Direktor, Hududiy rahbar —
  hisobotni faqat **o'ziga** yuboradi (sinov uchun eng xavfsiz yo'l).

## Audit log

- `GET /audit-logs?skip=&take=` — Superadmin

## Notifications

- `GET /notifications?unread=true`
- `PATCH /notifications/:id/read`

---

## Xato formati

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Kiritilgan ma'lumotlar noto'g'ri",
    "details": { ... }
  }
}
```
