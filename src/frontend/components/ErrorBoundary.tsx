import React, { Component, ErrorInfo, ReactNode } from "react";
import { logger } from "../services/logger.service";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and logs them
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error to our logger service
    logger.error(
      "React Error Boundary caught an error",
      error,
      "ErrorBoundary",
      {
        componentStack: errorInfo.componentStack,
      },
    );

    this.setState({ errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = "/";
  };

  handleReportBug = (): void => {
    const { error, errorInfo } = this.state;
    const bugReport = {
      timestamp: new Date().toISOString(),
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Copy to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        alert("Bug report copied to clipboard!");
      })
      .catch(() => {
        console.log("Bug report:", bugReport);
      });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>Щось пішло не так</h1>
            <p style={styles.message}>
              Виникла несподівана помилка. Ми вже працюємо над її вирішенням.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Деталі помилки</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={styles.actions}>
              <button style={styles.primaryButton} onClick={this.handleReload}>
                Перезавантажити сторінку
              </button>
              <button
                style={styles.secondaryButton}
                onClick={this.handleGoHome}
              >
                На головну
              </button>
              <button
                style={styles.tertiaryButton}
                onClick={this.handleReportBug}
              >
                Повідомити про помилку
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: "20px",
    backgroundColor: "#f5f5f5",
  },
  content: {
    textAlign: "center",
    maxWidth: "600px",
    padding: "40px",
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
  },
  icon: {
    fontSize: "64px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "24px",
    fontWeight: 600,
    color: "#16213e",
    margin: "0 0 12px",
  },
  message: {
    fontSize: "16px",
    color: "#666",
    margin: "0 0 24px",
  },
  details: {
    marginBottom: "24px",
    textAlign: "left",
  },
  summary: {
    cursor: "pointer",
    color: "#667eea",
    marginBottom: "12px",
  },
  errorText: {
    backgroundColor: "#f8f9fa",
    padding: "16px",
    borderRadius: "8px",
    overflow: "auto",
    fontSize: "12px",
    maxHeight: "300px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  primaryButton: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 500,
    color: "white",
    backgroundColor: "#667eea",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  secondaryButton: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: 500,
    color: "#667eea",
    backgroundColor: "white",
    border: "1px solid #667eea",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  tertiaryButton: {
    padding: "12px 24px",
    fontSize: "14px",
    fontWeight: 500,
    color: "#666",
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
  },
};
