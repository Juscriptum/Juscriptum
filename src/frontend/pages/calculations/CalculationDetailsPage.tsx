import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Alert } from "../../components/Alert";
import { Breadcrumbs } from "../../components/navigation";
import { PageHeader } from "../../components/PageHeader";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import { Spinner } from "../../components/Spinner";
import { calculationService } from "../../services/calculation.service";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import { Calculation } from "../../types/calculation.types";
import { formatCurrencyLabel } from "../../utils/currency";
import {
  formatCurrency,
  formatCurrencyInWords,
  formatDate,
  getCalculationDisplayDescription,
  getCalculationDisplayQuantity,
  getCalculationDisplayUnit,
  getCalculationStatusLabel,
  getCalculationSubjectLabel,
  getCalculationUnitTypeLabel,
  getCaseDisplayName,
  getClientDisplayName,
  getOperationType,
  getOperationTypeLabel,
  getStatusBadgeClass,
} from "./calculationPage.utils";
import "./CalculationDetailsPage.css";

export const CalculationDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [linkedClient, setLinkedClient] = useState<Client | null>(null);
  const [linkedCase, setLinkedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadCalculation = async () => {
    if (!id) {
      setError("Не вдалося визначити розрахунок");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextCalculation = await calculationService.getCalculation(id);
      const nextCase = nextCalculation.caseId
        ? await caseService.getCase(nextCalculation.caseId).catch(() => null)
        : null;
      const clientId =
        nextCalculation.metadata?.clientId || nextCase?.clientId || "";
      const nextClient = clientId
        ? await clientService.getClient(clientId).catch(() => null)
        : null;

      setCalculation(nextCalculation);
      setLinkedCase(nextCase);
      setLinkedClient(nextClient);
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(". ")
          : backendMessage || "Не вдалося завантажити розрахунок",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCalculation();
  }, [id]);

  const operationType = calculation ? getOperationType(calculation) : null;
  const subjectLabel = calculation
    ? getCalculationSubjectLabel(calculation, linkedClient)
    : "—";
  const clientTargetId =
    linkedClient?.id || calculation?.metadata?.clientId || "";
  const caseTargetId = linkedCase?.id || calculation?.case?.id || "";
  const caseLabel = calculation?.case
    ? [calculation.case.caseNumber, calculation.case.title]
        .filter(Boolean)
        .join(" • ")
    : "";
  const selectedPricelistNames = Array.isArray(
    calculation?.metadata?.selectedPricelistNames,
  )
    ? calculation?.metadata?.selectedPricelistNames
    : [];

  const totalHours = useMemo(
    () =>
      calculation?.items.reduce(
        (acc, item) =>
          item.unitType === "hourly"
            ? acc + Number(item.duration || 0) / 60
            : acc,
        0,
      ) || 0,
    [calculation],
  );

  const applyCalculationUpdate = (updatedCalculation: Calculation) => {
    setCalculation((current) =>
      current
        ? {
            ...current,
            ...updatedCalculation,
            items: updatedCalculation.items || current.items,
            case: updatedCalculation.case || current.case,
          }
        : updatedCalculation,
    );
  };

  const handleSendForApproval = async () => {
    if (!calculation) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const updated = await calculationService.sendForApproval(calculation.id);
      applyCalculationUpdate(updated);
      setSuccessMessage(
        `Розрахунок ${calculation.number} надіслано на затвердження.`,
      );
    } catch (err: any) {
      setError(
        err.message || "Не вдалося відправити розрахунок на затвердження",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!calculation) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const updated = await calculationService.approveCalculation(
        calculation.id,
      );
      applyCalculationUpdate(updated);
      setSuccessMessage(`Розрахунок ${calculation.number} затверджено.`);
    } catch (err: any) {
      setError(err.message || "Не вдалося затвердити розрахунок");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!calculation) {
      return;
    }

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
      setActionLoading(true);
      setError(null);
      const updated = await calculationService.rejectCalculation(
        calculation.id,
        {
          reason: reason.trim(),
        },
      );
      applyCalculationUpdate(updated);
      setSuccessMessage(`Розрахунок ${calculation.number} відхилено.`);
    } catch (err: any) {
      setError(err.message || "Не вдалося відхилити розрахунок");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (
    status: "draft" | "approved" | "paid",
    successText: string,
  ) => {
    if (!calculation) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const updated = await calculationService.updateCalculation(
        calculation.id,
        {
          status,
        },
      );
      applyCalculationUpdate(updated);
      setSuccessMessage(successText);
    } catch (err: any) {
      setError(err.message || "Не вдалося оновити статус розрахунку");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!calculation) {
      return;
    }

    if (
      !window.confirm(
        `Видалити розрахунок ${calculation.number}? Після цього сторінка закриється для перегляду.`,
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await calculationService.deleteCalculation(calculation.id);
      navigate("/calculations", { replace: true });
    } catch (err: any) {
      setError(err.message || "Не вдалося видалити розрахунок");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (!calculation || !operationType) {
    return (
      <div className="workspace-empty">
        <Alert type="error" message={error || "Розрахунок не знайдено"} />
      </div>
    );
  }

  return (
    <div className="calculation-details-page">
      <Breadcrumbs
        items={[
          { label: "Головна", to: "/dashboard" },
          { label: "Розрахунки", to: "/calculations" },
          { label: calculation.number },
        ]}
      />

      <PageHeader
        title={calculation.number}
        actions={
          <div className="calculation-details-header-actions">
            <Link className="btn btn-outline" to="/calculations">
              <ArrowLeft size={18} />
              До реєстру
            </Link>
            <RecordActionsMenu
              triggerLabel="Активні дії"
              ariaLabel={`Активні дії для ${calculation.number}`}
              actions={[
                ...(clientTargetId
                  ? [
                      {
                        label: "Відкрити клієнта",
                        to: `/clients/${clientTargetId}`,
                      },
                    ]
                  : []),
                ...(caseTargetId
                  ? [
                      {
                        label: "Відкрити справу",
                        to: `/cases/${caseTargetId}`,
                      },
                    ]
                  : []),
                {
                  label: "Редагувати",
                  to: `/calculations/${calculation.id}/edit?type=${operationType}`,
                  disabled: actionLoading,
                },
                {
                  label: "Дублювати",
                  to: `/calculations/add?type=${operationType}&duplicateFrom=${calculation.id}`,
                  disabled: actionLoading,
                },
                ...(calculation.status === "draft"
                  ? [
                      {
                        label: "Надіслати на затвердження",
                        onClick: () => void handleSendForApproval(),
                        disabled: actionLoading,
                      },
                    ]
                  : []),
                ...(calculation.status === "pending_approval"
                  ? [
                      {
                        label: "Затвердити",
                        onClick: () => void handleApprove(),
                        disabled: actionLoading,
                      },
                      {
                        label: "Відхилити",
                        onClick: () => void handleReject(),
                        disabled: actionLoading,
                      },
                    ]
                  : []),
                ...(calculation.status === "approved"
                  ? [
                      {
                        label: "Позначити як сплачено",
                        onClick: () =>
                          void handleStatusUpdate(
                            "paid",
                            `Розрахунок ${calculation.number} позначено як сплачений.`,
                          ),
                        disabled: actionLoading,
                      },
                    ]
                  : []),
                ...(calculation.status === "rejected"
                  ? [
                      {
                        label: "Повернути в чернетку",
                        onClick: () =>
                          void handleStatusUpdate(
                            "draft",
                            `Розрахунок ${calculation.number} повернуто у чернетку.`,
                          ),
                        disabled: actionLoading,
                      },
                    ]
                  : []),
                ...(calculation.status === "paid"
                  ? [
                      {
                        label: "Повернути в затверджені",
                        onClick: () =>
                          void handleStatusUpdate(
                            "approved",
                            `Розрахунок ${calculation.number} повернуто у затверджені.`,
                          ),
                        disabled: actionLoading,
                      },
                    ]
                  : []),
                {
                  label: "Видалити",
                  onClick: () => void handleDelete(),
                  disabled: actionLoading,
                  danger: true,
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

      <section
        className={`content-surface calculation-details-hero calculation-details-hero--${operationType}`}
      >
        <div className="calculation-details-hero__copy">
          <span
            className={`calculation-details-hero__operation calculation-details-hero__operation--${operationType}`}
          >
            {getOperationTypeLabel(operationType)}
          </span>
          <h2>{calculation.name}</h2>
          <p>
            {calculation.description || "Опис для цього розрахунку не додано."}
          </p>
        </div>

        <div className="calculation-details-hero__meta">
          <span className={`badge ${getStatusBadgeClass(calculation.status)}`}>
            {getCalculationStatusLabel(calculation.status)}
          </span>
          <strong>
            {formatCurrency(Number(calculation.totalAmount) || 0)}
          </strong>
        </div>
      </section>

      <section className="calculation-details-grid">
        <div className="content-surface calculation-details-card">
          <strong>Основні реквізити</strong>
          <dl className="calculation-details-list">
            <div>
              <dt>Тип операції</dt>
              <dd>{getOperationTypeLabel(operationType)}</dd>
            </div>
            <div>
              <dt>Суб'єкт</dt>
              <dd>
                {clientTargetId ? (
                  <Link
                    to={`/clients/${clientTargetId}`}
                    className="calculation-details-link"
                  >
                    {linkedClient
                      ? getClientDisplayName(linkedClient)
                      : subjectLabel}
                  </Link>
                ) : (
                  subjectLabel
                )}
              </dd>
            </div>
            <div>
              <dt>Справа</dt>
              <dd>
                {caseTargetId ? (
                  <Link
                    to={`/cases/${caseTargetId}`}
                    className="calculation-details-link"
                  >
                    {linkedCase ? getCaseDisplayName(linkedCase) : caseLabel}
                  </Link>
                ) : caseLabel ? (
                  caseLabel
                ) : (
                  "Без прив'язки"
                )}
              </dd>
            </div>
            {operationType === "income" && (
              <div>
                <dt>Прайс-листи</dt>
                <dd>
                  {selectedPricelistNames.length > 0
                    ? selectedPricelistNames.join(", ")
                    : "Не вказано"}
                </dd>
              </div>
            )}
            <div>
              <dt>Дата розрахунку</dt>
              <dd>{formatDate(calculation.calculationDate)}</dd>
            </div>
            <div>
              <dt>Строк оплати</dt>
              <dd>{formatDate(calculation.dueDate)}</dd>
            </div>
            <div>
              <dt>Створено</dt>
              <dd>{formatDate(calculation.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <div className="content-surface calculation-details-card">
          <strong>Фінансові показники</strong>
          <dl className="calculation-details-list">
            <div>
              <dt>Позицій</dt>
              <dd>{calculation.items.length}</dd>
            </div>
            <div>
              <dt>Підсумок</dt>
              <dd>{formatCurrency(Number(calculation.subtotal) || 0)}</dd>
            </div>
            <div>
              <dt>Разом</dt>
              <dd>{formatCurrency(Number(calculation.totalAmount) || 0)}</dd>
            </div>
            <div>
              <dt>Разом прописом</dt>
              <dd>
                {formatCurrencyInWords(Number(calculation.totalAmount) || 0)}
              </dd>
            </div>
            <div>
              <dt>Сплачено</dt>
              <dd>{formatCurrency(Number(calculation.paidAmount) || 0)}</dd>
            </div>
            <div>
              <dt>Валюта</dt>
              <dd>{formatCurrencyLabel(calculation.currency)}</dd>
            </div>
            <div>
              <dt>Погодинно</dt>
              <dd>
                {totalHours > 0
                  ? `${totalHours.toLocaleString("uk-UA", {
                      minimumFractionDigits: Number.isInteger(totalHours)
                        ? 0
                        : 2,
                      maximumFractionDigits: 2,
                    })} год`
                  : "Немає"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="content-surface calculation-details-card">
        <div className="calculation-details-card__header">
          <strong>Позиції розрахунку</strong>
          <span>{`${calculation.items.length} рядків`}</span>
        </div>

        <div className="calculation-details-table-wrap">
          <table className="calculation-details-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Назва послуги</th>
                <th>Кількість</th>
                <th>Од. виміру</th>
                <th>Сума</th>
              </tr>
            </thead>
            <tbody>
              {calculation.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="calculation-details-table__service">
                      <strong>
                        {getCalculationDisplayDescription(item.description)}
                      </strong>
                    </div>
                  </td>
                  <td>
                    {getCalculationDisplayQuantity(
                      item.quantity,
                      item.duration,
                      item.unitType,
                    )}
                  </td>
                  <td>
                    <div className="calculation-details-table__unit">
                      <strong>
                        {getCalculationDisplayUnit(item.unitType)}
                      </strong>
                      <span>{getCalculationUnitTypeLabel(item.unitType)}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(Number(item.lineTotal) || 0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Загалом</td>
                <td>{formatCurrency(Number(calculation.totalAmount) || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {(calculation.internalNotes || calculation.clientNotes) && (
        <section className="calculation-details-grid">
          {calculation.internalNotes && (
            <div className="content-surface calculation-details-card">
              <strong>Службові примітки</strong>
              <p className="calculation-details-notes">
                {calculation.internalNotes}
              </p>
            </div>
          )}
          {calculation.clientNotes && (
            <div className="content-surface calculation-details-card">
              <strong>Примітка для клієнта</strong>
              <p className="calculation-details-notes">
                {calculation.clientNotes}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default CalculationDetailsPage;
