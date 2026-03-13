import { z } from "zod";
import { CASE_CATEGORY_OPTIONS } from "../utils/caseCategories";

/**
 * Case Type enum (Ukrainian legal categories)
 * Цивільна, Кримінальна, Адміністративна, Господарська
 */
export const caseTypeSchema = z.enum([
  "judicial_case",
  "criminal_proceeding",
  "enforcement_proceeding",
  "contract_work",
  "consultation_case",
  "corporate_case",
  "registration_case",
  "administrative_appeal",
  "mediation_negotiation",
  "compliance_audit",
]);

/**
 * Case Priority enum
 */
export const casePrioritySchema = z.enum(["low", "medium", "high", "urgent"]);

/**
 * Case Status enum (Ukrainian terminology)
 */
export const caseStatusSchema = z.enum([
  "draft", // Чернетка
  "active", // В роботі
  "on_hold", // Призупинено
  "closed", // Завершено
  "archived", // Архів
]);

/**
 * Currency amount (UAH)
 */
const currencySchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === "number" && Number.isNaN(value)) {
    return undefined;
  }

  return value;
}, z.number().min(0, "Сума не може бути від'ємною").max(999999999999.99, "Сума занадто велика").optional());

const caseParticipantSchema = z.object({
  id: z.string().optional(),
  name: z.string().max(255, "Найменування учасника занадто довге"),
  role: z.string().max(255, "Статус учасника занадто довгий"),
  groupId: z.string().max(100, "Група учасника вказана некоректно"),
  isCustomRole: z.boolean().optional(),
});

/**
 * Create Case Schema
 */
export const createCaseSchema = z.object({
  // Основна інформація
  caseNumber: z
    .string()
    .max(50, "Номер справи занадто довгий")
    .optional()
    .or(z.literal("")),

  registryCaseNumber: z
    .string()
    .max(100, "Номер справи в реєстрі занадто довгий")
    .optional()
    .or(z.literal("")),

  caseType: caseTypeSchema,

  clientId: z.string().uuid("Оберіть клієнта зі списку"),

  assignedLawyerId: z.string().uuid("Оберіть юриста зі списку"),

  title: z.string().max(255, "Назва занадто довга").optional(),

  description: z.string().max(5000, "Опис занадто довгий").optional(),

  caseSubcategory: z.string().max(255, "Підкатегорія занадто довга").optional(),

  priority: casePrioritySchema,

  // Судова інформація
  courtName: z.string().max(255, "Назва суду занадто довга").optional(),

  courtAddress: z.string().max(500, "Адреса суду занадто довга").optional(),

  judgeName: z.string().max(100, "Ім'я судді занадто довге").optional(),

  proceedingStage: z
    .string()
    .max(100, "Стадія розгляду занадто довга")
    .optional(),

  // Сторони у справі
  plaintiffName: z.string().max(255, "Назва позивача занадто довга").optional(),

  defendantName: z
    .string()
    .max(255, "Назва відповідача занадто довга")
    .optional(),

  thirdParties: z
    .string()
    .max(1000, "Список третіх осіб занадто довгий")
    .optional(),

  participants: z.array(caseParticipantSchema).default([]),

  // Дати та фінанси
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невірний формат дати")
    .optional()
    .or(z.literal("")),

  deadlineDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невірний формат дати")
    .optional()
    .or(z.literal("")),

  estimatedAmount: currencySchema,

  courtFee: currencySchema,

  // Коментарі
  internalNotes: z.string().max(5000, "Нотатки занадто довгі").optional(),

  clientNotes: z.string().max(5000, "Нотатки занадто довгі").optional(),

  // Metadata for flexible fields
  metadata: z.record(z.any()).optional(),
});

/**
 * Update Case Schema (all fields optional)
 */
export const updateCaseSchema = createCaseSchema.partial().extend({
  status: caseStatusSchema.optional(),
  nextHearingDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невірний формат дати")
    .optional()
    .or(z.literal("")),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Невірний формат дати")
    .optional()
    .or(z.literal("")),
  paidAmount: currencySchema,
});

/**
 * Case Filters Schema
 */
export const caseFiltersSchema = z.object({
  clientId: z.string().uuid().optional(),
  assignedLawyerId: z.string().uuid().optional(),
  caseType: caseTypeSchema.optional(),
  priority: casePrioritySchema.optional(),
  status: caseStatusSchema.optional(),
  search: z.string().max(255).optional(),
  startDateFrom: z.string().optional(),
  startDateTo: z.string().optional(),
  deadlineFrom: z.string().optional(),
  deadlineTo: z.string().optional(),
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(["ASC", "DESC"]).optional(),
});

/**
 * Form data types inferred from schemas
 */
export type CreateCaseFormData = z.infer<typeof createCaseSchema>;
export type UpdateCaseFormData = z.infer<typeof updateCaseSchema>;
export type CaseFiltersFormData = z.infer<typeof caseFiltersSchema>;

/**
 * Case Type Labels (Ukrainian)
 */
export const CASE_TYPE_LABELS: Record<
  z.infer<typeof caseTypeSchema>,
  string
> = Object.fromEntries(
  CASE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<z.infer<typeof caseTypeSchema>, string>;

/**
 * Case Priority Labels (Ukrainian)
 */
export const CASE_PRIORITY_LABELS: Record<
  z.infer<typeof casePrioritySchema>,
  string
> = {
  low: "Низький",
  medium: "Середній",
  high: "Високий",
  urgent: "Терміновий",
};

/**
 * Case Status Labels (Ukrainian)
 */
export const CASE_STATUS_LABELS: Record<
  z.infer<typeof caseStatusSchema>,
  string
> = {
  draft: "Чернетка",
  active: "В роботі",
  on_hold: "Призупинено",
  closed: "Завершено",
  archived: "Архів",
};

/**
 * Proceeding Stage Options (Ukrainian)
 */
export const PROCEEDING_STAGES = [
  { value: "first_instance", label: "Перша інстанція" },
  { value: "appeal", label: "Апеляція" },
  { value: "cassation", label: "Касація" },
  { value: "supreme_court", label: "Верховний Суд" },
  { value: "execution", label: "Виконавче провадження" },
  { value: "pre_trial", label: "Досудове розслідування" },
  { value: "other", label: "Інше" },
] as const;

/**
 * Default form values
 */
export const DEFAULT_CASE_VALUES: Partial<CreateCaseFormData> = {
  caseType: "judicial_case",
  priority: "medium",
  startDate: new Date().toISOString().split("T")[0],
  participants: [],
  caseSubcategory: "",
};
