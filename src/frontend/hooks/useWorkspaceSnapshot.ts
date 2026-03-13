import { useEffect, useState } from "react";
import { caseService } from "../services/case.service";
import { clientService } from "../services/client.service";
import { dashboardService } from "../services/dashboard.service";
import { documentService } from "../services/document.service";
import { subscriptionService } from "../services/subscription.service";
import { Case, CaseStatistics } from "../types/case.types";
import { Client } from "../types/client.types";
import { DashboardStats } from "../types/dashboard.types";
import { Document } from "../types/document.types";
import { Invoice, Subscription } from "../types/subscription.types";

interface WorkspaceSnapshotOptions {
  days?: number;
  casesLimit?: number;
  clientsLimit?: number;
  documentsLimit?: number;
}

interface WorkspaceSnapshotState {
  dashboard: DashboardStats | null;
  caseStats: CaseStatistics | null;
  cases: Case[];
  clients: Client[];
  documents: Document[];
  invoices: Invoice[];
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const DEFAULT_OPTIONS: Required<WorkspaceSnapshotOptions> = {
  days: 30,
  casesLimit: 12,
  clientsLimit: 12,
  documentsLimit: 12,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
};

export const useWorkspaceSnapshot = (
  options?: WorkspaceSnapshotOptions,
): WorkspaceSnapshotState => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [caseStats, setCaseStats] = useState<CaseStatistics | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSnapshot = async () => {
      setLoading(true);
      setError(null);

      const results = await Promise.allSettled([
        dashboardService.getStats({ days: mergedOptions.days }),
        caseService.getStatistics(),
        caseService.getCases({
          limit: mergedOptions.casesLimit,
          sortBy: "updatedAt",
          sortOrder: "DESC",
        }),
        clientService.getClients({
          limit: mergedOptions.clientsLimit,
          sortBy: "updatedAt",
          sortOrder: "DESC",
        }),
        documentService.getDocuments({
          limit: mergedOptions.documentsLimit,
          sortBy: "updatedAt",
          sortOrder: "DESC",
        }),
        subscriptionService.getInvoices(),
        subscriptionService.getSubscription(),
      ]);

      if (cancelled) {
        return;
      }

      const failures = results
        .filter(
          (result): result is PromiseRejectedResult =>
            result.status === "rejected",
        )
        .map((result, index) =>
          getErrorMessage(
            result.reason,
            `Не вдалося завантажити блок даних #${index + 1}`,
          ),
        );

      const [
        dashboardResult,
        caseStatsResult,
        casesResult,
        clientsResult,
        documentsResult,
        invoicesResult,
        subscriptionResult,
      ] = results;

      setDashboard(
        dashboardResult.status === "fulfilled" ? dashboardResult.value : null,
      );
      setCaseStats(
        caseStatsResult.status === "fulfilled" ? caseStatsResult.value : null,
      );
      setCases(
        casesResult.status === "fulfilled" ? casesResult.value.data : [],
      );
      setClients(
        clientsResult.status === "fulfilled" ? clientsResult.value.data : [],
      );
      setDocuments(
        documentsResult.status === "fulfilled"
          ? documentsResult.value.data
          : [],
      );
      setInvoices(
        invoicesResult.status === "fulfilled" ? invoicesResult.value : [],
      );
      setSubscription(
        subscriptionResult.status === "fulfilled"
          ? subscriptionResult.value
          : null,
      );
      setError(failures.length > 0 ? failures.slice(0, 2).join(". ") : null);
      setLoading(false);
    };

    loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [
    mergedOptions.casesLimit,
    mergedOptions.clientsLimit,
    mergedOptions.days,
    mergedOptions.documentsLimit,
    refreshKey,
  ]);

  return {
    dashboard,
    caseStats,
    cases,
    clients,
    documents,
    invoices,
    subscription,
    loading,
    error,
    refresh: () => setRefreshKey((value) => value + 1),
  };
};

export default useWorkspaceSnapshot;
