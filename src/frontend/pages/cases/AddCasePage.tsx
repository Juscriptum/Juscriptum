import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, FormProvider } from "react-hook-form";
import {
  createCaseSchema,
  CreateCaseFormData,
  DEFAULT_CASE_VALUES,
} from "../../schemas/case.schema";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { Client } from "../../types/client.types";
import { CaseRegistrySearchResult } from "../../types/case.types";
import { Alert } from "../../components/Alert";
import { Spinner } from "../../components/Spinner";
import { FormActionBar } from "../../components/FormActionBar";
import { PageHeader } from "../../components/PageHeader";
import { RegistrySearchOverlay } from "../../components/RegistrySearchOverlay";
import { Breadcrumbs } from "../../components/navigation";
import { CaseFormSections } from "../../components/cases";
import { useAuth } from "../../hooks/useAuth";
import { Save, Calendar, Plus, Search } from "lucide-react";
import {
  buildLegacyParticipantFields,
  buildParticipantMetadata,
  extractParticipantsFromCase,
  normalizeParticipants,
} from "../../utils/caseParticipants";
import { normalizeCaseTypeForForm } from "../../utils/caseCategories";
import { buildRegistryParticipantsFromPrefill } from "../../utils/caseRegistryPrefill";
import "./AddCasePage.css";

const COURT_REGISTRY_PREFILL_STORAGE_KEY =
  "law-organizer.court-registry-prefill";
const TODAY_ISO = new Date().toISOString().split("T")[0];

interface CourtRegistryPrefill {
  source?: "court_registry" | "asvp";
  person: string;
  role: string;
  caseDescription: string;
  caseNumber: string;
  courtName: string;
  caseProc: string;
  registrationDate: string;
  judge: string;
  type: string;
  stageDate: string;
  stageName: string;
  participants?: string;
  counterpartyName?: string;
  counterpartyRole?: string;
  enforcementState?: string;
}

/**
 * Add Case Page
 * Multi-section form for creating legal cases
 */
export const AddCasePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get("client_id");
  const duplicateFromId = searchParams.get("duplicateFrom");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [postSubmitAction, setPostSubmitAction] = useState<
    "case" | "hearing" | "note"
  >("case");
  const [registryPrefillNotice, setRegistryPrefillNotice] = useState<
    string | null
  >(null);
  const [isRegistrySearchOpen, setIsRegistrySearchOpen] = useState(false);
  const [registryQuery, setRegistryQuery] = useState("");
  const [registryDateFrom, setRegistryDateFrom] = useState("");
  const [registryDateTo, setRegistryDateTo] = useState(TODAY_ISO);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [registryError, setRegistryError] = useState<string | null>(null);
  const [registryResults, setRegistryResults] = useState<
    CaseRegistrySearchResult[]
  >([]);
  const [selectedRegistryRecord, setSelectedRegistryRecord] =
    useState<CaseRegistrySearchResult | null>(null);
  const [caseNumberLoading, setCaseNumberLoading] = useState(false);

  const methods = useForm<CreateCaseFormData>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      ...DEFAULT_CASE_VALUES,
      clientId: preselectedClientId || "",
      assignedLawyerId: user?.id || "",
    } as CreateCaseFormData,
    mode: "onTouched",
  });

  const { handleSubmit, reset, setValue, watch } = methods;
  const selectedClientId = watch("clientId");
  const selectedClient =
    clients.find((client) => client.id === selectedClientId) || null;

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (preselectedClientId) {
      setValue("clientId", preselectedClientId, { shouldValidate: true });
    }
  }, [preselectedClientId, setValue]);

  useEffect(() => {
    if (user?.id) {
      setValue("assignedLawyerId", user.id, { shouldDirty: false });
    }
  }, [setValue, user?.id]);

  useEffect(() => {
    if (!duplicateFromId) {
      return;
    }

    let isCancelled = false;

    const loadDuplicateSource = async () => {
      try {
        setLoading(true);
        setError(null);

        const sourceCase = await caseService.getCase(duplicateFromId);

        if (isCancelled) {
          return;
        }

        reset({
          ...DEFAULT_CASE_VALUES,
          caseNumber: "",
          registryCaseNumber: sourceCase.registryCaseNumber || "",
          caseType: normalizeCaseTypeForForm(sourceCase.caseType),
          clientId: sourceCase.clientId || "",
          assignedLawyerId: sourceCase.assignedLawyerId || user?.id || "",
          title: sourceCase.title || "",
          description: sourceCase.description || "",
          caseSubcategory: sourceCase.metadata?.caseSubcategory || "",
          priority: sourceCase.priority,
          startDate: TODAY_ISO,
          deadlineDate: sourceCase.deadlineDate
            ? sourceCase.deadlineDate.split("T")[0]
            : "",
          estimatedAmount: sourceCase.estimatedAmount,
          courtFee: sourceCase.courtFee,
          courtName: sourceCase.courtName || "",
          courtAddress: sourceCase.courtAddress || "",
          judgeName: sourceCase.judgeName || "",
          proceedingStage: sourceCase.proceedingStage || "",
          plaintiffName: sourceCase.plaintiffName || "",
          defendantName: sourceCase.defendantName || "",
          thirdParties: sourceCase.thirdParties || "",
          participants: extractParticipantsFromCase(sourceCase),
          internalNotes: sourceCase.internalNotes || "",
          clientNotes: sourceCase.clientNotes || "",
          metadata: sourceCase.metadata || {},
        } as CreateCaseFormData);

        setRegistryPrefillNotice(null);
        setSelectedRegistryRecord(null);
      } catch (err: any) {
        if (isCancelled) {
          return;
        }

        const backendMessage = err.response?.data?.message;
        setError(
          Array.isArray(backendMessage)
            ? backendMessage.join(". ")
            : backendMessage || "Не вдалося підготувати дубль справи",
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
  }, [duplicateFromId, reset, user?.id]);

  useEffect(() => {
    const rawPrefill = sessionStorage.getItem(
      COURT_REGISTRY_PREFILL_STORAGE_KEY,
    );

    if (!rawPrefill) {
      return;
    }

    try {
      const prefill = JSON.parse(rawPrefill) as CourtRegistryPrefill;
      applyRegistryPrefill(prefill, false);

      setRegistryPrefillNotice(
        `Поля справи попередньо заповнено з реєстру для "${prefill.person}".`,
      );
    } catch (prefillError) {
      console.error("Failed to parse court registry prefill:", prefillError);
    } finally {
      sessionStorage.removeItem(COURT_REGISTRY_PREFILL_STORAGE_KEY);
    }
  }, [setValue]);

  useEffect(() => {
    if (!selectedClient) {
      setValue("caseNumber", "", { shouldDirty: false });
      return;
    }

    setRegistryQuery(buildClientRegistryQuery(selectedClient));
    void loadNextCaseNumber(selectedClient.id);
  }, [selectedClient]);

  const loadClients = async () => {
    try {
      setClientsLoading(true);
      setClients(await clientService.getAllClients());
    } catch (err: any) {
      console.error("Failed to load clients:", err);
    } finally {
      setClientsLoading(false);
    }
  };

  const loadNextCaseNumber = async (clientId: string) => {
    try {
      setCaseNumberLoading(true);
      const response = await caseService.getNextCaseNumber(clientId);
      setValue("caseNumber", response.caseNumber, {
        shouldDirty: false,
        shouldValidate: true,
      });
    } catch (err) {
      console.error("Failed to load next case number:", err);
      setValue("caseNumber", "", { shouldDirty: false });
    } finally {
      setCaseNumberLoading(false);
    }
  };

  const applyRegistryPrefill = (
    prefill: CourtRegistryPrefill,
    shouldDirty: boolean,
  ) => {
    if (prefill.source === "asvp") {
      applyAsvpRegistryPrefill(prefill, shouldDirty, selectedClient);
      return;
    }

    setValue("registryCaseNumber", prefill.caseNumber, { shouldDirty });
    setValue("caseType", "judicial_case", { shouldDirty });
    setValue("title", prefill.caseDescription, { shouldDirty });
    setValue("description", prefill.caseDescription, { shouldDirty });
    setValue("courtName", prefill.courtName, { shouldDirty });
    setValue("judgeName", prefill.judge, { shouldDirty });

    const participants = buildRegistryParticipantsFromPrefill(prefill);
    const legacyFields = buildLegacyParticipantFields(participants);
    setValue("participants", participants, { shouldDirty });
    setValue("plaintiffName", legacyFields.plaintiffName, { shouldDirty });
    setValue("defendantName", legacyFields.defendantName, { shouldDirty });
    setValue("thirdParties", legacyFields.thirdParties, { shouldDirty });

    const registrationDate = convertRegistryDate(prefill.registrationDate);
    if (registrationDate) {
      setValue("startDate", registrationDate, { shouldDirty });
    }

    setValue(
      "internalNotes",
      [
        "Імпортовано з реєстру судових справ.",
        `Особа: ${prefill.person}`,
        `Роль: ${prefill.role || "не вказано"}`,
        `Номер провадження: ${prefill.caseProc || "не вказано"}`,
        `Тип запису: ${prefill.type || "не вказано"}`,
        `Стан: ${prefill.stageName || "не вказано"}`,
        `Дата стадії: ${prefill.stageDate || "не вказано"}`,
      ].join("\n"),
      { shouldDirty },
    );
  };

  const applyAsvpRegistryPrefill = (
    prefill: CourtRegistryPrefill,
    shouldDirty: boolean,
    client: Client | null,
  ) => {
    setValue("registryCaseNumber", prefill.caseNumber, { shouldDirty });
    setValue("caseType", "enforcement_proceeding", { shouldDirty });
    setValue("proceedingStage", "Виконавче провадження", { shouldDirty });
    setValue("title", `Виконавче провадження № ${prefill.caseNumber}`, {
      shouldDirty,
    });
    setValue(
      "description",
      prefill.caseDescription || prefill.enforcementState || "",
      { shouldDirty },
    );
    setValue("courtName", prefill.courtName, { shouldDirty });
    setValue("judgeName", "", { shouldDirty });

    const participants = buildRegistryParticipantsFromPrefill(prefill);
    const legacyFields = buildLegacyParticipantFields(participants);
    setValue("participants", participants, { shouldDirty });
    setValue("plaintiffName", legacyFields.plaintiffName, { shouldDirty });
    setValue("defendantName", legacyFields.defendantName, { shouldDirty });
    setValue("thirdParties", legacyFields.thirdParties, { shouldDirty });

    const registrationDate = convertRegistryDateTime(prefill.registrationDate);
    if (registrationDate) {
      setValue("startDate", registrationDate, { shouldDirty });
    }

    const clientName = client ? buildClientRegistryQuery(client) : "";
    setValue(
      "internalNotes",
      [
        "Імпортовано з реєстру АСВП.",
        `Клієнт: ${clientName || prefill.person}`,
        `Статус клієнта: ${prefill.role || "не вказано"}`,
        `Інший учасник: ${
          prefill.counterpartyName
            ? `${prefill.counterpartyRole || "Учасник"}: ${prefill.counterpartyName}`
            : "не вказано"
        }`,
        `Стан провадження: ${prefill.enforcementState || "не вказано"}`,
      ].join("\n"),
      { shouldDirty },
    );
  };

  const handleCourtRegistrySearch = async () => {
    const autoQuery = selectedClient
      ? buildClientRegistryQuery(selectedClient)
      : "";
    const trimmedQuery = (registryQuery || autoQuery).trim();

    if (!trimmedQuery) {
      setRegistryError("Оберіть клієнта з ПІБ або введіть запит вручну.");
      setRegistryResults([]);
      return;
    }

    try {
      setRegistryLoading(true);
      setRegistryError(null);
      setRegistryQuery(trimmedQuery);
      const results = await caseService.searchRegistries({
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

  const onSubmit = async (
    data: CreateCaseFormData,
    action: "case" | "hearing" | "note" = "case",
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { participants, caseSubcategory, ...caseData } = data;
      const normalizedParticipants = normalizeParticipants(data.participants);
      const legacyFields = buildLegacyParticipantFields(normalizedParticipants);
      const newCase = await caseService.createCase({
        ...caseData,
        ...legacyFields,
        estimatedAmount:
          typeof data.estimatedAmount === "number"
            ? data.estimatedAmount
            : undefined,
        courtFee: typeof data.courtFee === "number" ? data.courtFee : undefined,
        assignedLawyerId: data.assignedLawyerId || user?.id || "",
        metadata: {
          ...buildParticipantMetadata(data.metadata, normalizedParticipants),
          caseSubcategory: (caseSubcategory || "").trim(),
        },
      } as any);

      if (action === "hearing") {
        navigate(`/events/add?caseId=${newCase.id}`);
      } else if (action === "note") {
        navigate(
          `/notes?caseId=${newCase.id}&clientId=${newCase.clientId}&new=1`,
        );
      } else {
        navigate(`/cases/${newCase.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Помилка створення справи");
    } finally {
      setLoading(false);
    }
  };

  const getClientDisplayName = (client: Client): string => {
    const personalName =
      `${client.lastName || ""} ${client.firstName || ""} ${client.patronymic || ""}`.trim();

    if (client.type !== "legal_entity" && personalName) {
      return personalName;
    }

    return client.companyName || "Невідома компанія";
  };

  return (
    <div className="add-case-page">
      <Breadcrumbs />

      <PageHeader
        title="Нова справа"
        actions={
          <Link to="/clients/add" className="btn btn-outline">
            <Plus size={18} />
            Додати клієнта
          </Link>
        }
      />

      {registryPrefillNotice && (
        <Alert type="info" onClose={() => setRegistryPrefillNotice(null)}>
          {registryPrefillNotice}
        </Alert>
      )}
      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit((data) => onSubmit(data, postSubmitAction))}
        >
          <div className="case-toolbar">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => setIsRegistrySearchOpen(true)}
              disabled={loading}
            >
              <Search size={18} />
              Пошук справи в реєстрах
            </button>
          </div>

          <CaseFormSections
            methods={methods}
            clients={clients}
            clientsLoading={clientsLoading}
            getClientDisplayName={getClientDisplayName}
            caseNumberReadOnly
          />

          {caseNumberLoading && (
            <Alert type="info">
              Формується наступний номер справи для обраного клієнта…
            </Alert>
          )}

          <FormActionBar title="Дії зі справою">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/cases")}
              disabled={loading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn btn-outline"
              disabled={loading}
              onClick={() => setPostSubmitAction("case")}
            >
              {loading && postSubmitAction === "case" ? (
                <>
                  <Spinner size="small" />
                  Збереження...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Зберегти
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              disabled={loading}
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
              disabled={loading}
              onClick={() => {
                setPostSubmitAction("hearing");
                handleSubmit((data) => onSubmit(data, "hearing"))();
              }}
            >
              {loading && postSubmitAction === "hearing" ? (
                <>
                  <Spinner size="small" />
                  Збереження...
                </>
              ) : (
                <>
                  <Calendar size={18} />
                  Зберегти та додати засідання
                </>
              )}
            </button>
          </FormActionBar>
        </form>
      </FormProvider>

      <RegistrySearchOverlay
        title="Пошук справи в державних реєстрах"
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

        {selectedRegistryRecord && (
          <Alert type="info" onClose={() => setSelectedRegistryRecord(null)}>
            Обрано справу `{selectedRegistryRecord.caseNumber}`. Дані вже
            перенесено у форму.
          </Alert>
        )}

        {registryResults.length > 0 && (
          <div className="registry-results-table-wrapper">
            <table className="registry-results-table">
              <thead>
                <tr>
                  <th>Особа</th>
                  <th>Роль</th>
                  <th>Джерело</th>
                  <th>Назва справи</th>
                  <th>№ справи</th>
                  <th>Установа</th>
                  <th>Дія</th>
                </tr>
              </thead>
              <tbody>
                {registryResults.map((result) => (
                  <tr
                    key={`${result.caseNumber}-${result.person}-${result.courtName}`}
                  >
                    <td>{result.person}</td>
                    <td>{result.role || "Не вказано"}</td>
                    <td>{result.sourceLabel}</td>
                    <td>
                      {result.source === "asvp"
                        ? result.enforcementState || "Без опису"
                        : result.caseDescription || "Без опису"}
                    </td>
                    <td>{result.caseNumber}</td>
                    <td>{result.courtName}</td>
                    <td>
                      <button
                        type="button"
                        className={`btn ${selectedRegistryRecord?.caseNumber === result.caseNumber && selectedRegistryRecord?.person === result.person && selectedRegistryRecord?.courtName === result.courtName ? "btn-primary" : "btn-outline"} registry-select-btn`}
                        onClick={() => {
                          setSelectedRegistryRecord(result);
                          applyRegistryPrefill(result, true);
                          setRegistryPrefillNotice(
                            `Поля справи заповнено з реєстру для "${result.person}".`,
                          );
                        }}
                      >
                        {selectedRegistryRecord?.caseNumber ===
                          result.caseNumber &&
                        selectedRegistryRecord?.person === result.person &&
                        selectedRegistryRecord?.courtName === result.courtName
                          ? "Обрано"
                          : "Обрати справу"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RegistrySearchOverlay>
    </div>
  );
};

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

const convertRegistryDateTime = (value?: string): string => {
  if (!value) {
    return "";
  }

  const datePart = value.split(" ")[0];
  return convertRegistryDate(datePart);
};

const buildClientRegistryQuery = (client: Client): string => {
  if (client.type === "legal_entity") {
    return client.companyName?.trim() || "";
  }

  return [client.lastName, client.firstName, client.patronymic]
    .filter(Boolean)
    .join(" ")
    .trim();
};

export default AddCasePage;
