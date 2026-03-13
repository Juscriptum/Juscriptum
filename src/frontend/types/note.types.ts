import { DataAccessScope } from "./shared.types";

export interface NoteClientSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  patronymic?: string;
  companyName?: string;
  status?: string;
}

export interface NoteCaseSummary {
  id: string;
  caseNumber: string;
  title?: string;
  clientId?: string;
}

export interface NoteUserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export type NoteAccessScope = DataAccessScope;

export interface Note {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  pinned: boolean;
  tags?: string[] | null;
  accessScope: NoteAccessScope;
  assignedUserId?: string | null;
  clientId?: string | null;
  caseId?: string | null;
  userId?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  client?: NoteClientSummary | null;
  case?: NoteCaseSummary | null;
  user?: NoteUserSummary | null;
  assignedUser?: NoteUserSummary | null;
}

export interface CreateNoteDto {
  title?: string;
  content?: string;
  pinned?: boolean;
  tags?: string[];
  accessScope?: NoteAccessScope;
  assignedUserId?: string;
  clientId?: string;
  caseId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateNoteDto extends Partial<CreateNoteDto> {}

export interface NoteFilters {
  clientId?: string;
  caseId?: string;
  userId?: string;
  pinned?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "ASC" | "DESC";
}

export interface NoteListResponse {
  data: Note[];
  total: number;
  page: number;
  limit: number;
}
