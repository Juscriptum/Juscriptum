import api from "./api";
import {
  Case,
  CreateCaseDto,
  UpdateCaseDto,
  CaseFilters,
  CaseListResponse,
  CaseStatistics,
  TimelineEvent,
  NextCaseNumberResponse,
  CaseRegistrySearchResult,
  RegistrySearchFilters,
  RegistryHearingSuggestion,
} from "../types/case.types";

/**
 * Case Service
 */
class CaseService {
  private baseUrl = "/cases";
  private static readonly MAX_PAGE_SIZE = 100;

  /**
   * Get all cases
   */
  async getCases(filters?: CaseFilters): Promise<CaseListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return api.get<CaseListResponse>(
      `${this.baseUrl}${query ? `?${query}` : ""}`,
    );
  }

  async getAllCases(
    filters?: Omit<CaseFilters, "page" | "limit">,
  ): Promise<Case[]> {
    const cases: Case[] = [];
    let page = 1;
    let total = 0;

    do {
      const response = await this.getCases({
        ...filters,
        page,
        limit: CaseService.MAX_PAGE_SIZE,
      });

      cases.push(...response.data);
      total = response.total;
      page += 1;
    } while (cases.length < total);

    return cases;
  }

  /**
   * Get case by ID
   */
  async getCase(id: string): Promise<Case> {
    return api.get<Case>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get case timeline
   */
  async getCaseTimeline(id: string): Promise<TimelineEvent[]> {
    return api.get<TimelineEvent[]>(`${this.baseUrl}/${id}/timeline`);
  }

  async getRegistryHearingSuggestion(
    id: string,
  ): Promise<RegistryHearingSuggestion | null> {
    return api.get<RegistryHearingSuggestion | null>(
      `${this.baseUrl}/${id}/registry-hearing-suggestion`,
    );
  }

  async getRegistryHearingNotifications(): Promise<
    RegistryHearingSuggestion[]
  > {
    return api.get<RegistryHearingSuggestion[]>(
      `${this.baseUrl}/registry-hearing-notifications`,
    );
  }

  async createRegistryHearingEvent(id: string): Promise<any> {
    return api.post(`${this.baseUrl}/${id}/registry-hearing-event`);
  }

  /**
   * Create case
   */
  async createCase(data: CreateCaseDto): Promise<Case> {
    return api.post<Case>(this.baseUrl, data);
  }

  async getNextCaseNumber(clientId: string): Promise<NextCaseNumberResponse> {
    const params = new URLSearchParams({ clientId });
    return api.get<NextCaseNumberResponse>(
      `${this.baseUrl}/next-number?${params.toString()}`,
    );
  }

  async searchRegistries(
    params: RegistrySearchFilters,
  ): Promise<CaseRegistrySearchResult[]> {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.append(key, value);
      }
    });

    return api.get<CaseRegistrySearchResult[]>(
      `${this.baseUrl}/registry-search?${searchParams.toString()}`,
    );
  }

  /**
   * Update case
   */
  async updateCase(id: string, data: UpdateCaseDto): Promise<Case> {
    return api.put<Case>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Change case status
   */
  async changeStatus(id: string, status: string): Promise<Case> {
    return api.put<Case>(`${this.baseUrl}/${id}/status`, { status });
  }

  /**
   * Delete case
   */
  async deleteCase(id: string): Promise<void> {
    return api.delete(`${this.baseUrl}/${id}`);
  }

  /**
   * Restore deleted case
   */
  async restoreCase(id: string): Promise<Case> {
    return api.post<Case>(`${this.baseUrl}/${id}/restore`);
  }

  /**
   * Get case statistics
   */
  async getStatistics(): Promise<CaseStatistics> {
    return api.get<CaseStatistics>(`${this.baseUrl}/statistics`);
  }

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(days: number = 30): Promise<Case[]> {
    return api.get<Case[]>(`${this.baseUrl}/upcoming-deadlines?days=${days}`);
  }
}

export const caseService = new CaseService();
export default caseService;
