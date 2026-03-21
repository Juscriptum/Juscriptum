import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createClientSchema,
  CreateClientFormData,
} from "../../schemas/client.schema";
import { clientService } from "../../services/client.service";
import {
  ClientType,
  CourtRegistrySearchResult,
} from "../../types/client.types";
import {
  transformFormData,
  validateTransformedData,
} from "../../utils/clientDataTransform";
import {
  getDefaultClientFormData,
  mapClientToFormData,
} from "../../utils/clientFormData";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { FormActionBar } from "../../components/FormActionBar";
import { RegistrySearchOverlay } from "../../components/RegistrySearchOverlay";
import { ClientForm } from "../../components/clients";
import { Plus, Save, Search } from "lucide-react";
import "./AddClientPage.css";

const COURT_REGISTRY_PREFILL_STORAGE_KEY =
  "law-organizer.court-registry-prefill";
const TODAY_ISO = new Date().toISOString().split("T")[0];

export const AddClientPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const duplicateFromId = searchParams.get("duplicateFrom");
  const [loading, setLoading] = useState(false);
  const [clientNumberLoading, setClientNumberLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postSubmitAction, setPostSubmitAction] = useState<
    "client" | "case" | "note"
  >("client");
  const [isRegistrySearchOpen, setIsRegistrySearchOpen] = useState(false);
  const [registryQuery, setRegistryQuery] = useState("");
  const [registryDateFrom, setRegistryDateFrom] = useState("");
  const [registryDateTo, setRegistryDateTo] = useState(TODAY_ISO);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [registryResults, setRegistryResults] = useState<
    CourtRegistrySearchResult[]
  >([]);
  const [selectedRegistryRecord, setSelectedRegistryRecord] =
    useState<CourtRegistrySearchResult | null>(null);

  const methods = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: getDefaultClientFormData(),
    mode: "onTouched",
  });

  const { watch, handleSubmit, reset, setValue } = methods;
  const clientType = watch("type") as ClientType;

  useEffect(() => {
    const loadNextClientNumber = async () => {
      try {
        setClientNumberLoading(true);
        const response = await clientService.getNextClientNumber();
        setValue("client_number", response.clientNumber, {
          shouldDirty: false,
          shouldValidate: false,
        });
      } catch (err: any) {
        const backendMessage = err.response?.data?.message;
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(". ")
            : backendMessage || "Не вдалося отримати наступний номер клієнта",
        );
      } finally {
        setClientNumberLoading(false);
      }
    };

    loadNextClientNumber();
  }, [setValue]);

  useEffect(() => {
    if (!duplicateFromId) {
      return;
    }

    let isCancelled = false;

    const loadDuplicateSource = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sourceClient, nextNumberResponse] = await Promise.all([
          clientService.getClient(duplicateFromId),
          clientService.getNextClientNumber(),
        ]);

        if (isCancelled) {
          return;
        }

        const prefilledFormData = mapClientToFormData(sourceClient);
        reset({
          ...prefilledFormData,
          client_number: nextNumberResponse.clientNumber,
          registration_date: TODAY_ISO,
        });
        setSelectedRegistryRecord(null);
      } catch (err: any) {
        if (isCancelled) {
          return;
        }

        const backendMessage = err.response?.data?.message;
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(". ")
            : backendMessage || "Не вдалося підготувати дубль клієнта",
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
  }, [duplicateFromId, reset]);

  const onSubmit = async (
    data: CreateClientFormData,
    action: "client" | "case" | "note" = "client",
  ) => {
    setLoading(true);
    setError(null);
    try {
      const dto = transformFormData(data, clientType);
      const validationErrors = validateTransformedData(dto);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(". "));
        setLoading(false);
        return;
      }

      const client = await clientService.createClient(dto);

      if (action === "case") {
        if (selectedRegistryRecord) {
          sessionStorage.setItem(
            COURT_REGISTRY_PREFILL_STORAGE_KEY,
            JSON.stringify(selectedRegistryRecord),
          );
        } else {
          sessionStorage.removeItem(COURT_REGISTRY_PREFILL_STORAGE_KEY);
        }
        navigate(`/cases/add?client_id=${client.id}`);
      } else if (action === "note") {
        sessionStorage.removeItem(COURT_REGISTRY_PREFILL_STORAGE_KEY);
        navigate(`/notes?clientId=${client.id}&new=1`);
      } else {
        sessionStorage.removeItem(COURT_REGISTRY_PREFILL_STORAGE_KEY);
        navigate(`/clients/${client.id}`);
      }
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(". ")
          : backendMessage || "Помилка створення клієнта",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: ClientType) => {
    setValue("type", type, { shouldValidate: true, shouldDirty: true });
  };

  const handleCourtRegistrySearch = async () => {
    const trimmedQuery = registryQuery.trim();

    if (!trimmedQuery) {
      setRegistryError("Введіть ПІБ для пошуку у реєстрах");
      setRegistryResults([]);
      return;
    }

    try {
      setRegistryLoading(true);
      setRegistryError(null);
      const results = await clientService.searchCourtRegistry({
        query: trimmedQuery,
        dateFrom: registryDateFrom || undefined,
        dateTo: registryDateTo || undefined,
      });
      setRegistryResults(results);

      if (results.length === 0) {
        setSelectedRegistryRecord(null);
      }
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setRegistryError(
        Array.isArray(backendMessage)
          ? backendMessage.join(". ")
          : backendMessage || "Не вдалося виконати пошук у реєстрах",
      );
      setRegistryResults([]);
    } finally {
      setRegistryLoading(false);
    }
  };

  const handleRegistryRecordSelect = (result: CourtRegistrySearchResult) => {
    setSelectedRegistryRecord(result);
    setRegistryError(null);
    applyRegistryResultToClientForm(result);
    setIsRegistrySearchOpen(false);

    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  const applyRegistryResultToClientForm = (
    result: CourtRegistrySearchResult,
  ) => {
    const parsedName = splitFullName(result.person);

    setValue("type", "individual", { shouldDirty: true, shouldValidate: true });
    setValue("metadata.last_name", parsedName.lastName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("metadata.first_name", parsedName.firstName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("metadata.middle_name", parsedName.middleName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const registrationDate = convertRegistryDate(result.registrationDate);
    if (registrationDate) {
      setValue("registration_date", registrationDate, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }

    setValue(
      "comment",
      [
        "Імпортовано з реєстру судових справ.",
        `ПІБ з participants: ${result.person}`,
        `Роль у справі: ${result.role || "не вказано"}`,
        `Назва справи: ${result.caseDescription || "не вказано"}`,
        `№ справи: ${result.caseNumber || "не вказано"}`,
        `Суд: ${result.courtName || "не вказано"}`,
      ].join("\n"),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <div className="add-client-page">
      <PageHeader title="Новий клієнт" />

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedRegistryRecord && (
        <Alert type="info" onClose={() => setSelectedRegistryRecord(null)}>
          Дані з реєстру перенесено у форму клієнта. Перевірте поля та
          збережіть картку, коли будете готові.
        </Alert>
      )}

      <ClientForm
        methods={methods}
        clientType={clientType}
        onSubmit={(data) => onSubmit(data, postSubmitAction)}
        onTypeChange={handleTypeChange}
        allowTypeChange
        clientNumberReadOnly
        header={
          <div className="page-toolbar">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsRegistrySearchOpen(true)}
              disabled={loading}
            >
              <Search size={18} />
              Пошук у реєстрах
            </button>
          </div>
        }
        footer={
          <FormActionBar title="Дії з карткою клієнта">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsRegistrySearchOpen(true)}
              disabled={loading}
            >
              <Search size={18} />
              Пошук у реєстрах
            </button>
            <button
              type="submit"
              className="btn btn-outline"
              disabled={loading || clientNumberLoading}
              onClick={() => setPostSubmitAction("client")}
            >
              <Save size={18} />
              Зберегти клієнта
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={loading || clientNumberLoading}
              onClick={() => {
                setPostSubmitAction("note");
                handleSubmit((data) => onSubmit(data, "note"))();
              }}
            >
              {loading && postSubmitAction === "note" ? (
                <>
                  <Spinner size="small" />
                  Збереження...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Зберегти та додати нотатку
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || clientNumberLoading}
              onClick={() => {
                setPostSubmitAction("case");
                handleSubmit((data) => onSubmit(data, "case"))();
              }}
            >
              {loading && postSubmitAction === "case" ? (
                <>
                  <Spinner size="small" />
                  Збереження...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  {clientNumberLoading
                    ? "Завантаження номера..."
                    : "Зберегти та додати справу"}
                </>
              )}
            </button>
          </FormActionBar>
        }
      />

      <RegistrySearchOverlay
        title="Пошук клієнта в реєстрах"
        isOpen={isRegistrySearchOpen}
        isLoading={registryLoading}
        queryValue={registryQuery}
        dateFromValue={registryDateFrom}
        dateToValue={registryDateTo}
        emptyState="Поки що результатів немає"
        resultCount={registryResults.length}
        onClose={() => setIsRegistrySearchOpen(false)}
        onQueryChange={setRegistryQuery}
        onDateFromChange={setRegistryDateFrom}
        onDateToChange={setRegistryDateTo}
        onSearch={handleCourtRegistrySearch}
      >
        {registryError && (
          <Alert type="error" onClose={() => setRegistryError(null)}>
            {registryError}
          </Alert>
        )}

        {registryResults.length > 0 && (
          <div className="client-registry-results-table-wrapper">
            <table className="client-registry-results-table">
              <colgroup>
                <col className="client-registry-results-table__col client-registry-results-table__col--source" />
                <col className="client-registry-results-table__col client-registry-results-table__col--person" />
                <col className="client-registry-results-table__col client-registry-results-table__col--role" />
                <col className="client-registry-results-table__col client-registry-results-table__col--case" />
                <col className="client-registry-results-table__col client-registry-results-table__col--number" />
                <col className="client-registry-results-table__col client-registry-results-table__col--court" />
                <col className="client-registry-results-table__col client-registry-results-table__col--action" />
              </colgroup>
              <thead>
                <tr>
                  <th>Реєстр</th>
                  <th>Особа</th>
                  <th>Роль</th>
                  <th>Назва справи</th>
                  <th>№ справи</th>
                  <th>Суд</th>
                  <th>Дія</th>
                </tr>
              </thead>
              <tbody>
                {registryResults.map((result) => {
                  const isSelected =
                    selectedRegistryRecord?.caseNumber === result.caseNumber &&
                    selectedRegistryRecord?.person === result.person &&
                    selectedRegistryRecord?.courtName === result.courtName;

                  return (
                    <tr
                      key={`${result.caseNumber}-${result.person}-${result.courtName}`}
                    >
                      <td>{result.sourceLabel}</td>
                      <td>{result.person}</td>
                      <td>{result.role || "Не вказано"}</td>
                      <td>{result.caseDescription || "Без опису"}</td>
                      <td>{result.caseNumber}</td>
                      <td>{result.courtName}</td>
                      <td className="client-registry-results-table__action-cell">
                        <button
                          type="button"
                          className={`btn ${isSelected ? "btn-primary" : "btn-outline"} client-registry-select-btn`}
                          onClick={() => handleRegistryRecordSelect(result)}
                        >
                          {isSelected ? "Обрано" : "Заповнити"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </RegistrySearchOverlay>
    </div>
  );
};

export default AddClientPage;

const convertRegistryDate = (value?: string): string => {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return "";
  }

  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
};

const splitFullName = (
  value: string,
): { lastName: string; firstName: string; middleName: string } => {
  const parts = value.trim().replace(/\s+/g, " ").split(" ");

  return {
    lastName: parts[0] || "",
    firstName: parts[1] || "",
    middleName: parts.slice(2).join(" "),
  };
};
