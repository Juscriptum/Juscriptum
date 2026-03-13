import api from "./api";
import { CreateEventDto, Event } from "../types/event.types";

class EventService {
  private baseUrl = "/events";

  async getEvents(filters?: {
    caseId?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  }): Promise<{ data: Event[]; total: number; page: number; limit: number }> {
    const params = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        params.append(key, String(value));
      }
    });

    return api.get<{
      data: Event[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.baseUrl}${params.toString() ? `?${params.toString()}` : ""}`);
  }

  async getAllEvents(filters?: { caseId?: string }): Promise<Event[]> {
    const events: Event[] = [];
    let page = 1;
    let total = 0;

    do {
      const response = await this.getEvents({
        ...filters,
        page,
        limit: 100,
        sortBy: "eventDate",
        sortOrder: "ASC",
      });
      events.push(...response.data);
      total = response.total;
      page += 1;
    } while (events.length < total);

    return events;
  }

  async getCalendarEvents(startDate: Date, endDate: Date): Promise<Event[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return api.get<Event[]>(`${this.baseUrl}/calendar?${params.toString()}`);
  }

  async createEvent(data: CreateEventDto): Promise<Event> {
    return api.post<Event>(this.baseUrl, data);
  }
}

export const eventService = new EventService();
export default eventService;
