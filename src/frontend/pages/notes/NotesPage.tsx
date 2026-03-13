import React, { useDeferredValue, useEffect, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import tinymce, { type Editor as TinyMCEEditor } from "tinymce";
import "tinymce/models/dom/model.min.js";
import "tinymce/themes/silver/theme.min.js";
import "tinymce/icons/default/icons.min.js";
import "tinymce/skins/ui/oxide/skin.js";
import "tinymce/skins/ui/oxide/content.js";
import "tinymce/skins/content/default/content.js";
import "tinymce/plugins/advlist";
import "tinymce/plugins/autoresize";
import "tinymce/plugins/link";
import "tinymce/plugins/lists";
import "tinymce/plugins/quickbars";
import "tinymce/plugins/searchreplace";
import { useSearchParams } from "react-router-dom";
import { Breadcrumbs } from "../../components/navigation";
import { Alert } from "../../components/Alert";
import { PageHeader } from "../../components/PageHeader";
import { RecordActionsMenu } from "../../components/RecordActionsMenu";
import { Spinner } from "../../components/Spinner";
import { caseService } from "../../services/case.service";
import { clientService } from "../../services/client.service";
import { noteService } from "../../services/note.service";
import { Case } from "../../types/case.types";
import { Client } from "../../types/client.types";
import { Note, NoteAccessScope } from "../../types/note.types";
import { getClientDisplayName } from "../../utils/clientFormData";
import {
  formatNoteDate,
  getNoteCaseLabel,
  getNoteClientLabel,
  getNoteSnippet,
  getNoteTitle,
  stripNoteContent,
} from "../../utils/noteFormat";
import "./NotesPage.css";

const tinyMceGlobal = globalThis as typeof globalThis & {
  tinymce?: typeof tinymce;
};

tinyMceGlobal.tinymce = tinymce;

interface NoteEditorState {
  id?: string;
  title: string;
  content: string;
  clientId: string;
  caseId: string;
  userId: string;
  pinned: boolean;
  accessScope: NoteAccessScope;
  tags: string;
  isNew: boolean;
  updatedAt?: string;
}

const NOTE_LIMIT = 100;
const CASE_LIMIT = 100;

const ACCESS_SCOPE_OPTIONS: Array<{
  value: NoteAccessScope;
  label: string;
}> = [
  { value: "private", label: "Приватна" },
  { value: "assigned", label: "Для відповідального" },
  { value: "tenant", label: "Для організації" },
];

const sortNotes = (items: Note[]) =>
  [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1;
    }

    return (
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    );
  });

const mapNoteToEditor = (note: Note): NoteEditorState => ({
  id: note.id,
  title: note.title || "",
  content: note.content || "",
  clientId: note.clientId || "",
  caseId: note.caseId || "",
  userId: note.userId || "",
  pinned: Boolean(note.pinned),
  accessScope: note.accessScope || "assigned",
  tags: (note.tags || []).join(", "),
  isNew: false,
  updatedAt: note.updatedAt,
});

const buildDraftEditor = (options?: {
  clientId?: string;
  caseId?: string;
  userId?: string;
}): NoteEditorState => ({
  title: "",
  content: "",
  clientId: options?.clientId || "",
  caseId: options?.caseId || "",
  userId: options?.userId || "",
  pinned: false,
  accessScope: "assigned",
  tags: "",
  isNew: true,
});

const parseTags = (value: string) =>
  value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);

export const NotesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notes, setNotes] = useState<Note[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [editor, setEditor] = useState<NoteEditorState>(() =>
    buildDraftEditor(),
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterClientId, setFilterClientId] = useState("");
  const [filterCaseId, setFilterCaseId] = useState("");
  const [filterAccessScope, setFilterAccessScope] = useState<
    NoteAccessScope | ""
  >("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const queryClientId = searchParams.get("clientId") || "";
  const queryCaseId = searchParams.get("caseId") || "";
  const queryUserId = searchParams.get("userId") || "";
  const queryNoteId = searchParams.get("noteId") || "";
  const queryIsNew = searchParams.get("new") === "1";

  const syncSearchParams = (values: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);

    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
    });

    setSearchParams(next, { replace: true });
  };

  const buildDraftFromQuery = (availableCases: Case[]) => {
    const matchedCase = availableCases.find(
      (caseItem) => caseItem.id === queryCaseId,
    );

    return buildDraftEditor({
      clientId: queryClientId || matchedCase?.clientId || "",
      caseId: queryCaseId,
      userId: queryUserId,
    });
  };

  const openCreateModal = (options?: {
    clientId?: string;
    caseId?: string;
    userId?: string;
  }) => {
    const nextDraft = buildDraftEditor({
      clientId: options?.clientId || queryClientId,
      caseId: options?.caseId || queryCaseId,
      userId: options?.userId || queryUserId,
    });

    setEditor(nextDraft);
    setActiveNoteId(null);
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
    setIsEditMode(true);
    syncSearchParams({
      noteId: undefined,
      new: "1",
      clientId: nextDraft.clientId || undefined,
      caseId: nextDraft.caseId || undefined,
      userId: nextDraft.userId || undefined,
    });
  };

  const openViewModal = (note: Note) => {
    setEditor(mapNoteToEditor(note));
    setActiveNoteId(note.id);
    setError(null);
    setSuccess(null);
    setIsEditorOpen(true);
    setIsEditMode(false);
    syncSearchParams({
      noteId: note.id,
      new: undefined,
      clientId: note.clientId || undefined,
      caseId: note.caseId || undefined,
      userId: note.userId || undefined,
    });
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setIsEditMode(false);
    syncSearchParams({
      noteId: undefined,
      new: undefined,
    });
  };

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const [notesResponse, clientsResponse, casesResponse] = await Promise.all(
        [
          noteService.getNotes({
            limit: NOTE_LIMIT,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
          clientService.getAllClients({ status: "active" }),
          caseService.getCases({
            limit: CASE_LIMIT,
            sortBy: "updatedAt",
            sortOrder: "DESC",
          }),
        ],
      );

      const loadedNotes = sortNotes(notesResponse.data);
      setNotes(loadedNotes);
      setClients(clientsResponse);
      setCases(casesResponse.data);

      if (queryIsNew) {
        const draft = buildDraftFromQuery(casesResponse.data);
        setEditor(draft);
        setIsEditorOpen(true);
        setIsEditMode(true);
        setActiveNoteId(null);
        return;
      }

      if (queryNoteId) {
        const matchedNote = loadedNotes.find((note) => note.id === queryNoteId);
        if (matchedNote) {
          setEditor(mapNoteToEditor(matchedNote));
          setActiveNoteId(matchedNote.id);
          setIsEditorOpen(true);
          setIsEditMode(false);
        }
      }
    } catch (loadError: any) {
      setError(
        loadError.response?.data?.message ||
          loadError.message ||
          "Помилка завантаження нотаток",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  useEffect(() => {
    setFilterClientId(queryClientId);
    setFilterCaseId(queryCaseId);
  }, [queryCaseId, queryClientId]);

  useEffect(() => {
    if (!editor.caseId) {
      return;
    }

    const matchedCase = cases.find((caseItem) => caseItem.id === editor.caseId);
    if (!matchedCase || editor.clientId === matchedCase.clientId) {
      return;
    }

    setEditor((current) => ({
      ...current,
      clientId: matchedCase.clientId,
    }));
  }, [cases, editor.caseId, editor.clientId]);

  useEffect(() => {
    if (!filterCaseId) {
      return;
    }

    const matchedCase = cases.find((caseItem) => caseItem.id === filterCaseId);
    if (!matchedCase) {
      setFilterCaseId("");
      return;
    }

    if (filterClientId && matchedCase.clientId !== filterClientId) {
      setFilterCaseId("");
    }
  }, [cases, filterCaseId, filterClientId]);

  const availableCases = cases.filter((caseItem) =>
    editor.clientId ? caseItem.clientId === editor.clientId : true,
  );

  const filterCases = cases.filter((caseItem) =>
    filterClientId ? caseItem.clientId === filterClientId : true,
  );

  const visibleNotes = notes.filter((note) => {
    if (filterClientId && note.clientId !== filterClientId) {
      return false;
    }

    if (filterCaseId && note.caseId !== filterCaseId) {
      return false;
    }

    if (filterAccessScope && note.accessScope !== filterAccessScope) {
      return false;
    }

    if (!deferredSearch) {
      return true;
    }

    const haystack = [
      getNoteTitle(note),
      stripNoteContent(note.content),
      getNoteClientLabel(note),
      getNoteCaseLabel(note),
      note.tags?.join(" "),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(deferredSearch);
  });

  const resetFilters = () => {
    setSearch("");
    setFilterClientId(queryClientId || "");
    setFilterCaseId(queryCaseId || "");
    setFilterAccessScope("");
  };

  const selectedCase = cases.find((caseItem) => caseItem.id === editor.caseId);
  const selectedClient = clients.find(
    (client) => client.id === editor.clientId,
  );

  const saveNote = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        title: editor.title,
        content: editor.content,
        pinned: false,
        accessScope: editor.accessScope,
        tags: parseTags(editor.tags),
        clientId: editor.clientId || "",
        caseId: editor.caseId || "",
        userId: editor.userId || "",
      };

      const savedNote = editor.isNew
        ? await noteService.createNote(payload)
        : await noteService.updateNote(editor.id || "", payload);

      setNotes((current) =>
        sortNotes([
          savedNote,
          ...current.filter((note) => note.id !== savedNote.id),
        ]),
      );
      setEditor(mapNoteToEditor(savedNote));
      setActiveNoteId(savedNote.id);
      setSuccess(editor.isNew ? "Нотатку створено." : "Нотатку оновлено.");
      setIsEditorOpen(true);
      setIsEditMode(false);
      syncSearchParams({
        noteId: savedNote.id,
        new: undefined,
        clientId: savedNote.clientId || undefined,
        caseId: savedNote.caseId || undefined,
        userId: savedNote.userId || undefined,
      });
    } catch (saveError: any) {
      setError(
        saveError.response?.data?.message ||
          saveError.message ||
          "Не вдалося зберегти нотатку.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (!editor.id) {
      closeEditor();
      return;
    }

    if (!window.confirm("Видалити цю нотатку?")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await noteService.deleteNote(editor.id);
      setNotes((current) => current.filter((note) => note.id !== editor.id));
      setActiveNoteId(null);
      setIsEditorOpen(false);
      setIsEditMode(false);
      setEditor(buildDraftEditor());
      setSuccess("Нотатку видалено.");
      syncSearchParams({
        noteId: undefined,
        new: undefined,
      });
    } catch (deleteError: any) {
      setError(
        deleteError.response?.data?.message ||
          deleteError.message ||
          "Не вдалося видалити нотатку.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNoteById = async (note: Note) => {
    if (!window.confirm("Видалити цю нотатку?")) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await noteService.deleteNote(note.id);
      setNotes((current) => current.filter((item) => item.id !== note.id));

      if (activeNoteId === note.id) {
        setActiveNoteId(null);
        setIsEditorOpen(false);
        setIsEditMode(false);
        setEditor(buildDraftEditor());
        syncSearchParams({
          noteId: undefined,
          new: undefined,
        });
      }

      setSuccess("Нотатку видалено.");
    } catch (deleteError: any) {
      setError(
        deleteError.response?.data?.message ||
          deleteError.message ||
          "Не вдалося видалити нотатку.",
      );
    } finally {
      setSaving(false);
    }
  };

  const duplicateNote = async (note: Note) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const duplicatedNote = await noteService.createNote({
        title: note.title || "",
        content: note.content || "",
        pinned: Boolean(note.pinned),
        accessScope: note.accessScope,
        tags: note.tags || [],
        clientId: note.clientId || "",
        caseId: note.caseId || "",
        userId: note.userId || "",
        metadata: note.metadata || undefined,
      });

      setNotes((current) =>
        sortNotes([
          duplicatedNote,
          ...current.filter((item) => item.id !== duplicatedNote.id),
        ]),
      );
      setEditor(mapNoteToEditor(duplicatedNote));
      setActiveNoteId(duplicatedNote.id);
      setIsEditorOpen(true);
      setIsEditMode(false);
      setSuccess("Нотатку дубльовано.");
      syncSearchParams({
        noteId: duplicatedNote.id,
        new: undefined,
        clientId: duplicatedNote.clientId || undefined,
        caseId: duplicatedNote.caseId || undefined,
        userId: duplicatedNote.userId || undefined,
      });
    } catch (duplicateError: any) {
      setError(
        duplicateError.response?.data?.message ||
          duplicateError.message ||
          "Не вдалося дублювати нотатку.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="workspace-loading">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="notes-page">
      <Breadcrumbs />
      <PageHeader
        title="Нотатки"
        subtitle="Реєстр нотаток по клієнтах і справах в єдиному списку"
        actions={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              openCreateModal({
                clientId: filterClientId || queryClientId,
                caseId: filterCaseId || queryCaseId,
                userId: queryUserId,
              })
            }
          >
            Створити нотатку
          </button>
        }
      />

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <section className="notes-registry">
        <div className="notes-filters">
          <div className="notes-search-box">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Пошук нотаток"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={filterClientId}
            onChange={(event) => {
              setFilterClientId(event.target.value);
              if (!event.target.value) {
                setFilterCaseId("");
              }
            }}
          >
            <option value="">Клієнт: усі</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {getClientDisplayName(client)}
              </option>
            ))}
          </select>

          <select
            value={filterCaseId}
            onChange={(event) => setFilterCaseId(event.target.value)}
          >
            <option value="">Справа: усі</option>
            {filterCases.map((caseItem) => (
              <option key={caseItem.id} value={caseItem.id}>
                {caseItem.caseNumber}{" "}
                {caseItem.title ? `• ${caseItem.title}` : ""}
              </option>
            ))}
          </select>

          <select
            value={filterAccessScope}
            onChange={(event) =>
              setFilterAccessScope(event.target.value as NoteAccessScope | "")
            }
          >
            <option value="">Доступ: усі</option>
            {ACCESS_SCOPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm notes-filters-reset"
            onClick={resetFilters}
          >
            Скинути
          </button>
        </div>

        <div className="notes-table-wrap">
          <table className="notes-table">
            <thead>
              <tr>
                <th>Заголовок</th>
                <th>Клієнт</th>
                <th>Справа</th>
                <th>Доступ</th>
                <th>Теги</th>
                <th>Оновлено</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {visibleNotes.map((note) => {
                const noteActionItems = [
                  {
                    label: "Переглянути",
                    onClick: () => openViewModal(note),
                  },
                  {
                    label: "Редагувати",
                    onClick: () => {
                      openViewModal(note);
                      setIsEditMode(true);
                    },
                  },
                  {
                    label: "Дублювати",
                    onClick: () => {
                      void duplicateNote(note);
                    },
                  },
                  {
                    label: "Видалити",
                    onClick: () => {
                      void deleteNoteById(note);
                    },
                    danger: true,
                  },
                ];

                return (
                  <tr
                    key={note.id}
                    className={activeNoteId === note.id ? "is-active" : ""}
                    onClick={() => openViewModal(note)}
                  >
                    <td>
                      <div className="notes-table-title">
                        <strong>{getNoteTitle(note)}</strong>
                        <span>{getNoteSnippet(note, 110)}</span>
                      </div>
                    </td>
                    <td>{getNoteClientLabel(note) || "—"}</td>
                    <td>{getNoteCaseLabel(note) || "—"}</td>
                    <td>
                      <span className="notes-access-badge">
                        {ACCESS_SCOPE_OPTIONS.find(
                          (option) => option.value === note.accessScope,
                        )?.label || "—"}
                      </span>
                    </td>
                    <td className="notes-tags-cell">
                      {note.tags?.length ? note.tags.join(", ") : "—"}
                    </td>
                    <td>{formatNoteDate(note.updatedAt)}</td>
                    <td
                      className="notes-actions-cell"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <RecordActionsMenu
                        actions={noteActionItems}
                        ariaLabel={`Дії для нотатки ${getNoteTitle(note)}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {visibleNotes.length === 0 && (
            <div className="notes-empty-state">
              За поточними фільтрами нотаток не знайдено.
            </div>
          )}
        </div>
      </section>

      {isEditorOpen && (
        <div
          className="notes-editor-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notes-editor-title"
        >
          <div className="notes-editor-card">
            <div className="notes-editor-head">
              <div>
                <h3 id="notes-editor-title">
                  {editor.isNew
                    ? "Створення нотатки"
                    : isEditMode
                      ? "Редагування нотатки"
                      : "Перегляд нотатки"}
                </h3>
                <p>
                  {editor.isNew || isEditMode
                    ? "Заповніть заголовок, контекст і текст нотатки. Запис зберігається в єдиному реєстрі."
                    : "Нотатка відкрита в режимі читання. Для змін натисніть Редагувати."}
                </p>
              </div>
              <div className="notes-editor-actions">
                {!editor.isNew && isEditMode && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={deleteNote}
                    disabled={saving}
                  >
                    Видалити
                  </button>
                )}
                {!editor.isNew && !isEditMode && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setIsEditMode(true)}
                  >
                    Редагувати
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Закрити
                </button>
                {(editor.isNew || isEditMode) && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={saveNote}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Spinner size="small" />
                        Збереження...
                      </>
                    ) : (
                      "Зберегти"
                    )}
                  </button>
                )}
              </div>
            </div>

            {editor.isNew || isEditMode ? (
              <div className="notes-editor-form">
                <label className="notes-field notes-field--full">
                  <span>Заголовок</span>
                  <input
                    type="text"
                    className="notes-title-input"
                    placeholder="Наприклад: Підготовка до засідання"
                    value={editor.title}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="notes-field">
                  <span>Клієнт</span>
                  <select
                    className="notes-select"
                    value={editor.clientId}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        clientId: event.target.value,
                        caseId:
                          event.target.value &&
                          selectedCase?.clientId === event.target.value
                            ? current.caseId
                            : "",
                      }))
                    }
                  >
                    <option value="">Без клієнта</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {getClientDisplayName(client)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="notes-field">
                  <span>Справа</span>
                  <select
                    className="notes-select"
                    value={editor.caseId}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        caseId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Без справи</option>
                    {availableCases.map((caseItem) => (
                      <option key={caseItem.id} value={caseItem.id}>
                        {caseItem.caseNumber}{" "}
                        {caseItem.title ? `• ${caseItem.title}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="notes-field">
                  <span>Доступ</span>
                  <select
                    className="notes-select"
                    value={editor.accessScope}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        accessScope: event.target.value as NoteAccessScope,
                      }))
                    }
                  >
                    {ACCESS_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="notes-field notes-field--full">
                  <span>Теги</span>
                  <input
                    type="text"
                    className="notes-tags-input"
                    placeholder="процес, переговори, документи"
                    value={editor.tags}
                    onChange={(event) =>
                      setEditor((current) => ({
                        ...current,
                        tags: event.target.value,
                      }))
                    }
                  />
                </label>

                <div className="notes-field notes-field--full">
                  <span>Текст нотатки</span>
                  <div className="notes-rich-editor">
                    <Editor
                      licenseKey="gpl"
                      value={editor.content}
                      onInit={(_, editorInstance: TinyMCEEditor) => {
                        if (!editor.content) {
                          editorInstance.setContent("");
                        }
                      }}
                      onEditorChange={(value) =>
                        setEditor((current) => ({
                          ...current,
                          content: value,
                        }))
                      }
                      init={{
                        min_height: 340,
                        menubar: false,
                        plugins: [
                          "advlist",
                          "autoresize",
                          "link",
                          "lists",
                          "quickbars",
                          "searchreplace",
                        ],
                        toolbar:
                          "undo redo | bold italic underline | bullist numlist checklist | blockquote | link | removeformat",
                        quickbars_selection_toolbar:
                          "bold italic underline | bullist numlist blockquote | link",
                        toolbar_mode: "sliding",
                        branding: false,
                        promotion: false,
                        resize: false,
                        statusbar: false,
                        content_style: `
                        body {
                          margin: 0;
                          padding: 1rem;
                          color: #0f172a;
                          background: #ffffff;
                          font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                          font-size: 15px;
                          line-height: 1.65;
                        }
                        p { margin: 0 0 0.85rem; }
                        ul, ol { margin: 0 0 0.85rem 1.25rem; }
                        blockquote {
                          margin: 0 0 0.85rem;
                          padding-left: 0.9rem;
                          border-left: 3px solid rgba(59, 130, 246, 0.3);
                          color: #475569;
                        }
                      `,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="notes-read-view">
                <div className="notes-read-header">
                  <div className="notes-read-item notes-read-item--title">
                    <span>Заголовок</span>
                    <strong>{getNoteTitle(editor)}</strong>
                  </div>
                </div>

                <div className="notes-read-meta">
                  <div className="notes-read-item">
                    <span>Клієнт</span>
                    <strong>
                      {selectedClient
                        ? getClientDisplayName(selectedClient)
                        : "—"}
                    </strong>
                  </div>

                  <div className="notes-read-item">
                    <span>Справа</span>
                    <strong>
                      {selectedCase
                        ? `${selectedCase.caseNumber}${selectedCase.title ? ` • ${selectedCase.title}` : ""}`
                        : "—"}
                    </strong>
                  </div>

                  <div className="notes-read-item">
                    <span>Доступ</span>
                    <strong>
                      {ACCESS_SCOPE_OPTIONS.find(
                        (option) => option.value === editor.accessScope,
                      )?.label || "—"}
                    </strong>
                  </div>

                  <div className="notes-read-item">
                    <span>Теги</span>
                    <strong>{editor.tags || "—"}</strong>
                  </div>
                  <div className="notes-read-item">
                    <span>Оновлено</span>
                    <strong>{formatNoteDate(editor.updatedAt) || "—"}</strong>
                  </div>
                </div>

                <div className="notes-read-body">
                  <div className="notes-read-item notes-read-item--body">
                    <span>Текст нотатки</span>
                    <div
                      className="notes-read-content"
                      dangerouslySetInnerHTML={{
                        __html:
                          editor.content?.trim() ||
                          "<p class='notes-read-placeholder'>Без тексту</p>",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
