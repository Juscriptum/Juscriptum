import { formatCurrencyAmount } from "../utils/currency";

/**
 * Ukrainian Localization Configuration
 * i18n setup for the Legal CRM SaaS application
 */

export type TranslationKey = string;

export interface Translations {
  [key: string]: string | Translations;
}

/**
 * Ukrainian translations
 */
export const uk: Translations = {
  // Common
  common: {
    loading: "Завантаження...",
    save: "Зберегти",
    cancel: "Скасувати",
    delete: "Видалити",
    edit: "Редагувати",
    create: "Створити",
    search: "Пошук",
    filter: "Фільтр",
    clear: "Очистити",
    confirm: "Підтвердити",
    back: "Назад",
    next: "Далі",
    previous: "Попередній",
    close: "Закрити",
    yes: "Так",
    no: "Ні",
    all: "Всі",
    none: "Немає",
    select: "Обрати",
    required: "Обов'язково",
    optional: "Необов'язково",
    success: "Успішно",
    error: "Помилка",
    warning: "Попередження",
    info: "Інформація",
  },

  // Navigation
  navigation: {
    dashboard: "Дашборд",
    cases: "Справи",
    clients: "Клієнти",
    documents: "Документи",
    calendar: "Календар",
    calculations: "Калькулятори",
    invoices: "Рахунки",
    team: "Команда",
    audit: "Аудит",
    billing: "Підписка",
    settings: "Налаштування",
    profile: "Профіль",
    logout: "Вийти",
  },

  // Authentication
  auth: {
    login: "Вхід",
    loginTitle: "Вхід до системи",
    register: "Зареєструватися",
    registerTitle: "Реєстрація",
    email: "Електронна пошта",
    password: "Пароль",
    confirmPassword: "Підтвердити пароль",
    rememberMe: "Запам'ятати мене",
    forgotPassword: "Забули пароль?",
    noAccount: "Немає акаунту?",
    hasAccount: "Вже є акаунт?",
    loginButton: "Увійти",
    registerButton: "Зареєструватися",
    loggingIn: "Вхід...",
    registering: "Реєстрація...",
    loginError: "Не вдалося увійти",
    registerError: "Не вдалося зареєструватися",
    invalidCredentials: "Невірний email або пароль",
    emailRequired: "Введіть електронну пошту",
    passwordRequired: "Введіть пароль",
    mfaCode: "Код двофакторної аутентифікації",
    mfaRequired: "Введіть код двофакторної аутентифікації",
  },

  // Subscription & Billing
  billing: {
    title: "Керування підпискою",
    subtitle: "Оберіть план, який найкраще підходить для вашої практики",
    currentPlan: "Поточний план",
    choosePlan: "Обрати план",
    upgradePlan: "Оновити план",
    cancelSubscription: "Скасувати підписку",
    resumeSubscription: "Відновити підписку",
    validUntil: "Дійсна до",
    paymentMethods: "Способи оплати",
    bankCard: "Банківська карта",
    accessDenied: "Доступ обмежено",
    accessDeniedMessage: "Тільки власник організації може керувати підпискою.",
    noPermission: "У вас немає прав для керування підпискою",
    cancelConfirm: "Ви впевнені, що хочете скасувати підписку?",
    sessionError: "Не вдалося створити сесію оплати",
    cancelError: "Не вдалося скасувати підписку",
    resumeError: "Не вдалося відновити підписку",
    loadError: "Не вдалося завантажити підписку",
    updateError: "Не вдалося оновити план",
  },

  // Plans
  plans: {
    basic: "Basic",
    professional: "Professional",
    enterprise: "Enterprise",
    free: "Безкоштовно",
    perMonth: "/місяць",
    currentPlan: "Поточний план",
    maxUsers: "Користувачів",
    unlimitedUsers: "Необмежена кількість користувачів",
    upToUsers: "До {{count}} користувачів",
    mfa: "Двофакторна аутентифікація",
    sso: "Єдиний вхід (SSO)",
    advancedAudit: "Розширений аудит",
    customDomain: "Власний домен",
    apiAccess: "API доступ",
    webhooks: "Webhooks",
    customReports: "Кастомні звіти",
    prioritySupport: "Пріоритетна підтримка",
    dataExport: "Експорт даних",
  },

  // Status
  status: {
    trialing: "Пробний період",
    active: "Активна",
    past_due: "Прострочена",
    canceled: "Скасована",
    unpaid: "Не оплачена",
    pending: "Очікує",
    suspended: "Призупинена",
    deleted: "Видалена",
  },

  // Roles
  roles: {
    super_admin: "Суперадмін",
    organization_owner: "Власник організації",
    organization_admin: "Адміністратор",
    lawyer: "Юрист",
    assistant: "Асистент",
    accountant: "Бухгалтер",
  },

  // Errors
  errors: {
    pageNotFound: "Сторінку не знайдено",
    serverError: "Помилка сервера",
    networkError: "Помилка мережі",
    unauthorized: "Неавторизований доступ",
    forbidden: "Доступ заборонено",
    validationError: "Помилка валідації",
    unknownError: "Невідома помилка",
    tryAgain: "Спробуйте ще раз",
    goToDashboard: "Перейти на дашборд",
  },

  // Dates
  dates: {
    today: "Сьогодні",
    yesterday: "Вчора",
    tomorrow: "Завтра",
    thisWeek: "Цього тижня",
    lastWeek: "Минулого тижня",
    thisMonth: "Цього місяця",
    lastMonth: "Минулого місяця",
    thisYear: "Цього року",
  },

  // Pagination
  pagination: {
    previous: "Попередня",
    next: "Наступна",
    page: "Сторінка",
    of: "з",
    itemsPerPage: "Елементів на сторінці",
    showing: "Показано",
    to: "до",
    from: "з",
    total: "всього",
  },

  // Filters
  filters: {
    all: "Всі",
    active: "Активні",
    archived: "Архівні",
    sortBy: "Сортувати за",
    filterBy: "Фільтрувати за",
    dateRange: "Період",
    status: "Статус",
    reset: "Скинути фільтри",
    apply: "Застосувати",
  },

  // Onboarding
  onboarding: {
    welcome: "Ласкаво просимо!",
    letsSetup: "Давайте налаштуємо ваш обліковий запис",
    step: "Крок",
    of: "з",
    complete: "Завершити",
    skip: "Пропустити",
    next: "Далі",
    back: "Назад",
    organizationInfo: "Інформація про організацію",
    personalInfo: "Особиста інформація",
    preferences: "Налаштування",
    completed: "Завершено!",
    startWorking: "Почати роботу",
  },

  // Dashboard
  dashboard: {
    title: "Дашборд",
    welcome: "Ласкаво просимо",
    overview: "Огляд",
    recentActivity: "Остання активність",
    quickActions: "Швидкі дії",
    statistics: "Статистика",
    noData: "Немає даних для відображення",
  },

  // Cases
  cases: {
    title: "Мої справи",
    newCase: "Додати справу",
    addCase: "Додати справу",
    caseDetails: "Деталі справи",
    caseNumber: "Номер справи",
    status: "Статус",
    client: "Клієнт",
    lawyer: "Юрист",
    created: "Створено",
    updated: "Оновлено",
    noCases: "Справ не знайдено",
    essence: "Суть справи",
    court: "Суд / Орган",
    stage: "Стадія",
    hearingDate: "Дата засідання",
    actions: "Дії",
    searchPlaceholder: "Пошук за номером справи, судом або стороною...",
    filters: {
      status: "Статус",
      client: "Клієнт",
      date: "Дата",
      allStatuses: "Усі статуси",
      allClients: "Усі клієнти",
      inProgress: "В роботі",
      suspended: "Призупинено",
      completed: "Завершено",
      archive: "Архів",
    },
    form: {
      generalInfo: "Основна інформація",
      courtInfo: "Судова інформація",
      parties: "Сторони у справі",
      datesFinances: "Дати та Фінанси",
      comments: "Коментарі",
      caseNumber: "Номер справи",
      caseType: "Категорія справи",
      client: "Клієнт",
      priority: "Пріоритет",
      essence: "Суть справи",
      description: "Опис справи",
      courtName: "Суд / Установа",
      courtAddress: "Адреса суду",
      judgeName: "Суддя",
      proceedingStage: "Стадія розгляду",
      plaintiff: "Позивач / Заявник",
      defendant: "Відповідач / Боржник",
      thirdParties: "Треті особи",
      filingDate: "Дата подачі",
      deadlineDate: "Кінцевий термін",
      claimAmount: "Сума позову",
      courtFee: "Судовий збір",
      internalNotes: "Внутрішні нотатки",
      save: "Зберегти",
      saveAndAddHearing: "Зберегти та додати засідання",
      cancel: "Скасувати",
    },
    types: {
      judicial_case: "Судова справа",
      criminal_proceeding: "Кримінальне провадження",
      enforcement_proceeding: "Виконавче провадження",
      contract_work: "Договірна робота",
      consultation_case: "Консультаційна справа",
      corporate_case: "Корпоративна справа",
      registration_case: "Реєстраційна справа",
      administrative_appeal: "Адміністративне оскарження",
      mediation_negotiation: "Медіація / переговори",
      compliance_audit: "Комплаєнс / аудит",
    },
    statuses: {
      draft: "Чернетка",
      active: "В роботі",
      on_hold: "Призупинено",
      closed: "Завершено",
      archived: "Архів",
    },
    priorities: {
      low: "Низький",
      medium: "Середній",
      high: "Високий",
      urgent: "Терміновий",
    },
    stages: {
      first_instance: "Перша інстанція",
      appeal: "Апеляція",
      cassation: "Касація",
      supreme_court: "Верховний Суд",
      execution: "Виконавче провадження",
      pre_trial: "Досудове розслідування",
      other: "Інше",
    },
  },

  // Clients
  clients: {
    title: "Клієнти",
    newClient: "Новий клієнт",
    clientDetails: "Деталі клієнта",
    name: "Ім'я",
    email: "Email",
    phone: "Телефон",
    address: "Адреса",
    noClients: "Клієнтів не знайдено",
  },

  // Documents
  documents: {
    title: "Документи",
    newDocument: "Новий документ",
    uploadDocument: "Завантажити документ",
    download: "Завантажити",
    preview: "Перегляд",
    name: "Назва",
    type: "Тип",
    size: "Розмір",
    uploaded: "Завантажено",
    noDocuments: "Документів не знайдено",
  },

  // Profile
  profile: {
    title: "Профіль",
    personalInfo: "Особиста інформація",
    security: "Безпека",
    preferences: "Налаштування",
    changePassword: "Змінити пароль",
    enableMFA: "Увімкнути двофакторну аутентифікацію",
    disableMFA: "Вимкнути двофакторну аутентифікацію",
    updateSuccess: "Профіль оновлено успішно",
    updateError: "Не вдалося оновити профіль",
  },

  // Feature flags / Upgrade prompts
  upgrade: {
    required: "Потрібне оновлення плану",
    featureNotAvailable: "Ця функція недоступна на вашому плані",
    upgradeTo: "Оновіть до плану {{plan}} щоб отримати доступ",
    learnMore: "Дізнатися більше",
    upgradeNow: "Оновити зараз",
    contactSupport: "Зв'язатися з підтримкою",
  },
};

/**
 * Default locale
 */
export const DEFAULT_LOCALE = "uk";

/**
 * Supported locales
 */
export const SUPPORTED_LOCALES = ["uk", "en"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Date format for Ukrainian locale
 */
export const DATE_FORMAT_UK = {
  short: "dd.MM.yyyy",
  medium: "dd MMM yyyy",
  long: "dd MMMM yyyy",
  full: "EEEE, dd MMMM yyyy 'р.'",
  time: "HH:mm",
  dateTime: "dd.MM.yyyy HH:mm",
};

/**
 * Number format for Ukrainian locale
 */
export const NUMBER_FORMAT_UK = {
  currency: "грн",
  locale: "uk-UA",
  decimalSeparator: ",",
  thousandSeparator: " ",
  decimalPlaces: 2,
};

/**
 * Format date for Ukrainian locale
 */
export function formatDateUk(
  date: Date | string,
  format: keyof typeof DATE_FORMAT_UK = "medium",
): string {
  const d = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "short":
      return d.toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    case "medium":
      return d.toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    case "long":
      return d.toLocaleDateString("uk-UA", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "full":
      return d.toLocaleDateString("uk-UA", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    case "time":
      return d.toLocaleTimeString("uk-UA", {
        hour: "2-digit",
        minute: "2-digit",
      });
    case "dateTime":
      return d.toLocaleString("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return d.toLocaleDateString("uk-UA");
  }
}

/**
 * Format number for Ukrainian locale
 */
export function formatNumberUk(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat("uk-UA", options).format(value);
}

/**
 * Format currency for Ukrainian locale
 */
export function formatCurrencyUk(
  value: number,
  currency: string = "UAH",
): string {
  return formatCurrencyAmount(value, currency);
}

/**
 * Get nested translation value
 */
export function getTranslation(
  key: string,
  translations: Translations = uk,
): string {
  const keys = key.split(".");
  let result: string | Translations = translations;

  for (const k of keys) {
    if (typeof result === "string") {
      return key; // Return key if we hit a string before reaching the end
    }
    result = (result as Translations)[k] || key;
  }

  return typeof result === "string" ? result : key;
}

/**
 * Interpolate translation with variables
 */
export function interpolate(
  translation: string,
  variables: Record<string, string | number>,
): string {
  return Object.entries(variables).reduce(
    (result, [key, value]) =>
      result.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
    translation,
  );
}

export default {
  uk,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  DATE_FORMAT_UK,
  NUMBER_FORMAT_UK,
  formatDateUk,
  formatNumberUk,
  formatCurrencyUk,
  getTranslation,
  interpolate,
};
