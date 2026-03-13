import React, { useEffect, useMemo, useState } from "react";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { teamService } from "../../services/team.service";
import {
  CreateInvitationData,
  TeamInvitation,
  TeamMember,
  TeamMemberStatus,
  TeamRole,
} from "../../types/team.types";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../hooks/useAuth";
import "../workspace/WorkspacePage.css";
import "./UsersPage.css";

const ROLE_LABELS: Record<TeamRole, string> = {
  super_admin: "Super admin",
  organization_owner: "Власник",
  organization_admin: "Адміністратор",
  lawyer: "Юрист",
  assistant: "Асистент",
  accountant: "Бухгалтер",
};

const STATUS_LABELS: Record<TeamMemberStatus, string> = {
  pending: "Очікує",
  active: "Активний",
  suspended: "Призупинений",
  deleted: "Видалений",
};

const INVITE_ROLE_OPTIONS: TeamRole[] = [
  "organization_admin",
  "lawyer",
  "assistant",
  "accountant",
];

const MEMBER_STATUS_OPTIONS: TeamMemberStatus[] = ["active", "suspended"];

const formatDate = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("uk-UA", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Немає входів";

export const UsersPage: React.FC = () => {
  const permissions = usePermissions();
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [inviteForm, setInviteForm] = useState<CreateInvitationData>({
    email: "",
    role: "lawyer",
    message: "",
  });

  const canManageUsers = permissions.canManageUsers();

  const summary = useMemo(() => {
    const activeMembers = members.filter(
      (member) => member.status === "active",
    );
    const pendingInvites = invitations.filter(
      (invitation) => invitation.status === "pending",
    );

    return {
      total: members.length,
      active: activeMembers.length,
      pendingInvites: pendingInvites.length,
      limit:
        permissions.organization?.maxUsers === -1
          ? "Без ліміту"
          : String(permissions.organization?.maxUsers ?? "n/a"),
    };
  }, [invitations, members, permissions.organization?.maxUsers]);

  const loadData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const [membersData, invitationsData] = await Promise.all([
        teamService.getMembers(),
        teamService.getInvitations(),
      ]);
      setMembers(membersData);
      setInvitations(invitationsData);
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Не вдалося завантажити команду організації",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleInviteSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage(null);
      const invitation = await teamService.createInvitation(inviteForm);
      setInvitations((prev) => [invitation, ...prev]);
      setInviteForm({ email: "", role: "lawyer", message: "" });
      setMessage({
        type: "success",
        text: "Запрошення збережено. SMTP-відправка буде перевірятися окремо на staging.",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || "Не вдалося створити запрошення",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, role: TeamRole) => {
    try {
      setSaving(true);
      const updatedMember = await teamService.updateMember(member.id, { role });
      setMembers((prev) =>
        prev.map((item) => (item.id === member.id ? updatedMember : item)),
      );
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Не вдалося оновити роль користувача",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    member: TeamMember,
    status: TeamMemberStatus,
  ) => {
    try {
      setSaving(true);
      const updatedMember = await teamService.updateMember(member.id, {
        status,
      });
      setMembers((prev) =>
        prev.map((item) => (item.id === member.id ? updatedMember : item)),
      );
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Не вдалося оновити статус користувача",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    try {
      setSaving(true);
      const updated = await teamService.revokeInvitation(invitationId);
      setInvitations((prev) =>
        prev.map((item) => (item.id === invitationId ? updated : item)),
      );
    } catch (error: any) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message || "Не вдалося відкликати запрошення",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canManageUsers) {
    return (
      <div className="workspace-page">
        <Breadcrumbs />
        <PageHeader
          title="Користувачі"
          subtitle="Доступ до керування командою мають адміністратори організації"
        />
        <Alert type="warning">
          Для перегляду складу команди зверніться до власника або адміністратора
          організації.
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
        title="Користувачі"
        subtitle="Склад команди, ролі доступу та журнал активних запрошень"
        actions={
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              void loadData();
            }}
          >
            Оновити
          </button>
        }
      />

      {message && (
        <Alert
          type={message.type}
          onClose={() => {
            setMessage(null);
          }}
        >
          {message.text}
        </Alert>
      )}

      <div className="workspace-grid">
        <div className="workspace-card">
          <span>Усього учасників</span>
          <strong>{summary.total}</strong>
          <small>Активних: {summary.active}</small>
        </div>
        <div className="workspace-card">
          <span>Запрошення</span>
          <strong>{summary.pendingInvites}</strong>
          <small>Очікують прийняття</small>
        </div>
        <div className="workspace-card">
          <span>Ліміт тарифу</span>
          <strong>{summary.limit}</strong>
          <small>Поточний план: {permissions.getPlan() || "n/a"}</small>
        </div>
        <div className="workspace-card">
          <span>Ваш доступ</span>
          <strong>{ROLE_LABELS[(user?.role || "lawyer") as TeamRole]}</strong>
          <small>{user?.email}</small>
        </div>

        <section className="workspace-panel full users-panel-grid">
          <div className="workspace-panel users-panel">
            <div className="workspace-panel-header">
              <div>
                <h3>Команда організації</h3>
                <p>Керуйте ролями та статусами без виходу з CRM</p>
              </div>
            </div>
            <div className="workspace-list">
              {members.map((member) => {
                const canEditMember =
                  member.role !== "organization_owner" &&
                  member.id !== user?.id;

                return (
                  <div
                    key={member.id}
                    className="workspace-list-item users-row"
                  >
                    <div>
                      <strong>
                        {member.lastName} {member.firstName}
                      </strong>
                      <span>
                        {member.email}
                        {member.position ? ` • ${member.position}` : ""}
                      </span>
                      <span className="users-row-meta">
                        Останній вхід: {formatDate(member.lastLoginAt)}
                      </span>
                    </div>
                    <div className="users-row-controls">
                      <span
                        className={`workspace-badge users-status users-status--${member.status}`}
                      >
                        {STATUS_LABELS[member.status]}
                      </span>
                      <select
                        value={member.role}
                        disabled={!canEditMember || saving}
                        onChange={(event) =>
                          void handleRoleChange(
                            member,
                            event.target.value as TeamRole,
                          )
                        }
                      >
                        {Object.entries(ROLE_LABELS)
                          .filter(([role]) => role !== "super_admin")
                          .map(([role, label]) => (
                            <option key={role} value={role}>
                              {label}
                            </option>
                          ))}
                      </select>
                      <select
                        value={member.status}
                        disabled={!canEditMember || saving}
                        onChange={(event) =>
                          void handleStatusChange(
                            member,
                            event.target.value as TeamMemberStatus,
                          )
                        }
                      >
                        <option value={member.status}>
                          {STATUS_LABELS[member.status]}
                        </option>
                        {MEMBER_STATUS_OPTIONS.filter(
                          (status) => status !== member.status,
                        ).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="workspace-panel users-panel">
            <div className="workspace-panel-header">
              <div>
                <h3>Нове запрошення</h3>
              </div>
            </div>
            <form className="users-invite-form" onSubmit={handleInviteSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="name@firm.ua"
                  required
                />
              </label>
              <label>
                Роль
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      role: event.target.value as TeamRole,
                    }))
                  }
                >
                  {INVITE_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Примітка
                <textarea
                  rows={4}
                  value={inviteForm.message || ""}
                  onChange={(event) =>
                    setInviteForm((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                  placeholder="Контекст для майбутнього email або ручного дзвінка"
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                Створити запрошення
              </button>
            </form>

            <div className="workspace-panel-header users-subpanel-header">
              <div>
                <h3>Активні запрошення</h3>
              </div>
            </div>
            <div className="workspace-list">
              {invitations.length === 0 ? (
                <div className="workspace-empty">
                  Активних запрошень ще немає.
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="workspace-list-item users-row users-row--invite"
                  >
                    <div>
                      <strong>{invitation.email}</strong>
                      <span>
                        {ROLE_LABELS[invitation.role]} • до{" "}
                        {formatDate(invitation.expiresAt)}
                      </span>
                    </div>
                    <div className="users-row-controls">
                      <span
                        className={`workspace-badge users-status users-status--${invitation.status}`}
                      >
                        {invitation.status}
                      </span>
                      {invitation.status === "pending" && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          disabled={saving}
                          onClick={() =>
                            void handleRevokeInvitation(invitation.id)
                          }
                        >
                          Відкликати
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default UsersPage;
