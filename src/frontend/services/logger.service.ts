import { authStorage } from "./auth-storage";

/**
 * Logger Service
 * Centralized logging for the frontend application
 * Tracks errors, user actions, and performance metrics
 */

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  userId?: string;
  tenantId?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  logToConsole: boolean;
  logToServer: boolean;
  serverEndpoint?: string;
  batchSize: number;
  flushInterval: number; // ms
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

class LoggerService {
  private config: LoggerConfig = {
    enabled: true,
    minLevel: "info",
    logToConsole: true,
    logToServer: true,
    serverEndpoint: "/api/logs",
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
  };

  private logBuffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private userId: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    this.startFlushTimer();
    this.setupErrorHandlers();
  }

  /**
   * Configure the logger
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Set user context
   */
  setUser(userId: string | null, tenantId?: string | null): void {
    this.userId = userId;
    this.tenantId = tenantId || null;
  }

  /**
   * Log debug message
   */
  debug(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log("debug", message, context, metadata);
  }

  /**
   * Log info message
   */
  info(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log("info", message, context, metadata);
  }

  /**
   * Log warning message
   */
  warn(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log("warn", message, context, metadata);
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log("error", message, context, metadata, error);
  }

  /**
   * Log fatal error
   */
  fatal(
    message: string,
    error?: Error,
    context?: string,
    metadata?: Record<string, any>,
  ): void {
    this.log("fatal", message, context, metadata, error);
  }

  /**
   * Log user action
   */
  userAction(action: string, details?: Record<string, any>): void {
    this.log("info", `User action: ${action}`, "UserAction", {
      action,
      ...details,
    });
  }

  /**
   * Log page view
   */
  pageView(pageName: string, path?: string): void {
    this.log("info", `Page view: ${pageName}`, "PageView", {
      pageName,
      path: path || window.location.pathname,
      referrer: document.referrer,
    });
  }

  /**
   * Log API call
   */
  apiCall(
    method: string,
    url: string,
    duration: number,
    status: number,
    error?: string,
  ): void {
    const level = status >= 400 ? "error" : "info";
    this.log(level, `API ${method} ${url}`, "APICall", {
      method,
      url,
      duration,
      status,
      error,
    });
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, unit: string = "ms"): void {
    this.log("info", `Performance: ${metric}`, "Performance", {
      metric,
      value,
      unit,
    });
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: string,
    metadata?: Record<string, any>,
    error?: Error,
  ): void {
    if (!this.config.enabled) return;
    if (LOG_LEVELS[level] < LOG_LEVELS[this.config.minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userId: this.userId || undefined,
      tenantId: this.tenantId || undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Console output
    if (this.config.logToConsole) {
      this.logToConsole(entry);
    }

    // Buffer for server logging
    if (this.config.logToServer) {
      this.logBuffer.push(entry);
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    }
  }

  /**
   * Output to console with formatting
   */
  private logToConsole(entry: LogEntry): void {
    const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : "";
    const fullMessage = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case "debug":
        console.debug(fullMessage, entry.metadata || "");
        break;
      case "info":
        console.info(fullMessage, entry.metadata || "");
        break;
      case "warn":
        console.warn(fullMessage, entry.metadata || "");
        break;
      case "error":
      case "fatal":
        console.error(fullMessage, entry.error || entry.metadata || "");
        break;
    }
  }

  /**
   * Flush logs to server
   */
  async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;
    if (!this.config.logToServer) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const response = await fetch(this.config.serverEndpoint || "/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authStorage.getAccessToken()}`,
        },
        body: JSON.stringify({ logs: logsToSend }),
      });

      if (!response.ok) {
        // Re-add logs to buffer on failure
        this.logBuffer = [...logsToSend, ...this.logBuffer].slice(0, 100); // Limit buffer size
      }
    } catch (error) {
      // Silently fail and keep logs in buffer
      this.logBuffer = [...logsToSend, ...this.logBuffer].slice(0, 100);
    }
  }

  /**
   * Start periodic flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener("beforeunload", () => {
      this.flush();
    });
  }

  /**
   * Setup global error handlers
   */
  private setupErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      this.error(
        "Uncaught error",
        event.error || new Error(event.message),
        "GlobalErrorHandler",
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      );
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));

      this.error(
        "Unhandled promise rejection",
        error,
        "PromiseRejectionHandler",
      );
    });
  }

  /**
   * Get all buffered logs
   */
  getBufferedLogs(): LogEntry[] {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearBuffer(): void {
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = new LoggerService();

// Export type for dependency injection
export type Logger = typeof logger;
