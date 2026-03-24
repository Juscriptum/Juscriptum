type CaseReference = {
  caseNumber?: string | null;
  registryCaseNumber?: string | null;
  title?: string | null;
};

export function formatCaseReferenceLabel(
  caseItem?: CaseReference | null,
  fallback = "Не вказано",
): string {
  if (!caseItem) {
    return fallback;
  }

  const internalNumber = caseItem.caseNumber?.trim();
  const registryNumber = caseItem.registryCaseNumber?.trim();
  const title = caseItem.title?.trim();

  const label = [
    internalNumber ? `Внутрішній: ${internalNumber}` : null,
    registryNumber ? `Реєстр: ${registryNumber}` : null,
    title || null,
  ]
    .filter(Boolean)
    .join(" • ");

  return label || fallback;
}
