import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { AuthResponse } from "../types/auth.types";
import { logger as frontendLogger } from "./logger.service";
import { authStorage } from "./auth-storage";
import { buildWindowLoginRedirectPath } from "../utils/authRedirect";

// Extend axios config to include metadata for timing
declare module "axios" {
  interface AxiosRequestConfig {
    metadata?: { startTime: number };
  }
}

const getLogger = () => frontendLogger;

const normalizeBaseUrl = (value?: string): string => {
  const trimmed = value?.trim();

  if (!trimmed) {
    return "/api";
  }

  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

/**
 * API Client Configuration
 */
const BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL);

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add auth token and logging
    this.client.interceptors.request.use(
      (config) => {
        // Add timestamp for duration tracking
        config.metadata = { startTime: Date.now() };

        // Add auth token
        const token = authStorage.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Log request in development
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[API Request] ${config.method?.toUpperCase()} ${config.url}`,
            config.data,
          );
        }

        return config;
      },
      (error) => {
        getLogger().error("API request setup error", error, "APIClient");
        return Promise.reject(error);
      },
    );

    // Response interceptor - Handle logging, errors, and token refresh
    this.client.interceptors.response.use(
      (response) => {
        this.logResponse(response);
        return response;
      },
      async (error: AxiosError) => {
        return this.handleResponseError(error);
      },
    );
  }

  /**
   * Log successful response
   */
  private logResponse(response: AxiosResponse): void {
    const duration =
      Date.now() - (response.config.metadata?.startTime || Date.now());

    getLogger().apiCall(
      response.config.method?.toUpperCase() || "GET",
      response.config.url || "",
      duration,
      response.status,
    );
  }

  /**
   * Handle response errors
   */
  private async handleResponseError(error: AxiosError): Promise<any> {
    const originalRequest = error.config as any;
    const duration =
      Date.now() - (originalRequest?.metadata?.startTime || Date.now());

    // Log error
    getLogger().apiCall(
      originalRequest?.method?.toUpperCase() || "GET",
      originalRequest?.url || "",
      duration,
      error.response?.status || 0,
      error.message,
    );

    // Log detailed error info
    if (error.response) {
      getLogger().error(
        `API Error: ${error.response.status}`,
        new Error(error.message),
        "APIClient",
        {
          url: originalRequest?.url,
          method: originalRequest?.method,
          status: error.response.status,
          data: error.response.data,
        },
      );
    } else if (error.request) {
      getLogger().error("API Network Error", error, "APIClient", {
        url: originalRequest?.url,
        method: originalRequest?.method,
      });
    }

    // Handle 401 - Token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/auth/login" &&
      originalRequest.url !== "/auth/refresh"
    ) {
      return this.handleTokenRefresh(originalRequest);
    }

    // Handle common errors
    this.handleCommonErrors(error);

    return Promise.reject(error);
  }

  /**
   * Handle token refresh for 401 errors
   */
  private async handleTokenRefresh(originalRequest: any): Promise<any> {
    originalRequest._retry = true;

    try {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const response = await this.client.post<AuthResponse>("/auth/refresh", {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Update tokens
      authStorage.setTokens({ accessToken, refreshToken: newRefreshToken });

      getLogger().info("Token refreshed successfully", "APIClient");

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return this.client(originalRequest);
    } catch (refreshError) {
      getLogger().warn(
        "Token refresh failed, redirecting to login",
        "APIClient",
      );

      // Refresh failed, clear tokens and redirect to login
      authStorage.clear();
      window.location.href = buildWindowLoginRedirectPath();
      return Promise.reject(refreshError);
    }
  }

  /**
   * Handle common HTTP errors
   */
  private handleCommonErrors(error: AxiosError): void {
    const status = error.response?.status;

    switch (status) {
      case 403:
        getLogger().warn("Access forbidden", "APIClient", {
          url: error.config?.url,
        });
        break;
      case 404:
        getLogger().warn("Resource not found", "APIClient", {
          url: error.config?.url,
        });
        break;
      case 429:
        getLogger().warn("Rate limit exceeded", "APIClient");
        break;
      case 500:
      case 502:
      case 503:
        getLogger().error(
          "Server error",
          new Error(`HTTP ${status}`),
          "APIClient",
          { url: error.config?.url },
        );
        break;
    }
  }

  /**
   * GET request
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  /**
   * GET blob response
   */
  async getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.client.get<Blob>(url, {
      ...config,
      responseType: "blob",
    });

    return response.data;
  }

  /**
   * POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(
      url,
      data,
      config,
    );
    return response.data;
  }

  /**
   * PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(
      url,
      data,
      config,
    );
    return response.data;
  }

  /**
   * DELETE request
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * Upload file
   */
  async upload<T = any>(
    url: string,
    fileOrFormData: File | FormData,
    onProgress?: (progress: number) => void,
  ): Promise<T> {
    const formData =
      fileOrFormData instanceof FormData ? fileOrFormData : new FormData();

    if (!(fileOrFormData instanceof FormData)) {
      formData.append("file", fileOrFormData);
    }

    const response: AxiosResponse<T> = await this.client.post(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  }

  /**
   * Download file
   */
  async download(url: string, filename: string): Promise<void> {
    const response = await this.client.get(url, {
      responseType: "blob",
    });

    const urlBlob = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = urlBlob;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(urlBlob);
  }
}

export const api = new ApiClient();
export default api;
