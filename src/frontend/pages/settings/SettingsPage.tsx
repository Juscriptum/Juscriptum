import React, { useEffect, useState } from "react";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { organizationService } from "../../services/organization.service";
import {
  LegalForm,
  Organization,
  UpdateOrganizationData,
} from "../../types/organization.types";
import { useAppDispatch } from "../../store";
import { updateOrganization as updateOrganizationAction } from "../../store/auth.slice";
import { usePermissions } from "../../hooks/usePermissions";
import "../workspace/WorkspacePage.css";
import "./SettingsPage.css";

const LEGAL_FORM_LABELS: Record<LegalForm, string> = {
  sole_proprietor: "ФОП",
  llc: "ТОВ",
  joint_stock: "АТ",
  partnership: "Партнерство",
  other: "Інша форма",
};

export const SettingsPage: React.FC = () => {
  const permissions = usePermissions();
  const dispatch = useAppDispatch();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<UpdateOrganizationData>({
    name: "",
    legalForm: "sole_proprietor",
    phone: "",
    email: "",
    website: "",
    address: "",
    city: "",
    region: "",
    edrpou: "",
    taxNumber: "",
    mfaRequired: false,
    auditRetentionDays: 365,
    settings: {
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const canManageSettings = permissions.canManageSettings();

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        setLoading(true);
        const data = await organizationService.getOrganization();
        setOrganization(data);
        setFormData({
          name: data.name,
          legalForm: data.legalForm,
          phone: data.phone || "",
          email: data.email || "",
          website: data.website || "",
          address: data.address || "",
          city: data.city || "",
          region: data.region || "",
          edrpou: data.edrpou || "",
          taxNumber: data.taxNumber || "",
          mfaRequired: data.mfaRequired,
          auditRetentionDays: data.auditRetentionDays,
          settings: {
            notifications: {
              email: data.settings?.notifications?.email ?? true,
              sms: data.settings?.notifications?.sms ?? false,
              push: data.settings?.notifications?.push ?? true,
            },
          },
        });
      } catch (error: any) {
        setMessage({
          type: "error",
          text:
            error?.response?.data?.message ||
            "Не вдалося завантажити налаштування організації",
        });
      } finally {
        setLoading(false);
      }
    };

    void loadOrganization();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage(null);
      const updated = await organizationService.updateOrganization(formData);
      setOrganization(updated);
      dispatch(
        updateOrganizationAction({
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          website: updated.website,
          address: updated.address,
          city: updated.city,
          region: updated.region,
          status: updated.status,
          legalForm: updated.legalForm,
          edrpou: updated.edrpou,
          taxNumber: updated.taxNumber,
        }),
      );
      setMessage({
        type: "success",
        text: "Налаштування організації оновлено",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || "Не вдалося зберегти налаштування",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canManageSettings) {
    return (
      <div className="workspace-page">
        <Breadcrumbs />
        <PageHeader
          title="Налаштування"
          subtitle="Редагування параметрів організації доступне адміністраторам"
        />
        <Alert type="warning">
          Запросіть адміністратора організації, якщо потрібно змінити реквізити,
          політики MFA або канали сповіщень.
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="workspace-page">
      <Breadcrumbs />
      <PageHeader
        title="Налаштування"
        subtitle="Реквізити організації, безпека та параметри роботи"
      />

      {message && (
        <Alert type={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <div className="workspace-grid">
        <div className="workspace-card">
          <span>План</span>
          <strong>{organization?.subscriptionPlan || "n/a"}</strong>
          <small>Статус: {organization?.subscriptionStatus || "n/a"}</small>
        </div>
        <div className="workspace-card">
          <span>Двофакторний захист</span>
          <strong>
            {formData.mfaRequired ? "Обов'язкова" : "Опціональна"}
          </strong>
          <small>Застосовується до всієї організації</small>
        </div>
        <div className="workspace-card">
          <span>Журнал подій</span>
          <strong>{formData.auditRetentionDays} днів</strong>
          <small>Період зберігання історії</small>
        </div>
        <div className="workspace-card">
          <span>Користувачі</span>
          <strong>{organization?.maxUsers ?? "n/a"}</strong>
          <small>Ліміт активних акаунтів за планом</small>
        </div>

        <section className="workspace-panel full">
          <form className="settings-form" onSubmit={handleSubmit}>
            <div className="settings-grid">
              <label>
                Назва організації
                <input
                  value={formData.name || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </label>

              <label>
                Правова форма
                <select
                  value={formData.legalForm || "sole_proprietor"}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      legalForm: event.target.value as LegalForm,
                    }))
                  }
                >
                  {Object.entries(LEGAL_FORM_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Email організації
                <input
                  type="email"
                  value={formData.email || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Телефон
                <input
                  value={formData.phone || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Сайт
                <input
                  value={formData.website || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      website: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                ЄДРПОУ
                <input
                  value={formData.edrpou || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      edrpou: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Податковий номер
                <input
                  value={formData.taxNumber || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      taxNumber: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Місто
                <input
                  value={formData.city || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      city: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                Область
                <input
                  value={formData.region || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      region: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="settings-grid-wide">
                Адреса
                <input
                  value={formData.address || ""}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <div className="settings-policy-grid">
              <div className="settings-policy-card">
                <h3>Безпека</h3>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={!!formData.mfaRequired}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        mfaRequired: event.target.checked,
                      }))
                    }
                  />
                  Вимагати MFA для всіх користувачів організації
                </label>
                <label>
                  Зберігання журналу, днів
                  <input
                    type="number"
                    min={30}
                    max={3650}
                    value={formData.auditRetentionDays || 365}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        auditRetentionDays: Number(event.target.value),
                      }))
                    }
                  />
                </label>
              </div>

              <div className="settings-policy-card">
                <h3>Сповіщення</h3>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={!!formData.settings?.notifications?.email}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          notifications: {
                            ...prev.settings?.notifications,
                            email: event.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  Email-сповіщення
                </label>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={!!formData.settings?.notifications?.sms}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          notifications: {
                            ...prev.settings?.notifications,
                            sms: event.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  SMS-сповіщення
                </label>
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={!!formData.settings?.notifications?.push}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        settings: {
                          ...(prev.settings || {}),
                          notifications: {
                            ...prev.settings?.notifications,
                            push: event.target.checked,
                          },
                        },
                      }))
                    }
                  />
                  Push-сповіщення
                </label>
              </div>
            </div>

            <div className="settings-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                Зберегти зміни
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
