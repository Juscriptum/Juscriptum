import api from "./api";
import {
  CreateNoteDto,
  Note,
  NoteFilters,
  NoteListResponse,
  UpdateNoteDto,
} from "../types/note.types";

class NoteService {
  private baseUrl = "/notes";

  async getNotes(filters?: NoteFilters): Promise<NoteListResponse> {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();

    return api.get<NoteListResponse>(
      `${this.baseUrl}${query ? `?${query}` : ""}`,
    );
  }

  async getNote(id: string): Promise<Note> {
    return api.get<Note>(`${this.baseUrl}/${id}`);
  }

  async createNote(data: CreateNoteDto): Promise<Note> {
    return api.post<Note>(this.baseUrl, data);
  }

  async updateNote(id: string, data: UpdateNoteDto): Promise<Note> {
    return api.put<Note>(`${this.baseUrl}/${id}`, data);
  }

  async deleteNote(id: string): Promise<void> {
    return api.delete(`${this.baseUrl}/${id}`);
  }
}

export const noteService = new NoteService();
export default noteService;
