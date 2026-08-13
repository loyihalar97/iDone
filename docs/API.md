# API Hujjatlari

Base URL: `{BACKEND_URL}/api`

Autentifikatsiya: `Authorization: Bearer <JWT>` header orqali (login endpointidan tashqari barcha endpointlar uchun majburiy).

---

## Auth

### `POST /auth/telegram`
Telegram Mini App `initData`si orqali kirish. Foydalanuvchi bazada bo'lmasa, `isActive: false` holatida yaratiladi (superadmin faollashtirishi kerak).

**Body:** `{ "initData": "query_id=...&user=...&hash=..." }`
**Response:** `{ "token": "jwt...", "user": { id, fullName, role, branchId, isActive } }`

### `GET /auth/me`
Joriy foydalanuvchi ma'lumotlari.

---

## Requests (zayavkalar)

### `POST /requests` — Direktor
```json
{
  "branchId": "uuid (faqat Superadmin uchun; Direktorda o'z filialidan olinadi)",
  "category": "electrical | plumbing | ac | kitchen_equipment | it_equipment | furniture | other",
  "description": "string",
  "priority": "low | medium | high | critical",
  "beforePhotoUrl": "https://..."
}
```
> Direktorga filial biriktirilmagan bo'lsa zayavka ochilmaydi (400 xato).
> Bosh texnik AVTOMATIK belgilanadi (tizimdagi yagona faol Bosh texnik).

### `GET /requests`
Query: `branchId, status, priority, category, technicianId, dateFrom, dateTo, page, pageSize`
Rol asosida avtomatik filtrlanadi (Direktor faqat o'z filialini, Texnik faqat o'ziga biriktirilganlarni ko'radi).

### `GET /requests/:id`
### `GET /requests/:id/history` — status va audit tarixi

### `PATCH /requests/:id/assign` — Bosh texnik
```json
{ "technicianId": "uuid" }
```

### `PATCH /requests/:id/status`
```json
{
  "status": "in_progress | completed_by_technician | approved_by_chief_technician | accepted_by_director",
  "afterPhotoUrl": "https://... (completed_by_technician uchun majburiy — Texnik yuklaydi)",
  "expenseAmount": 150000
}
```
> `closed` statusiga qo'lda o'tish taqiqlangan — u faqat `accepted_by_director`dan keyin avtomatik qo'yiladi.
> `approved_by_chief_technician` (Bosh texnik "Ishni yakunlash") uchun `expenseAmount` MAJBURIY —
> harajat bo'lmagan bo'lsa `0` yuboriladi.
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

- `GET /users?role=&branchId=&isActive=` — Superadmin, Bosh texnik
- `GET /users/technicians?branchId=` — Bosh texnik, Superadmin — filial texniklari + barcha filiallarga biriktirilgan (branchId=null) texniklar
- `GET /users/technicians/overview` — Bosh texnik, Superadmin — texniklar nazorati (har birining ish yuklamasi kesimi)
- `GET /users/chief-technicians` — Direktor, Superadmin
- `PATCH /users/:id/role` — Superadmin — `{ role, branchId?, isActive? }` — Direktor uchun filial majburiy; Texnikda `branchId: null` = **barcha filiallar**; faol Bosh texnik faqat bitta bo'lishi mumkin
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

- `GET /dashboard/stats` — Superadmin, Bosh texnik

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
