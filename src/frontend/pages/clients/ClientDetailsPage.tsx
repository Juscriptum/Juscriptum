import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Calendar,
  FolderOpen,
  Pencil,
  Save,
} from "lucide-react";
import { Alert } from "../../components/Alert";
import { FormActionBar } from "../../components/FormActionBar";
import { Spinner } from "../../components/Spinner";
import { PageHeader } from "../../components/PageHeader";
import { Breadcrumbs } from "../../components/navigation";
import RelatedNotesPanel from "../../components/notes/RelatedNotesPanel";
import { ClientForm } from "../../components/clients";
import {
  createClientSchema,
  CreateClientFormData,
} from "../../schemas/client.schema";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { Case } from "../../types/case.types";
import { Client, ClientStatus, ClientType } from "../../types/client.types";
import {
  transformFormData,
  validateTransformedData,
} from "../../utils/clientDataTransform";
import {
  CLIENT_STATUS_CLASSES,
  CLIENT_STATUS_LABELS,
  getClientDisplayName,
  getClientTypeLabel,
  mapClientToFormData,
} from "../../utils/clientFormData";
import "./AddClientPage.css";
import "./ClientDetailsPage.css";

const STATUS_OPTIONS: ClientStatus[] = [
  "active",
  "inactive",
  "blocked",
  "archived",
];
const EMPTY_CLIENT = {
  id: "",
  tenantId: "",
  type: "individual",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
} as Client;

const EMPTY_VALUE = "Не вказано";

interface InfoItem {
  label: string;
  value: string;
}

interface InfoSection {
  title: string;
  items: InfoItem[];
}

const formatDate = (value?: string | null) => {
  if (!value) {
    return EMPTY_VALUE;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("uk-UA");
};

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) {
    return EMPTY_VALUE;
  }

  const normalized = String(value).trim();
  return normalized || EMPTY_VALUE;
};

const formatAddress = (address?: Record<string, string>) => {
  if (!address) {
    return EMPTY_VALUE;
  }

  const parts = [
    address.region,
    address.city,
    address.city_code ? `індекс ${address.city_code}` : "",
    address.street ? `вул. ${address.street}` : "",
    address.building ? `буд. ${address.building}` : "",
    address.apartment ? `кв. ${address.apartment}` : "",
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : EMPTY_VALUE;
};

const formatList = (values?: string[]) => {
  const normalized = (values || []).map((item) => item.trim()).filter(Boolean);
  return normalized.length > 0 ? normalized.join(", ") : EMPTY_VALUE;
};

const formatMessengers = (messengers?: Record<string, string>) => {
  if (!messengers) {
    return EMPTY_VALUE;
  }

  const normalized = Object.entries(messengers)
    .filter(([, value]) => Boolean(value?.trim()))
    .map(([key, value]) => `${key}: ${value.trim()}`);

  return normalized.length > 0 ? normalized.join(", ") : EMPTY_VALUE;
};

const buildClientSections = (client: Client): InfoSection[] => {
  const addresses = client.metadata?.addresses || {};
  const contact = client.metadata?.contact || {};
  const fop = client.metadata?.fop || {};
  const legalEntity = client.metadata?.legalEntity || {};
  const banking = fop.banking || legalEntity.banking || {};
  const director = fop.director || legalEntity.director || {};
  const contactPerson = legalEntity.contactPerson || {};

  const sections: InfoSection[] = [
    {
      title: "Основна інформація",
      items: [
        {
          label: "Номер клієнта",
          value: formatValue(client.metadata?.client_number),
        },
        { label: "Тип клієнта", value: getClientTypeLabel(client.type) },
        { label: "Статус", value: CLIENT_STATUS_LABELS[client.status] },
        { label: "Дата додавання", value: formatDate(client.createdAt) },
        { label: "Коментар", value: formatValue(client.notes) },
      ],
    },
  ];

  if (client.type === "individual") {
    sections.push(
      {
        title: "Особисті дані",
        items: [
          { label: "Прізвище", value: formatValue(client.lastName) },
          { label: "Ім'я", value: formatValue(client.firstName) },
          { label: "По батькові", value: formatValue(client.patronymic) },
          { label: "ІПН", value: formatValue(client.inn) },
          { label: "Паспорт", value: formatValue(client.passportNumber) },
          { label: "Дата народження", value: formatDate(client.passportDate) },
        ],
      },
      {
        title: "Контакти",
        items: [
          { label: "Телефон", value: formatValue(client.phone) },
          {
            label: "Додаткові телефони",
            value: formatList(contact.additional_phones),
          },
          { label: "Email", value: formatValue(client.email) },
          {
            label: "Додаткові email",
            value: formatList(contact.additional_emails),
          },
          { label: "Месенджери", value: formatMessengers(contact.messengers) },
        ],
      },
    );
  }

  if (client.type === "fop") {
    sections.push(
      {
        title: "Дані ФОП",
        items: [
          { label: "Прізвище", value: formatValue(client.lastName) },
          { label: "Ім'я", value: formatValue(client.firstName) },
          { label: "По батькові", value: formatValue(client.patronymic) },
          { label: "ІПН", value: formatValue(client.inn) },
          {
            label: "Дата народження / реєстрації",
            value: formatDate(fop.registrationDate || client.passportDate),
          },
          { label: "Діє на підставі", value: formatValue(fop.taxationBasis) },
          {
            label: "Форма оподаткування",
            value: formatValue(fop.taxationForm),
          },
        ],
      },
      {
        title: "Контакти",
        items: [
          { label: "Телефон", value: formatValue(client.phone) },
          {
            label: "Додаткові телефони",
            value: formatList(contact.additional_phones),
          },
          { label: "Email", value: formatValue(client.email) },
          {
            label: "Додаткові email",
            value: formatList(contact.additional_emails),
          },
          { label: "Месенджери", value: formatMessengers(contact.messengers) },
        ],
      },
      {
        title: "Дані для підписання",
        items: [
          {
            label: "Підписант",
            value:
              director.firstName || director.lastName
                ? formatValue(
                    [director.lastName, director.firstName, director.patronymic]
                      .filter(Boolean)
                      .join(" "),
                  )
                : "Співпадає з даними клієнта",
          },
          { label: "Посада", value: formatValue(director.position) },
          { label: "Підстава дій", value: formatValue(director.taxationBasis) },
        ],
      },
    );
  }

  if (client.type === "legal_entity") {
    sections.push(
      {
        title: "Реквізити компанії",
        items: [
          { label: "Назва компанії", value: formatValue(client.companyName) },
          {
            label: "Форма компанії",
            value: formatValue(legalEntity.companyForm),
          },
          { label: "ЄДРПОУ", value: formatValue(client.edrpou) },
          {
            label: "Форма оподаткування",
            value: formatValue(legalEntity.taxationForm),
          },
        ],
      },
      {
        title: "Контактна особа",
        items: [
          { label: "Прізвище", value: formatValue(contactPerson.lastName) },
          { label: "Ім'я", value: formatValue(contactPerson.firstName) },
          {
            label: "По батькові",
            value: formatValue(contactPerson.patronymic),
          },
          { label: "Посада", value: formatValue(contactPerson.position) },
          {
            label: "Телефон",
            value: formatValue(contactPerson.phone || client.phone),
          },
          {
            label: "Додаткові телефони",
            value: formatList(contactPerson.additional_phones),
          },
          {
            label: "Email",
            value: formatValue(contactPerson.email || client.email),
          },
          {
            label: "Додаткові email",
            value: formatList(contactPerson.additional_emails),
          },
          {
            label: "Месенджери",
            value: formatMessengers(contactPerson.messengers),
          },
        ],
      },
      {
        title: "Керівник / підписант",
        items: [
          {
            label: "Підписант",
            value:
              director.firstName || director.lastName
                ? formatValue(
                    [director.lastName, director.firstName, director.patronymic]
                      .filter(Boolean)
                      .join(" "),
                  )
                : "Співпадає з контактною особою",
          },
          { label: "Посада", value: formatValue(director.position) },
          { label: "Підстава дій", value: formatValue(director.taxationBasis) },
        ],
      },
    );
  }

  sections.push(
    {
      title: "Адреси",
      items: [
        {
          label: "Адреса реєстрації",
          value: formatAddress(addresses.registration),
        },
        {
          label: "Фактична адреса",
          value: addresses.is_same_address
            ? "Співпадає з адресою реєстрації"
            : formatAddress(addresses.actual),
        },
      ],
    },
    {
      title: "Банківські реквізити",
      items: [
        { label: "Банк", value: formatValue(banking.bankName) },
        { label: "МФО", value: formatValue(banking.mfo) },
        { label: "IBAN", value: formatValue(banking.iban) },
      ],
    },
  );

  return sections;
};

export const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<ClientStatus | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const methods = useForm<CreateClientFormData>({
    resolver: zodResolver(createClientSchema),
    defaultValues: mapClientToFormData(EMPTY_CLIENT),
    mode: "onTouched",
  });

  const clientType = methods.watch("type") as ClientType;

  useEffect(() => {
    const loadPageData = async () => {
      if (!id) {
        setError("Не вдалося визначити клієнта");
        setPageLoading(false);
        return;
      }

      try {
        setPageLoading(true);
        setError(null);

        const [clientResponse, casesResponse] = await Promise.all([
          clientService.getClient(id),
          caseService.getCases({
            clientId: id,
            limit: 10,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
        ]);

        setClient(clientResponse);
        setCases(casesResponse.data);
        setIsEditing(false);
        methods.reset(mapClientToFormData(clientResponse));
      } catch (err: any) {
        setError(err.message || "Помилка завантаження клієнта");
      } finally {
        setPageLoading(false);
      }
    };

    loadPageData();
  }, [id, methods]);

  const handleSave = async (data: CreateClientFormData) => {
    if (!id || !client) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const dto = transformFormData(data, clientType);
      const validationErrors = validateTransformedData(dto);
      if (validationErrors.length > 0) {
        setError(validationErrors.join(". "));
        setSaving(false);
        return;
      }

      const updatedClient = await clientService.updateClient(id, {
        ...dto,
        status: client.status,
      });
      setClient(updatedClient);
      setIsEditing(false);
      methods.reset(mapClientToFormData(updatedClient));
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(". ")
          : backendMessage || "Помилка збереження клієнта",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: ClientStatus) => {
    if (!id || !client || client.status === status) {
      return;
    }

    setStatusUpdating(status);
    setError(null);
    try {
      const updatedClient = await clientService.updateClient(id, { status });
      setClient(updatedClient);
      methods.reset(mapClientToFormData(updatedClient));
    } catch (err: any) {
      const backendMessage = err.response?.data?.message;
      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(". ")
          : backendMessage || "Помилка зміни статусу клієнта",
      );
    } finally {
      setStatusUpdating(null);
    }
  };

  if (pageLoading) {
    return (
      <div className="client-details-loading">
        <Spinner size="large" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="client-details-page client-details-empty">
        <Alert type="error" message={error || "Клієнта не знайдено"} />
      </div>
    );
  }

  const clientSections = buildClientSections(client);

  const handleCancelEdit = () => {
    methods.reset(mapClientToFormData(client));
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="add-client-page client-details-page">
      <Breadcrumbs />

      <PageHeader
        title={getClientDisplayName(client)}
        subtitle={
          isEditing
            ? `Редагування клієнта: ${getClientTypeLabel(client.type)}`
            : `Картка клієнта: ${getClientTypeLabel(client.type)}`
        }
        actions={
          <>
            <Link to="/clients" className="btn btn-outline">
              <ArrowLeft size={18} />
              До списку клієнтів
            </Link>
            <Link
              to={`/clients/${client.id}/documents`}
              className="btn btn-outline"
            >
              <FolderOpen size={18} />
              Документи
            </Link>
            <Link
              to={`/cases/add?client_id=${client.id}`}
              className="btn btn-outline"
            >
              <BriefcaseBusiness size={18} />
              Додати справу
            </Link>
            <Link
              to={`/events/add?clientId=${client.id}`}
              className="btn btn-outline"
            >
              <Calendar size={18} />
              Додати подію
            </Link>
            <Link
              to={`/notes?clientId=${client.id}&new=1`}
              className="btn btn-outline"
            >
              <Pencil size={18} />
              Додати нотатку
            </Link>
            {!isEditing && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={18} />
                Редагувати
              </button>
            )}
          </>
        }
      />

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      <div className="client-details-summary-grid">
        <div className="client-summary-card">
          <span className="client-summary-label">Статус</span>
          <span
            className={`client-status-pill ${CLIENT_STATUS_CLASSES[client.status]}`}
          >
            {CLIENT_STATUS_LABELS[client.status]}
          </span>
        </div>
        <div className="client-summary-card">
          <span className="client-summary-label">Тип клієнта</span>
          <span className="client-summary-value">
            {getClientTypeLabel(client.type)}
          </span>
        </div>
        <div className="client-summary-card">
          <span className="client-summary-label">Створено</span>
          <span className="client-summary-value">
            {new Date(client.createdAt).toLocaleDateString("uk-UA")}
          </span>
        </div>
        <div className="client-summary-card">
          <span className="client-summary-label">Оновлено</span>
          <span className="client-summary-value">
            {new Date(client.updatedAt).toLocaleDateString("uk-UA")}
          </span>
        </div>
      </div>

      <div className="client-status-actions-panel">
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            className={`btn btn-outline ${client.status === status ? "is-current" : ""}`}
            disabled={statusUpdating === status || client.status === status}
            onClick={() => handleStatusChange(status)}
          >
            {statusUpdating === status
              ? "Оновлення..."
              : CLIENT_STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      <div className="client-related-cases-panel">
        <div className="client-related-header">
          <div>
            <h3>Пов'язані справи</h3>
            <p>
              {cases.length > 0
                ? "Останні справи цього клієнта"
                : "Для цього клієнта справ ще немає"}
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(`/cases?clientId=${client.id}`)}
          >
            Усі справи клієнта
          </button>
        </div>

        {cases.length > 0 ? (
          <div className="client-related-cases-list">
            {cases.map((caseItem) => (
              <button
                key={caseItem.id}
                type="button"
                className="client-related-case"
                onClick={() => navigate(`/cases/${caseItem.id}`)}
              >
                <span className="client-related-case-title">
                  {caseItem.title || caseItem.caseNumber}
                </span>
                <span className="client-related-case-meta">
                  {caseItem.caseNumber} •{" "}
                  {new Date(caseItem.updatedAt).toLocaleDateString("uk-UA")}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="client-related-empty">
            Додайте першу справу для цього клієнта з картки або зі списку справ.
          </div>
        )}
      </div>

      <RelatedNotesPanel
        title="Нотатки клієнта"
        description="Останні записи, створені з картки клієнта або з єдиного простору нотаток."
        filters={{ clientId: client.id }}
        createTo={`/notes?clientId=${client.id}&new=1`}
        emptyMessage="Поки що для цього клієнта немає пов'язаних нотаток."
      />

      {isEditing ? (
        <ClientForm
          methods={methods}
          clientType={clientType}
          onSubmit={handleSave}
          allowTypeChange={false}
          clientNumberReadOnly
          registrationDateReadOnly
          footer={
            <FormActionBar title="Дії з карткою клієнта">
              <button
                type="button"
                className="btn btn-outline"
                disabled={saving}
                onClick={handleCancelEdit}
              >
                Скасувати зміни
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Spinner size="small" />
                    Збереження...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Зберегти зміни
                  </>
                )}
              </button>
            </FormActionBar>
          }
        />
      ) : (
        <div className="client-details-info-grid">
          {clientSections.map((section) => (
            <section key={section.title} className="client-info-card">
              <h3>{section.title}</h3>
              <div className="client-info-list">
                {section.items.map((item) => (
                  <div
                    key={`${section.title}-${item.label}`}
                    className="client-info-item"
                  >
                    <span className="client-info-label">{item.label}</span>
                    <span
                      className={`client-info-value ${item.value === EMPTY_VALUE ? "is-empty" : ""}`}
                    >
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDetailsPage;
