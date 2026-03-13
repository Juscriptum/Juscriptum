import React, { useEffect } from "react";
import { useAppDispatch } from "../store";
import { clearUser, setUser } from "../store/auth.slice";
import { authStorage } from "../services/auth-storage";

const AUTH_STORAGE_KEYS = new Set([
  "access_token",
  "refresh_token",
  "auth_user",
  "auth_organization",
  "auth_remember_me",
]);

export const AuthSessionSync: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const syncAuthState = () => {
      const accessToken = authStorage.getAccessToken();
      const storedSession = authStorage.getStoredSession();

      if (!accessToken || !storedSession) {
        dispatch(clearUser());
        return;
      }

      dispatch(
        setUser({
          user: storedSession.user,
          organization: storedSession.organization,
          isAuthenticated: true,
        }),
      );
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key && !AUTH_STORAGE_KEYS.has(event.key)) {
        return;
      }

      syncAuthState();
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [dispatch]);

  return null;
};
