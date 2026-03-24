import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import clientService from "../../services/client.service";
import { Client, ClientFilters, ClientStatus } from "../../types/client.types";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import { DateRangePicker } from "../../components/DateRangePicker";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import {
  RegistryEmptyState,
  RegistryFilterBar,
  RegistryFilterGroup,
  RegistryLoadingState,
  RegistryPagination,
  RegistrySearchField,
  RegistrySurface,
  RegistryTableShell,
} from "../../components/registry";
import "./ClientsPage.css";

/**
 * Clients List Page
 */
export const ClientsPage: React.FC = () => {
  const todayIso = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<ClientFilters>({
    limit: 20,
    page: 1,
    status: (searchParams.get("status") as ClientStatus | null) || undefined,
  });
  useEffect(() => {
    loadClients();
  }, [filters]);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await clientService.getClients(filters);
      setClients(response.data);
      setTotal(response.total);
      setPage(response.page);
    } catch (err: any) {
      setError(err.message || "Помилка завантаження клієнтів");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setFilters((current) => ({ ...current, search, page: 1 }));
  };

  const handleFilterChange = (key: keyof ClientFilters, value: any) => {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((current) => ({ ...current, page: newPage }));
  };

  const handleDateRangeChange = (
    key: "createdAtFrom" | "createdAtTo",
    value: string,
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      limit: filters.limit || 20,
      page: 1,
      status: (searchParams.get("status") as ClientStatus | null) || undefined,
    });
  };

  const getClientNumber = (client: Client): string | null => {
    const clientNumber = client.metadata?.client_number;
    return typeof clientNumber === "string" && clientNumber.trim().length > 0
      ? clientNumber.trim()
      : null;
  };

  const handleDelete = async (client: Client) => {
    const clientName = getClientDisplayName(client);
    const shouldDelete = window.confirm(
      `Видалення клієнта "${clientName}" також видалить усі пов'язані дані: справи, документи, нотатки, події, розрахунки та інші записи.\n\nНатисніть "OK", щоб продовжити видалення, або "Скасувати", щоб замість цього запропонувати архівацію.`,
    );

    if (!shouldDelete) {
      const shouldArchive = window.confirm(
        `Архівувати клієнта "${clientName}" замість видалення?\n\nКлієнт зникне з активного реєстру, але запис залишиться в архіві.`,
      );

      if (shouldArchive) {
        await handleArchive(client);
      }

      return;
    }

    const clientNumber = getClientNumber(client);
    const releaseClientNumber = clientNumber
      ? window.confirm(
          `Звільнити номер клієнта ${clientNumber} для повторного використання?\n\nНатисніть "Скасувати", щоб зберегти номер за видаленим клієнтом і продовжити нумерацію далі.`,
        )
      : false;

    try {
      await clientService.deleteClient(client.id, { releaseClientNumber });
      loadClients();
    } catch (err: any) {
      setError(err.message || "Помилка видалення клієнта");
    }
  };

  const handleArchive = async (client: Client) => {
    if (client.status === "archived") {
      return;
    }

    if (
      !window.confirm(`Архівувати клієнта "${getClientDisplayName(client)}"?`)
    ) {
      return;
    }

    try {
      await clientService.updateClient(client.id, { status: "archived" });
      await loadClients();
    } catch (err: any) {
      setError(err.message || "Помилка архівування клієнта");
    }
  };

  const totalPages = Math.ceil(total / (filters.limit || 20));
  const getClientDisplayName = (client: Client): string => {
    if (client.type === "individual") {
      return `${client.lastName || ""} ${client.firstName || ""} ${client.patronymic || ""}`.trim();
    }
    return client.companyName || "Невідома компанія";
  };

  const getStatusBadge = (status: ClientStatus) => {
    const statusClasses: Record<ClientStatus, string> = {
      active: "badge-success",
      inactive: "badge-warning",
      blocked: "badge-danger",
      archived: "badge-default",
    };
    const statusLabels: Record<ClientStatus, string> = {
      active: "Активний",
      inactive: "Неактивний",
      blocked: "Заблокований",
      archived: "Архівний",
    };
    return (
      <span className={`badge ${statusClasses[status]}`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="clients-page">
      <Breadcrumbs />
      <PageHeader
        title="Мої клієнти"
        subtitle="Клієнтський реєстр для всієї практики: контакти, статуси і швидкий перехід до пов’язаних справ"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => navigate("/clients/add")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Додати клієнта
          </button>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <RegistrySurface className="clients-registry">
        <RegistryFilterBar className="clients-registry-filters">
          <RegistrySearchField
            placeholder="Пошук клієнтів..."
            value={filters.search || ""}
            onChange={handleSearch}
          />
          <RegistryFilterGroup label="Дата створення">
            <DateRangePicker
              fromValue={filters.createdAtFrom}
              toValue={filters.createdAtTo}
              onFromChange={(value) =>
                handleDateRangeChange("createdAtFrom", value)
              }
              onToChange={(value) =>
                handleDateRangeChange("createdAtTo", value)
              }
              max={todayIso}
            />
          </RegistryFilterGroup>
          <select
            value={filters.type || ""}
            onChange={(e) =>
              handleFilterChange("type", e.target.value || undefined)
            }
          >
            <option value="">Усі типи</option>
            <option value="individual">Фізичні особи</option>
            <option value="fop">ФОП</option>
            <option value="legal_entity">Юридичні особи</option>
          </select>
          <select
            value={filters.status || ""}
            onChange={(e) =>
              handleFilterChange("status", e.target.value || undefined)
            }
          >
            <option value="">Усі статуси</option>
            <option value="active">Активні</option>
            <option value="inactive">Неактивні</option>
            <option value="blocked">Заблоковані</option>
            <option value="archived">Архівні</option>
          </select>
          <button
            type="button"
            className="btn btn-secondary filters-reset-btn"
            onClick={handleResetFilters}
          >
            Скинути
          </button>
        </RegistryFilterBar>

        {loading ? (
          <RegistryLoadingState />
        ) : clients.length === 0 ? (
          <RegistryEmptyState
            icon={
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
            title="Клієнтів не знайдено"
            description="Додайте першого клієнта, щоб почати роботу"
            action={
              <button
                className="btn btn-primary"
                onClick={() => navigate("/clients/add")}
              >
                Додати клієнта
              </button>
            }
          />
        ) : (
          <>
            <RegistryTableShell className="clients-table">
              <table>
                <thead>
                  <tr>
                    <th>Номер</th>
                    <th>Клієнт</th>
                    <th>Тип</th>
                    <th>Контакти</th>
                    <th>Статус</th>
                    <th>Створено</th>
                    <th>Дії</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const clientNumber = getClientNumber(client);

                    return (
                      <tr key={client.id}>
                        <td data-label="Номер">
                          {clientNumber ? (
                            <span className="client-number-cell">
                              {clientNumber}
                            </span>
                          ) : (
                            <span className="muted-text">Не вказано</span>
                          )}
                        </td>
                        <td data-label="Клієнт">
                          <Link
                            to={`/clients/${client.id}`}
                            className="client-name"
                          >
                            {getClientDisplayName(client)}
                          </Link>
                          {client.type === "legal_entity" && client.edrpou && (
                            <span className="client-edrpou">
                              ЄДРПОУ: {client.edrpou}
                            </span>
                          )}
                        </td>
                        <td data-label="Тип">
                          <span className={`type-badge type-${client.type}`}>
                            {client.type === "individual" ? "ФО" : "ЮО"}
                          </span>
                        </td>
                        <td data-label="Контакти">
                          {client.email && (
                            <div className="contact-item">{client.email}</div>
                          )}
                          {client.phone && (
                            <div className="contact-item">{client.phone}</div>
                          )}
                        </td>
                        <td data-label="Статус">
                          {getStatusBadge(client.status)}
                        </td>
                        <td data-label="Створено">
                          {new Date(client.createdAt).toLocaleDateString(
                            "uk-UA",
                          )}
                        </td>
                        <td data-label="Дії">
                          <RecordActionsMenu
                            actions={[
                              {
                                label: "Редагувати",
                                to: `/clients/${client.id}`,
                              },
                              {
                                label: "Дублювати",
                                to: `/clients/add?duplicateFrom=${client.id}`,
                              },
                              {
                                label: "Справи клієнта",
                                to: `/cases?clientId=${client.id}`,
                              },
                              {
                                label:
                                  client.status === "archived"
                                    ? "Уже в архіві"
                                    : "Архівувати",
                                onClick: () => handleArchive(client),
                                disabled: client.status === "archived",
                              },
                              {
                                label: "Видалити",
                                onClick: () => handleDelete(client),
                                danger: true,
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </RegistryTableShell>

            {totalPages > 1 && (
              <RegistryPagination
                page={page}
                totalPages={totalPages}
                totalItems={total}
                onPrevious={() => handlePageChange(page - 1)}
                onNext={() => handlePageChange(page + 1)}
              />
            )}
          </>
        )}
      </RegistrySurface>
    </div>
  );
};

export default ClientsPage;
