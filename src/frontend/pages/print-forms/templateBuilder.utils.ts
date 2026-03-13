export type VariableValueKind = "text" | "date" | "number" | "currency";
export type VariableInflectionKind = "none" | "person" | "generic";
export type TemplatePageOrientation = "portrait" | "landscape";
export type TemplateMarginPreset = "standard" | "narrow" | "wide";
export type TemplateFontFamily = "times" | "golos" | "arial";

export interface TemplateDocumentSettings {
  orientation: TemplatePageOrientation;
  marginPreset: TemplateMarginPreset;
  fontFamily: TemplateFontFamily;
  fontSizePt: number;
  lineHeight: number;
}

export interface TemplateVariableDefinition {
  id: string;
  label: string;
  group: string;
  description: string;
  token: string;
  example: string;
  kind: VariableValueKind;
  inflection: VariableInflectionKind;
  defaultCaseMode?: "default" | "genitive";
  renderMode?: "inline" | "table";
}

export interface TemplateVariableGroup {
  id: string;
  label: string;
  description: string;
  variables: TemplateVariableDefinition[];
}

const formatDateExample = (date: Date) =>
  new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

const formatDateTimeExample = (date: Date) =>
  new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const SAMPLE_BIRTH_DATE = new Date("1990-01-15T12:00:00.000Z");
const SAMPLE_CLIENT_CREATED_AT = new Date("2025-09-03T12:00:00.000Z");
const SAMPLE_CASE_CREATED_AT = new Date("2026-02-17T12:00:00.000Z");

export const DEFAULT_TEMPLATE_DOCUMENT_SETTINGS: TemplateDocumentSettings = {
  orientation: "portrait",
  marginPreset: "standard",
  fontFamily: "times",
  fontSizePt: 14,
  lineHeight: 1.5,
};

const DOCUMENT_MARGIN_PRESETS: Record<
  TemplateMarginPreset,
  { top: string; right: string; bottom: string; left: string }
> = {
  standard: { top: "18mm", right: "16mm", bottom: "18mm", left: "16mm" },
  narrow: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
  wide: { top: "24mm", right: "22mm", bottom: "24mm", left: "22mm" },
};

const DOCUMENT_FONT_STACKS: Record<TemplateFontFamily, string> = {
  times: '"Times New Roman", Georgia, serif',
  golos: '"Golos Text", Arial, sans-serif',
  arial: "Arial, Helvetica, sans-serif",
};

export const normalizeTemplateDocumentSettings = (
  settings?: Partial<TemplateDocumentSettings>,
): TemplateDocumentSettings => ({
  orientation: settings?.orientation === "landscape" ? "landscape" : "portrait",
  marginPreset:
    settings?.marginPreset === "narrow" || settings?.marginPreset === "wide"
      ? settings.marginPreset
      : "standard",
  fontFamily:
    settings?.fontFamily === "golos" || settings?.fontFamily === "arial"
      ? settings.fontFamily
      : "times",
  fontSizePt:
    typeof settings?.fontSizePt === "number" &&
    settings.fontSizePt >= 10 &&
    settings.fontSizePt <= 18
      ? settings.fontSizePt
      : DEFAULT_TEMPLATE_DOCUMENT_SETTINGS.fontSizePt,
  lineHeight:
    typeof settings?.lineHeight === "number" &&
    settings.lineHeight >= 1.15 &&
    settings.lineHeight <= 2
      ? settings.lineHeight
      : DEFAULT_TEMPLATE_DOCUMENT_SETTINGS.lineHeight,
});

const getDocumentPageMetrics = (settings: TemplateDocumentSettings) => {
  const normalized = normalizeTemplateDocumentSettings(settings);
  const margins = DOCUMENT_MARGIN_PRESETS[normalized.marginPreset];

  return {
    pageWidth: normalized.orientation === "landscape" ? "297mm" : "210mm",
    pageHeight: normalized.orientation === "landscape" ? "210mm" : "297mm",
    pageSizeRule: `A4 ${normalized.orientation}`,
    marginShorthand: `${margins.top} ${margins.right} ${margins.bottom} ${margins.left}`,
    fontFamily: DOCUMENT_FONT_STACKS[normalized.fontFamily],
  };
};

export const buildEditorContentStyle = (settings: TemplateDocumentSettings) => {
  const normalized = normalizeTemplateDocumentSettings(settings);
  const pageMetrics = getDocumentPageMetrics(normalized);

  return `
    body {
      max-width: ${pageMetrics.pageWidth};
      min-height: ${pageMetrics.pageHeight};
      margin: 16px auto;
      padding: ${pageMetrics.marginShorthand};
      background: #ffffff;
      color: #111827;
      font-family: ${pageMetrics.fontFamily};
      font-size: ${normalized.fontSizePt}pt;
      line-height: ${normalized.lineHeight};
      box-shadow: 0 0 0 1px rgba(36, 50, 74, 0.1);
    }
    p { margin: 0 0 0.9rem; }
    h1, h2, h3 { margin: 0 0 1rem; }
    ul, ol { margin: 0 0 1rem 1.5rem; }
    blockquote {
      margin: 0 0 1rem;
      padding-left: 1rem;
      border-left: 3px solid rgba(44, 95, 178, 0.22);
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td, th {
      border: 1px solid #d6deea;
      padding: 0.45rem 0.6rem;
      vertical-align: top;
    }
    .template-token {
      display: inline-block;
      padding: 0.08rem 0.3rem;
      border: 1px solid rgba(44, 95, 178, 0.18);
      border-radius: 0.35rem;
      background: rgba(61, 118, 209, 0.06);
      color: #2c5fb2;
      font-family: "SFMono-Regular", "JetBrains Mono", monospace;
      font-size: 10pt;
      white-space: nowrap;
    }
    .template-token-table {
      margin: 0 0 1rem;
      border: 1px solid rgba(44, 95, 178, 0.16);
      border-radius: 0.45rem;
      overflow: hidden;
      background: rgba(61, 118, 209, 0.03);
    }
    .template-token-table-caption {
      padding: 0.45rem 0.65rem;
      border-bottom: 1px solid rgba(44, 95, 178, 0.14);
      background: rgba(61, 118, 209, 0.07);
      color: #2c5fb2;
      font-family: "SFMono-Regular", "JetBrains Mono", monospace;
      font-size: 10pt;
      font-weight: 600;
    }
    .template-token-table table {
      margin: 0;
      background: #ffffff;
      table-layout: fixed;
    }
    .template-token-table-placeholder {
      padding: 0.8rem 0.9rem;
      color: #5b677a;
      font-style: italic;
      text-align: center;
    }
    .template-token-table th,
    .template-token-table td {
      white-space: normal;
      word-break: normal;
      overflow-wrap: break-word;
      hyphens: auto;
    }
    .template-token-table th:nth-child(1),
    .template-token-table td:nth-child(1) {
      width: 7%;
      text-align: center;
    }
    .template-token-table th:nth-child(2),
    .template-token-table td:nth-child(2) {
      width: 51%;
      text-align: left;
    }
    .template-token-table th:nth-child(3),
    .template-token-table td:nth-child(3) {
      width: 13%;
      text-align: center;
    }
    .template-token-table th:nth-child(4),
    .template-token-table td:nth-child(4) {
      width: 14%;
      text-align: center;
    }
    .template-token-table th:nth-child(5),
    .template-token-table td:nth-child(5) {
      width: 15%;
      text-align: center;
    }
  `;
};

const createVariable = (
  group: string,
  id: string,
  label: string,
  description: string,
  example: string,
  kind: VariableValueKind,
  inflection: VariableInflectionKind,
  options?: {
    token?: string;
    defaultCaseMode?: "default" | "genitive";
    renderMode?: "inline" | "table";
  },
): TemplateVariableDefinition => ({
  id,
  label,
  group,
  description,
  token: options?.token || id,
  example,
  kind,
  inflection,
  defaultCaseMode: options?.defaultCaseMode || "default",
  renderMode: options?.renderMode || "inline",
});

export const buildVariableGroups = (
  now: Date = new Date(),
): TemplateVariableGroup[] => {
  const userVariables: TemplateVariableDefinition[] = [
    createVariable(
      "Користувач",
      "user.fullName",
      "ПІБ користувача",
      "Зібране ПІБ з полів профілю",
      "Іваненко Іван Іванович",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.firstName",
      "Ім'я",
      "Ім'я користувача",
      "Іван",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.lastName",
      "Прізвище",
      "Прізвище користувача",
      "Іваненко",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.patronymic",
      "По батькові",
      "По батькові користувача",
      "Іванович",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.position",
      "Посада",
      "Статус або посада з профілю",
      "Адвокат",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.positionGenitive",
      "Посада в родовому відмінку",
      "Посада користувача з автоматичним переведенням у родовий відмінок",
      "Адвоката",
      "text",
      "generic",
      {
        token: "user.position",
        defaultCaseMode: "genitive",
      },
    ),
    createVariable(
      "Користувач",
      "user.legalStatus",
      "Статус діяльності",
      "Юрист / адвокат / адвокат + БПД",
      "Адвокат",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.organizationType",
      "Тип організації",
      "Самозайнята особа, ФОП або юрособа",
      "ФОП",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.emailLogin",
      "Логін / email входу",
      "Email, який використовується для входу в систему",
      "lawyer@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.emailPrimary",
      "Основний email",
      "Основна електронна пошта з профілю",
      "lawyer@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.emailSecondary",
      "Додаткові email",
      "Усі додаткові email з профілю",
      "office@example.ua, billing@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.phonePrimary",
      "Основний телефон",
      "Основний номер телефону з профілю",
      "+380 67 123 45 67",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.phoneSecondary",
      "Додаткові телефони",
      "Усі додаткові телефони з профілю",
      "+380 67 000 00 01, +380 67 000 00 02",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.city",
      "Місто",
      "Окреме місто користувача з адреси профілю",
      "Київ",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.taxId",
      "РНОКПП",
      "Податковий номер користувача",
      "1234567890",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.legalForm",
      "Організаційно-правова форма",
      "Форма юридичної особи користувача",
      "ТОВ",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalEntityName",
      "Назва юридичної особи",
      "Власна назва юридичної особи з профілю",
      "Право на захист",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalEntityDisplayName",
      "Повна назва юридичної особи",
      "Організаційно-правова форма разом із власною назвою",
      "ТОВ Право на захист",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.edrpou",
      "ЄДРПОУ",
      "Код ЄДРПОУ юридичної особи користувача",
      "12345678",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.bankName",
      "Банк",
      "Назва банку з профілю",
      "ПриватБанк",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.bankMfo",
      "МФО",
      "Банківський МФО користувача",
      "305299",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.iban",
      "IBAN",
      "Банківський рахунок користувача",
      "UA123456789012345678901234567",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.taxSystem",
      "Форма оподаткування",
      "Податкова система з профілю",
      "Загальна система",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.vatPayer",
      "Платник ПДВ",
      "Ознака платника ПДВ",
      "Так",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress",
      "Юридична адреса",
      "Повна юридична адреса з профілю",
      "м. Київ, вул. Хрещатик, 1, оф. 5",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.region",
      "Юридична адреса: область",
      "Область юридичної адреси",
      "Київська область",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.city",
      "Юридична адреса: місто",
      "Місто юридичної адреси",
      "Київ",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.cityCode",
      "Юридична адреса: індекс",
      "Поштовий індекс юридичної адреси",
      "01001",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.street",
      "Юридична адреса: вулиця",
      "Вулиця юридичної адреси",
      "Хрещатик",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.building",
      "Юридична адреса: будинок",
      "Будинок юридичної адреси",
      "1",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.apartment",
      "Юридична адреса: офіс / квартира",
      "Квартира або офіс юридичної адреси",
      "5",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.legalAddress.unit",
      "Юридична адреса: приміщення",
      "Квартира, офіс або приміщення юридичної адреси",
      "5",
      "text",
      "none",
      {
        token: "user.legalAddress.apartment",
      },
    ),
    createVariable(
      "Користувач",
      "user.actualSameAsLegal",
      "Фактична адреса збігається з юридичною",
      "Ознака, що фактична адреса збігається з юридичною",
      "Так",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress",
      "Фактична адреса",
      "Повна фактична адреса з профілю",
      "м. Київ, вул. Січових Стрільців, 15, кв. 8",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.region",
      "Фактична адреса: область",
      "Область фактичної адреси",
      "Київська область",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.city",
      "Фактична адреса: місто",
      "Місто фактичної адреси",
      "Київ",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.cityCode",
      "Фактична адреса: індекс",
      "Поштовий індекс фактичної адреси",
      "04053",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.street",
      "Фактична адреса: вулиця",
      "Вулиця фактичної адреси",
      "Січових Стрільців",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.building",
      "Фактична адреса: будинок",
      "Будинок фактичної адреси",
      "15",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.apartment",
      "Фактична адреса: офіс / квартира",
      "Квартира або офіс фактичної адреси",
      "8",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.actualAddress.unit",
      "Фактична адреса: приміщення",
      "Квартира, офіс або приміщення фактичної адреси",
      "8",
      "text",
      "none",
      {
        token: "user.actualAddress.apartment",
      },
    ),
    createVariable(
      "Користувач",
      "user.additionalAddresses",
      "Додаткові адреси",
      "Усі додаткові адреси користувача одним списком",
      "м. Київ, вул. Саксаганського, 12; м. Львів, вул. Шевченка, 8",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.director.sameAsUser",
      "Керівник = користувач",
      "Чи збігаються дані керівника з даними користувача",
      "Так",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.director.fullName",
      "ПІБ керівника",
      "ПІБ керівника з профілю",
      "Іваненко Іван Іванович",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.director.fullNameGenitive",
      "ПІБ керівника в родовому відмінку",
      "ПІБ керівника з автоматичним переведенням у родовий відмінок",
      "Іваненка Івана Івановича",
      "text",
      "person",
      {
        token: "user.director.fullName",
        defaultCaseMode: "genitive",
      },
    ),
    createVariable(
      "Користувач",
      "user.director.firstName",
      "Ім'я керівника",
      "Ім'я керівника",
      "Іван",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.director.lastName",
      "Прізвище керівника",
      "Прізвище керівника",
      "Іваненко",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.director.middleName",
      "По батькові керівника",
      "По батькові керівника",
      "Іванович",
      "text",
      "person",
    ),
    createVariable(
      "Користувач",
      "user.director.position",
      "Посада керівника",
      "Посада керівника з профілю",
      "Директор",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.director.positionGenitive",
      "Посада керівника в родовому відмінку",
      "Посада керівника з автоматичним переведенням у родовий відмінок",
      "Директора",
      "text",
      "generic",
      {
        token: "user.director.position",
        defaultCaseMode: "genitive",
      },
    ),
    createVariable(
      "Користувач",
      "user.director.actingBasis",
      "Підстава дії керівника",
      "На підставі чого діє керівник",
      "Статут",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.certificateNumber",
      "Номер свідоцтва",
      "Номер свідоцтва або посвідчення",
      "№ 5821",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.certificateDate",
      "Дата видачі",
      "Дата видачі свідоцтва або посвідчення",
      "20 травня 2018",
      "date",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.issuedBy",
      "Ким видано",
      "Орган, що видав документ",
      "Рада адвокатів міста Києва",
      "text",
      "generic",
    ),
    createVariable(
      "Користувач",
      "user.registryNumber",
      "Номер запису ЄДР",
      "Реєстровий номер з профілю",
      "RAU-000123",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.registryDate",
      "Дата запису ЄДР",
      "Дата внесення до реєстру",
      "11 березня 2019",
      "date",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.contractNumber",
      "Номер контракту",
      "Номер контракту з профілю",
      "ДГ-15/24",
      "text",
      "none",
    ),
    createVariable(
      "Користувач",
      "user.contractWith",
      "З ким контракт",
      "Контрагент за контрактом",
      "АО Право і Порядок",
      "text",
      "generic",
    ),
  ];

  const clientVariables: TemplateVariableDefinition[] = [
    createVariable(
      "Клієнт",
      "client.number",
      "Номер клієнта",
      "Внутрішній номер клієнта",
      "CL-2026-0018",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.type",
      "Тип клієнта",
      "ФО, ФОП або юридична особа",
      "Фізична особа",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.registrationDate",
      "Дата додавання",
      "Дата додавання клієнта з форми",
      formatDateExample(SAMPLE_CLIENT_CREATED_AT),
      "date",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.displayName",
      "Клієнт",
      "ПІБ або назва клієнта",
      "Петренко Петро Петрович",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.firstName",
      "Ім'я",
      "Ім'я клієнта",
      "Петро",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.lastName",
      "Прізвище",
      "Прізвище клієнта",
      "Петренко",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.patronymic",
      "По батькові",
      "По батькові клієнта",
      "Петрович",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.birthDate",
      "Дата народження",
      "Дата народження клієнта",
      formatDateExample(SAMPLE_BIRTH_DATE),
      "date",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.companyName",
      "Назва компанії",
      "Назва юрособи або ФОП",
      "ТОВ Юрклієнт",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.companyForm",
      "Орг.-правова форма",
      "Організаційно-правова форма юрособи",
      "ТОВ",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.edrpou",
      "ЄДРПОУ",
      "Код ЄДРПОУ",
      "12345678",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.inn",
      "ІПН / РНОКПП",
      "Податковий номер клієнта",
      "1234567890",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.passportNumber",
      "Паспорт",
      "Серія та номер паспорта клієнта",
      "АА 123456",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.phone",
      "Телефон",
      "Основний телефон клієнта",
      "+380 50 123 45 67",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.additionalPhones",
      "Додаткові телефони",
      "Усі додаткові телефони клієнта",
      "+380 67 000 00 01, +380 67 000 00 02",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.email",
      "Email",
      "Основний email клієнта",
      "client@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.additionalEmails",
      "Додаткові email",
      "Усі додаткові email клієнта",
      "office@example.ua, billing@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.whatsapp",
      "WhatsApp",
      "WhatsApp клієнта",
      "+380 50 123 45 67",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.viber",
      "Viber",
      "Viber клієнта",
      "+380 50 123 45 67",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.skype",
      "Skype",
      "Skype клієнта",
      "live:client.legal",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.telegram",
      "Telegram",
      "Telegram клієнта",
      "@client_legal",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.registrationAddress",
      "Адреса реєстрації / юридична адреса",
      "Повна адреса реєстрації або юридична адреса",
      "м. Київ, вул. Хрещатик, 1, кв. 10",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.registrationRegion",
      "Область реєстрації",
      "Область адреси реєстрації або юридичної адреси",
      "Київська область",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.registrationCity",
      "Місто реєстрації",
      "Місто адреси реєстрації або юридичної адреси",
      "Київ",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.registrationPostalCode",
      "Індекс реєстрації",
      "Поштовий індекс адреси реєстрації або юридичної адреси",
      "01001",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.actualSameAsRegistration",
      "Фактична адреса збігається з адресою реєстрації",
      "Ознака, що фактична адреса збігається з адресою реєстрації",
      "Так",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.actualAddress",
      "Фактична адреса",
      "Повна фактична адреса клієнта",
      "м. Львів, вул. Шевченка, 5",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.actualRegion",
      "Фактична область",
      "Область фактичної адреси",
      "Львівська область",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.actualCity",
      "Фактичне місто",
      "Місто фактичної адреси",
      "Львів",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.actualPostalCode",
      "Фактичний індекс",
      "Поштовий індекс фактичної адреси",
      "79000",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.taxationForm",
      "Форма оподаткування",
      "Форма оподаткування ФОП або юрособи",
      "Спрощена система",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.taxationBasis",
      "Підстава діяльності",
      "Підстава діяльності ФОП або підписанта",
      "Виписка з ЄДР",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.fullName",
      "Контактна особа",
      "ПІБ контактної особи юрособи",
      "Савченко Марина Олегівна",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.firstName",
      "Ім'я контактної особи",
      "Ім'я контактної особи",
      "Марина",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.lastName",
      "Прізвище контактної особи",
      "Прізвище контактної особи",
      "Савченко",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.middleName",
      "По батькові контактної особи",
      "По батькові контактної особи",
      "Олегівна",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.position",
      "Посада контактної особи",
      "Посада контактної особи",
      "Юрисконсульт",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.phone",
      "Телефон контактної особи",
      "Основний номер контактної особи",
      "+380 67 555 44 33",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.additionalPhones",
      "Додаткові телефони контактної особи",
      "Усі додаткові телефони контактної особи",
      "+380 67 555 44 34, +380 67 555 44 35",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.email",
      "Email контактної особи",
      "Основний email контактної особи",
      "contact@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.additionalEmails",
      "Додаткові email контактної особи",
      "Усі додаткові email контактної особи",
      "assistant@example.ua, legal@example.ua",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.whatsapp",
      "WhatsApp контактної особи",
      "WhatsApp контактної особи",
      "+380 67 555 44 33",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.viber",
      "Viber контактної особи",
      "Viber контактної особи",
      "+380 67 555 44 33",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.skype",
      "Skype контактної особи",
      "Skype контактної особи",
      "live:contact.person",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.contactPerson.telegram",
      "Telegram контактної особи",
      "Telegram контактної особи",
      "@contact_person",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.director.fullName",
      "ПІБ керівника",
      "ПІБ керівника або підписанта",
      "Іваненко Ігор Петрович",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.director.fullNameGenitive",
      "ПІБ керівника в родовому відмінку",
      "ПІБ керівника з автоматичним переведенням у родовий відмінок",
      "Іваненка Ігоря Петровича",
      "text",
      "person",
      {
        token: "client.director.fullName",
        defaultCaseMode: "genitive",
      },
    ),
    createVariable(
      "Клієнт",
      "client.director.firstName",
      "Ім'я керівника",
      "Ім'я керівника або підписанта",
      "Ігор",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.director.lastName",
      "Прізвище керівника",
      "Прізвище керівника або підписанта",
      "Іваненко",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.director.middleName",
      "По батькові керівника",
      "По батькові керівника або підписанта",
      "Петрович",
      "text",
      "person",
    ),
    createVariable(
      "Клієнт",
      "client.director.position",
      "Посада керівника",
      "Посада керівника або підписанта",
      "Директор",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.director.positionGenitive",
      "Посада керівника в родовому відмінку",
      "Посада керівника з автоматичним переведенням у родовий відмінок",
      "Директора",
      "text",
      "generic",
      {
        token: "client.director.position",
        defaultCaseMode: "genitive",
      },
    ),
    createVariable(
      "Клієнт",
      "client.director.actingBasis",
      "Підстава підпису",
      "На підставі чого діє керівник або підписант",
      "Статут",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.bankName",
      "Банк",
      "Назва банку клієнта",
      "ПриватБанк",
      "text",
      "generic",
    ),
    createVariable(
      "Клієнт",
      "client.bankMfo",
      "МФО",
      "Банківський МФО клієнта",
      "305299",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.bankIban",
      "IBAN",
      "Банківський рахунок клієнта",
      "UA123456789012345678901234567",
      "text",
      "none",
    ),
    createVariable(
      "Клієнт",
      "client.comment",
      "Коментар",
      "Коментар до клієнта",
      "Працює через контактну особу, договір підписує директор.",
      "text",
      "generic",
    ),
  ];

  const caseVariables: TemplateVariableDefinition[] = [
    createVariable(
      "Справа",
      "case.startDate",
      "Дата додавання справи",
      "Дата, вказана у формі створення або редагування справи",
      formatDateExample(SAMPLE_CASE_CREATED_AT),
      "date",
      "none",
    ),
    createVariable(
      "Справа",
      "case.title",
      "Суть справи",
      "Коротка назва або суть справи",
      "Стягнення заборгованості",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.number",
      "Номер справи",
      "Внутрішній номер справи",
      "CASE-2026-0015",
      "text",
      "none",
    ),
    createVariable(
      "Справа",
      "case.type",
      "Категорія справи",
      "Категорія справи з форми",
      "Цивільна",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.priority",
      "Пріоритет",
      "Пріоритет справи",
      "Високий",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.courtName",
      "Назва установи",
      "Назва суду або іншої установи",
      "Шевченківський районний суд м. Києва",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.courtAddress",
      "Адреса установи",
      "Адреса суду або іншої установи",
      "м. Київ, вул. Дегтярівська, 31-А",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.registryNumber",
      "Номер справи в реєстрі",
      "Номер справи в державному реєстрі",
      "761/12345/26",
      "text",
      "none",
    ),
    createVariable(
      "Справа",
      "case.judgeName",
      "Особа, у веденні якої справа",
      "ПІБ судді або іншої відповідальної особи",
      "Коваленко Олена Ігорівна",
      "text",
      "person",
    ),
    createVariable(
      "Справа",
      "case.proceedingStage",
      "Стадія розгляду",
      "Поточна стадія розгляду справи",
      "Підготовче провадження",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.description",
      "Опис справи",
      "Детальний опис справи",
      "Позов про стягнення заборгованості за договором поставки.",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.participantsSummary",
      "Учасники справи",
      "Усі учасники справи одним списком",
      "Позивач: Петренко Петро Петрович; Відповідач: ТОВ Контрагент",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.firstParticipantName",
      "Перший учасник",
      "Найменування або ПІБ першого учасника",
      "Петренко Петро Петрович",
      "text",
      "person",
    ),
    createVariable(
      "Справа",
      "case.firstParticipantRole",
      "Роль першого учасника",
      "Роль першого учасника у справі",
      "Позивач",
      "text",
      "generic",
    ),
    createVariable(
      "Справа",
      "case.plaintiffName",
      "Позивач",
      "ПІБ або назва позивача",
      "Петренко Петро Петрович",
      "text",
      "person",
    ),
    createVariable(
      "Справа",
      "case.defendantName",
      "Відповідач",
      "ПІБ або назва відповідача",
      "ТОВ Контрагент",
      "text",
      "person",
    ),
  ];

  const calculationVariables: TemplateVariableDefinition[] = [
    createVariable(
      "Розрахунок",
      "calculation.name",
      "Назва розрахунку",
      "Назва розрахунку",
      "Прибуткова операція",
      "text",
      "generic",
    ),
    createVariable(
      "Розрахунок",
      "calculation.date",
      "Дата розрахунку",
      "Дата розрахунку з форми",
      "11 березня 2026",
      "date",
      "none",
    ),
    createVariable(
      "Розрахунок",
      "calculation.dueDate",
      "Строк оплати",
      "Строк оплати з форми розрахунку",
      "18 березня 2026",
      "date",
      "none",
    ),
    createVariable(
      "Розрахунок",
      "calculation.subjectType",
      "Суб'єкт",
      "Обраний суб'єкт розрахунку",
      "Клієнт",
      "text",
      "generic",
    ),
    createVariable(
      "Розрахунок",
      "calculation.description",
      "Опис",
      "Опис призначення розрахунку",
      "Розрахунок по договору правничої допомоги.",
      "text",
      "generic",
    ),
    createVariable(
      "Розрахунок",
      "calculation.internalNotes",
      "Службові примітки",
      "Внутрішні коментарі до розрахунку",
      "Оплату очікуємо після погодження клієнтом.",
      "text",
      "generic",
    ),
    createVariable(
      "Розрахунок",
      "calculation.totalAmount",
      "Загалом",
      "Підсумкова сума розрахунку",
      "1 200,00 грн",
      "currency",
      "none",
    ),
    createVariable(
      "Розрахунок",
      "calculation.totalAmountWords",
      "Загалом прописом",
      "Підсумкова сума розрахунку текстом",
      "одна тисяча двісті грн 00 коп",
      "text",
      "generic",
    ),
    createVariable(
      "Розрахунок",
      "calculation.selectedTable",
      "Таблиця послуг розрахунку",
      "Готова таблиця рядків розрахунку для актів, рахунків та додатків",
      "№ | Назва послуги | кількість | од. виміру | сума",
      "text",
      "none",
      {
        renderMode: "table",
      },
    ),
  ];

  const eventVariables: TemplateVariableDefinition[] = [
    createVariable(
      "Подія",
      "event.title",
      "Назва події",
      "Назва події або засідання",
      "Підготовче судове засідання",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.type",
      "Тип події",
      "Тип календарної події",
      "Засідання",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.date",
      "Дата події",
      "Дата події",
      "25 березня 2026",
      "date",
      "none",
    ),
    createVariable(
      "Подія",
      "event.time",
      "Час події",
      "Час початку події",
      "14:30",
      "text",
      "none",
    ),
    createVariable(
      "Подія",
      "event.dateTime",
      "Дата і час",
      "Дата та час початку події",
      "25.03.2026, 14:30",
      "date",
      "none",
    ),
    createVariable(
      "Подія",
      "event.endDate",
      "Дата завершення",
      "Дата завершення для події типу 'від і до'",
      "25 березня 2026",
      "date",
      "none",
    ),
    createVariable(
      "Подія",
      "event.endTime",
      "Час завершення",
      "Час завершення події",
      "16:00",
      "text",
      "none",
    ),
    createVariable(
      "Подія",
      "event.isAllDay",
      "Подія на весь день",
      "Ознака події на весь день",
      "Так",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.location",
      "Місце події",
      "Локація або адреса події",
      "м. Київ, вул. Дегтярівська, 31-А",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.courtRoom",
      "Зала / кабінет",
      "Номер залу або кабінету",
      "Зал № 12",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.responsibleContact",
      "Контакти відповідальної особи",
      "ПІБ, телефон або email відповідальної особи",
      "Іваненко Іван Іванович, +380671234567",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.judgeName",
      "Суддя / контакт",
      "Суддя або контакт із форми події",
      "Коваленко Олена Ігорівна",
      "text",
      "person",
    ),
    createVariable(
      "Подія",
      "event.reminderValue",
      "Нагадати за",
      "Числове значення нагадування",
      "1",
      "number",
      "none",
    ),
    createVariable(
      "Подія",
      "event.reminderUnit",
      "Одиниця нагадування",
      "Хвилини, години, дні або тижні",
      "днів",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.isRecurring",
      "Повторювана подія",
      "Ознака повторюваної події",
      "Так",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.recurrencePattern",
      "Повторювати",
      "Схема повторення події",
      "Щотижня",
      "text",
      "generic",
    ),
    createVariable(
      "Подія",
      "event.recurrenceInterval",
      "Інтервал повтору",
      "Числовий інтервал повторення",
      "1",
      "number",
      "none",
    ),
    createVariable(
      "Подія",
      "event.recurrenceEndDate",
      "Повтор до",
      "Дата завершення повтору",
      "30 квітня 2026",
      "date",
      "none",
    ),
    createVariable(
      "Подія",
      "event.description",
      "Опис",
      "Опис події з форми",
      "Коротко опишіть зміст події",
      "text",
      "generic",
    ),
  ];

  return [
    {
      id: "user",
      label: "Користувач",
      description: "Поля з профілю користувача та картки юрособи / ФОП",
      variables: userVariables,
    },
    {
      id: "client",
      label: "Клієнт",
      description: "Поля з форми створення / редагування клієнта",
      variables: clientVariables,
    },
    {
      id: "case",
      label: "Справа",
      description: "Поля з форми створення / редагування справи",
      variables: caseVariables,
    },
    {
      id: "calculation",
      label: "Розрахунок",
      description: "Поля з форми створення / редагування розрахунку",
      variables: calculationVariables,
    },
    {
      id: "event",
      label: "Подія",
      description: "Поля з форми створення / редагування події",
      variables: eventVariables,
    },
    {
      id: "system",
      label: "Система",
      description: "Службові значення, що підставляються автоматично",
      variables: [
        createVariable(
          "Система",
          "system.today",
          "Сьогодні",
          "Поточна дата",
          formatDateExample(now),
          "date",
          "none",
        ),
        createVariable(
          "Система",
          "system.now",
          "Дата і час",
          "Поточна дата та час",
          formatDateTimeExample(now),
          "date",
          "none",
        ),
      ],
    },
  ];
};

const inflectSingleWordGenitive = (
  originalWord: string,
  inflection: VariableInflectionKind,
) => {
  const word = originalWord.trim();
  if (!word || inflection === "none") {
    return originalWord;
  }

  if (/^[A-Z0-9._-]+$/i.test(word) && !/[А-Яа-яІіЇїЄєҐґ]/.test(word)) {
    return originalWord;
  }

  const lower = word.toLowerCase();
  const isCapitalized = word[0] === word[0]?.toUpperCase();
  const rebuild = (next: string) =>
    isCapitalized ? next[0].toUpperCase() + next.slice(1) : next;

  if (inflection === "person") {
    if (/(ич|ович|евич|йович|івна|ївна)$/.test(lower)) {
      return rebuild(`${lower}а`);
    }

    if (lower.endsWith("ія")) {
      return rebuild(`${lower.slice(0, -2)}ії`);
    }

    if (lower.endsWith("я")) {
      return rebuild(`${lower.slice(0, -1)}і`);
    }

    if (lower.endsWith("а")) {
      const base = lower.slice(0, -1);
      const previous = base.slice(-1);
      if ("гкхжчшщ".includes(previous)) {
        return rebuild(`${base}і`);
      }
      return rebuild(`${base}и`);
    }

    if (lower.endsWith("ій")) {
      return rebuild(`${lower.slice(0, -2)}ія`);
    }

    if (lower.endsWith("ий")) {
      return rebuild(`${lower.slice(0, -2)}ого`);
    }

    if (lower.endsWith("й")) {
      return rebuild(`${lower.slice(0, -1)}я`);
    }

    if (/[бвгґджзклмнпрстфхцчшщ]$/.test(lower)) {
      return rebuild(`${lower}а`);
    }
  }

  if (inflection === "generic") {
    if (lower.endsWith("ія")) {
      return rebuild(`${lower.slice(0, -2)}ії`);
    }

    if (lower.endsWith("я")) {
      return rebuild(`${lower.slice(0, -1)}і`);
    }

    if (lower.endsWith("а")) {
      const base = lower.slice(0, -1);
      return rebuild(`${base}и`);
    }

    if (lower.endsWith("ь")) {
      return rebuild(`${lower.slice(0, -1)}я`);
    }

    if (/[бвгґджзклмнпрстфхцчшщ]$/.test(lower)) {
      return rebuild(`${lower}у`);
    }
  }

  return originalWord;
};

export const toGenitiveCase = (
  value: string,
  inflection: VariableInflectionKind,
) => {
  if (!value || inflection === "none") {
    return value;
  }

  return value.replace(/[A-Za-zА-Яа-яІіЇїЄєҐґ'’-]+/g, (word) =>
    inflectSingleWordGenitive(word, inflection),
  );
};

export const getVariableLookup = (groups: TemplateVariableGroup[]) => {
  const lookup = new Map<string, TemplateVariableDefinition>();
  groups.forEach((group) => {
    group.variables.forEach((variable) => {
      lookup.set(variable.id, variable);
    });
  });
  return lookup;
};

export const getTemplateTokenText = (
  variable: TemplateVariableDefinition,
  useGenitive = variable.defaultCaseMode === "genitive",
) => `{{${variable.token}${useGenitive ? "|genitive" : ""}}}`;

export const buildTemplateTokenHtml = (
  variable: TemplateVariableDefinition,
  useGenitive = variable.defaultCaseMode === "genitive",
) => {
  const tokenText = getTemplateTokenText(variable, useGenitive);

  if (variable.renderMode === "table") {
    return `
      <div class="template-token-table mceNonEditable" contenteditable="false" data-token-id="${variable.id}" data-case-mode="${useGenitive ? "genitive" : "default"}">
        <div class="template-token-table-caption">${tokenText}</div>
        <table>
          <colgroup>
            <col style="width: 7%;" />
            <col style="width: 51%;" />
            <col style="width: 13%;" />
            <col style="width: 14%;" />
            <col style="width: 15%;" />
          </colgroup>
          <thead>
            <tr>
              <th>№</th>
              <th>Назва послуги</th>
              <th>Кількість</th>
              <th>Тип обліку</th>
              <th>Сума</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="5" class="template-token-table-placeholder">
                Рядки таблиці будуть підставлені з обраного розрахунку під час формування документа
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p></p>
    `;
  }

  return `<span class="template-token mceNonEditable" contenteditable="false" data-token-id="${variable.id}" data-case-mode="${useGenitive ? "genitive" : "default"}">${tokenText}</span>&nbsp;`;
};

export const sanitizeTemplateHtml = (
  html: string,
  variables: Map<string, TemplateVariableDefinition>,
) => {
  if (!html) {
    return "";
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    `<div id="template-root">${html}</div>`,
    "text/html",
  );
  const root = documentNode.getElementById("template-root");

  if (!root) {
    return html;
  }

  root.querySelectorAll<HTMLElement>("*").forEach((node) => {
    [...node.attributes].forEach((attribute) => {
      if (attribute.name.startsWith("data-mce-")) {
        node.removeAttribute(attribute.name);
      }
    });
  });

  root.querySelectorAll<HTMLElement>(".template-token").forEach((node) => {
    const variableId = node.dataset.tokenId || "";
    const variable = variables.get(variableId);
    const useGenitive = node.dataset.caseMode === "genitive";
    node.className = "template-token";
    node.setAttribute("contenteditable", "false");
    node.textContent = variable
      ? getTemplateTokenText(variable, useGenitive)
      : node.textContent || "";
  });

  root
    .querySelectorAll<HTMLElement>(".template-token-table")
    .forEach((node) => {
      const variableId = node.dataset.tokenId || "";
      const variable = variables.get(variableId);
      const useGenitive = node.dataset.caseMode === "genitive";
      const tokenText = variable
        ? getTemplateTokenText(variable, useGenitive)
        : node.textContent || "";

      node.className = "template-token-table";
      node.setAttribute("contenteditable", "false");
      node.innerHTML = `
      <div class="template-token-table-caption">${tokenText}</div>
      <table>
        <colgroup>
          <col style="width: 7%;" />
          <col style="width: 51%;" />
          <col style="width: 13%;" />
          <col style="width: 14%;" />
          <col style="width: 15%;" />
        </colgroup>
        <thead>
          <tr>
            <th>№</th>
            <th>Назва послуги</th>
            <th>Кількість</th>
            <th>Тип обліку</th>
            <th>Сума</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colspan="5" class="template-token-table-placeholder">
              Рядки таблиці будуть підставлені з обраного розрахунку під час формування документа
            </td>
          </tr>
        </tbody>
      </table>
    `;
    });

  return root.innerHTML;
};

export const summarizeTemplateVariables = (
  html: string,
  variables: Map<string, TemplateVariableDefinition>,
) => {
  if (!html) {
    return "Без змінних";
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(
    `<div id="template-root">${html}</div>`,
    "text/html",
  );
  const root = documentNode.getElementById("template-root");

  if (!root) {
    return "Без змінних";
  }

  const tokenNodes = [
    ...root.querySelectorAll<HTMLElement>(".template-token"),
    ...root.querySelectorAll<HTMLElement>(".template-token-table"),
  ];
  if (tokenNodes.length === 0) {
    return "Без змінних";
  }

  const groups = new Set<string>();

  tokenNodes.forEach((node) => {
    const variable = variables.get(node.dataset.tokenId || "");
    if (variable) {
      groups.add(variable.group);
    }
  });

  const groupList = [...groups];
  const groupsPreview = groupList.slice(0, 2).join(", ");
  const groupsSuffix = groupList.length > 2 ? ` +${groupList.length - 2}` : "";

  return `${tokenNodes.length} змінн. • ${groupsPreview}${groupsSuffix}`;
};

export const buildPrintableHtml = (
  title: string,
  bodyHtml: string,
  settings: TemplateDocumentSettings = DEFAULT_TEMPLATE_DOCUMENT_SETTINGS,
) => {
  const normalizedSettings = normalizeTemplateDocumentSettings(settings);
  const pageMetrics = getDocumentPageMetrics(normalizedSettings);

  return `<!doctype html>
<html lang="uk">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root {
        color-scheme: light;
      }

      @page {
        size: ${pageMetrics.pageSizeRule};
        margin: ${pageMetrics.marginShorthand};
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f4f7fb;
        color: #162033;
        font-family: "Golos Text", sans-serif;
      }

      .page-shell {
        width: ${pageMetrics.pageWidth};
        min-height: ${pageMetrics.pageHeight};
        margin: 0 auto;
        padding: ${pageMetrics.marginShorthand};
        background: #ffffff;
        box-shadow: 0 16px 34px rgba(16, 25, 38, 0.08);
      }

      .document-body {
        font-family: ${pageMetrics.fontFamily};
        font-size: ${normalizedSettings.fontSizePt}pt;
        line-height: ${normalizedSettings.lineHeight};
        color: #111827;
        word-break: normal;
        overflow-wrap: normal;
        hyphens: none;
      }

      .document-body p {
        margin: 0 0 0.9rem;
      }

      .document-body ul,
      .document-body ol {
        margin: 0 0 1rem 1.5rem;
      }

      .document-body h1,
      .document-body h2,
      .document-body h3 {
        margin: 0 0 1rem;
        font-weight: 700;
      }

      .template-token {
        display: inline-block;
        padding: 0.08rem 0.3rem;
        border: 1px solid rgba(44, 95, 178, 0.18);
        border-radius: 0.35rem;
        background: rgba(61, 118, 209, 0.06);
        color: #2c5fb2;
        font-family: "SFMono-Regular", "JetBrains Mono", monospace;
        font-size: 10pt;
      }

      .template-token-table {
        margin: 0 0 1rem;
        border: 1px solid rgba(44, 95, 178, 0.16);
        border-radius: 0.45rem;
        overflow: hidden;
        background: rgba(61, 118, 209, 0.03);
      }

      .template-token-table-caption {
        padding: 0.45rem 0.65rem;
        border-bottom: 1px solid rgba(44, 95, 178, 0.14);
        background: rgba(61, 118, 209, 0.07);
        color: #2c5fb2;
        font-family: "SFMono-Regular", "JetBrains Mono", monospace;
        font-size: 10pt;
        font-weight: 600;
      }

      .template-token-table table {
        margin: 0;
        background: #ffffff;
      }

      .template-token-table-placeholder {
        padding: 0.8rem 0.9rem;
        color: #5b677a;
        font-style: italic;
        text-align: center;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }

      td,
      th {
        border: 1px solid #d6deea;
        padding: 0.45rem 0.6rem;
        vertical-align: top;
        white-space: normal;
        word-break: normal;
        overflow-wrap: break-word;
        hyphens: auto;
      }

      th {
        white-space: nowrap;
      }

      th:first-child,
      td:first-child {
        width: 6.5%;
      }

      th:nth-child(2),
      td:nth-child(2) {
        width: 51.5%;
      }

      th:nth-child(3),
      td:nth-child(3) {
        width: 13%;
      }

      th:nth-child(4),
      td:nth-child(4) {
        width: 14%;
      }

      th:nth-child(5),
      td:nth-child(5) {
        width: 15%;
      }

      td:nth-child(1),
      td:nth-child(3),
      td:nth-child(4),
      td:nth-child(5),
      th:nth-child(1),
      th:nth-child(3),
      th:nth-child(4),
      th:nth-child(5) {
        text-align: center;
      }

      td:nth-child(2) {
        text-align: left;
      }

      @media print {
        body {
          background: #ffffff;
        }

        .page-shell {
          box-shadow: none;
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    <main class="page-shell">
      <div class="document-body">${bodyHtml}</div>
    </main>
  </body>
</html>`;
};
