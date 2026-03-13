import { getClientDisplayName } from "./clientFormData";
import { Note } from "../types/note.types";

export const stripNoteContent = (value?: string | null) =>
  (value || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();

export const getNoteTitle = (note: Pick<Note, "title" | "content">) => {
  const normalizedTitle = note.title?.trim();
  if (normalizedTitle) {
    return normalizedTitle;
  }

  const firstLine = stripNoteContent(note.content)
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || "Нова нотатка";
};

export const getNoteSnippet = (
  note: Pick<Note, "content">,
  maxLength: number = 160,
) => {
  const normalized = stripNoteContent(note.content);
  if (!normalized) {
    return "Без тексту";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}…`;
};

export const getNoteClientLabel = (note: Pick<Note, "client">) => {
  if (!note.client) {
    return "";
  }

  return getClientDisplayName(note.client as any);
};

export const getNoteCaseLabel = (note: Pick<Note, "case">) => {
  if (!note.case) {
    return "";
  }

  return note.case.title || note.case.caseNumber;
};

export const getNoteUserLabel = (note: Pick<Note, "user">) => {
  if (!note.user) {
    return "";
  }

  return `${note.user.lastName} ${note.user.firstName}`.trim();
};

export const formatNoteDate = (value?: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
