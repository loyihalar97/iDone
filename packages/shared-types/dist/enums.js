"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = exports.STATUS_LABELS = exports.STATUS_LABELS_RU = exports.STATUS_LABELS_UZ = exports.PRIORITY_LABELS = exports.PRIORITY_LABELS_RU = exports.PRIORITY_LABELS_UZ = exports.CATEGORY_LABELS = exports.CATEGORY_LABELS_RU = exports.CATEGORY_LABELS_UZ = exports.Category = exports.Priority = exports.RequestStatus = exports.REQUEST_CREATOR_ROLES = exports.GLOBAL_SCOPE_ROLES = exports.ROLE_LABELS = exports.ROLE_LABELS_RU = exports.ROLE_LABELS_UZ = exports.Role = exports.LOCALE_BY_LANGUAGE = exports.LANGUAGE_SHORT_LABELS = exports.LANGUAGE_LABELS = exports.LANGUAGES = exports.Language = void 0;
exports.normalizeLanguage = normalizeLanguage;
exports.roleLabel = roleLabel;
exports.statusLabel = statusLabel;
exports.priorityLabel = priorityLabel;
exports.categoryLabel = categoryLabel;
/**
 * Tizim tillari / Языки системы.
 *
 * Foydalanuvchi tilni o'zi tanlaydi (Mini App sarlavhasidagi UZ/RU tugmasi
 * orqali). Tanlangan til `users.language` ustunida saqlanadi va butun
 * interfeys, Telegram bildirishnomalari hamda PDF/Excel hisobotlar
 * o'sha tilda chiqadi.
 */
var Language;
(function (Language) {
    Language["UZ"] = "uz";
    Language["RU"] = "ru";
})(Language || (exports.Language = Language = {}));
/** Tanlash mumkin bo'lgan tillar ro'yxati (tartibi bilan). */
exports.LANGUAGES = [Language.UZ, Language.RU];
/** Til tanlash tugmalarida ko'rsatiladigan nomlar (har doim o'z tilida). */
exports.LANGUAGE_LABELS = {
    [Language.UZ]: "O'zbekcha",
    [Language.RU]: "Русский",
};
exports.LANGUAGE_SHORT_LABELS = {
    [Language.UZ]: "UZ",
    [Language.RU]: "RU",
};
/** Noma'lum qiymatni xavfsiz `Language`ga aylantiradi (standart — o'zbekcha). */
function normalizeLanguage(value, fallback = Language.UZ) {
    if (typeof value !== "string")
        return fallback;
    const v = value.trim().toLowerCase();
    if (v === Language.RU || v.startsWith("ru"))
        return Language.RU;
    if (v === Language.UZ || v.startsWith("uz"))
        return Language.UZ;
    return fallback;
}
/** Sana/son formatlash uchun locale kodlari. */
exports.LOCALE_BY_LANGUAGE = {
    [Language.UZ]: "uz-UZ",
    [Language.RU]: "ru-RU",
};
var Role;
(function (Role) {
    Role["DIRECTOR"] = "director";
    Role["CHIEF_TECHNICIAN"] = "chief_technician";
    Role["TECHNICIAN"] = "technician";
    Role["SUPERADMIN"] = "superadmin";
    /** Hududiy rahbar — o'ziga biriktirilgan bir nechta filialni boshqaradi. */
    Role["REGIONAL_MANAGER"] = "regional_manager";
    /** Rahbar — butun kompaniyani (barcha filiallar + texniklar) kuzatadi. */
    Role["EXECUTIVE"] = "executive";
    /** Filial menejeri — faqat o'z filiali doirasida ishlaydi. */
    Role["BRANCH_MANAGER"] = "branch_manager";
})(Role || (exports.Role = Role = {}));
exports.ROLE_LABELS_UZ = {
    [Role.DIRECTOR]: "Filial direktori",
    [Role.CHIEF_TECHNICIAN]: "Bosh texnik",
    [Role.TECHNICIAN]: "Texnik",
    [Role.SUPERADMIN]: "Superadmin",
    [Role.REGIONAL_MANAGER]: "Hududiy rahbar",
    [Role.EXECUTIVE]: "Rahbar",
    [Role.BRANCH_MANAGER]: "Filial menejeri",
};
exports.ROLE_LABELS_RU = {
    [Role.DIRECTOR]: "Директор филиала",
    [Role.CHIEF_TECHNICIAN]: "Главный техник",
    [Role.TECHNICIAN]: "Техник",
    [Role.SUPERADMIN]: "Суперадмин",
    [Role.REGIONAL_MANAGER]: "Региональный руководитель",
    [Role.EXECUTIVE]: "Руководитель",
    [Role.BRANCH_MANAGER]: "Менеджер филиала",
};
exports.ROLE_LABELS = {
    [Language.UZ]: exports.ROLE_LABELS_UZ,
    [Language.RU]: exports.ROLE_LABELS_RU,
};
/** Barcha filiallarni cheklovsiz ko'radigan rollar. */
exports.GLOBAL_SCOPE_ROLES = [
    Role.SUPERADMIN,
    Role.CHIEF_TECHNICIAN,
    Role.EXECUTIVE,
];
/** Zayavka ocha oladigan rollar. */
exports.REQUEST_CREATOR_ROLES = [
    Role.DIRECTOR,
    Role.BRANCH_MANAGER,
    Role.REGIONAL_MANAGER,
    Role.EXECUTIVE,
    Role.SUPERADMIN,
];
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["NEW"] = "new";
    RequestStatus["IN_PROGRESS"] = "in_progress";
    RequestStatus["COMPLETED_BY_TECHNICIAN"] = "completed_by_technician";
    RequestStatus["APPROVED_BY_CHIEF_TECHNICIAN"] = "approved_by_chief_technician";
    RequestStatus["ACCEPTED_BY_DIRECTOR"] = "accepted_by_director";
    RequestStatus["CLOSED"] = "closed";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["MEDIUM"] = "medium";
    Priority["HIGH"] = "high";
    Priority["CRITICAL"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
var Category;
(function (Category) {
    Category["ELECTRICAL"] = "electrical";
    Category["PLUMBING"] = "plumbing";
    Category["AC"] = "ac";
    Category["KITCHEN_EQUIPMENT"] = "kitchen_equipment";
    Category["IT_EQUIPMENT"] = "it_equipment";
    Category["FURNITURE"] = "furniture";
    Category["OTHER"] = "other";
})(Category || (exports.Category = Category = {}));
exports.CATEGORY_LABELS_UZ = {
    [Category.ELECTRICAL]: "Elektr ishlari",
    [Category.PLUMBING]: "Santexnika",
    [Category.AC]: "Konditsioner",
    [Category.KITCHEN_EQUIPMENT]: "Oshxona uskunalari",
    [Category.IT_EQUIPMENT]: "IT uskunalari",
    [Category.FURNITURE]: "Mebel",
    [Category.OTHER]: "Boshqa",
};
exports.CATEGORY_LABELS_RU = {
    [Category.ELECTRICAL]: "Электрика",
    [Category.PLUMBING]: "Сантехника",
    [Category.AC]: "Кондиционер",
    [Category.KITCHEN_EQUIPMENT]: "Кухонное оборудование",
    [Category.IT_EQUIPMENT]: "IT-оборудование",
    [Category.FURNITURE]: "Мебель",
    [Category.OTHER]: "Другое",
};
exports.CATEGORY_LABELS = {
    [Language.UZ]: exports.CATEGORY_LABELS_UZ,
    [Language.RU]: exports.CATEGORY_LABELS_RU,
};
exports.PRIORITY_LABELS_UZ = {
    [Priority.LOW]: "Past",
    [Priority.MEDIUM]: "O'rta",
    [Priority.HIGH]: "Yuqori",
    [Priority.CRITICAL]: "Kritik",
};
exports.PRIORITY_LABELS_RU = {
    [Priority.LOW]: "Низкий",
    [Priority.MEDIUM]: "Средний",
    [Priority.HIGH]: "Высокий",
    [Priority.CRITICAL]: "Критический",
};
exports.PRIORITY_LABELS = {
    [Language.UZ]: exports.PRIORITY_LABELS_UZ,
    [Language.RU]: exports.PRIORITY_LABELS_RU,
};
exports.STATUS_LABELS_UZ = {
    [RequestStatus.NEW]: "Yangi",
    [RequestStatus.IN_PROGRESS]: "Jarayonda",
    [RequestStatus.COMPLETED_BY_TECHNICIAN]: "Texnik tugatdi",
    [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "Bosh texnik tasdiqladi",
    [RequestStatus.ACCEPTED_BY_DIRECTOR]: "Direktor tasdiqladi",
    [RequestStatus.CLOSED]: "Yopildi",
};
exports.STATUS_LABELS_RU = {
    [RequestStatus.NEW]: "Новая",
    [RequestStatus.IN_PROGRESS]: "В процессе",
    [RequestStatus.COMPLETED_BY_TECHNICIAN]: "Техник завершил",
    [RequestStatus.APPROVED_BY_CHIEF_TECHNICIAN]: "Главный техник подтвердил",
    [RequestStatus.ACCEPTED_BY_DIRECTOR]: "Директор подтвердил",
    [RequestStatus.CLOSED]: "Закрыта",
};
exports.STATUS_LABELS = {
    [Language.UZ]: exports.STATUS_LABELS_UZ,
    [Language.RU]: exports.STATUS_LABELS_RU,
};
/** Lavozim nomi tanlangan tilda (noma'lum qiymat o'zi qaytariladi). */
function roleLabel(role, lang) {
    return exports.ROLE_LABELS[lang][role] ?? String(role);
}
/** Holat nomi tanlangan tilda. */
function statusLabel(status, lang) {
    return exports.STATUS_LABELS[lang][status] ?? String(status);
}
/** Muhimlik darajasi nomi tanlangan tilda. */
function priorityLabel(priority, lang) {
    return exports.PRIORITY_LABELS[lang][priority] ?? String(priority);
}
/** Standart kategoriya nomi tanlangan tilda (DB'dagi kategoriyalar uchun emas). */
function categoryLabel(category, lang) {
    return exports.CATEGORY_LABELS[lang][category] ?? String(category);
}
var NotificationType;
(function (NotificationType) {
    NotificationType["REQUEST_CREATED"] = "request_created";
    NotificationType["TECHNICIAN_ASSIGNED"] = "technician_assigned";
    NotificationType["TECHNICIAN_STARTED"] = "technician_started";
    NotificationType["TECHNICIAN_COMPLETED"] = "technician_completed";
    NotificationType["CHIEF_APPROVED"] = "chief_approved";
    NotificationType["REQUEST_CLOSED"] = "request_closed";
    /** Bosh texnik zayavkaga izoh yozdi (masalan: bajarish imkonsiz sabablari). */
    NotificationType["REQUEST_COMMENT"] = "request_comment";
    /** Zayavkaning muhimlik darajasi o'zgartirildi. */
    NotificationType["PRIORITY_CHANGED"] = "priority_changed";
    /** Superadmin barcha faol foydalanuvchilarga yuborgan umumiy e'lon. */
    NotificationType["ANNOUNCEMENT"] = "announcement";
    /** Bosh texnik tasdiqlagandan keyin muddatida qabul qilinmagani sababli tizim avtomatik yopgan zayavka haqida xabar. */
    NotificationType["AUTO_CLOSED"] = "auto_closed";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
