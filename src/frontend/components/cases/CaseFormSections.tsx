import React, { useEffect, useState } from "react";
import { UseFormReturn, useFieldArray } from "react-hook-form";
import { Building2, FileText, Plus, Scale, Trash2, Users } from "lucide-react";
import { Spinner } from "../Spinner";
import { DatePicker } from "../DatePicker";
import { Client } from "../../types/client.types";
import {
  CASE_PRIORITY_LABELS,
  CASE_TYPE_LABELS,
  CreateCaseFormData,
  PROCEEDING_STAGES,
} from "../../schemas/case.schema";
import {
  createEmptyParticipant,
  DEFAULT_PARTICIPANT_GROUP_ID,
  PARTICIPANT_ROLE_GROUPS,
} from "../../utils/caseParticipants";
import { hasErrorAtPath, hasErrorInPaths } from "../../utils/formErrors";

interface CaseFormSectionsProps {
  methods: UseFormReturn<CreateCaseFormData>;
  clients: Client[];
  clientsLoading: boolean;
  getClientDisplayName: (client: Client) => string;
  caseNumberReadOnly?: boolean;
}

export const CaseFormSections: React.FC<CaseFormSectionsProps> = ({
  methods,
  clients,
  clientsLoading,
  getClientDisplayName,
  caseNumberReadOnly = false,
}) => {
  const {
    register,
    watch,
    setValue,
    control,
    formState: { errors },
  } = methods;
  const startDate = watch("startDate");
  const participants = watch("participants") || [];
  const [lastSelectedGroup, setLastSelectedGroup] = useState(
    DEFAULT_PARTICIPANT_GROUP_ID,
  );
  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const typedErrors = errors as Record<string, any>;
  const mainSectionHasErrors = hasErrorInPaths(typedErrors, [
    "clientId",
    "caseNumber",
    "startDate",
    "caseType",
    "caseSubcategory",
    "priority",
    "title",
    "description",
  ]);
  const institutionSectionHasErrors = hasErrorInPaths(typedErrors, [
    "courtName",
    "courtAddress",
    "registryCaseNumber",
    "judgeName",
    "proceedingStage",
  ]);
  const participantsSectionHasErrors = Boolean(typedErrors.participants);
  const commentsSectionHasErrors = hasErrorInPaths(typedErrors, [
    "internalNotes",
  ]);

  useEffect(() => {
    const latestGroup = [...participants]
      .reverse()
      .find((participant) => participant?.groupId)?.groupId;

    if (latestGroup) {
      setLastSelectedGroup(latestGroup);
    }
  }, [participants]);

  const updateParticipantRole = (
    index: number,
    groupId: string,
    role: string,
    isCustomRole: boolean = false,
  ) => {
    setValue(`participants.${index}.groupId`, groupId, { shouldDirty: true });
    setValue(`participants.${index}.role`, role, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`participants.${index}.isCustomRole`, isCustomRole, {
      shouldDirty: true,
    });
    setLastSelectedGroup(groupId);
  };

  const addParticipant = () => {
    append(createEmptyParticipant(lastSelectedGroup));
  };

  return (
    <>
      <section
        className={`form-section ${mainSectionHasErrors ? "has-errors" : ""}`}
      >
        <div className="section-header">
          <FileText size={20} />
          <h2>Основна інформація</h2>
        </div>

        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label required">Клієнт</label>
            {clientsLoading ? (
              <div className="loading-select">
                <Spinner size="small" /> Завантаження...
              </div>
            ) : (
              <select
                {...register("clientId")}
                className={`form-select ${errors.clientId ? "error" : ""}`}
              >
                <option value="">Оберіть клієнта</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {getClientDisplayName(client)}
                    {client.type === "legal_entity" &&
                      client.edrpou &&
                      ` (${client.edrpou})`}
                  </option>
                ))}
              </select>
            )}
            {errors.clientId && (
              <span className="error-message">{errors.clientId.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Номер справи</label>
            <input
              type="text"
              {...register("caseNumber")}
              placeholder="001/001"
              readOnly={caseNumberReadOnly}
              className={`form-input ${errors.caseNumber ? "error" : ""}`}
            />
            {errors.caseNumber && (
              <span className="error-message">{errors.caseNumber.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Дата додавання справи</label>
            <DatePicker
              value={startDate}
              onChange={(value) =>
                setValue("startDate", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              error={errors.startDate?.message}
            />
          </div>

          <div className="form-group">
            <label className="form-label required">Категорія справи</label>
            <select
              {...register("caseType")}
              className={`form-select ${errors.caseType ? "error" : ""}`}
            >
              <option value="">Оберіть категорію</option>
              {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.caseType && (
              <span className="error-message">{errors.caseType.message}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Підкатегорія справи</label>
            <input
              type="text"
              {...register("caseSubcategory")}
              placeholder="Уточніть підкатегорію вручну"
              className={`form-input ${errors.caseSubcategory ? "error" : ""}`}
            />
            {errors.caseSubcategory && (
              <span className="error-message">
                {errors.caseSubcategory.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label required">Пріоритет</label>
            <select
              {...register("priority")}
              className={`form-select ${errors.priority ? "error" : ""}`}
            >
              {Object.entries(CASE_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group full-width">
            <label className="form-label">Суть справи</label>
            <input
              type="text"
              {...register("title")}
              placeholder="Коротка назва або суть справи"
              className={`form-input ${errors.title ? "error" : ""}`}
            />
          </div>

          <div className="form-group full-width">
            <label className="form-label">Опис справи</label>
            <textarea
              {...register("description")}
              placeholder="Детальний опис справи"
              rows={4}
              className={`form-textarea ${errors.description ? "error" : ""}`}
            />
          </div>
        </div>
      </section>

      <section
        className={`form-section ${institutionSectionHasErrors ? "has-errors" : ""}`}
      >
        <div className="section-header">
          <Building2 size={20} />
          <h2>Дані щодо установи</h2>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">
              Назва установи (суд, орган виконавчої влади тощо)
            </label>
            <input
              type="text"
              {...register("courtName")}
              placeholder="Печерський районний суд м. Києва"
              className={`form-input ${errors.courtName ? "error" : ""}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Адреса установи</label>
            <input
              type="text"
              {...register("courtAddress")}
              placeholder="м. Київ, вул. Хрещатик, 1"
              className={`form-input ${errors.courtAddress ? "error" : ""}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Номер справи в реєстрі</label>
            <input
              type="text"
              {...register("registryCaseNumber")}
              placeholder="757/12345/23-ц"
              className={`form-input ${errors.registryCaseNumber ? "error" : ""}`}
            />
            {errors.registryCaseNumber && (
              <span className="error-message">
                {errors.registryCaseNumber.message}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              Особа, у веденні якої знаходиться справа
            </label>
            <input
              type="text"
              {...register("judgeName")}
              placeholder="Іванов І.І."
              className={`form-input ${errors.judgeName ? "error" : ""}`}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Стадія розгляду</label>
            <select
              {...register("proceedingStage")}
              className={`form-select ${errors.proceedingStage ? "error" : ""}`}
            >
              <option value="">Оберіть стадію</option>
              {PROCEEDING_STAGES.map((stage) => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section
        className={`form-section ${participantsSectionHasErrors ? "has-errors" : ""}`}
      >
        <div className="section-header">
          <Users size={20} />
          <h2>Учасники</h2>
        </div>

        <div className="participants-stack">
          {fields.map((field, index) => {
            const participant = participants[index];
            const participantHasErrors = hasErrorAtPath(
              typedErrors,
              `participants.${index}`,
            );

            return (
              <div
                key={field.id}
                className={`participant-card ${participantHasErrors ? "has-errors" : ""}`}
              >
                <div className="participant-card__header">
                  <h3 className="participant-card__title">
                    Учасник {index + 1}
                  </h3>
                  <button
                    type="button"
                    className="btn btn-ghost participant-card__remove"
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} />
                    Видалити
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Найменування / ПІБ</label>
                    <input
                      type="text"
                      {...register(`participants.${index}.name`)}
                      placeholder="Назва або ПІБ учасника"
                      className={`form-input ${hasErrorAtPath(typedErrors, `participants.${index}.name`) ? "error" : ""}`}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Статус у справі</label>
                    <select
                      className={`form-select ${hasErrorAtPath(typedErrors, `participants.${index}.role`) ? "error" : ""}`}
                      value={
                        participant?.isCustomRole
                          ? "__custom__"
                          : participant?.role || ""
                      }
                      onChange={(event) => {
                        const selectedValue = event.target.value;

                        if (selectedValue === "__custom__") {
                          updateParticipantRole(
                            index,
                            participant?.groupId || lastSelectedGroup,
                            participant?.isCustomRole ? participant.role : "",
                            true,
                          );
                          return;
                        }

                        const groupId =
                          PARTICIPANT_ROLE_GROUPS.find((group) =>
                            group.roles.includes(selectedValue),
                          )?.id ||
                          participant?.groupId ||
                          lastSelectedGroup;

                        updateParticipantRole(
                          index,
                          groupId,
                          selectedValue,
                          false,
                        );
                      }}
                    >
                      <option value="">Оберіть статус</option>
                      {PARTICIPANT_ROLE_GROUPS.map((group) => (
                        <optgroup key={group.id} label={group.label}>
                          {group.roles.map((role) => (
                            <option key={`${group.id}-${role}`} value={role}>
                              {role}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                      <option value="__custom__">Інше (ввести вручну)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Інше</label>
                  <input
                    type="text"
                    value={
                      participant?.isCustomRole ? participant.role || "" : ""
                    }
                    onChange={(event) =>
                      updateParticipantRole(
                        index,
                        participant?.groupId || lastSelectedGroup,
                        event.target.value,
                        true,
                      )
                    }
                    placeholder="Введіть свій статус вручну"
                    className={`form-input ${hasErrorAtPath(typedErrors, `participants.${index}.role`) ? "error" : ""} ${participant?.isCustomRole ? "" : "is-disabled"}`}
                    disabled={!participant?.isCustomRole}
                  />
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-outline participants-add-btn"
            onClick={addParticipant}
          >
            <Plus size={18} />+ Додати нового учасника
          </button>
        </div>
      </section>

      <section
        className={`form-section ${commentsSectionHasErrors ? "has-errors" : ""}`}
      >
        <div className="section-header">
          <Scale size={20} />
          <h2>Коментарі</h2>
        </div>

        <div className="form-group full-width">
          <label className="form-label">Внутрішні нотатки</label>
          <textarea
            {...register("internalNotes")}
            placeholder="Нотатки, видимі тільки вам та команді"
            rows={4}
            className={`form-textarea ${errors.internalNotes ? "error" : ""}`}
          />
        </div>
      </section>
    </>
  );
};
