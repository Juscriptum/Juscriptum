import api from "./api";
import {
  CreatePricelistCategoryDto,
  CreatePricelistDto,
  CreatePricelistItemDto,
  Pricelist,
  PricelistFilters,
  PricelistListResponse,
  PricelistCategory,
  UpdatePricelistCategoryDto,
  UpdatePricelistDto,
  UpdatePricelistItemDto,
} from "../types/pricelist.types";

class PricelistService {
  private baseUrl = "/pricelists";
  private static readonly MAX_PAGE_SIZE = 100;

  async getPricelists(
    filters?: PricelistFilters,
  ): Promise<PricelistListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    return api.get<PricelistListResponse>(
      `${this.baseUrl}${query ? `?${query}` : ""}`,
    );
  }

  async getAllPricelists(
    filters?: Omit<PricelistFilters, "page" | "limit">,
  ): Promise<Pricelist[]> {
    const pricelists: Pricelist[] = [];
    let page = 1;
    let total = 0;

    do {
      const response = await this.getPricelists({
        ...filters,
        page,
        limit: PricelistService.MAX_PAGE_SIZE,
      });

      pricelists.push(...response.data);
      total = response.total;
      page += 1;
    } while (pricelists.length < total);

    return pricelists;
  }

  async getPricelist(id: string): Promise<Pricelist> {
    return api.get<Pricelist>(`${this.baseUrl}/${id}`);
  }

  async createPricelist(data: CreatePricelistDto): Promise<Pricelist> {
    return api.post<Pricelist>(this.baseUrl, data);
  }

  async updatePricelist(
    id: string,
    data: UpdatePricelistDto,
  ): Promise<Pricelist> {
    return api.put<Pricelist>(`${this.baseUrl}/${id}`, data);
  }

  async deletePricelist(id: string): Promise<void> {
    return api.delete(`${this.baseUrl}/${id}`);
  }

  async duplicatePricelist(id: string): Promise<Pricelist> {
    return api.post<Pricelist>(`${this.baseUrl}/${id}/duplicate`);
  }

  async addCategory(
    pricelistId: string,
    data: CreatePricelistCategoryDto,
  ): Promise<PricelistCategory> {
    return api.post<PricelistCategory>(
      `${this.baseUrl}/${pricelistId}/categories`,
      data,
    );
  }

  async updateCategory(
    categoryId: string,
    data: UpdatePricelistCategoryDto,
  ): Promise<PricelistCategory> {
    return api.put<PricelistCategory>(
      `${this.baseUrl}/categories/${categoryId}`,
      data,
    );
  }

  async deleteCategory(categoryId: string): Promise<void> {
    return api.delete(`${this.baseUrl}/categories/${categoryId}`);
  }

  async addItem(pricelistId: string, data: CreatePricelistItemDto) {
    return api.post(`${this.baseUrl}/${pricelistId}/items`, data);
  }

  async updateItem(itemId: string, data: UpdatePricelistItemDto) {
    return api.put(`${this.baseUrl}/items/${itemId}`, data);
  }

  async deleteItem(itemId: string): Promise<void> {
    return api.delete(`${this.baseUrl}/items/${itemId}`);
  }
}

export const pricelistService = new PricelistService();
export default pricelistService;
