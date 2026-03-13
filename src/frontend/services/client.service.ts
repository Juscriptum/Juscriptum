import api from "./api";
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  ClientFilters,
  ClientListResponse,
  ClientStatistics,
  DeleteClientOptions,
  NextClientNumberResponse,
  CourtRegistrySearchResult,
  CourtRegistrySearchFilters,
} from "../types/client.types";

/**
 * Client Service
 */
class ClientService {
  private baseUrl = "/clients";
  private static readonly MAX_PAGE_SIZE = 100;

  /**
   * Get all clients
   */
  async getClients(filters?: ClientFilters): Promise<ClientListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return api.get<ClientListResponse>(
      `${this.baseUrl}${query ? `?${query}` : ""}`,
    );
  }

  async getAllClients(
    filters?: Omit<ClientFilters, "page" | "limit">,
  ): Promise<Client[]> {
    const clients: Client[] = [];
    let page = 1;
    let total = 0;

    do {
      const response = await this.getClients({
        ...filters,
        page,
        limit: ClientService.MAX_PAGE_SIZE,
      });

      clients.push(...response.data);
      total = response.total;
      page += 1;
    } while (clients.length < total);

    return clients;
  }

  /**
   * Get client by ID
   */
  async getClient(id: string): Promise<Client> {
    return api.get<Client>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create client
   */
  async createClient(data: CreateClientDto): Promise<Client> {
    return api.post<Client>(this.baseUrl, data);
  }

  async getNextClientNumber(): Promise<NextClientNumberResponse> {
    return api.get<NextClientNumberResponse>(`${this.baseUrl}/next-number`);
  }

  async searchCourtRegistry(
    filters: CourtRegistrySearchFilters,
  ): Promise<CourtRegistrySearchResult[]> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    return api.get<CourtRegistrySearchResult[]>(
      `${this.baseUrl}/court-registry/search?${params.toString()}`,
    );
  }

  /**
   * Update client
   */
  async updateClient(id: string, data: UpdateClientDto): Promise<Client> {
    return api.put<Client>(`${this.baseUrl}/${id}`, data);
  }

  /**
   * Delete client
   */
  async deleteClient(id: string, options?: DeleteClientOptions): Promise<void> {
    return api.delete(
      `${this.baseUrl}/${id}`,
      options ? { data: options } : undefined,
    );
  }

  /**
   * Get client statistics
   */
  async getStatistics(): Promise<ClientStatistics> {
    return api.get<ClientStatistics>(`${this.baseUrl}/statistics`);
  }

  /**
   * Bulk import clients
   */
  async bulkImport(
    clients: CreateClientDto[],
  ): Promise<{ success: number; failed: number; errors: any[] }> {
    return api.post(`${this.baseUrl}/import`, { clients });
  }
}

export const clientService = new ClientService();
export default clientService;
