import React, { useEffect, useState } from "react";
import {
  PLATFORM_ADMIN_BLUEPRINT,
  type PlatformAdminApiBlueprint,
  type PlatformAdminScreenBlueprint,
} from "../../platform-admin/blueprint";
import {
  platformAdminApi,
  PlatformAdminApiError,
  type PlatformAdminAuthResponse,
  type PlatformAdminBootstrapStatus,
  type PlatformAdminDashboardSummary,
  type PlatformAdminMfaSetupResponse,
  type PlatformAdminOrganizationDetail,
  type PlatformAdminOrganizationListResponse,
  type PlatformAdminOrganizationUser,
} from "./platformAdminApi";
import {
  platformAdminSessionStorage,
  type PlatformAdminStoredSession,
} from "./platformAdminSession";
import "./PlatformAdminApp.css";

type PlatformAdminView =
  | "loading"
  | "bootstrap"
  | "login"
  | "verify-mfa"
  | "setup-mfa"
  | "ready";

interface NoticeState {
  tone: "error" | "success" | "neutral";
  message: string;
}

const formatBytes = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let amount = value;
  let unitIndex = 0;

  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }

  return `${amount.toFixed(amount >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return "n/a";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "n/a";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
};

const formatMoney = (
  amountCents?: number | null,
  currency?: string | null,
): string => {
  if (typeof amountCents !== "number" || !currency) {
    return "n/a";
  }

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);
};

const humanizeToken = (value: string): string =>
  value
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const groupScreens = (
  phase: PlatformAdminScreenBlueprint["phase"],
): PlatformAdminScreenBlueprint[] =>
  PLATFORM_ADMIN_BLUEPRINT.screens.filter((screen) => screen.phase === phase);

const groupApi = (
  phase: PlatformAdminApiBlueprint["phase"],
): PlatformAdminApiBlueprint[] =>
  PLATFORM_ADMIN_BLUEPRINT.api.filter((endpoint) => endpoint.phase === phase);

const ScreenCard: React.FC<{ screen: PlatformAdminScreenBlueprint }> = ({
  screen,
}) => (
  <article className="platform-admin-card">
    <div className="platform-admin-card-header">
      <span className="platform-admin-card-route">{screen.route}</span>
      <h3>{screen.title}</h3>
    </div>
    <p>{screen.purpose}</p>
    <ul>
      {screen.sections.map((section) => (
        <li key={section}>{section}</li>
      ))}
    </ul>
  </article>
);

const Field: React.FC<{
  label: string;
  type?: string;
  value: string;
  placeholder?: string;
  autoComplete?: string;
  onChange: (value: string) => void;
}> = ({ label, type = "text", value, placeholder, autoComplete, onChange }) => (
  <label className="platform-admin-field">
    <span>{label}</span>
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      autoComplete={autoComplete}
      onChange={(event) => onChange(event.target.value)}
    />
  </label>
);

const resolveInitialView = (
  bootstrapStatus: PlatformAdminBootstrapStatus | null,
): PlatformAdminView => {
  if (!bootstrapStatus) {
    return "loading";
  }

  return bootstrapStatus.bootstrapRequired ? "bootstrap" : "login";
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof PlatformAdminApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не вдалося виконати запит до platform-admin surface.";
};

export const PlatformAdminApp: React.FC = () => {
  const mvpScreens = groupScreens("mvp");
  const phase2Screens = groupScreens("phase_2");
  const mvpApi = groupApi("mvp");
  const phase2Api = groupApi("phase_2");

  const [view, setView] = useState<PlatformAdminView>("loading");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [bootstrapStatus, setBootstrapStatus] =
    useState<PlatformAdminBootstrapStatus | null>(null);
  const [session, setSession] = useState<PlatformAdminStoredSession | null>(
    null,
  );
  const [pendingMfaToken, setPendingMfaToken] = useState("");
  const [mfaSetup, setMfaSetup] =
    useState<PlatformAdminMfaSetupResponse | null>(null);
  const [dashboardSummary, setDashboardSummary] =
    useState<PlatformAdminDashboardSummary | null>(null);
  const [organizations, setOrganizations] =
    useState<PlatformAdminOrganizationListResponse | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState("");
  const [selectedOrganizationDetail, setSelectedOrganizationDetail] =
    useState<PlatformAdminOrganizationDetail | null>(null);
  const [selectedOrganizationUsers, setSelectedOrganizationUsers] = useState<
    PlatformAdminOrganizationUser[]
  >([]);

  const [bootstrapForm, setBootstrapForm] = useState({
    bootstrapToken: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });
  const [verifyMfaCode, setVerifyMfaCode] = useState("");
  const [confirmMfaCode, setConfirmMfaCode] = useState("");
  const [registryFilters, setRegistryFilters] = useState({
    q: "",
    status: "",
    plan: "",
    subscriptionStatus: "",
  });
  const [appliedRegistryFilters, setAppliedRegistryFilters] = useState({
    q: "",
    status: "",
    plan: "",
    subscriptionStatus: "",
    page: 1,
    limit: 10,
  });

  useEffect(() => {
    void initializeSurface();
  }, []);

  useEffect(() => {
    if (view !== "ready" || !session?.accessToken) {
      return;
    }

    void loadOperatorData(session.accessToken, appliedRegistryFilters);
  }, [view, session?.accessToken, appliedRegistryFilters]);

  useEffect(() => {
    if (view !== "ready" || !session?.accessToken || !selectedOrganizationId) {
      return;
    }

    void loadOrganizationDetail(session.accessToken, selectedOrganizationId);
  }, [view, session?.accessToken, selectedOrganizationId]);

  const initializeSurface = async (): Promise<void> => {
    setBusyAction("initialize");
    setNotice(null);

    try {
      const nextBootstrapStatus = await platformAdminApi.getBootstrapStatus();
      setBootstrapStatus(nextBootstrapStatus);

      const storedSession = platformAdminSessionStorage.load();
      if (!storedSession) {
        setView(resolveInitialView(nextBootstrapStatus));
        return;
      }

      try {
        const admin = await platformAdminApi.getMe(storedSession.accessToken);
        const hydratedSession = {
          ...storedSession,
          admin,
        };

        platformAdminSessionStorage.save(hydratedSession);
        setSession(hydratedSession);
        setView(admin.mfaEnabled ? "ready" : "setup-mfa");
      } catch {
        platformAdminSessionStorage.clear();
        setSession(null);
        setView(resolveInitialView(nextBootstrapStatus));
      }
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
      setView("login");
    } finally {
      setBusyAction(null);
    }
  };

  const loadOperatorData = async (
    token: string,
    filters: {
      q?: string;
      status?: string;
      plan?: string;
      subscriptionStatus?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<void> => {
    setBusyAction("load-read-models");

    try {
      const [summary, organizationsResponse] = await Promise.all([
        platformAdminApi.getDashboardSummary(token),
        platformAdminApi.getOrganizations(token, filters),
      ]);

      setDashboardSummary(summary);
      setOrganizations(organizationsResponse);

      const nextSelection =
        organizationsResponse.items.find(
          (item) => item.id === selectedOrganizationId,
        )?.id ||
        organizationsResponse.items[0]?.id ||
        "";

      setSelectedOrganizationId(nextSelection);

      if (!nextSelection) {
        setSelectedOrganizationDetail(null);
        setSelectedOrganizationUsers([]);
      } else if (nextSelection === selectedOrganizationId) {
        void loadOrganizationDetail(token, nextSelection);
      }
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
    } finally {
      setBusyAction((current) =>
        current === "load-read-models" ? null : current,
      );
    }
  };

  const loadOrganizationDetail = async (
    token: string,
    organizationId: string,
  ): Promise<void> => {
    setBusyAction("load-organization-detail");

    try {
      const [detail, users] = await Promise.all([
        platformAdminApi.getOrganizationDetail(token, organizationId),
        platformAdminApi.getOrganizationUsers(token, organizationId),
      ]);

      setSelectedOrganizationDetail(detail);
      setSelectedOrganizationUsers(users);
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
    } finally {
      setBusyAction((current) =>
        current === "load-organization-detail" ? null : current,
      );
    }
  };

  const applyAuthenticatedState = (
    response: PlatformAdminAuthResponse,
    successMessage: string,
  ): void => {
    const storedSession =
      platformAdminSessionStorage.saveFromAuthResponse(response);

    setSession(storedSession);
    setPendingMfaToken("");
    setVerifyMfaCode("");
    setConfirmMfaCode("");
    setMfaSetup(null);
    setBootstrapStatus({
      bootstrapRequired: false,
      bootstrapEnabled: bootstrapStatus?.bootstrapEnabled ?? false,
      hasPlatformAdmins: true,
    });
    setView(storedSession.admin.mfaEnabled ? "ready" : "setup-mfa");
    setNotice({
      tone: "success",
      message: successMessage,
    });
  };

  const handleBootstrap = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setBusyAction("bootstrap");
    setNotice(null);

    try {
      const response = await platformAdminApi.bootstrap(bootstrapForm);
      applyAuthenticatedState(
        response,
        "Перший platform-admin власник створений. Наступний крок: завершити MFA enrollment.",
      );
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
      const nextStatus = await platformAdminApi.getBootstrapStatus();
      setBootstrapStatus(nextStatus);
      setView(resolveInitialView(nextStatus));
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogin = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setBusyAction("login");
    setNotice(null);

    try {
      const response = await platformAdminApi.login(loginForm);

      if (response.mfaRequired && response.mfaToken) {
        setPendingMfaToken(response.mfaToken);
        setView("verify-mfa");
        setNotice({
          tone: "neutral",
          message: "Підтвердіть вхід через TOTP або резервний MFA код.",
        });
        return;
      }

      applyAuthenticatedState(
        response,
        "Вхід виконано. Якщо MFA ще не ввімкнено, налаштуйте його перед подальшою роботою.",
      );
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleVerifyMfa = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();
    setBusyAction("verify-mfa");
    setNotice(null);

    try {
      const response = await platformAdminApi.verifyMfa({
        mfaToken: pendingMfaToken,
        code: verifyMfaCode,
      });
      applyAuthenticatedState(response, "MFA підтверджено. Вхід завершено.");
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleGenerateMfaSetup = async (): Promise<void> => {
    if (!session) {
      return;
    }

    setBusyAction("setup-mfa");
    setNotice(null);

    try {
      const response = await platformAdminApi.setupMfa(session.accessToken);
      setMfaSetup(response);
      setNotice({
        tone: "neutral",
        message:
          "Скануйте QR у застосунку-authenticator, збережіть резервні коди й підтвердьте 6-значний код нижче.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleConfirmMfa = async (
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    event.preventDefault();

    if (!session) {
      return;
    }

    setBusyAction("confirm-mfa");
    setNotice(null);

    try {
      const response = await platformAdminApi.confirmMfa(session.accessToken, {
        code: confirmMfaCode,
      });
      applyAuthenticatedState(
        response,
        "MFA enrollment завершено. Owner back office тепер працює з MFA-backed session.",
      );
    } catch (error) {
      setNotice({
        tone: "error",
        message: extractErrorMessage(error),
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogout = async (): Promise<void> => {
    const activeSession = session;
    setBusyAction("logout");
    setNotice(null);

    try {
      if (activeSession) {
        await platformAdminApi.logout(activeSession.accessToken, {
          refreshToken: activeSession.refreshToken,
          mfaReason: "platform_admin_surface_logout",
        });
      }
    } catch {
      // Keep logout best-effort on the client side.
    } finally {
      platformAdminSessionStorage.clear();
      setSession(null);
      setPendingMfaToken("");
      setMfaSetup(null);
      setConfirmMfaCode("");
      setVerifyMfaCode("");
      setDashboardSummary(null);
      setOrganizations(null);
      setSelectedOrganizationId("");
      setSelectedOrganizationDetail(null);
      setSelectedOrganizationUsers([]);

      try {
        const nextStatus = await platformAdminApi.getBootstrapStatus();
        setBootstrapStatus(nextStatus);
        setView(resolveInitialView(nextStatus));
      } catch {
        setView("login");
      }

      setNotice({
        tone: "success",
        message: "Поточну platform-admin сесію завершено.",
      });
      setBusyAction(null);
    }
  };

  const renderNotice = () =>
    notice ? (
      <div
        className={`platform-admin-notice platform-admin-notice--${notice.tone}`}
      >
        {notice.message}
      </div>
    ) : null;

  const handleRegistryFiltersSubmit = (
    event: React.FormEvent<HTMLFormElement>,
  ): void => {
    event.preventDefault();
    setAppliedRegistryFilters((current) => ({
      ...current,
      q: registryFilters.q.trim(),
      status: registryFilters.status,
      plan: registryFilters.plan,
      subscriptionStatus: registryFilters.subscriptionStatus,
      page: 1,
    }));
  };

  const renderReadyData = () => {
    if (view !== "ready" || !session) {
      return null;
    }

    return (
      <>
        <section className="platform-admin-panel">
          <div className="platform-admin-section-header">
            <h2>Live platform overview</h2>
            <p>
              Metadata-only KPIs and alerts for the owner back office. No
              client, case, or document content is exposed here.
            </p>
          </div>
          <div className="platform-admin-inline-note">
            Signed in as {session.admin.firstName} {session.admin.lastName}.
            Read model refresh status:{" "}
            {busyAction === "load-read-models" ||
            busyAction === "load-organization-detail"
              ? "updating"
              : "idle"}
            .
          </div>
          <div className="platform-admin-metric-grid">
            <article className="platform-admin-metric-card">
              <span>Organizations</span>
              <strong>{dashboardSummary?.organizations.total ?? "..."}</strong>
              <small>
                Active {dashboardSummary?.organizations.active ?? 0}, suspended{" "}
                {dashboardSummary?.organizations.suspended ?? 0}
              </small>
            </article>
            <article className="platform-admin-metric-card">
              <span>Users</span>
              <strong>{dashboardSummary?.users.total ?? "..."}</strong>
              <small>
                Active {dashboardSummary?.users.active ?? 0}, locked{" "}
                {dashboardSummary?.users.locked ?? 0}
              </small>
            </article>
            <article className="platform-admin-metric-card">
              <span>Storage</span>
              <strong>
                {formatBytes(dashboardSummary?.storageBytes ?? 0)}
              </strong>
              <small>
                Pending scans {dashboardSummary?.pendingMalwareScans ?? 0}
              </small>
            </article>
            <article className="platform-admin-metric-card">
              <span>Readiness</span>
              <strong>
                {dashboardSummary?.monitoring.readinessStatus ?? "..."}
              </strong>
              <small>
                Trust failed{" "}
                {dashboardSummary?.monitoring.trustVerificationFailed ?? 0}
              </small>
            </article>
          </div>
        </section>

        <section className="platform-admin-grid">
          <article className="platform-admin-panel">
            <div className="platform-admin-section-header">
              <h2>Platform alerts</h2>
              <p>
                High-signal risk indicators across billing, security, and worker
                backlogs.
              </p>
            </div>
            <div className="platform-admin-alert-list">
              {(dashboardSummary?.alerts || []).length > 0 ? (
                dashboardSummary?.alerts.map((alert) => (
                  <article
                    key={alert.id}
                    className={`platform-admin-alert platform-admin-alert--${alert.severity}`}
                  >
                    <div className="platform-admin-alert-header">
                      <strong>{humanizeToken(alert.type)}</strong>
                      <span>{alert.severity}</span>
                    </div>
                    <p>{alert.message}</p>
                    <small>{formatDateTime(alert.createdAt)}</small>
                  </article>
                ))
              ) : (
                <div className="platform-admin-empty-state">
                  <strong>No current platform alerts</strong>
                  <p>
                    Nothing high-signal is currently escalated in the read
                    model.
                  </p>
                </div>
              )}
            </div>
          </article>

          <article className="platform-admin-panel">
            <div className="platform-admin-section-header">
              <h2>Monitoring snapshot</h2>
              <p>Operational posture taken from readiness-safe monitoring.</p>
            </div>
            <div className="platform-admin-inline-stats">
              <div>
                <span>Database</span>
                <strong>
                  {dashboardSummary?.monitoring.databaseStatus ?? "..."}
                </strong>
              </div>
              <div>
                <span>Redis</span>
                <strong>
                  {dashboardSummary?.monitoring.redisStatus ?? "..."}
                </strong>
              </div>
              <div>
                <span>Auth</span>
                <strong>
                  {dashboardSummary?.monitoring.authStatus ?? "..."}
                </strong>
              </div>
              <div>
                <span>Billing</span>
                <strong>
                  {dashboardSummary?.monitoring.billingStatus ?? "..."}
                </strong>
              </div>
              <div>
                <span>Trust Queue</span>
                <strong>
                  {dashboardSummary?.monitoring.trustVerificationDue ?? 0}
                </strong>
              </div>
              <div>
                <span>Outbox Risk</span>
                <strong>
                  {dashboardSummary?.monitoring.outboxDeadLetterRisk ?? 0}
                </strong>
              </div>
            </div>
          </article>
        </section>

        <section className="platform-admin-panel">
          <div className="platform-admin-section-header">
            <h2>Organizations registry</h2>
            <p>
              Safe tenant registry with masked owner contacts, usage stats, and
              risk flags.
            </p>
          </div>
          <form
            className="platform-admin-form"
            onSubmit={handleRegistryFiltersSubmit}
          >
            <div className="platform-admin-registry-filters">
              <Field
                label="Search by name or domain"
                value={registryFilters.q}
                onChange={(value) =>
                  setRegistryFilters((current) => ({ ...current, q: value }))
                }
                placeholder="Lex Growth"
              />
              <label className="platform-admin-field">
                <span>Status</span>
                <select
                  value={registryFilters.status}
                  onChange={(event) =>
                    setRegistryFilters((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="provisioning">Provisioning</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
              <label className="platform-admin-field">
                <span>Plan</span>
                <select
                  value={registryFilters.plan}
                  onChange={(event) =>
                    setRegistryFilters((current) => ({
                      ...current,
                      plan: event.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </label>
              <label className="platform-admin-field">
                <span>Billing state</span>
                <select
                  value={registryFilters.subscriptionStatus}
                  onChange={(event) =>
                    setRegistryFilters((current) => ({
                      ...current,
                      subscriptionStatus: event.target.value,
                    }))
                  }
                >
                  <option value="">All</option>
                  <option value="trialing">Trialing</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past due</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="canceled">Canceled</option>
                </select>
              </label>
            </div>
            <button
              className="platform-admin-button"
              type="submit"
              disabled={busyAction === "load-read-models"}
            >
              {busyAction === "load-read-models"
                ? "Refreshing..."
                : "Apply filters"}
            </button>
          </form>

          <div className="platform-admin-registry-layout">
            <div className="platform-admin-registry-list">
              {organizations?.items.length ? (
                organizations.items.map((organization) => (
                  <button
                    key={organization.id}
                    type="button"
                    className={`platform-admin-registry-item${
                      selectedOrganizationId === organization.id
                        ? " platform-admin-registry-item--active"
                        : ""
                    }`}
                    onClick={() => setSelectedOrganizationId(organization.id)}
                  >
                    <div className="platform-admin-registry-item-header">
                      <strong>{organization.name}</strong>
                      <span>{organization.status}</span>
                    </div>
                    <small>
                      {organization.subscriptionPlan} /{" "}
                      {organization.subscriptionStatus}
                    </small>
                    <p>
                      Owner: {organization.owner.fullName}
                      <br />
                      {organization.owner.emailMasked || "masked"}
                    </p>
                    <div className="platform-admin-registry-meta">
                      <span>
                        {organization.activeUsersCount}/
                        {organization.usersCount} active users
                      </span>
                      <span>{formatBytes(organization.storageBytes)}</span>
                    </div>
                    <div className="platform-admin-risk-list">
                      {organization.riskFlags.length > 0 ? (
                        organization.riskFlags.map((risk) => (
                          <span key={risk}>{humanizeToken(risk)}</span>
                        ))
                      ) : (
                        <span>No active flags</span>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="platform-admin-empty-state">
                  <strong>No organizations found</strong>
                  <p>Try broadening the registry filters.</p>
                </div>
              )}
            </div>

            <div className="platform-admin-registry-detail">
              {selectedOrganizationDetail ? (
                <>
                  <article className="platform-admin-detail-card">
                    <div className="platform-admin-card-header">
                      <span className="platform-admin-card-route">
                        {selectedOrganizationDetail.status}
                      </span>
                      <h3>{selectedOrganizationDetail.name}</h3>
                    </div>
                    <p>
                      Owner: {selectedOrganizationDetail.owner.fullName}
                      <br />
                      {selectedOrganizationDetail.owner.emailMasked || "masked"}
                    </p>
                    <div className="platform-admin-detail-grid">
                      <div>
                        <span>Plan</span>
                        <strong>
                          {selectedOrganizationDetail.billing.subscriptionPlan}
                        </strong>
                      </div>
                      <div>
                        <span>Billing</span>
                        <strong>
                          {
                            selectedOrganizationDetail.billing
                              .subscriptionStatus
                          }
                        </strong>
                      </div>
                      <div>
                        <span>Storage</span>
                        <strong>
                          {formatBytes(
                            selectedOrganizationDetail.ops.storageBytes,
                          )}
                        </strong>
                      </div>
                      <div>
                        <span>Last activity</span>
                        <strong>
                          {formatDateTime(
                            selectedOrganizationDetail.ops.lastActivityAt,
                          )}
                        </strong>
                      </div>
                    </div>
                    <div className="platform-admin-risk-list">
                      {selectedOrganizationDetail.riskFlags.length > 0 ? (
                        selectedOrganizationDetail.riskFlags.map((risk) => (
                          <span key={risk}>{humanizeToken(risk)}</span>
                        ))
                      ) : (
                        <span>No active flags</span>
                      )}
                    </div>
                  </article>

                  <div className="platform-admin-card-grid">
                    <article className="platform-admin-card">
                      <div className="platform-admin-card-header">
                        <h3>Billing</h3>
                      </div>
                      <p>
                        {formatMoney(
                          selectedOrganizationDetail.billing.amountCents,
                          selectedOrganizationDetail.billing.currency,
                        )}
                      </p>
                      <ul>
                        <li>
                          Provider:{" "}
                          {selectedOrganizationDetail.billing.provider || "n/a"}
                        </li>
                        <li>
                          Period end:{" "}
                          {formatDateTime(
                            selectedOrganizationDetail.billing
                              .currentPeriodEndAt,
                          )}
                        </li>
                        <li>
                          Last sync:{" "}
                          {formatDateTime(
                            selectedOrganizationDetail.billing.lastSyncedAt,
                          )}
                        </li>
                      </ul>
                    </article>
                    <article className="platform-admin-card">
                      <div className="platform-admin-card-header">
                        <h3>Security</h3>
                      </div>
                      <ul>
                        <li>
                          Org MFA required:{" "}
                          {selectedOrganizationDetail.security
                            .organizationMfaRequired
                            ? "yes"
                            : "no"}
                        </li>
                        <li>
                          Owner MFA enabled:{" "}
                          {selectedOrganizationDetail.security.ownerMfaEnabled
                            ? "yes"
                            : "no"}
                        </li>
                        <li>
                          Locked users:{" "}
                          {selectedOrganizationDetail.security.lockedUsersCount}
                        </li>
                        <li>
                          Suspended users:{" "}
                          {
                            selectedOrganizationDetail.security
                              .suspendedUsersCount
                          }
                        </li>
                      </ul>
                    </article>
                    <article className="platform-admin-card">
                      <div className="platform-admin-card-header">
                        <h3>Operations</h3>
                      </div>
                      <ul>
                        <li>
                          Documents:{" "}
                          {selectedOrganizationDetail.ops.documentsCount}
                        </li>
                        <li>
                          Pending scans:{" "}
                          {selectedOrganizationDetail.ops.pendingMalwareScans}
                        </li>
                        <li>
                          Infected docs:{" "}
                          {selectedOrganizationDetail.ops.infectedDocuments}
                        </li>
                        <li>
                          Audit entries (30d):{" "}
                          {selectedOrganizationDetail.ops.auditEntriesLast30d}
                        </li>
                      </ul>
                    </article>
                  </div>

                  <article className="platform-admin-panel platform-admin-panel--nested">
                    <div className="platform-admin-section-header">
                      <h2>Masked tenant users</h2>
                      <p>
                        Support-safe roster without raw phone numbers or other
                        profile PII.
                      </p>
                    </div>
                    <div className="platform-admin-user-table">
                      {selectedOrganizationUsers.map((user) => (
                        <div key={user.id} className="platform-admin-user-row">
                          <div>
                            <strong>{user.fullName}</strong>
                            <small>{user.emailMasked || "masked"}</small>
                          </div>
                          <div>
                            <span>{user.role}</span>
                            <small>{user.status}</small>
                          </div>
                          <div>
                            <span>MFA: {user.mfaEnabled ? "yes" : "no"}</span>
                            <small>
                              Last login: {formatDateTime(user.lastLoginAt)}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                </>
              ) : (
                <div className="platform-admin-empty-state">
                  <strong>No organization selected</strong>
                  <p>
                    Choose a tenant from the registry to inspect safe metadata.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </>
    );
  };

  const renderAccessPanel = () => {
    if (view === "loading") {
      return (
        <article className="platform-admin-panel platform-admin-panel--auth">
          <div className="platform-admin-section-header">
            <h2>Loading secure access</h2>
            <p>Checking bootstrap status and restoring the operator session.</p>
          </div>
          {renderNotice()}
          <div className="platform-admin-loading-line" />
        </article>
      );
    }

    if (view === "bootstrap") {
      const bootstrapDisabled = !bootstrapStatus?.bootstrapEnabled;

      return (
        <article className="platform-admin-panel platform-admin-panel--auth">
          <div className="platform-admin-section-header">
            <h2>First owner bootstrap</h2>
            <p>
              This flow exists only for the very first `PlatformAdminUser`.
              After one owner is created, the form locks forever.
            </p>
          </div>
          {renderNotice()}
          <form className="platform-admin-form" onSubmit={handleBootstrap}>
            <Field
              label="Bootstrap token"
              type="password"
              value={bootstrapForm.bootstrapToken}
              onChange={(value) =>
                setBootstrapForm((current) => ({
                  ...current,
                  bootstrapToken: value,
                }))
              }
              autoComplete="one-time-code"
              placeholder="Paste PLATFORM_ADMIN_BOOTSTRAP_TOKEN"
            />
            <div className="platform-admin-form-grid">
              <Field
                label="First name"
                value={bootstrapForm.firstName}
                onChange={(value) =>
                  setBootstrapForm((current) => ({
                    ...current,
                    firstName: value,
                  }))
                }
                autoComplete="given-name"
              />
              <Field
                label="Last name"
                value={bootstrapForm.lastName}
                onChange={(value) =>
                  setBootstrapForm((current) => ({
                    ...current,
                    lastName: value,
                  }))
                }
                autoComplete="family-name"
              />
            </div>
            <Field
              label="Owner email"
              type="email"
              value={bootstrapForm.email}
              onChange={(value) =>
                setBootstrapForm((current) => ({
                  ...current,
                  email: value,
                }))
              }
              autoComplete="email"
            />
            <Field
              label="Strong password"
              type="password"
              value={bootstrapForm.password}
              onChange={(value) =>
                setBootstrapForm((current) => ({
                  ...current,
                  password: value,
                }))
              }
              autoComplete="new-password"
              placeholder="Minimum 12 characters"
            />
            <button
              className="platform-admin-button"
              type="submit"
              disabled={busyAction === "bootstrap" || bootstrapDisabled}
            >
              {busyAction === "bootstrap"
                ? "Creating owner..."
                : "Create first owner"}
            </button>
          </form>
          <div className="platform-admin-inline-note">
            {bootstrapDisabled
              ? "Set PLATFORM_ADMIN_BOOTSTRAP_TOKEN in the environment before using this one-time bootstrap path."
              : "Use a one-time bootstrap token from the environment and rotate/remove it after the first owner is created."}
          </div>
        </article>
      );
    }

    if (view === "login") {
      return (
        <article className="platform-admin-panel platform-admin-panel--auth">
          <div className="platform-admin-section-header">
            <h2>Dedicated owner login</h2>
            <p>
              Separate platform-admin authentication, outside tenant sessions
              and outside the CRM navigation surface.
            </p>
          </div>
          {renderNotice()}
          <form className="platform-admin-form" onSubmit={handleLogin}>
            <Field
              label="Email"
              type="email"
              value={loginForm.email}
              onChange={(value) =>
                setLoginForm((current) => ({ ...current, email: value }))
              }
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={loginForm.password}
              onChange={(value) =>
                setLoginForm((current) => ({ ...current, password: value }))
              }
              autoComplete="current-password"
            />
            <button
              className="platform-admin-button"
              type="submit"
              disabled={busyAction === "login"}
            >
              {busyAction === "login" ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </article>
      );
    }

    if (view === "verify-mfa") {
      return (
        <article className="platform-admin-panel platform-admin-panel--auth">
          <div className="platform-admin-section-header">
            <h2>Verify MFA</h2>
            <p>
              Enter a 6-digit code from your authenticator app or use a backup
              code from enrollment.
            </p>
          </div>
          {renderNotice()}
          <form className="platform-admin-form" onSubmit={handleVerifyMfa}>
            <Field
              label="Verification code"
              value={verifyMfaCode}
              onChange={setVerifyMfaCode}
              autoComplete="one-time-code"
              placeholder="123456 or ABCD-1234"
            />
            <button
              className="platform-admin-button"
              type="submit"
              disabled={busyAction === "verify-mfa"}
            >
              {busyAction === "verify-mfa" ? "Verifying..." : "Verify"}
            </button>
          </form>
        </article>
      );
    }

    if (view === "setup-mfa" && session) {
      return (
        <article className="platform-admin-panel platform-admin-panel--auth">
          <div className="platform-admin-section-header">
            <h2>MFA enrollment required</h2>
            <p>
              Password-only access is intentionally temporary. Complete TOTP
              setup before using the owner back office further.
            </p>
          </div>
          {renderNotice()}
          <div className="platform-admin-auth-grid">
            <div className="platform-admin-auth-stack">
              <div className="platform-admin-identity-card">
                <span>Signed in as</span>
                <strong>
                  {session.admin.firstName} {session.admin.lastName}
                </strong>
                <small>{session.admin.email}</small>
              </div>
              <button
                className="platform-admin-button"
                type="button"
                onClick={() => void handleGenerateMfaSetup()}
                disabled={busyAction === "setup-mfa"}
              >
                {busyAction === "setup-mfa"
                  ? "Generating setup..."
                  : mfaSetup
                    ? "Regenerate setup kit"
                    : "Generate MFA setup kit"}
              </button>
              <button
                className="platform-admin-button platform-admin-button--ghost"
                type="button"
                onClick={() => void handleLogout()}
                disabled={busyAction === "logout"}
              >
                Exit this session
              </button>
            </div>

            {mfaSetup ? (
              <div className="platform-admin-mfa-layout">
                <div className="platform-admin-mfa-card">
                  <img
                    className="platform-admin-qr"
                    src={mfaSetup.qrCodeDataUrl}
                    alt="Platform admin MFA QR code"
                  />
                  <div className="platform-admin-manual-secret">
                    <span>Manual secret</span>
                    <code>{mfaSetup.secret}</code>
                  </div>
                </div>

                <div className="platform-admin-mfa-card">
                  <span>Backup codes</span>
                  <div className="platform-admin-backup-grid">
                    {mfaSetup.backupCodes.map((code) => (
                      <code key={code}>{code}</code>
                    ))}
                  </div>
                  <small>
                    Save these offline. Each backup code works once.
                  </small>
                  <form
                    className="platform-admin-form"
                    onSubmit={handleConfirmMfa}
                  >
                    <Field
                      label="Confirm current TOTP code"
                      value={confirmMfaCode}
                      onChange={setConfirmMfaCode}
                      autoComplete="one-time-code"
                      placeholder="123456"
                    />
                    <button
                      className="platform-admin-button"
                      type="submit"
                      disabled={busyAction === "confirm-mfa"}
                    >
                      {busyAction === "confirm-mfa"
                        ? "Confirming..."
                        : "Enable MFA"}
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="platform-admin-empty-state">
                <strong>No MFA kit generated yet</strong>
                <p>
                  Generate a QR code, pair your authenticator app, store backup
                  codes, and then confirm the first code to complete setup.
                </p>
              </div>
            )}
          </div>
        </article>
      );
    }

    if (view === "ready" && session) {
      return (
        <article className="platform-admin-panel platform-admin-panel--auth">
          <div className="platform-admin-section-header">
            <h2>Operator session active</h2>
            <p>
              The separate owner back office is authenticated and isolated from
              the tenant CRM session model.
            </p>
          </div>
          {renderNotice()}
          <div className="platform-admin-auth-grid">
            <div className="platform-admin-identity-card">
              <span>Current operator</span>
              <strong>
                {session.admin.firstName} {session.admin.lastName}
              </strong>
              <small>{session.admin.email}</small>
            </div>
            <div className="platform-admin-inline-stats">
              <div>
                <span>Role</span>
                <strong>{session.admin.role}</strong>
              </div>
              <div>
                <span>MFA</span>
                <strong>
                  {session.admin.mfaEnabled ? "Enabled" : "Missing"}
                </strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{session.admin.status}</strong>
              </div>
            </div>
            <button
              className="platform-admin-button platform-admin-button--ghost"
              type="button"
              onClick={() => void handleLogout()}
              disabled={busyAction === "logout"}
            >
              {busyAction === "logout" ? "Signing out..." : "Logout"}
            </button>
          </div>
        </article>
      );
    }

    return null;
  };

  return (
    <main className="platform-admin-shell">
      <section className="platform-admin-hero">
        <div className="platform-admin-hero-copy">
          <span className="platform-admin-eyebrow">Platform Admin Surface</span>
          <h1>Owner back office outside the tenant frontend</h1>
          <p>
            This entry is now more than a blueprint: it supports first-owner
            bootstrap, dedicated login, MFA verification, and required MFA
            enrollment without touching the tenant SPA.
          </p>
        </div>
        <div className="platform-admin-highlight">
          <span>Current state</span>
          <strong>
            {view === "ready"
              ? "Authenticated"
              : view === "setup-mfa"
                ? "MFA setup required"
                : view === "bootstrap"
                  ? "First owner bootstrap"
                  : view === "verify-mfa"
                    ? "Awaiting MFA confirmation"
                    : view === "loading"
                      ? "Loading"
                      : "Sign-in required"}
          </strong>
          <small>
            Entry: {PLATFORM_ADMIN_BLUEPRINT.frontendEntry}
            <br />
            API: {PLATFORM_ADMIN_BLUEPRINT.backendPrefix}
          </small>
        </div>
      </section>

      {renderAccessPanel()}
      {renderReadyData()}

      <section className="platform-admin-grid">
        <article className="platform-admin-panel">
          <h2>Locked Principles</h2>
          <ul>
            {PLATFORM_ADMIN_BLUEPRINT.principles.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="platform-admin-panel">
          <h2>Disabled By Default</h2>
          <ul>
            {PLATFORM_ADMIN_BLUEPRINT.disabledCapabilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="platform-admin-panel">
        <div className="platform-admin-section-header">
          <h2>MVP Screens</h2>
          <p>Initial operator surface with metadata-first access.</p>
        </div>
        <div className="platform-admin-card-grid">
          {mvpScreens.map((screen) => (
            <ScreenCard key={screen.id} screen={screen} />
          ))}
        </div>
      </section>

      <section className="platform-admin-panel">
        <div className="platform-admin-section-header">
          <h2>Phase 2 Screens</h2>
          <p>
            Deferred modules after platform auth, audit, and safe read models
            land.
          </p>
        </div>
        <div className="platform-admin-card-grid">
          {phase2Screens.map((screen) => (
            <ScreenCard key={screen.id} screen={screen} />
          ))}
        </div>
      </section>

      <section className="platform-admin-panel">
        <div className="platform-admin-section-header">
          <h2>Security Decisions</h2>
          <p>
            Rules that protect tenant confidentiality while the owner operates
            the platform.
          </p>
        </div>
        <div className="platform-admin-card-grid">
          {PLATFORM_ADMIN_BLUEPRINT.securityDecisions.map((decision) => (
            <article key={decision.id} className="platform-admin-card">
              <div className="platform-admin-card-header">
                <span
                  className={`platform-admin-status platform-admin-status--${decision.status}`}
                >
                  {decision.status === "locked_for_mvp" ? "MVP" : "Phase 2"}
                </span>
                <h3>{decision.title}</h3>
              </div>
              <p>{decision.decision}</p>
              <small>{decision.rationale}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="platform-admin-grid">
        <article className="platform-admin-panel">
          <div className="platform-admin-section-header">
            <h2>MVP API</h2>
            <p>
              Auth now includes first-owner bootstrap plus MFA enrollment and
              verification.
            </p>
          </div>
          <div className="platform-admin-api-list">
            {mvpApi.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="platform-admin-api-row"
              >
                <code>{endpoint.method}</code>
                <div>
                  <strong>{endpoint.path}</strong>
                  <p>{endpoint.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="platform-admin-panel">
          <div className="platform-admin-section-header">
            <h2>Phase 2 API</h2>
            <p>
              Deferred controls once audit, approvals, and safe tenant read
              models exist.
            </p>
          </div>
          <div className="platform-admin-api-list">
            {phase2Api.map((endpoint) => (
              <div
                key={`${endpoint.method}-${endpoint.path}`}
                className="platform-admin-api-row"
              >
                <code>{endpoint.method}</code>
                <div>
                  <strong>{endpoint.path}</strong>
                  <p>{endpoint.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="platform-admin-panel">
        <div className="platform-admin-section-header">
          <h2>Immediate Next Steps</h2>
          <p>
            Bootstrap and MFA enrollment are now live; the next milestone is
            safe metadata-only operator read models.
          </p>
        </div>
        <ol className="platform-admin-next-steps">
          {PLATFORM_ADMIN_BLUEPRINT.nextImplementationSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>
    </main>
  );
};
