import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  Calculation,
  CalculationOperationType,
  CalculationStatus,
  CalculationUnitType,
} from "../../types/calculation.types";
import {
  formatCurrencyAmount,
  formatCurrencyInWordsUk,
} from "../../utils/currency";

export const TODAY_ISO = new Date().toISOString().split("T")[0];
export const DEFAULT_FETCH_LIMIT = 100;

export const formatCurrency = (amount: number) => formatCurrencyAmount(amount);

export const formatDate = (value?: string | null): string => {
  if (!value) {
    return "Не вказано";
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("uk-UA");
};

export const getClientDisplayName = (client: Client): string => {
  const personalName =
    `${client.lastName || ""} ${client.firstName || ""} ${client.patronymic || ""}`.trim();

  if (client.type !== "legal_entity" && personalName) {
    return personalName;
  }

  return client.companyName || "Невідомий клієнт";
};

export const getCaseDisplayName = (caseItem: Case): string =>
  [caseItem.caseNumber, caseItem.title].filter(Boolean).join(" • ");

export const getOperationType = (
  calculation: Calculation,
): CalculationOperationType => {
  const operationType = calculation.metadata?.operationType;

  if (operationType === "income" || operationType === "expense") {
    return operationType;
  }

  return calculation.pricelistId ? "income" : "expense";
};

export const getOperationTypeLabel = (
  operationType: CalculationOperationType,
): string => (operationType === "income" ? "Прибуткова" : "Видаткова");

export const getCalculationStatusLabel = (
  status: CalculationStatus,
): string => {
  const labels: Record<CalculationStatus, string> = {
    draft: "Чернетка",
    pending_approval: "На затвердженні",
    approved: "Затверджено",
    rejected: "Відхилено",
    paid: "Сплачено",
  };

  return labels[status];
};

export const getCalculationUnitTypeLabel = (
  unitType?: CalculationUnitType | null,
): string => {
  const labels: Record<CalculationUnitType, string> = {
    hourly: "Погодинно",
    piecewise: "Поштучно",
    fixed: "Фіксовано",
  };

  return unitType ? labels[unitType] : "Без типу";
};

export const getCalculationDisplayQuantity = (
  quantity?: number | null,
  duration?: number | null,
  unitType?: CalculationUnitType | null,
): string => {
  if (unitType === "hourly") {
    const hours = Number(duration || 0) / 60;
    return hours > 0
      ? hours.toLocaleString("uk-UA", {
          minimumFractionDigits: Number.isInteger(hours) ? 0 : 2,
          maximumFractionDigits: 2,
        })
      : "—";
  }

  const resolvedQuantity = Number(quantity || (unitType === "fixed" ? 1 : 0));
  return resolvedQuantity > 0
    ? resolvedQuantity.toLocaleString("uk-UA", {
        minimumFractionDigits: Number.isInteger(resolvedQuantity) ? 0 : 2,
        maximumFractionDigits: 2,
      })
    : "—";
};

export const getCalculationDisplayUnit = (
  unitType?: CalculationUnitType | null,
): string => {
  switch (unitType) {
    case "hourly":
      return "год.";
    case "fixed":
      return "посл.";
    case "piecewise":
      return "шт.";
    default:
      return "—";
  }
};

export const formatCurrencyInWords = (amount: number): string =>
  formatCurrencyInWordsUk(amount);

export const getStatusBadgeClass = (status: CalculationStatus): string => {
  const classes: Record<CalculationStatus, string> = {
    draft: "badge-secondary",
    pending_approval: "badge-warning",
    approved: "badge-success",
    rejected: "badge-danger",
    paid: "badge-info",
  };

  return classes[status];
};

export const getCalculationSubjectLabel = (
  calculation: Calculation,
  linkedClient?: Client | null,
): string =>
  calculation.metadata?.clientDisplayName ||
  calculation.metadata?.subjectDisplayName ||
  (linkedClient ? getClientDisplayName(linkedClient) : "") ||
  "Власний облік";

export const getCalculationDisplayDescription = (
  description?: string | null,
) => {
  if (!description) {
    return "";
  }

  return description.replace(/\s*\(([A-Za-z0-9_]+)\)\s*$/, "").trim();
};
