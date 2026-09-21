/**
 * Tizim tillari / Языки системы.
 *
 * Foydalanuvchi tilni o'zi tanlaydi (Mini App sarlavhasidagi UZ/RU tugmasi
 * orqali). Tanlangan til `users.language` ustunida saqlanadi va butun
 * interfeys, Telegram bildirishnomalari hamda PDF/Excel hisobotlar
 * o'sha tilda chiqadi.
 */
export declare enum Language {
    UZ = "uz",
    RU = "ru"
}
/** Tanlash mumkin bo'lgan tillar ro'yxati (tartibi bilan). */
export declare const LANGUAGES: Language[];
/** Til tanlash tugmalarida ko'rsatiladigan nomlar (har doim o'z tilida). */
export declare const LANGUAGE_LABELS: Record<Language, string>;
export declare const LANGUAGE_SHORT_LABELS: Record<Language, string>;
/** Noma'lum qiymatni xavfsiz `Language`ga aylantiradi (standart — o'zbekcha). */
export declare function normalizeLanguage(value: unknown, fallback?: Language): Language;
/** Sana/son formatlash uchun locale kodlari. */
export declare const LOCALE_BY_LANGUAGE: Record<Language, string>;
export declare enum Role {
    DIRECTOR = "director",
    CHIEF_TECHNICIAN = "chief_technician",
    TECHNICIAN = "technician",
    SUPERADMIN = "superadmin",
    /** Hududiy rahbar — o'ziga biriktirilgan bir nechta filialni boshqaradi. */
    REGIONAL_MANAGER = "regional_manager",
    /** Rahbar — butun kompaniyani (barcha filiallar + texniklar) kuzatadi. */
    EXECUTIVE = "executive",
    /** Filial menejeri — faqat o'z filiali doirasida ishlaydi. */
    BRANCH_MANAGER = "branch_manager"
}
export declare const ROLE_LABELS_UZ: Record<Role, string>;
export declare const ROLE_LABELS_RU: Record<Role, string>;
export declare const ROLE_LABELS: Record<Language, Record<Role, string>>;
/** Barcha filiallarni cheklovsiz ko'radigan rollar. */
export declare const GLOBAL_SCOPE_ROLES: Role[];
/** Zayavka ocha oladigan rollar. */
export declare const REQUEST_CREATOR_ROLES: Role[];
export declare enum RequestStatus {
    NEW = "new",
    IN_PROGRESS = "in_progress",
    COMPLETED_BY_TECHNICIAN = "completed_by_technician",
    APPROVED_BY_CHIEF_TECHNICIAN = "approved_by_chief_technician",
    ACCEPTED_BY_DIRECTOR = "accepted_by_director",
    CLOSED = "closed"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum Category {
    ELECTRICAL = "electrical",
    PLUMBING = "plumbing",
    AC = "ac",
    KITCHEN_EQUIPMENT = "kitchen_equipment",
    IT_EQUIPMENT = "it_equipment",
    FURNITURE = "furniture",
    OTHER = "other"
}
export declare const CATEGORY_LABELS_UZ: Record<Category, string>;
export declare const CATEGORY_LABELS_RU: Record<Category, string>;
export declare const CATEGORY_LABELS: Record<Language, Record<Category, string>>;
export declare const PRIORITY_LABELS_UZ: Record<Priority, string>;
export declare const PRIORITY_LABELS_RU: Record<Priority, string>;
export declare const PRIORITY_LABELS: Record<Language, Record<Priority, string>>;
export declare const STATUS_LABELS_UZ: Record<RequestStatus, string>;
export declare const STATUS_LABELS_RU: Record<RequestStatus, string>;
export declare const STATUS_LABELS: Record<Language, Record<RequestStatus, string>>;
/** Lavozim nomi tanlangan tilda (noma'lum qiymat o'zi qaytariladi). */
export declare function roleLabel(role: Role | string, lang: Language): string;
/** Holat nomi tanlangan tilda. */
export declare function statusLabel(status: RequestStatus | string, lang: Language): string;
/** Muhimlik darajasi nomi tanlangan tilda. */
export declare function priorityLabel(priority: Priority | string, lang: Language): string;
/** Standart kategoriya nomi tanlangan tilda (DB'dagi kategoriyalar uchun emas). */
export declare function categoryLabel(category: Category | string, lang: Language): string;
export declare enum NotificationType {
    REQUEST_CREATED = "request_created",
    TECHNICIAN_ASSIGNED = "technician_assigned",
    TECHNICIAN_STARTED = "technician_started",
    TECHNICIAN_COMPLETED = "technician_completed",
    CHIEF_APPROVED = "chief_approved",
    REQUEST_CLOSED = "request_closed",
    /** Bosh texnik zayavkaga izoh yozdi (masalan: bajarish imkonsiz sabablari). */
    REQUEST_COMMENT = "request_comment",
    /** Zayavkaning muhimlik darajasi o'zgartirildi. */
    PRIORITY_CHANGED = "priority_changed",
    /** Superadmin barcha faol foydalanuvchilarga yuborgan umumiy e'lon. */
    ANNOUNCEMENT = "announcement"
}
