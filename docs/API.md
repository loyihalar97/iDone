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
  "branchId": "uuid",
  "chiefTechnicianId": "uuid (ixtiyoriy)",
  "category": "electrical | plumbing | ac | kitchen_equipment | it_equipment | furniture | other",
  "description": "string",
  "priority": "low | medium | high | critical",
  "beforePhotoUrl": "https://..."
}
```

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
  "afterPhotoUrl": "https://... (completed_by_technician uchun majburiy)"
}
```
> `closed` statusiga qo'lda o'tish taqiqlangan — u faqat `accepted_by_director`dan keyin avtomatik qo'yiladi.

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
- `GET /users/technicians?branchId=` — Bosh texnik, Superadmin
- `GET /users/chief-technicians` — Direktor, Superadmin
- `PATCH /users/:id/role` — Superadmin — `{ role, branchId?, isActive? }`
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
