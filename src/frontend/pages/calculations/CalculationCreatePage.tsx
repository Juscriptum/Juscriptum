import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import { Alert } from "../../components/Alert";
import { FormActionBar } from "../../components/FormActionBar";
import { Breadcrumbs } from "../../components/navigation";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { calculationService } from "../../services/calculation.service";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { pricelistService } from "../../services/pricelist.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  Calculation,
  CalculationOperationType,
  CalculationSubjectType,
  CalculationUnitType,
  CreateCalculationDto,
} from "../../types/calculation.types";
import { Pricelist, PricelistItem } from "../../types/pricelist.types";
import {
  TODAY_ISO,
  formatCurrency,
  getCaseDisplayName,
  getClientDisplayName,
} from "./calculationPage.utils";
import "./CalculationCreatePage.css";

interface DraftCalculationItem {
  id: string;
  pricelistItemId: string;
  description: string;
  code: string;
  unitType: CalculationUnitType;
  quantity: string;
  duration: string;
  unitPrice: string;
}

interface CalculationFormState {
  name: string;
  calculationDate: string;
  dueDate: string;
  subjectType: CalculationSubjectType;
  pricelistIds: string[];
  clientId: string;
  caseId: string;
  description: string;
  internalNotes: string;
  items: DraftCalculationItem[];
}

interface GroupedPricelistItemOption {
  item: PricelistItem;
  pricelistId: string;
  pricelistName: string;
  groupLabel: string;
}

const CATEGORY_PATH_SEPARATOR = " > ";

const OPERATION_COPY: Record<
  CalculationOperationType,
  {
    title: string;
    defaultName: string;
    defaultSubjectType: CalculationSubjectType;
  }
> = {
  income: {
    title: "Прибутковий",
    defaultName: "Прибутковий розрахунок",
    defaultSubjectType: "client",
  },
  expense: {
    title: "Видатковий",
    defaultName: "Видатковий розрахунок",
    defaultSubjectType: "self",
  },
};

const createDraftItem = (): DraftCalculationItem => ({
  id:
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  pricelistItemId: "",
  description: "",
  code: "",
  unitType: "piecewise",
  quantity: "1",
  duration: "1",
  unitPrice: "",
});

const minutesToHoursValue = (value?: number | null): string => {
  const minutes = Number(value || 0);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "1";
  }

  const hours = minutes / 60;
  return Number.isInteger(hours)
    ? String(hours)
    : String(Number(hours.toFixed(2)));
};

const hoursToMinutesValue = (value: string): number => {
  const hours = parseNumber(value);

  if (hours <= 0) {
    return 0;
  }

  return Math.round(hours * 60);
};

const createDraftItemFromCalculationItem = (
  item: Calculation["items"][number],
): DraftCalculationItem => ({
  id: createDraftItem().id,
  pricelistItemId: item.pricelistItemId || "",
  description: item.description || "",
  code: item.code || "",
  unitType: item.unitType || (item.duration ? "hourly" : "piecewise"),
  quantity:
    item.quantity != null && Number.isFinite(Number(item.quantity))
      ? String(item.quantity)
      : "1",
  duration: minutesToHoursValue(item.duration),
  unitPrice:
    item.unitPrice != null && Number.isFinite(Number(item.unitPrice))
      ? String(item.unitPrice)
      : "",
});

const buildInitialFormState = (
  operationType: CalculationOperationType,
): CalculationFormState => ({
  name: OPERATION_COPY[operationType].defaultName,
  calculationDate: TODAY_ISO,
  dueDate: TODAY_ISO,
  subjectType: OPERATION_COPY[operationType].defaultSubjectType,
  pricelistIds: [],
  clientId: "",
  caseId: "",
  description: "",
  internalNotes: "",
  items: [createDraftItem()],
});

const parseOperationType = (
  value: string | null,
): CalculationOperationType | null => {
  if (value === "income" || value === "expense") {
    return value;
  }

  return null;
};

const parseNumber = (value: string): number => {
  const normalized = value.replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getDraftLineTotal = (item: DraftCalculationItem): number => {
  const unitPrice = parseNumber(item.unitPrice);

  if (item.unitType === "hourly") {
    return Number((unitPrice * parseNumber(item.duration)).toFixed(2));
  }

  return Number((unitPrice * parseNumber(item.quantity || "1")).toFixed(2));
};

const getUnitFieldLabel = (unitType: CalculationUnitType): string =>
  unitType === "hourly" ? "Годин" : "Кількість";

const getPricelistItemPath = (
  item: PricelistItem,
  pricelist: Pricelist,
): string[] => {
  const metadataPath = item.metadata?.categoryPath;

  if (Array.isArray(metadataPath) && metadataPath.length > 0) {
    return metadataPath
      .map((segment) => String(segment).trim())
      .filter(Boolean);
  }

  const categoryById = new Map(
    (pricelist.categories || []).map((category) => [category.id, category]),
  );
  const categoryPath = item.category
    .split(CATEGORY_PATH_SEPARATOR)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (categoryPath.length > 0) {
    return categoryPath;
  }

  const category = [...categoryById.values()].find(
    (entry) => entry.name === item.category,
  );

  if (!category) {
    return [];
  }

  const resolvedPath: string[] = [];
  let currentCategory = category;

  while (currentCategory) {
    resolvedPath.unshift(currentCategory.name);
    currentCategory = currentCategory.parentId
      ? categoryById.get(currentCategory.parentId) || null
      : null;
  }

  return resolvedPath;
};

export const CalculationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: editCalculationId } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const operationType = parseOperationType(searchParams.get("type"));
  const duplicateFromId = searchParams.get("duplicateFrom");
  const isEditMode = Boolean(editCalculationId);
  const previousOperationTypeRef = useRef<CalculationOperationType | null>(
    operationType,
  );

  const [formState, setFormState] = useState<CalculationFormState>(() =>
    buildInitialFormState(operationType || "income"),
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [pricelists, setPricelists] = useState<Pricelist[]>([]);
  const [loading, setLoading] = useState(Boolean(operationType));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!operationType) {
      setLoading(false);
      return;
    }

    const loadOptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const [clientOptions, caseOptions, pricelistOptions] =
          await Promise.all([
            clientService.getAllClients(),
            caseService.getAllCases({
              sortBy: "createdAt",
              sortOrder: "DESC",
            }),
            operationType === "income"
              ? pricelistService.getAllPricelists({
                  status: "active",
                })
              : Promise.resolve([] as Pricelist[]),
          ]);

        setClients(clientOptions);
        setCases(caseOptions);
        setPricelists(pricelistOptions);
      } catch (err: any) {
        const backendMessage = err.response?.data?.message;
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(". ")
            : backendMessage ||
                "Не вдалося завантажити довідники для створення розрахунку",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOptions();
  }, [operationType]);

  useEffect(() => {
    if (!operationType || previousOperationTypeRef.current === operationType) {
      return;
    }

    if (isEditMode) {
      previousOperationTypeRef.current = operationType;
      return;
    }

    previousOperationTypeRef.current = operationType;
    setFormState(buildInitialFormState(operationType));
    setError(null);
  }, [isEditMode, operationType]);

  useEffect(() => {
    if (!operationType || !duplicateFromId || isEditMode) {
      return;
    }

    let isCancelled = false;

    const loadDuplicateSource = async () => {
      try {
        setLoading(true);
        setError(null);

        const sourceCalculation =
          await calculationService.getCalculation(duplicateFromId);

        if (isCancelled) {
          return;
        }

        const selectedPricelistIds = Array.isArray(
          sourceCalculation.metadata?.selectedPricelistIds,
        )
          ? sourceCalculation.metadata?.selectedPricelistIds.filter(Boolean)
          : sourceCalculation.pricelistId
            ? [sourceCalculation.pricelistId]
            : [];

        setFormState({
          name: sourceCalculation.name,
          calculationDate: TODAY_ISO,
          dueDate: sourceCalculation.dueDate
            ? sourceCalculation.dueDate.split("T")[0]
            : TODAY_ISO,
          subjectType:
            sourceCalculation.metadata?.subjectType ||
            (sourceCalculation.metadata?.clientId ? "client" : "self"),
          pricelistIds: operationType === "income" ? selectedPricelistIds : [],
          clientId: sourceCalculation.metadata?.clientId || "",
          caseId: sourceCalculation.caseId || "",
          description: sourceCalculation.description || "",
          internalNotes: sourceCalculation.internalNotes || "",
          items:
            sourceCalculation.items.length > 0
              ? sourceCalculation.items.map(createDraftItemFromCalculationItem)
              : [createDraftItem()],
        });
      } catch (err: any) {
        if (isCancelled) {
          return;
        }

        const backendMessage = err.response?.data?.message;
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(". ")
            : backendMessage || "Не вдалося підготувати дубль розрахунку",
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadDuplicateSource();

    return () => {
      isCancelled = true;
    };
  }, [duplicateFromId, isEditMode, operationType]);

  useEffect(() => {
    if (!operationType || !editCalculationId) {
      return;
    }

    let isCancelled = false;

    const loadEditableCalculation = async () => {
      try {
        setLoading(true);
        setError(null);

        const sourceCalculation =
          await calculationService.getCalculation(editCalculationId);

        if (isCancelled) {
          return;
        }

        setFormState({
          name: sourceCalculation.name,
          calculationDate: sourceCalculation.calculationDate
            ? sourceCalculation.calculationDate.split("T")[0]
            : TODAY_ISO,
          dueDate: sourceCalculation.dueDate
            ? sourceCalculation.dueDate.split("T")[0]
            : TODAY_ISO,
          subjectType:
            sourceCalculation.metadata?.subjectType ||
            (sourceCalculation.metadata?.clientId ? "client" : "self"),
          pricelistIds: Array.isArray(
            sourceCalculation.metadata?.selectedPricelistIds,
          )
            ? sourceCalculation.metadata.selectedPricelistIds.filter(Boolean)
            : sourceCalculation.pricelistId
              ? [sourceCalculation.pricelistId]
              : [],
          clientId: sourceCalculation.metadata?.clientId || "",
          caseId: sourceCalculation.caseId || "",
          description: sourceCalculation.description || "",
          internalNotes: sourceCalculation.internalNotes || "",
          items:
            sourceCalculation.items.length > 0
              ? sourceCalculation.items.map(createDraftItemFromCalculationItem)
              : [createDraftItem()],
        });
      } catch (err: any) {
        if (isCancelled) {
          return;
        }

        const backendMessage = err.response?.data?.message;
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(". ")
            : backendMessage ||
                "Не вдалося завантажити розрахунок для редагування",
        );
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    void loadEditableCalculation();

    return () => {
      isCancelled = true;
    };
  }, [editCalculationId, operationType]);

  useEffect(() => {
    if (!formState.caseId) {
      return;
    }

    const selectedCase = cases.find(
      (caseItem) => caseItem.id === formState.caseId,
    );

    if (!selectedCase) {
      setFormState((current) => ({
        ...current,
        caseId: "",
      }));
      return;
    }

    if (formState.subjectType !== "client") {
      setFormState((current) => ({
        ...current,
        clientId: "",
        caseId: "",
      }));
      return;
    }

    if (formState.clientId && selectedCase.clientId !== formState.clientId) {
      setFormState((current) => ({
        ...current,
        caseId: "",
      }));
      return;
    }

    if (!formState.clientId) {
      setFormState((current) => ({
        ...current,
        clientId: selectedCase.clientId,
      }));
    }
  }, [cases, formState.caseId, formState.clientId, formState.subjectType]);

  const operationCopy = operationType ? OPERATION_COPY[operationType] : null;

  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const availableCases = useMemo(() => {
    if (formState.subjectType !== "client") {
      return [];
    }

    if (!formState.clientId) {
      return cases;
    }

    return cases.filter((caseItem) => caseItem.clientId === formState.clientId);
  }, [cases, formState.clientId, formState.subjectType]);

  const selectedClient = formState.clientId
    ? clientMap.get(formState.clientId) || null
    : null;
  const selectedCase = formState.caseId
    ? cases.find((caseItem) => caseItem.id === formState.caseId) || null
    : null;
  const selectedPricelists = useMemo(
    () =>
      pricelists.filter((pricelist) =>
        formState.pricelistIds.includes(pricelist.id),
      ),
    [formState.pricelistIds, pricelists],
  );
  const availablePricelistOptions = useMemo<GroupedPricelistItemOption[]>(
    () =>
      selectedPricelists
        .flatMap((pricelist) =>
          [...(pricelist.items || [])]
            .filter((item) => item.isActive)
            .sort((left, right) => left.displayOrder - right.displayOrder)
            .map((item) => ({
              item,
              pricelistId: pricelist.id,
              pricelistName: pricelist.name,
              groupLabel: [
                pricelist.name,
                ...getPricelistItemPath(item, pricelist),
              ]
                .filter(Boolean)
                .join(" / "),
            })),
        )
        .sort((left, right) => {
          if (left.groupLabel === right.groupLabel) {
            return left.item.displayOrder - right.item.displayOrder;
          }

          return left.groupLabel.localeCompare(right.groupLabel, "uk-UA");
        }),
    [selectedPricelists],
  );
  const availablePricelistOptionMap = useMemo(
    () =>
      new Map(
        availablePricelistOptions.map((option) => [option.item.id, option]),
      ),
    [availablePricelistOptions],
  );
  const availablePricelistOptionGroups = useMemo(
    () =>
      availablePricelistOptions.reduce<
        Array<{ label: string; options: GroupedPricelistItemOption[] }>
      >((groups, option) => {
        const lastGroup = groups[groups.length - 1];

        if (lastGroup && lastGroup.label === option.groupLabel) {
          lastGroup.options.push(option);
          return groups;
        }

        groups.push({
          label: option.groupLabel,
          options: [option],
        });

        return groups;
      }, []),
    [availablePricelistOptions],
  );

  const totals = useMemo(
    () =>
      formState.items.reduce(
        (acc, item) => {
          const lineTotal = getDraftLineTotal(item);
          acc.total += lineTotal;
          return acc;
        },
        { total: 0 },
      ),
    [formState.items],
  );

  const updateFormState = <K extends keyof CalculationFormState>(
    field: K,
    value: CalculationFormState[K],
  ) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubjectTypeChange = (value: CalculationSubjectType) => {
    setFormState((current) => ({
      ...current,
      subjectType: value,
      clientId: value === "self" ? "" : current.clientId,
      caseId: value === "self" ? "" : current.caseId,
    }));
  };

  const handleClientChange = (clientId: string) => {
    setFormState((current) => {
      const shouldResetCase =
        current.caseId &&
        cases.some(
          (caseItem) =>
            caseItem.id === current.caseId && caseItem.clientId !== clientId,
        );

      return {
        ...current,
        clientId,
        caseId: shouldResetCase ? "" : current.caseId,
      };
    });
  };

  const handleCaseChange = (caseId: string) => {
    const selectedCase = cases.find((caseItem) => caseItem.id === caseId);

    setFormState((current) => ({
      ...current,
      caseId,
      clientId: selectedCase?.clientId || current.clientId,
    }));
  };

  const handlePricelistToggle = (pricelistId: string) => {
    setFormState((current) => ({
      ...current,
      pricelistIds: current.pricelistIds.includes(pricelistId)
        ? current.pricelistIds.filter((id) => id !== pricelistId)
        : [...current.pricelistIds, pricelistId],
    }));
  };

  const handlePricelistItemChange = (
    draftItemId: string,
    pricelistItemId: string,
  ) => {
    const selectedPricelistOption =
      availablePricelistOptionMap.get(pricelistItemId);
    const selectedPricelistItem = selectedPricelistOption?.item || null;

    setFormState((current) => ({
      ...current,
      items: current.items.map((item) => {
        if (item.id !== draftItemId) {
          return item;
        }

        if (!selectedPricelistItem) {
          return {
            ...item,
            pricelistItemId: "",
          };
        }

        return {
          ...item,
          pricelistItemId: selectedPricelistItem.id,
          description: selectedPricelistItem.name,
          code: selectedPricelistItem.code || "",
          unitType: selectedPricelistItem.unitType,
          quantity: String(selectedPricelistItem.minQuantity ?? 1),
          duration: minutesToHoursValue(selectedPricelistItem.defaultDuration),
          unitPrice: String(selectedPricelistItem.basePrice ?? ""),
        };
      }),
    }));
  };

  useEffect(() => {
    if (operationType !== "income") {
      return;
    }

    setFormState((current) => {
      let hasChanges = false;

      const nextItems = current.items.map((item) => {
        if (!item.pricelistItemId) {
          return item;
        }

        if (availablePricelistOptionMap.has(item.pricelistItemId)) {
          return item;
        }

        hasChanges = true;
        return {
          ...item,
          pricelistItemId: "",
          description: "",
          code: "",
          unitType: "piecewise",
          quantity: "1",
          duration: "1",
          unitPrice: "",
        };
      });

      return hasChanges
        ? {
            ...current,
            items: nextItems,
          }
        : current;
    });
  }, [availablePricelistOptionMap, operationType]);

  const handleItemChange = (
    itemId: string,
    field: keyof DraftCalculationItem,
    value: string,
  ) => {
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }));
  };

  const handleAddItem = () => {
    setFormState((current) => ({
      ...current,
      items: [...current.items, createDraftItem()],
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setFormState((current) => ({
      ...current,
      items:
        current.items.length > 1
          ? current.items.filter((item) => item.id !== itemId)
          : current.items,
    }));
  };

  const validateForm = (): string | null => {
    if (!operationType) {
      return "Оберіть тип розрахунку.";
    }

    if (!formState.name.trim()) {
      return "Вкажіть назву розрахунку.";
    }

    if (!formState.calculationDate) {
      return "Вкажіть дату розрахунку.";
    }

    if (operationType === "income" && formState.pricelistIds.length === 0) {
      return "Оберіть хоча б один прайс-лист.";
    }

    if (formState.subjectType === "client" && !formState.clientId) {
      return "Для клієнтського розрахунку потрібно обрати клієнта.";
    }

    if (formState.items.length === 0) {
      return "Додайте хоча б одну позицію розрахунку.";
    }

    for (const [index, item] of formState.items.entries()) {
      if (operationType === "income" && !item.pricelistItemId) {
        return `Позиція ${index + 1}: оберіть послугу з прайс-листа.`;
      }

      if (!item.description.trim()) {
        return `Позиція ${index + 1}: заповніть опис послуги або витрати.`;
      }

      if (item.unitType === "hourly") {
        if (parseNumber(item.duration) <= 0) {
          return `Позиція ${index + 1}: вкажіть тривалість у хвилинах.`;
        }
      } else if (parseNumber(item.quantity) <= 0) {
        return `Позиція ${index + 1}: вкажіть кількість більше нуля.`;
      }

      if (parseNumber(item.unitPrice) < 0) {
        return `Позиція ${index + 1}: вартість не може бути від'ємною.`;
      }
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (!operationType) {
      return;
    }

    const metadata: CreateCalculationDto["metadata"] =
      formState.subjectType === "client" && selectedClient
        ? {
            clientId: selectedClient.id,
            clientDisplayName: getClientDisplayName(selectedClient),
            subjectDisplayName: getClientDisplayName(selectedClient),
            subjectType: "client",
            operationType,
            ...(operationType === "income"
              ? {
                  selectedPricelistIds: formState.pricelistIds,
                  selectedPricelistNames: selectedPricelists.map(
                    (pricelist) => pricelist.name,
                  ),
                }
              : {}),
          }
        : {
            subjectDisplayName: "Власний облік",
            subjectType: "self",
            operationType,
            ...(operationType === "income"
              ? {
                  selectedPricelistIds: formState.pricelistIds,
                  selectedPricelistNames: selectedPricelists.map(
                    (pricelist) => pricelist.name,
                  ),
                }
              : {}),
          };

    const payload: CreateCalculationDto = {
      caseId:
        formState.subjectType === "client" && formState.caseId
          ? formState.caseId
          : undefined,
      name: formState.name.trim(),
      calculationDate: formState.calculationDate,
      dueDate: formState.dueDate || undefined,
      description: formState.description.trim() || undefined,
      pricelistId:
        operationType === "income"
          ? formState.pricelistIds.length === 1
            ? formState.pricelistIds[0]
            : undefined
          : undefined,
      internalNotes: formState.internalNotes.trim() || undefined,
      metadata,
      items: formState.items.map((item) => ({
        description: item.description.trim(),
        pricelistItemId: item.pricelistItemId || undefined,
        code: item.code.trim() || undefined,
        unitType: item.unitType,
        quantity:
          item.unitType === "hourly" ? undefined : parseNumber(item.quantity),
        duration:
          item.unitType === "hourly"
            ? hoursToMinutesValue(item.duration)
            : undefined,
        unitPrice: parseNumber(item.unitPrice),
      })),
    };

    try {
      setSaving(true);
      setError(null);
      const savedCalculation =
        isEditMode && editCalculationId
          ? await calculationService.updateCalculation(
              editCalculationId,
              payload,
            )
          : await calculationService.createCalculation(payload);
      navigate(`/calculations/${savedCalculation.id}`, { replace: true });
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(". ")
          : backendMessage || "Не вдалося створити розрахунок",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (!operationType || !operationCopy) {
    return (
      <div className="calculation-create-page">
        <Breadcrumbs
          items={[
            { label: "Головна", to: "/dashboard" },
            { label: "Розрахунки", to: "/calculations" },
            { label: "Новий розрахунок" },
          ]}
        />

        <PageHeader
          title="Новий розрахунок"
          subtitle="Оберіть, який тип розрахунку потрібно відкрити для створення."
          actions={
            <Link className="btn btn-outline" to="/calculations">
              <ArrowLeft size={18} />
              До реєстру
            </Link>
          }
        />

        <section className="calculation-type-selector">
          <Link
            to="/calculations/add?type=income"
            className="content-surface calculation-type-card calculation-type-card--income"
          >
            <strong>Прибутковий розрахунок</strong>
            <p>
              Надходження від клієнта, оплата послуг, погодинні чи фіксовані
              роботи.
            </p>
            <span>Відкрити форму</span>
          </Link>

          <Link
            to="/calculations/add?type=expense"
            className="content-surface calculation-type-card calculation-type-card--expense"
          >
            <strong>Видатковий розрахунок</strong>
            <p>
              Внутрішні витрати, виплати контрагентам або витрати по справі.
            </p>
            <span>Відкрити форму</span>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="calculation-create-page">
      <Breadcrumbs
        items={[
          { label: "Головна", to: "/dashboard" },
          { label: "Розрахунки", to: "/calculations" },
          { label: `${operationCopy.title} розрахунок` },
        ]}
      />

      <PageHeader
        title={`${isEditMode ? "Редагування" : operationCopy.title} розрахунку`}
        actions={
          <div className="calculation-create-header-actions">
            <Link className="btn btn-outline" to="/calculations">
              <ArrowLeft size={18} />
              До реєстру
            </Link>
          </div>
        }
      />

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form className="calculation-create-form" onSubmit={handleSubmit}>
        <div className="calculation-create-layout">
          <div className="calculation-create-main">
            <section className="content-surface calculation-create-card">
              <div className="calculation-create-card__header">
                <strong>Основні дані</strong>
              </div>

              <div className="calculation-create-grid">
                <div className="form-group calculation-create-grid__wide">
                  <label className="form-label" htmlFor="calculation-name">
                    Назва <span className="required">*</span>
                  </label>
                  <input
                    id="calculation-name"
                    className="form-input"
                    value={formState.name}
                    onChange={(event) =>
                      updateFormState("name", event.target.value)
                    }
                    placeholder="Наприклад, розрахунок по справі №..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="calculation-date">
                    Дата розрахунку <span className="required">*</span>
                  </label>
                  <input
                    id="calculation-date"
                    type="date"
                    className="form-input"
                    value={formState.calculationDate}
                    onChange={(event) =>
                      updateFormState("calculationDate", event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="calculation-due-date">
                    Строк оплати
                  </label>
                  <input
                    id="calculation-due-date"
                    type="date"
                    className="form-input"
                    value={formState.dueDate}
                    onChange={(event) =>
                      updateFormState("dueDate", event.target.value)
                    }
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="calculation-subject">
                    Суб'єкт
                  </label>
                  <select
                    id="calculation-subject"
                    className="form-select"
                    value={formState.subjectType}
                    onChange={(event) =>
                      handleSubjectTypeChange(
                        event.target.value as CalculationSubjectType,
                      )
                    }
                  >
                    <option value="client">Клієнт</option>
                    <option value="self">Власний облік</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="calculation-client">
                    Клієнт
                  </label>
                  <select
                    id="calculation-client"
                    className="form-select"
                    value={formState.clientId}
                    onChange={(event) => handleClientChange(event.target.value)}
                    disabled={formState.subjectType === "self"}
                  >
                    <option value="">
                      {formState.subjectType === "self"
                        ? "Для власного обліку не потрібен"
                        : "Оберіть клієнта"}
                    </option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {getClientDisplayName(client)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="calculation-case">
                    Справа
                  </label>
                  <select
                    id="calculation-case"
                    className="form-select"
                    value={formState.caseId}
                    onChange={(event) => handleCaseChange(event.target.value)}
                    disabled={formState.subjectType === "self"}
                  >
                    <option value="">
                      {formState.subjectType === "self"
                        ? "Для власного обліку не потрібна"
                        : "Без прив'язки до справи"}
                    </option>
                    {availableCases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {getCaseDisplayName(caseItem)}
                      </option>
                    ))}
                  </select>
                </div>

                {operationType === "income" && (
                  <div className="form-group calculation-create-grid__wide">
                    <span className="form-label">
                      Прайс-листи <span className="required">*</span>
                    </span>
                    <div className="calculation-create-pricelist-picker">
                      {pricelists.map((pricelist) => (
                        <label
                          key={pricelist.id}
                          className="calculation-create-pricelist-option"
                        >
                          <input
                            type="checkbox"
                            checked={formState.pricelistIds.includes(
                              pricelist.id,
                            )}
                            onChange={() => handlePricelistToggle(pricelist.id)}
                          />
                          <span>{pricelist.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="form-group calculation-create-grid__wide">
                  <label
                    className="form-label"
                    htmlFor="calculation-description"
                  >
                    Опис
                  </label>
                  <textarea
                    id="calculation-description"
                    className="form-textarea"
                    value={formState.description}
                    onChange={(event) =>
                      updateFormState("description", event.target.value)
                    }
                    placeholder="Короткий опис призначення розрахунку"
                  />
                </div>

                <div className="form-group calculation-create-grid__wide">
                  <label className="form-label" htmlFor="calculation-notes">
                    Службові примітки
                  </label>
                  <textarea
                    id="calculation-notes"
                    className="form-textarea"
                    value={formState.internalNotes}
                    onChange={(event) =>
                      updateFormState("internalNotes", event.target.value)
                    }
                    placeholder="Внутрішні коментарі для бухгалтерії або команди"
                  />
                </div>
              </div>
            </section>

            <section className="content-surface calculation-create-card">
              <div className="calculation-create-card__header">
                <strong>Позиції розрахунку</strong>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handleAddItem}
                >
                  <Plus size={18} />
                  Додати позицію
                </button>
              </div>

              <div className="calculation-create-items">
                {formState.items.map((item, index) => (
                  <article key={item.id} className="calculation-create-item">
                    <div className="calculation-create-item__header">
                      <strong>{`Позиція ${index + 1}`}</strong>
                      <button
                        type="button"
                        className="btn btn-ghost calculation-create-item__remove"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={formState.items.length === 1}
                      >
                        <Trash2 size={16} />
                        Видалити
                      </button>
                    </div>

                    <div className="calculation-create-item__grid">
                      {operationType === "income" && (
                        <div className="form-group calculation-create-item__pricelist">
                          <label className="form-label">
                            Послуга з прайс-листа
                          </label>
                          <select
                            className="form-select"
                            value={item.pricelistItemId}
                            onChange={(event) =>
                              handlePricelistItemChange(
                                item.id,
                                event.target.value,
                              )
                            }
                            disabled={
                              availablePricelistOptionGroups.length === 0
                            }
                          >
                            <option value="">
                              {availablePricelistOptionGroups.length > 0
                                ? "Оберіть послугу"
                                : "Спочатку оберіть один або кілька прайсів"}
                            </option>
                            {availablePricelistOptionGroups.map((group) => (
                              <optgroup key={group.label} label={group.label}>
                                {group.options.map((option) => (
                                  <option
                                    key={option.item.id}
                                    value={option.item.id}
                                  >
                                    {option.item.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="form-group calculation-create-item__wide">
                        <label className="form-label">Опис позиції</label>
                        <input
                          className="form-input"
                          value={item.description}
                          onChange={(event) =>
                            handleItemChange(
                              item.id,
                              "description",
                              event.target.value,
                            )
                          }
                          placeholder="Назва послуги, витрати або етапу робіт"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Код</label>
                        <input
                          className="form-input"
                          value={item.code}
                          onChange={(event) =>
                            handleItemChange(
                              item.id,
                              "code",
                              event.target.value,
                            )
                          }
                          placeholder="Необов'язково"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Тип обліку</label>
                        <select
                          className="form-select"
                          value={item.unitType}
                          onChange={(event) =>
                            handleItemChange(
                              item.id,
                              "unitType",
                              event.target.value,
                            )
                          }
                        >
                          <option value="piecewise">Поштучно</option>
                          <option value="fixed">Фіксовано</option>
                          <option value="hourly">Погодинно</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          {getUnitFieldLabel(item.unitType)}
                        </label>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          step={item.unitType === "hourly" ? "0.25" : "1"}
                          value={
                            item.unitType === "hourly"
                              ? item.duration
                              : item.quantity
                          }
                          onChange={(event) =>
                            handleItemChange(
                              item.id,
                              item.unitType === "hourly"
                                ? "duration"
                                : "quantity",
                              event.target.value,
                            )
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Ціна за одиницю</label>
                        <input
                          className="form-input"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) =>
                            handleItemChange(
                              item.id,
                              "unitPrice",
                              event.target.value,
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="calculation-create-item__total">
                        <span>Разом</span>
                        <strong>
                          {formatCurrency(getDraftLineTotal(item))}
                        </strong>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="calculation-create-sidebar">
            <section className="content-surface calculation-create-card calculation-create-summary">
              <div className="calculation-create-card__header">
                <strong>Підсумок</strong>
              </div>

              <dl className="calculation-create-summary__list">
                <div>
                  <dt>Тип операції</dt>
                  <dd>{operationCopy.title}</dd>
                </div>
                {operationType === "income" && (
                  <div>
                    <dt>Прайс-листи</dt>
                    <dd>
                      {selectedPricelists.length > 0
                        ? selectedPricelists
                            .map((pricelist) => pricelist.name)
                            .join(", ")
                        : "Не обрано"}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Суб'єкт</dt>
                  <dd>
                    {formState.subjectType === "client"
                      ? selectedClient
                        ? getClientDisplayName(selectedClient)
                        : "Клієнт не обраний"
                      : "Власний облік"}
                  </dd>
                </div>
                <div>
                  <dt>Справа</dt>
                  <dd>
                    {selectedCase
                      ? getCaseDisplayName(selectedCase)
                      : "Без прив'язки"}
                  </dd>
                </div>
                <div>
                  <dt>Позицій</dt>
                  <dd>{formState.items.length}</dd>
                </div>
                <div>
                  <dt>Загальна сума</dt>
                  <dd>{formatCurrency(totals.total)}</dd>
                </div>
              </dl>
            </section>
          </aside>
        </div>

        <FormActionBar title="Дії з розрахунком">
          <Link className="btn btn-outline" to="/calculations">
            Скасувати
          </Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} />
            {saving
              ? "Збереження..."
              : isEditMode
                ? "Зберегти зміни"
                : "Створити розрахунок"}
          </button>
        </FormActionBar>
      </form>
    </div>
  );
};

export default CalculationCreatePage;
