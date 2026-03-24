import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../../components/Alert";
import { DateRangePicker } from "../../components/DateRangePicker";
import { Breadcrumbs } from "../../components/navigation";
import { PageHeader } from "../../components/PageHeader";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import { Spinner } from "../../components/Spinner";
import {
  RegistryFilterBar,
  RegistryFilterGroup,
  RegistrySearchField,
  RegistrySurface,
  RegistryTableShell,
} from "../../components/registry";
import { calculationService } from "../../services/calculation.service";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import {
  Calculation,
  CalculationFilters,
  CalculationOperationType,
  CalculationStatus,
} from "../../types/calculation.types";
import {
  DEFAULT_FETCH_LIMIT,
  formatCurrency,
  getCalculationStatusLabel,
  getCalculationSubjectLabel,
  getCaseDisplayName,
  getClientDisplayName,
  getOperationType,
  getOperationTypeLabel,
  getStatusBadgeClass,
} from "./calculationPage.utils";
import "./CalculationsPage.css";

interface RegistryFilters {
  search: string;
  operationType: "" | CalculationOperationType;
  clientId: string;
  caseId: string;
  status: "" | CalculationStatus;
  dateFrom: string;
  dateTo: string;
}

const INITIAL_FILTERS: RegistryFilters = {
  search: "",
  operationType: "",
  clientId: "",
  caseId: "",
  status: "",
  dateFrom: "",
  dateTo: "",
};

export const CalculationsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [registryFilters, setRegistryFilters] =
    useState<RegistryFilters>(INITIAL_FILTERS);
  const [pageLoading, setPageLoading] = useState(true);
  const [registryRefreshing, setRegistryRefreshing] = useState(false);
  const [busyCalculationId, setBusyCalculationId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPageData = async (showSpinner = true) => {
    try {
      if (showSpinner) {
        setPageLoading(true);
      } else {
        setRegistryRefreshing(true);
      }
      setError(null);

      const calculationFetchFilters: CalculationFilters = {
        limit: DEFAULT_FETCH_LIMIT,
        sortBy: "calculationDate",
        sortOrder: "DESC",
      };

      const [clientsData, casesResponse, calculationsData] = await Promise.all([
        clientService.getAllClients(),
        caseService.getCases({
          limit: 100,
          sortBy: "createdAt",
          sortOrder: "DESC",
        }),
        calculationService.getCalculations(calculationFetchFilters),
      ]);

      setClients(clientsData);
      setCases(casesResponse.data);
      setCalculations(calculationsData.data);
    } catch (err: any) {
      setError(err.message || "Не вдалося завантажити модуль розрахунків");
    } finally {
      if (showSpinner) {
        setPageLoading(false);
      } else {
        setRegistryRefreshing(false);
      }
    }
  };

  useEffect(() => {
    void loadPageData();
  }, []);

  useEffect(() => {
    if (!registryFilters.caseId) {
      return;
    }

    const selectedRegistryCase = cases.find(
      (caseItem) => caseItem.id === registryFilters.caseId,
    );

    if (
      !selectedRegistryCase ||
      (registryFilters.clientId &&
        selectedRegistryCase.clientId !== registryFilters.clientId)
    ) {
      setRegistryFilters((current) => ({
        ...current,
        caseId: "",
      }));
    }
  }, [cases, registryFilters.caseId, registryFilters.clientId]);

  const clientMap = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  );

  const caseMap = useMemo(
    () => new Map(cases.map((caseItem) => [caseItem.id, caseItem])),
    [cases],
  );

  const registryCaseOptions = useMemo(() => {
    if (!registryFilters.clientId) {
      return cases;
    }

    return cases.filter(
      (caseItem) => caseItem.clientId === registryFilters.clientId,
    );
  }, [cases, registryFilters.clientId]);

  const filteredCalculations = useMemo(() => {
    const normalizedSearch = registryFilters.search.trim().toLowerCase();

    return calculations.filter((calculation) => {
      const operation = getOperationType(calculation);
      const metadataClientId = calculation.metadata?.clientId || "";
      const linkedClient = metadataClientId
        ? clientMap.get(metadataClientId)
        : null;
      const caseItem =
        calculation.case ||
        (calculation.caseId ? caseMap.get(calculation.caseId) || null : null);
      const clientLabel = getCalculationSubjectLabel(calculation, linkedClient);
      const caseLabel = caseItem ? getCaseDisplayName(caseItem) : "";
      const searchText = [
        calculation.number,
        calculation.name,
        calculation.description,
        calculation.internalNotes,
        clientLabel,
        caseLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (normalizedSearch && !searchText.includes(normalizedSearch)) {
        return false;
      }

      if (
        registryFilters.operationType &&
        operation !== registryFilters.operationType
      ) {
        return false;
      }

      if (
        registryFilters.clientId &&
        metadataClientId !== registryFilters.clientId
      ) {
        return false;
      }

      if (
        registryFilters.caseId &&
        calculation.caseId !== registryFilters.caseId
      ) {
        return false;
      }

      if (
        registryFilters.status &&
        calculation.status !== registryFilters.status
      ) {
        return false;
      }

      const calculationDateValue = new Date(calculation.calculationDate);

      if (registryFilters.dateFrom) {
        const fromDate = new Date(registryFilters.dateFrom);
        if (calculationDateValue < fromDate) {
          return false;
        }
      }

      if (registryFilters.dateTo) {
        const toDate = new Date(registryFilters.dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (calculationDateValue > toDate) {
          return false;
        }
      }

      return true;
    });
  }, [calculations, caseMap, clientMap, registryFilters]);

  const registrySummary = useMemo(
    () =>
      filteredCalculations.reduce(
        (acc, calculation) => {
          const operation = getOperationType(calculation);
          const amount = Number(calculation.totalAmount) || 0;

          if (operation === "income") {
            acc.income += amount;
          } else {
            acc.expense += amount;
          }

          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [filteredCalculations],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.entries(registryFilters).reduce((count, [key, value]) => {
        if (typeof value !== "string") {
          return count;
        }

        if (key === "search") {
          return value.trim() ? count + 1 : count;
        }

        return value ? count + 1 : count;
      }, 0),
    [registryFilters],
  );

  const applyRegistryFilters = (nextFilters: Partial<RegistryFilters>) => {
    setRegistryFilters((current) => ({
      ...current,
      ...nextFilters,
    }));
  };

  const handleResetFilters = () => {
    setRegistryFilters(INITIAL_FILTERS);
  };

  const replaceCalculation = (updatedCalculation: Calculation) => {
    setCalculations((current) =>
      current.map((item) =>
        item.id === updatedCalculation.id ? updatedCalculation : item,
      ),
    );
  };

  const handleSendForApproval = async (calculation: Calculation) => {
    try {
      setBusyCalculationId(calculation.id);
      setError(null);
      const updatedCalculation = await calculationService.sendForApproval(
        calculation.id,
      );
      replaceCalculation(updatedCalculation);
      setSuccessMessage(
        `Розрахунок ${calculation.number} надіслано на затвердження.`,
      );
    } catch (err: any) {
      setError(
        err.message || "Не вдалося відправити розрахунок на затвердження",
      );
    } finally {
      setBusyCalculationId(null);
    }
  };

  const handleApproveCalculation = async (calculation: Calculation) => {
    try {
      setBusyCalculationId(calculation.id);
      setError(null);
      const updatedCalculation = await calculationService.approveCalculation(
        calculation.id,
      );
      replaceCalculation(updatedCalculation);
      setSuccessMessage(`Розрахунок ${calculation.number} затверджено.`);
    } catch (err: any) {
      setError(err.message || "Не вдалося затвердити розрахунок");
    } finally {
      setBusyCalculationId(null);
    }
  };

  const handleRejectCalculation = async (calculation: Calculation) => {
    const reason = window.prompt(
      `Вкажіть причину відхилення для ${calculation.number}`,
      "",
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      setError("Вкажіть причину відхилення розрахунку.");
      return;
    }

    try {
      setBusyCalculationId(calculation.id);
      setError(null);
      const updatedCalculation = await calculationService.rejectCalculation(
        calculation.id,
        { reason: reason.trim() },
      );
      replaceCalculation(updatedCalculation);
      setSuccessMessage(`Розрахунок ${calculation.number} відхилено.`);
    } catch (err: any) {
      setError(err.message || "Не вдалося відхилити розрахунок");
    } finally {
      setBusyCalculationId(null);
    }
  };

  const handleStatusUpdate = async (
    calculation: Calculation,
    status: CalculationStatus,
    successText: string,
  ) => {
    try {
      setBusyCalculationId(calculation.id);
      setError(null);
      const updatedCalculation = await calculationService.updateCalculation(
        calculation.id,
        { status },
      );
      replaceCalculation(updatedCalculation);
      setSuccessMessage(successText);
    } catch (err: any) {
      setError(err.message || "Не вдалося оновити статус розрахунку");
    } finally {
      setBusyCalculationId(null);
    }
  };

  const handleDeleteCalculation = async (calculation: Calculation) => {
    if (
      !window.confirm(
        `Видалити розрахунок ${calculation.number}? Цю дію не можна швидко скасувати.`,
      )
    ) {
      return;
    }

    try {
      setBusyCalculationId(calculation.id);
      setError(null);
      await calculationService.deleteCalculation(calculation.id);
      setCalculations((current) =>
        current.filter((item) => item.id !== calculation.id),
      );
      setSuccessMessage(`Розрахунок ${calculation.number} видалено.`);
    } catch (err: any) {
      setError(err.message || "Не вдалося видалити розрахунок");
    } finally {
      setBusyCalculationId(null);
    }
  };

  const handleArchiveCalculation = async (calculation: Calculation) => {
    if (
      !window.confirm(
        `Архівувати розрахунок ${calculation.number}? Запис зникне з реєстру активних розрахунків.`,
      )
    ) {
      return;
    }

    try {
      setBusyCalculationId(calculation.id);
      setError(null);
      await calculationService.deleteCalculation(calculation.id);
      setCalculations((current) =>
        current.filter((item) => item.id !== calculation.id),
      );
      setSuccessMessage(`Розрахунок ${calculation.number} архівовано.`);
    } catch (err: any) {
      setError(err.message || "Не вдалося архівувати розрахунок");
    } finally {
      setBusyCalculationId(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="calculations-page">
      <Breadcrumbs />

      <PageHeader
        title="Розрахунки"
        actions={
          <div className="calculations-header-actions">
            <RecordActionsMenu
              triggerLabel="Активні дії"
              ariaLabel="Активні дії сторінки розрахунків"
              actions={[
                {
                  label: registryRefreshing ? "Оновлення..." : "Оновити реєстр",
                  onClick: () => void loadPageData(false),
                  disabled: registryRefreshing,
                },
                {
                  label:
                    activeFilterCount > 0
                      ? `Скинути фільтри (${activeFilterCount})`
                      : "Фільтрів немає",
                  onClick: handleResetFilters,
                  disabled: activeFilterCount === 0,
                },
              ]}
            />
            <RecordActionsMenu
              triggerLabel="Додати розрахунок"
              ariaLabel="Вибір типу нового розрахунку"
              actions={[
                {
                  label: "Прибутковий",
                  to: "/calculations/add?type=income",
                },
                {
                  label: "Видатковий",
                  to: "/calculations/add?type=expense",
                },
              ]}
            />
          </div>
        }
      />

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert type="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      <RegistrySurface className="calculations-registry">
        <RegistryFilterBar className="calculations-filters">
          <RegistrySearchField
            placeholder="Пошук по номеру, клієнту, опису чи справі..."
            value={registryFilters.search}
            onChange={(search) => applyRegistryFilters({ search })}
          />

          <RegistryFilterGroup label="Дата розрахунку">
            <DateRangePicker
              fromValue={registryFilters.dateFrom}
              toValue={registryFilters.dateTo}
              onFromChange={(value) =>
                applyRegistryFilters({ dateFrom: value })
              }
              onToChange={(value) => applyRegistryFilters({ dateTo: value })}
            />
          </RegistryFilterGroup>

          <select
            value={registryFilters.operationType}
            onChange={(event) =>
              applyRegistryFilters({
                operationType: event.target
                  .value as RegistryFilters["operationType"],
              })
            }
          >
            <option value="">Усі операції</option>
            <option value="income">Прибуткові</option>
            <option value="expense">Видаткові</option>
          </select>

          <select
            value={registryFilters.clientId}
            onChange={(event) =>
              applyRegistryFilters({
                clientId: event.target.value,
              })
            }
          >
            <option value="">Усі клієнти</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getClientDisplayName(client)}
              </option>
            ))}
          </select>

          <select
            value={registryFilters.caseId}
            onChange={(event) =>
              applyRegistryFilters({
                caseId: event.target.value,
              })
            }
          >
            <option value="">Усі справи</option>
            {registryCaseOptions.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {getCaseDisplayName(caseItem)}
              </option>
            ))}
          </select>

          <select
            value={registryFilters.status}
            onChange={(event) =>
              applyRegistryFilters({
                status: event.target.value as RegistryFilters["status"],
              })
            }
          >
            <option value="">Усі статуси</option>
            <option value="draft">Чернетка</option>
            <option value="pending_approval">На затвердженні</option>
            <option value="approved">Затверджено</option>
            <option value="rejected">Відхилено</option>
            <option value="paid">Сплачено</option>
          </select>

          <button
            type="button"
            className="btn btn-secondary filters-reset-btn"
            onClick={handleResetFilters}
          >
            Скинути
          </button>
        </RegistryFilterBar>

        <div className="calculations-registry-toolbar">
          <div className="calculations-registry-copy">
            <strong>Операційний реєстр</strong>
            <span>
              {filteredCalculations.length} записів
              {activeFilterCount > 0
                ? ` • ${activeFilterCount} активних фільтрів`
                : " • Без додаткових обмежень"}
              {registryRefreshing ? " • Оновлення..." : ""}
            </span>
          </div>

          <div className="calculations-registry-stats">
            <div className="calculations-stat calculations-stat--income">
              <span>Прибуток</span>
              <strong>{formatCurrency(registrySummary.income)}</strong>
            </div>
            <div className="calculations-stat calculations-stat--expense">
              <span>Видатки</span>
              <strong>{formatCurrency(registrySummary.expense)}</strong>
            </div>
            <div className="calculations-stat">
              <span>Записи</span>
              <strong>{filteredCalculations.length}</strong>
            </div>
          </div>
        </div>

        <RegistryTableShell className="calculations-table">
          <table>
            <thead>
              <tr>
                <th>№</th>
                <th>Вид операції</th>
                <th>Клієнт</th>
                <th>Справа</th>
                <th>Дата</th>
                <th>Сума</th>
                <th>Статус</th>
                <th>Примітка</th>
                <th>Активні дії</th>
              </tr>
            </thead>
            <tbody>
              {filteredCalculations.map((calculation) => {
                const operationTypeValue = getOperationType(calculation);
                const clientId = calculation.metadata?.clientId || "";
                const linkedClient = clientId ? clientMap.get(clientId) : null;
                const subjectLabel = getCalculationSubjectLabel(
                  calculation,
                  linkedClient,
                );
                const caseItem =
                  calculation.case ||
                  (calculation.caseId
                    ? caseMap.get(calculation.caseId) || null
                    : null);
                const isBusy = busyCalculationId === calculation.id;
                const notePreview =
                  calculation.description || calculation.internalNotes || "—";

                return (
                  <tr key={calculation.id}>
                    <td data-label="№">
                      <Link
                        to={`/calculations/${calculation.id}`}
                        className="calculations-table-link"
                      >
                        <span className="calculation-number-pill">
                          {calculation.number}
                        </span>
                      </Link>
                      <span className="calculations-row-caption">
                        {calculation.name}
                      </span>
                    </td>
                    <td data-label="Вид операції">
                      <span
                        className={`calculation-operation calculation-operation--${operationTypeValue}`}
                      >
                        {getOperationTypeLabel(operationTypeValue)}
                      </span>
                    </td>
                    <td data-label="Клієнт">
                      {clientId ? (
                        <Link
                          to={`/clients/${clientId}`}
                          className="calculations-table-link"
                        >
                          {subjectLabel}
                        </Link>
                      ) : (
                        <span className="calculations-text-muted">
                          {subjectLabel}
                        </span>
                      )}
                    </td>
                    <td data-label="Справа">
                      {caseItem ? (
                        <Link
                          to={`/cases/${caseItem.id}`}
                          className="calculations-table-link"
                        >
                          {getCaseDisplayName(caseItem)}
                        </Link>
                      ) : (
                        <span className="calculations-text-muted">
                          Без справи
                        </span>
                      )}
                    </td>
                    <td data-label="Дата">
                      {new Date(calculation.calculationDate).toLocaleDateString(
                        "uk-UA",
                      )}
                    </td>
                    <td data-label="Сума">
                      <strong>
                        {formatCurrency(Number(calculation.totalAmount) || 0)}
                      </strong>
                    </td>
                    <td data-label="Статус">
                      <span
                        className={`badge ${getStatusBadgeClass(calculation.status)}`}
                      >
                        {getCalculationStatusLabel(calculation.status)}
                      </span>
                    </td>
                    <td
                      data-label="Примітка"
                      className="calculations-note-cell"
                    >
                      <span>{notePreview}</span>
                      {calculation.description &&
                        calculation.internalNotes &&
                        calculation.internalNotes !==
                          calculation.description && (
                          <span className="calculations-row-caption">
                            {calculation.internalNotes}
                          </span>
                        )}
                    </td>
                    <td data-label="Активні дії">
                      <RecordActionsMenu
                        ariaLabel={`Активні дії для ${calculation.number}`}
                        actions={[
                          {
                            label: "Відкрити",
                            to: `/calculations/${calculation.id}`,
                          },
                          {
                            label: "Редагувати",
                            to: `/calculations/${calculation.id}/edit?type=${getOperationType(calculation)}`,
                            disabled: isBusy,
                          },
                          {
                            label: "Дублювати",
                            to: `/calculations/add?type=${getOperationType(calculation)}&duplicateFrom=${calculation.id}`,
                            disabled: isBusy,
                          },
                          {
                            label: "Архівувати",
                            onClick: () =>
                              void handleArchiveCalculation(calculation),
                            disabled: isBusy,
                          },
                          ...(calculation.status === "pending_approval"
                            ? [
                                {
                                  label: "Затвердити",
                                  onClick: () =>
                                    void handleApproveCalculation(calculation),
                                  disabled: isBusy,
                                },
                                {
                                  label: "Відхилити",
                                  onClick: () =>
                                    void handleRejectCalculation(calculation),
                                  disabled: isBusy,
                                },
                              ]
                            : []),
                          ...(calculation.status === "approved"
                            ? [
                                {
                                  label: "Позначити як сплачено",
                                  onClick: () =>
                                    void handleStatusUpdate(
                                      calculation,
                                      "paid",
                                      `Розрахунок ${calculation.number} позначено як сплачений.`,
                                    ),
                                  disabled: isBusy,
                                },
                              ]
                            : []),
                          ...(calculation.status === "rejected"
                            ? [
                                {
                                  label: "Повернути в чернетку",
                                  onClick: () =>
                                    void handleStatusUpdate(
                                      calculation,
                                      "draft",
                                      `Розрахунок ${calculation.number} повернуто у чернетки.`,
                                    ),
                                  disabled: isBusy,
                                },
                              ]
                            : []),
                          ...(calculation.status === "paid"
                            ? [
                                {
                                  label: "Повернути в затверджені",
                                  onClick: () =>
                                    void handleStatusUpdate(
                                      calculation,
                                      "approved",
                                      `Розрахунок ${calculation.number} повернуто у статус затвердження.`,
                                    ),
                                  disabled: isBusy,
                                },
                              ]
                            : []),
                          {
                            label: "Видалити",
                            onClick: () =>
                              void handleDeleteCalculation(calculation),
                            danger: true,
                            disabled: isBusy,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCalculations.length === 0 && (
            <div className="workspace-empty">
              Розрахунків за обраними фільтрами поки немає.
            </div>
          )}
        </RegistryTableShell>
      </RegistrySurface>
    </div>
  );
};

export default CalculationsPage;
