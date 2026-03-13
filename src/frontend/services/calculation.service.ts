import api from "./api";
import {
  ApproveCalculationDto,
  Calculation,
  CalculationFilters,
  CalculationListResponse,
  CreateCalculationDto,
  RejectCalculationDto,
  UpdateCalculationDto,
} from "../types/calculation.types";

class CalculationService {
  private baseUrl = "/calculations";
  private static readonly MAX_PAGE_SIZE = 100;

  async getCalculations(
    filters?: CalculationFilters,
  ): Promise<CalculationListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return api.get<CalculationListResponse>(
      `${this.baseUrl}${query ? `?${query}` : ""}`,
    );
  }

  async createCalculation(data: CreateCalculationDto): Promise<Calculation> {
    return api.post<Calculation>(this.baseUrl, data);
  }

  async getCalculation(id: string): Promise<Calculation> {
    return api.get<Calculation>(`${this.baseUrl}/${id}`);
  }

  async getAllCalculations(
    filters?: Omit<CalculationFilters, "page" | "limit">,
  ): Promise<Calculation[]> {
    const calculations: Calculation[] = [];
    let page = 1;
    let total = 0;

    do {
      const response = await this.getCalculations({
        ...filters,
        page,
        limit: CalculationService.MAX_PAGE_SIZE,
      });
      calculations.push(...response.data);
      total = response.total;
      page += 1;
    } while (calculations.length < total);

    return calculations;
  }

  async updateCalculation(
    id: string,
    data: UpdateCalculationDto,
  ): Promise<Calculation> {
    return api.put<Calculation>(`${this.baseUrl}/${id}`, data);
  }

  async deleteCalculation(id: string): Promise<void> {
    await api.delete(`${this.baseUrl}/${id}`);
  }

  async sendForApproval(id: string): Promise<Calculation> {
    return api.post<Calculation>(`${this.baseUrl}/${id}/send-for-approval`);
  }

  async approveCalculation(
    id: string,
    data: ApproveCalculationDto = {},
  ): Promise<Calculation> {
    return api.post<Calculation>(`${this.baseUrl}/${id}/approve`, data);
  }

  async rejectCalculation(
    id: string,
    data: RejectCalculationDto,
  ): Promise<Calculation> {
    return api.post<Calculation>(`${this.baseUrl}/${id}/reject`, data);
  }
}

export const calculationService = new CalculationService();
export default calculationService;
