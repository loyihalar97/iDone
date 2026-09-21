import { Dictionary } from "./uz";

/**
 * Русские тексты интерфейса.
 *
 * Тип `Dictionary` берётся из `uz.ts`: если там появится новый ключ, здесь
 * без него не скомпилируется — так перевод не может остаться неполным.
 */
export const ru: Dictionary = {
  common: {
    loading: "Загрузка...",
    sending: "Отправка...",
    save: "Сохранить",
    cancel: "Отмена",
    add: "Добавить",
    edit: "Изменить",
    delete: "Удалить",
    deleteFull: "Удалить",
    active: "Активен",
    inactive: "Неактивен",
    makeActive: "Включить",
    makeInactive: "Выключить",
    ready: "Готово",
    error: "Произошла ошибка",
    retry: "Повторить",
    all: "Все",
    currency: "сум",
    optional: "необязательно",
    required: "обязательно",
    notSaved: "Не удалось сохранить",
    notDeleted: "Не удалось удалить",
    notAdded: "Не удалось добавить",
  },

  language: {
    chooseTitle: "Выберите язык",
    chooseSubtitle: "На этом языке будут приложение, уведомления и отчёты",
    switchTitle: "Язык",
    saving: "Сохранение...",
    changeError: "Не удалось сменить язык",
  },

  auth: {
    signingIn: "Вход...",
    signInError: "Ошибка входа",
    initDataMissing:
      "Данные Telegram initData не найдены. Убедитесь, что вы открыли приложение внутри Telegram.",
    genericError: "Произошла ошибка при входе в систему",
  },

  appTitle: "Тех. обслуживание",

  titles: {
    directorRequests: "Открытые заявки",
    directorClosed: "Завершённые заявки",
    stats: "Статистика",
    newRequest: "Новая заявка",
    chiefRequests: "Все заявки",
    chiefTechnicians: "Контроль техников",
    technicianOpen: "Открытые работы",
    technicianClosed: "Завершённые работы",
    managerRequests: "Открытые заявки",
    managerClosed: "История и отчёты",
    superadminRequests: "Все заявки",
    users: "Пользователи",
    branches: "Филиалы",
    categories: "Категории",
    requestDetails: "Детали заявки",
  },

  nav: {
    open: "Открытые",
    done: "Готовые",
    new: "Новая",
    stats: "Статистика",
    requests: "Заявки",
    technicians: "Техники",
    staff: "Сотрудники",
    branches: "Филиалы",
    categories: "Категории",
    history: "История",
  },

  request: {
    emptyOpenTitle: "Открытых заявок нет",
    emptyOpenSubtitleDirector:
      "Если появилась техническая проблема, создайте заявку кнопкой ниже",
    emptyOpenSubtitleManager: "Измените фильтры или создайте новую заявку",
    emptyClosedTitle: "Завершённых заявок нет",
    emptyClosedSubtitle: "Закрытые заявки появятся здесь",
    emptyNotFound: "Заявки не найдены",
    emptyChangeFilters: "Попробуйте изменить фильтры",
    hasComment: "Есть комментарий",
    newRequestButton: "Новая заявка",
    deleteConfirm: (branch: string) =>
      `Полностью удалить заявку "${branch}"? Это действие нельзя отменить.`,
  },

  time: {
    justNow: "только что",
    minutesAgo: (n: number) => `${n} мин. назад`,
    hoursAgo: (n: number) => `${n} ч. назад`,
    yesterday: "вчера",
    daysAgo: (n: number) => `${n} дн. назад`,
  },

  filters: {
    more: "Дополнительные фильтры",
    allStatuses: "Все статусы",
    allBranches: "Все филиалы",
    allPriorities: "Все уровни",
    allTechnicians: "Все техники",
    allCreators: "Все создатели",
    allRoles: "Все должности",
  },

  newRequest: {
    branch: "Филиал",
    branchNotFound: "Филиал не найден",
    category: "Категория проблемы",
    description: "Описание проблемы",
    descriptionPlaceholder: "Опишите проблему подробно...",
    priority: "Уровень важности",
    photo: "Фото проблемы (обязательно)",
    pickFile: "Выберите фото или видео",
    preview: "Предпросмотр",
    submit: "Отправить",
    photoRequired: "Фото проблемы обязательно",
    noBranchTitle: "Вам не назначен филиал",
    noBranchSubtitle:
      "Чтобы создавать заявки, суперадмин должен назначить вам филиал. Обратитесь к администратору.",
    noBranchesTitle: "Вам не назначены филиалы",
    noBranchesSubtitle:
      "Филиалы вашего региона должен назначить суперадмин. Обратитесь к администратору.",
  },

  detail: {
    problemPhoto: "Проблема",
    resultPhoto: "Фото результата",
    result: "Результат",
    createdBy: "Создал",
    openedAt: "Дата открытия",
    closedAt: "Дата закрытия",
    chiefTechnician: "Главный техник",
    technician: "Техник",
    expense: "Расходы",
    blockersTitle: "Причины невозможности выполнения",
    changePriority: "Изменить уровень важности",
    assignTechnician: "Назначить техника",
    changeTechnician: "Сменить техника",
    pickTechnician: "Выберите техника",
    self: " (я сам)",
    chiefSuffix: " (главный техник)",
    assign: "Назначить",
    change: "Сменить",
    commentTitle: "Эту работу выполнить невозможно (комментарий)",
    commentPlaceholder: "Напишите причину — она уйдёт директору филиала...",
    commentHint:
      "Техник не назначается, статус заявки не меняется. Комментарий отправится в чат бота директора филиала.",
    sendComment: "Отправить комментарий",
    startWork: "Начать работу",
    resultPhotoRequired: "Фото результата (обязательно)",
    resultPhotoMissing: "Фото результата обязательно",
    technicianExpense: "Потраченная сумма (необязательно)",
    expensePlaceholder: "Например: 150000",
    expenseAutoZero: "Если оставить пустым, расходы будут записаны как 0.",
    finishWork: "Завершить работу",
    chiefExpense: "Сумма расходов (необязательно — можно изменить)",
    chiefExpenseHint:
      "Показана сумма, введённая техником. Менять не обязательно — можно завершить как есть.",
    acceptAndClose: "Принять (заявка закроется)",
    invalidExpense: "Сумма расходов указана неверно",
  },

  export: {
    pdf: "Экспорт PDF",
    excel: "Экспорт Excel",
    success: (count: number, format: string) =>
      `✅ ${count} заявок экспортировано в файл ${format} и отправлено в ваш чат с ботом.`,
    failed: "Не удалось выполнить экспорт",
  },

  chief: {
    sortHint: "Перетаскивайте заявки за ручку — порядок работ сохраняется автоматически.",
    sortButton: "Изменить порядок работ",
    sortEmpty: "Нет открытых заявок для сортировки",
    sortHandle: "Перетащить для сортировки",
    sortFailed: "Не удалось сохранить порядок. Попробуйте ещё раз.",
  },

  technicians: {
    emptyTitle: "Техников нет",
    emptySubtitle: "Появятся здесь, когда суперадмин назначит роль техника",
    allBranches: "Все филиалы",
    new: "Новые",
    inProgress: "В процессе",
    completed: "Завершил",
    closed: "Закрытые",
    free: "Сейчас свободен — можно назначить новую работу",
    myEmptyTitle: "Вам не назначено открытых работ",
    myEmptySubtitle: "Появятся здесь, когда главный техник назначит работу",
    myClosedTitle: "Завершённых работ нет",
    myClosedSubtitle: "Здесь появятся работы, которые вы завершили",
  },

  dashboard: {
    loading: "Загрузка статистики...",
    openRequests: "Открытые заявки",
    inProgress: "В процессе",
    closedToday: "Закрыто сегодня",
    closedThisMonth: "Закрыто за месяц",
    hours: "ч.",
    avgResolution: "Среднее время выполнения",
    topBranches: "Филиалы с наибольшим числом проблем",
    busiestTechnicians: "Самые загруженные техники",
  },

  broadcast: {
    title: "Отправить сообщение всем",
    hint: "Сообщение будет отправлено одновременно в личный чат всех активных сотрудников, использующих бота.",
    placeholder: "Введите текст сообщения...",
    send: "Отправить",
    sending: "Отправка...",
    confirm: "Отправить сообщение всем активным пользователям? Это действие нельзя отменить.",
    result: (sent: number, failed: number) =>
      failed > 0
        ? `Отправлено: ${sent}. Не удалось: ${failed} (бот заблокирован или /start не нажат).`
        : `Сообщение успешно отправлено ${sent} пользователям.`,
    emptyText: "Сначала введите текст сообщения",
    noRecipients: "Нет активных пользователей для отправки",
  },

  branches: {
    addTitle: "Добавить филиал",
    namePlaceholder: "Название филиала",
    addressPlaceholder: "Адрес (необязательно)",
    swipeHint: "Проведите по карточке влево, чтобы изменить, включить/выключить или удалить.",
    editTitle: "Редактирование филиала",
    deleteConfirm: (name: string) => `Удалить филиал "${name}"?`,
  },

  categories: {
    addTitle: "Новая категория (тип работ)",
    nameUz: "Название (узбекский)",
    nameRu: "Название (русский)",
    nameUzPlaceholder: "Masalan: Chiroq almashtirish",
    nameRuPlaceholder: "Например: Замена лампы",
    hint:
      "Этот список выбирается при создании заявки. Укажите название на узбекском и русском — " +
      "пользователю покажется вариант на его языке. Проведите по карточке влево, чтобы изменить, " +
      "включить/выключить или удалить. Используемую категорию удалить нельзя — деактивируйте её.",
    editTitle: "Редактирование категории",
    missingRu: "Нет русского названия",
    deleteConfirm: (name: string) => `Удалить категорию "${name}"?`,
  },

  users: {
    emptyTitle: "Пользователей нет",
    emptySubtitle: "Здесь появятся пользователи, нажавшие /start в боте",
    hint:
      "Новый пользователь добавляется в список автоматически после /start в боте, но не сможет войти, " +
      "пока суперадмин не назначит роль и не активирует его. Проведите по карточке влево, чтобы изменить, " +
      "включить/выключить или удалить.",
    noName: "Имя не указано",
    noBranches: "Филиалы не назначены",
    allBranches: "Все филиалы",
    pickBranch: "Выберите филиал",
    multiBranchLabel: "Назначаемые филиалы (минимум один)",
    addBranchFirst: 'Сначала добавьте филиал в разделе "Филиалы".',
    selectedCount: (n: number) => `Выбрано филиалов: ${n}`,
    deleteConfirm: (name: string) =>
      `Полностью удалить сотрудника "${name}"?\n\n` +
      `Созданные им заявки перейдут администратору, назначенные работы освободятся. ` +
      `Это действие нельзя отменить.`,
  },
};
