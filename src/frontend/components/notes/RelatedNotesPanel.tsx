import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert } from "../Alert";
import { Spinner } from "../Spinner";
import { noteService } from "../../services/note.service";
import { Note, NoteFilters } from "../../types/note.types";
import {
  formatNoteDate,
  getNoteCaseLabel,
  getNoteClientLabel,
  getNoteSnippet,
  getNoteTitle,
  getNoteUserLabel,
} from "../../utils/noteFormat";
import "./RelatedNotesPanel.css";

interface RelatedNotesPanelProps {
  title: string;
  description: string;
  filters: NoteFilters;
  createTo: string;
  emptyMessage: string;
}

export const RelatedNotesPanel: React.FC<RelatedNotesPanelProps> = ({
  title,
  description,
  filters,
  createTo,
  emptyMessage,
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadNotes = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await noteService.getNotes({
          ...filters,
          limit: 5,
          sortBy: "updatedAt",
          sortOrder: "DESC",
        });

        if (!active) {
          return;
        }

        setNotes(response.data);
      } catch (loadError: any) {
        if (!active) {
          return;
        }

        setError(
          loadError.response?.data?.message ||
            loadError.message ||
            "Не вдалося завантажити нотатки.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadNotes();

    return () => {
      active = false;
    };
  }, [filters.caseId, filters.clientId, filters.userId]);

  return (
    <section className="related-notes-panel">
      <div className="related-notes-head">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="related-notes-actions">
          <Link to="/notes" className="btn btn-outline">
            Усі нотатки
          </Link>
          <Link to={createTo} className="btn btn-primary">
            Нова нотатка
          </Link>
        </div>
      </div>

      {error && (
        <Alert type="error" message={error} onClose={() => setError(null)} />
      )}

      {loading ? (
        <div className="related-notes-loading">
          <Spinner size="small" />
          Завантаження нотаток...
        </div>
      ) : notes.length === 0 ? (
        <div className="related-notes-empty">{emptyMessage}</div>
      ) : (
        <div className="related-notes-list">
          {notes.map((note) => {
            const links = [
              getNoteClientLabel(note),
              getNoteCaseLabel(note),
              getNoteUserLabel(note),
            ].filter(Boolean);

            return (
              <Link
                key={note.id}
                to={`/notes?noteId=${note.id}`}
                className="related-note-card"
              >
                <div className="related-note-card-head">
                  <strong>{getNoteTitle(note)}</strong>
                  {note.pinned && <span>Закріплено</span>}
                </div>
                <p>{getNoteSnippet(note, 130)}</p>
                <div className="related-note-card-meta">
                  <span>{formatNoteDate(note.updatedAt)}</span>
                  {links.length > 0 && <span>{links.join(" • ")}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default RelatedNotesPanel;
