import React from "react";
import { X } from "lucide-react";
import "./RegistryHearingPreviewModal.css";

interface RegistryHearingPreviewModalProps {
  isOpen: boolean;
  title?: string;
  date: string;
  courtName: string;
  courtRoom?: string;
  caseNumber: string;
  caseDescription?: string;
  participants?: string;
  judge?: string;
  sourceHint?: string;
  confirmLabel: string;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const RegistryHearingPreviewModal: React.FC<
  RegistryHearingPreviewModalProps
> = ({
  isOpen,
  title = "Найближче засідання в реєстрі",
  date,
  courtName,
  courtRoom,
  caseNumber,
  caseDescription,
  participants,
  judge,
  sourceHint,
  confirmLabel,
  confirmLoading = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="registry-hearing-modal" role="dialog" aria-modal="true">
      <div className="registry-hearing-modal__backdrop" onClick={onClose} />
      <section className="registry-hearing-modal__panel">
        <header className="registry-hearing-modal__header">
          <div>
            <span className="registry-hearing-modal__eyebrow">Реєстр</span>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="registry-hearing-modal__close"
            onClick={onClose}
            disabled={confirmLoading}
          >
            <X size={18} />
          </button>
        </header>

        <div className="registry-hearing-modal__body">
          <div className="registry-hearing-modal__row">
            <span>Дата і час</span>
            <strong>{date || "Не вказано"}</strong>
          </div>
          <div className="registry-hearing-modal__row">
            <span>Номер справи</span>
            <strong>{caseNumber || "Не вказано"}</strong>
          </div>
          <div className="registry-hearing-modal__row">
            <span>Суд</span>
            <strong>{courtName || "Не вказано"}</strong>
          </div>
          {courtRoom && (
            <div className="registry-hearing-modal__row">
              <span>Зала</span>
              <strong>{courtRoom}</strong>
            </div>
          )}
          {judge && (
            <div className="registry-hearing-modal__row">
              <span>Суддя / контакт</span>
              <strong>{judge}</strong>
            </div>
          )}
          {caseDescription && (
            <div className="registry-hearing-modal__row registry-hearing-modal__row--stacked">
              <span>Опис справи</span>
              <strong>{caseDescription}</strong>
            </div>
          )}
          {participants && (
            <div className="registry-hearing-modal__row registry-hearing-modal__row--stacked">
              <span>Учасники</span>
              <strong>{participants}</strong>
            </div>
          )}
          {sourceHint && (
            <p className="registry-hearing-modal__hint">{sourceHint}</p>
          )}
        </div>

        <footer className="registry-hearing-modal__actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={confirmLoading}
          >
            Скасувати
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? "Створення..." : confirmLabel}
          </button>
        </footer>
      </section>
    </div>
  );
};

export default RegistryHearingPreviewModal;
