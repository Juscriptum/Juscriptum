import api from "./api";
import { authStorage } from "./auth-storage";
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  RefreshTokenResponse,
  ForgotPasswordData,
  ResetPasswordData,
  VerifyEmailData,
  User,
} from "../types/auth.types";

/**
 * Auth Service
 */
export const authService = {
  /**
   * Persist full auth session
   */
  setSession(session: AuthResponse, rememberMe = false): void {
    authStorage.setSession(session, rememberMe);
  },

  /**
   * Login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>("/auth/login", credentials);
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    return api.post<RefreshTokenResponse>("/auth/refresh", { refreshToken });
  },

  /**
   * Logout
   */
  async logout(refreshToken?: string): Promise<void> {
    await api.post<void>("/auth/logout", { refreshToken });
  },

  /**
   * Logout from all devices
   */
  async logoutAll(): Promise<void> {
    await api.post<void>("/auth/logout-all");
  },

  /**
   * Forgot password
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    await api.post<void>("/auth/forgot-password", data);
  },

  /**
   * Reset password
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    await api.post<void>("/auth/reset-password", data);
  },

  /**
   * Verify email
   */
  async verifyEmail(data: VerifyEmailData): Promise<void> {
    await api.post<void>("/auth/verify-email", data);
  },

  /**
   * Get current user
   */
  async getMe(): Promise<User> {
    return api.get<User>("/auth/me");
  },

  /**
   * Register - Simple email + password registration
   */
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/auth/register",
      credentials,
    );

    // Store tokens after registration for auto-login
    if (response.accessToken && response.refreshToken) {
      this.setSession(response, false);
    }

    return response;
  },

  /**
   * Store tokens
   */
  setTokens(tokens: AuthResponse): void {
    authStorage.setTokens(tokens);
  },

  /**
   * Get persisted auth session
   */
  getStoredSession(): {
    user: User;
    organization: AuthResponse["organization"];
  } | null {
    return authStorage.getStoredSession();
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return authStorage.getAccessToken();
  },

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return authStorage.getRefreshToken();
  },

  /**
   * Clear tokens
   */
  clearTokens(): void {
    authStorage.clear();
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return authStorage.isAuthenticated();
  },
};
