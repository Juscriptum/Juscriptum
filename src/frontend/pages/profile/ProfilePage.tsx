import React, { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { Spinner } from "../../components/Spinner";
import { Breadcrumbs } from "../../components/navigation";
import { profileService } from "../../services/profile.service";
import { UserProfile } from "../../types/profile.types";
import { UserProfileDetailsForm } from "../../components/profile/UserProfileDetailsForm";
import "../workspace/WorkspacePage.css";
import "./ProfilePage.css";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const nextProfile = await profileService.getProfile();
        setProfile(nextProfile);
      } catch (_error) {
        setMessage({ type: "error", text: "Не вдалося завантажити профіль" });
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const handleProfileSubmit = async (formData: any) => {
    const updated = await profileService.updateProfile(formData);
    setProfile(updated);
    setMessage({ type: "success", text: "Профіль успішно оновлено" });
  };

  const handlePasswordSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setMessage({
        type: "error",
        text: "Заповніть поточний та новий пароль",
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "Паролі не співпадають" });
      return;
    }

    setIsSavingPassword(true);
    setMessage(null);

    try {
      await profileService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword,
      );
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Пароль успішно змінено" });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Не вдалося змінити пароль",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="workspace-page profile-page">
        <Breadcrumbs />
        <PageHeader
          title="Профіль"
          subtitle="Керуйте персональними даними, реквізитами та безпекою облікового запису."
        />
        <div className="profile-loading">
          <Spinner size="large" />
          <p>Завантаження профілю...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace-page profile-page">
      <Breadcrumbs />
      <PageHeader
        title="Профіль"
        subtitle="Керуйте персональними даними, реквізитами та безпекою облікового запису."
      />

      <section className="profile-hero">
        <div className="profile-avatar">
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" />
          ) : (
            <div className="avatar-placeholder">
              {(profile?.firstName || user?.firstName || "Н")[0]}
              {(profile?.lastName || user?.lastName || "К")[0]}
            </div>
          )}
        </div>
        <div className="profile-info">
          <h2>
            {profile?.firstName || user?.firstName}{" "}
            {profile?.lastName || user?.lastName}
          </h2>
          <p>{profile?.email || user?.email}</p>
        </div>
      </section>

      {message ? <Alert type={message.type}>{message.text}</Alert> : null}

      <div className="profile-content">
        <div className="profile-section profile-section--details">
          <UserProfileDetailsForm
            email={profile?.email || user?.email || ""}
            initialData={profile || undefined}
            introTitle="Дані профілю"
            introText="Профіль побудований як універсальна форма: змінюйте організаційну модель, контакти, банківські реквізити та адреси без переходу між окремими екранами."
            onSubmit={handleProfileSubmit}
          />
        </div>

        <section className="profile-section password-section">
          <h2>Безпека</h2>
          <form className="password-form" onSubmit={handlePasswordSubmit}>
            <label>
              <span>Поточний пароль</span>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(event) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    currentPassword: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Новий пароль</span>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(event) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    newPassword: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Підтвердження пароля</span>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(event) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: event.target.value,
                  }))
                }
              />
            </label>
            <button
              type="submit"
              className="save-button"
              disabled={isSavingPassword}
            >
              {isSavingPassword ? "Збереження..." : "Оновити пароль"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
