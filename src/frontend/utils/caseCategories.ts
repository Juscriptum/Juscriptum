export const CASE_CATEGORY_OPTIONS = [
  { value: "judicial_case", label: "Судова справа" },
  { value: "criminal_proceeding", label: "Кримінальне провадження" },
  { value: "enforcement_proceeding", label: "Виконавче провадження" },
  { value: "contract_work", label: "Договірна робота" },
  { value: "consultation_case", label: "Консультаційна справа" },
  { value: "corporate_case", label: "Корпоративна справа" },
  { value: "registration_case", label: "Реєстраційна справа" },
  { value: "administrative_appeal", label: "Адміністративне оскарження" },
  { value: "mediation_negotiation", label: "Медіація / переговори" },
  { value: "compliance_audit", label: "Комплаєнс / аудит" },
] as const;

export type CaseCategoryValue = (typeof CASE_CATEGORY_OPTIONS)[number]["value"];

const CASE_CATEGORY_LABELS = Object.fromEntries(
  CASE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
) as Record<CaseCategoryValue, string>;

const LEGACY_CASE_TYPE_MAP: Record<string, CaseCategoryValue> = {
  civil: "judicial_case",
  criminal: "criminal_proceeding",
  administrative: "administrative_appeal",
  economic: "judicial_case",
  family: "judicial_case",
  labor: "judicial_case",
  tax: "judicial_case",
  other: "consultation_case",
};

export const normalizeCaseTypeForForm = (
  caseType?: string | null,
): CaseCategoryValue => {
  if (!caseType) {
    return "judicial_case";
  }

  if (caseType in CASE_CATEGORY_LABELS) {
    return caseType as CaseCategoryValue;
  }

  return LEGACY_CASE_TYPE_MAP[caseType] || "judicial_case";
};

export const getCaseTypeLabel = (caseType?: string | null): string => {
  if (!caseType) {
    return "Не вказано";
  }

  const normalized = normalizeCaseTypeForForm(caseType);
  return CASE_CATEGORY_LABELS[normalized];
};
