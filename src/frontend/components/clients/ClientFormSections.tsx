import React from "react";
import { Check, Minus, Plus } from "lucide-react";
import {
  UseFieldArrayReturn,
  UseFormReturn,
  useFieldArray,
} from "react-hook-form";
import { CreateClientFormData } from "../../schemas/client.schema";
import { ClientType } from "../../types/client.types";
import { AddressSection } from "./AddressSection";
import { DatePicker } from "../DatePicker";
import { hasErrorInPaths } from "../../utils/formErrors";

export const CLIENT_TYPES: {
  value: ClientType;
  label: string;
}[] = [
  {
    value: "individual",
    label: "Фізична особа",
  },
  {
    value: "fop",
    label: "ФОП",
  },
  {
    value: "legal_entity",
    label: "Юридична особа",
  },
];

const BANK_OPTIONS = [
  "АТ «АЛЬФА-БАНК»",
  "ПриватБанк",
  "Ощадбанк",
  "Укрексімбанк",
  "Райффайзен Банк",
  "УкрСиббанк",
];

const TAXATION_OPTIONS = [
  "Неприбуткова організація",
  "Платник ПДВ",
  "Неплатник ПДВ",
  "Загальна система",
  "Спрощена система",
];

const LEGAL_FORM_OPTIONS = [
  "Громадська організація",
  "ТОВ",
  "ПП",
  "АТ",
  "Благодійна організація",
];

interface ClientFormSectionsProps {
  methods: UseFormReturn<CreateClientFormData>;
  clientType: ClientType;
  onTypeChange?: (type: ClientType) => void;
  allowTypeChange?: boolean;
  clientNumberReadOnly?: boolean;
  registrationDateReadOnly?: boolean;
}

export const ClientFormSections: React.FC<ClientFormSectionsProps> = ({
  methods,
  clientType,
  onTypeChange,
  allowTypeChange = true,
  clientNumberReadOnly = false,
  registrationDateReadOnly = false,
}) => {
  const {
    watch,
    setValue,
    formState: { errors },
  } = methods;
  const isSameAddress = watch("addresses.is_same_address");
  const registrationDate = watch("registration_date");
  const comment = watch("comment") || "";
  const typedErrors = errors as Record<string, any>;
  const topSectionHasErrors = hasErrorInPaths(typedErrors, [
    "client_number",
    "registration_date",
  ]);
  const commentSectionHasErrors = hasErrorInPaths(typedErrors, ["comment"]);

  const addressConfig =
    clientType === "legal_entity"
      ? {
          primaryAddressTitle: "Юридична адреса",
          sameAddressLabel: "Фактична адреса відповідає юридичній",
        }
      : {
          primaryAddressTitle: "Адреса реєстрації (прописка)",
          sameAddressLabel: "Фактична адреса співпадає з адресою реєстрації",
        };

  return (
    <>
      <div className="client-type-tabs" role="tablist" aria-label="Тип клієнта">
        {CLIENT_TYPES.map((type) => {
          const isActive = clientType === type.value;
          return (
            <button
              key={type.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={!allowTypeChange}
              className={`type-tab ${isActive ? "active" : ""}`}
              onClick={() => onTypeChange?.(type.value)}
              disabled={!allowTypeChange}
            >
              {isActive && <Check size={16} />}
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`form-card ${topSectionHasErrors ? "has-errors" : ""}`}>
          <label className="form-label">Номер клієнта</label>
          <input
            type="text"
            {...methods.register("client_number")}
            placeholder="Автоматично"
            className="form-input"
            readOnly={clientNumberReadOnly}
          />
        </div>
        <div className={`form-card ${topSectionHasErrors ? "has-errors" : ""}`}>
          <label className="form-label">Дата додавання клієнта</label>
          <DatePicker
            value={registrationDate}
            disabled={registrationDateReadOnly}
            onChange={(value) =>
              setValue("registration_date", value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.registration_date?.message as string | undefined}
          />
        </div>
      </div>

      {clientType === "individual" && (
        <IndividualFormSection methods={methods} />
      )}
      {clientType === "fop" && <FopFormSection methods={methods} />}
      {clientType === "legal_entity" && (
        <LegalEntityFormSection methods={methods} />
      )}

      <AddressSection
        methods={methods}
        isSameAddress={Boolean(isSameAddress)}
        onToggleSameAddress={(checked) =>
          setValue("addresses.is_same_address", checked, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        primaryAddressTitle={addressConfig.primaryAddressTitle}
        sameAddressLabel={addressConfig.sameAddressLabel}
      />

      <div
        className={`form-card mb-6 ${commentSectionHasErrors ? "has-errors" : ""}`}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="section-title">Коментар до клієнта</h3>
          <span className="form-hint">{comment.length}/5000</span>
        </div>
        <textarea
          {...methods.register("comment")}
          placeholder="Напишіть Ваш коментар"
          rows={4}
          maxLength={5000}
          className="form-textarea"
        />
        {errors.comment && (
          <span className="error-message">
            {String(errors.comment.message)}
          </span>
        )}
      </div>
    </>
  );
};

const IndividualFormSection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
}> = ({ methods }) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = methods;
  const birthDate = watch("metadata.birth_date");

  return (
    <>
      <div className="form-card mb-6">
        <h3 className="section-title">Особисті дані</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <TextField
            label="Прізвище *"
            error={errors.metadata?.last_name}
            input={
              <input
                type="text"
                {...register("metadata.last_name")}
                className={`form-input ${errors.metadata?.last_name ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="Ім'я *"
            error={errors.metadata?.first_name}
            input={
              <input
                type="text"
                {...register("metadata.first_name")}
                className={`form-input ${errors.metadata?.first_name ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="По батькові"
            error={errors.metadata?.middle_name}
            input={
              <input
                type="text"
                {...register("metadata.middle_name")}
                className={`form-input ${errors.metadata?.middle_name ? "error" : ""}`}
              />
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <TextField
            label="ІПН"
            error={errors.metadata?.inn}
            input={
              <input
                type="text"
                {...register("metadata.inn")}
                placeholder="10 цифр"
                maxLength={10}
                className={`form-input ${errors.metadata?.inn ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="Серія та номер паспорту"
            error={errors.metadata?.passport_series_number}
            input={
              <input
                type="text"
                {...register("metadata.passport_series_number")}
                className="form-input"
              />
            }
          />
          <div className="form-group">
            <label className="form-label">Дата народження</label>
            <DatePicker
              value={birthDate}
              onChange={(value) =>
                setValue("metadata.birth_date", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        </div>
      </div>

      <ContactSection methods={methods} prefix="metadata" />
    </>
  );
};

const FopFormSection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
}> = ({ methods }) => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = methods;
  const isSameAsClient = watch("metadata.director.is_same_as_client");
  const birthDate = watch("metadata.birth_date");

  return (
    <>
      <div className="form-card mb-6">
        <h3 className="section-title">Особисті дані</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <TextField
            label="Прізвище *"
            error={errors.metadata?.last_name}
            input={
              <input
                type="text"
                {...register("metadata.last_name")}
                className={`form-input ${errors.metadata?.last_name ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="Ім'я *"
            error={errors.metadata?.first_name}
            input={
              <input
                type="text"
                {...register("metadata.first_name")}
                className={`form-input ${errors.metadata?.first_name ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="По батькові"
            error={errors.metadata?.middle_name}
            input={
              <input
                type="text"
                {...register("metadata.middle_name")}
                className="form-input"
              />
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <TextField
            label="ІПН"
            error={errors.metadata?.inn}
            input={
              <input
                type="text"
                {...register("metadata.inn")}
                placeholder="10 цифр"
                maxLength={10}
                className={`form-input ${errors.metadata?.inn ? "error" : ""}`}
              />
            }
          />
          <div className="form-group">
            <label className="form-label">Дата народження</label>
            <DatePicker
              value={birthDate}
              onChange={(value) =>
                setValue("metadata.birth_date", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Діє на підставі *"
            error={errors.metadata?.taxation_basis}
            input={
              <input
                type="text"
                {...register("metadata.taxation_basis")}
                className="form-input"
              />
            }
          />
          <div className="form-group">
            <label className="form-label">Форма оподаткування *</label>
            <select
              {...register("metadata.taxation_form")}
              className={`form-select ${errors.metadata?.taxation_form ? "error" : ""}`}
            >
              <option value="">Оберіть форму</option>
              {TAXATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.metadata?.taxation_form && (
              <span className="error-message">
                {String(errors.metadata.taxation_form.message)}
              </span>
            )}
          </div>
        </div>
      </div>

      <SignatorySection
        methods={methods}
        title="Контакти керівника (або особи, відповідальної за підписання договорів)"
        checkboxPath="metadata.director.is_same_as_client"
        checkboxLabel="Співпадає з даними клієнта"
        disabled={Boolean(isSameAsClient)}
        includePosition={false}
      />

      <BankingSection methods={methods} />

      <ContactSection methods={methods} prefix="metadata" />
    </>
  );
};

const LegalEntityFormSection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
}> = ({ methods }) => {
  const {
    register,
    formState: { errors },
    watch,
  } = methods;
  const isSameAsContactPerson = watch("metadata.director.is_same_as_client");

  return (
    <>
      <div className="form-card mb-6">
        <h3 className="section-title">Реквізити організації</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Організаційно-правова форма *</label>
            <select
              {...register("metadata.company_form")}
              className={`form-select ${errors.metadata?.company_form ? "error" : ""}`}
            >
              <option value="">Оберіть форму</option>
              {LEGAL_FORM_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.metadata?.company_form && (
              <span className="error-message">
                {String(errors.metadata.company_form.message)}
              </span>
            )}
          </div>
          <TextField
            label="Власна назва юридичної особи *"
            error={errors.metadata?.company_name}
            input={
              <input
                type="text"
                {...register("metadata.company_name")}
                className={`form-input ${errors.metadata?.company_name ? "error" : ""}`}
              />
            }
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Код ЄДРПОУ *"
            error={errors.metadata?.edrpou}
            input={
              <input
                type="text"
                {...register("metadata.edrpou")}
                placeholder="8 цифр"
                maxLength={8}
                className={`form-input ${errors.metadata?.edrpou ? "error" : ""}`}
              />
            }
          />
          <div className="form-group">
            <label className="form-label">Форма оподаткування *</label>
            <select
              {...register("metadata.taxation_form")}
              className={`form-select ${errors.metadata?.taxation_form ? "error" : ""}`}
            >
              <option value="">Оберіть форму</option>
              {TAXATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.metadata?.taxation_form && (
              <span className="error-message">
                {String(errors.metadata.taxation_form.message)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="form-card mb-6">
        <h3 className="section-title">Контактна особа</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <TextField
            label="Прізвище *"
            error={errors.metadata?.contact_person?.last_name}
            input={
              <input
                type="text"
                {...register("metadata.contact_person.last_name")}
                className={`form-input ${errors.metadata?.contact_person?.last_name ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="Ім'я *"
            error={errors.metadata?.contact_person?.first_name}
            input={
              <input
                type="text"
                {...register("metadata.contact_person.first_name")}
                className={`form-input ${errors.metadata?.contact_person?.first_name ? "error" : ""}`}
              />
            }
          />
          <TextField
            label="По батькові"
            error={errors.metadata?.contact_person?.middle_name}
            input={
              <input
                type="text"
                {...register("metadata.contact_person.middle_name")}
                className="form-input"
              />
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Посада *"
            error={errors.metadata?.contact_person?.position}
            input={
              <input
                type="text"
                {...register("metadata.contact_person.position")}
                className={`form-input ${errors.metadata?.contact_person?.position ? "error" : ""}`}
              />
            }
          />
        </div>
      </div>

      <ContactSection methods={methods} prefix="metadata.contact_person" />

      <SignatorySection
        methods={methods}
        title="Контакти керівника (або особи, відповідальної за підписання договорів)"
        checkboxPath="metadata.director.is_same_as_client"
        checkboxLabel="Співпадає з даними контактної особи"
        disabled={Boolean(isSameAsContactPerson)}
        includePosition
      />

      <BankingSection methods={methods} />
    </>
  );
};

const SignatorySection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  title: string;
  checkboxPath: "metadata.director.is_same_as_client";
  checkboxLabel: string;
  disabled: boolean;
  includePosition: boolean;
}> = ({
  methods,
  title,
  checkboxPath,
  checkboxLabel,
  disabled,
  includePosition,
}) => {
  const { register } = methods;

  return (
    <div className="form-card mb-6">
      <h3 className="section-title">{title}</h3>
      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          {...register(checkboxPath)}
          className="form-checkbox"
        />
        <span className="text-sm text-gray-700">{checkboxLabel}</span>
      </label>

      <div
        className={`grid grid-cols-3 gap-4 mb-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <TextField
          label="Прізвище"
          input={
            <input
              type="text"
              {...register("metadata.director.last_name")}
              disabled={disabled}
              className="form-input"
            />
          }
        />
        <TextField
          label="Ім'я"
          input={
            <input
              type="text"
              {...register("metadata.director.first_name")}
              disabled={disabled}
              className="form-input"
            />
          }
        />
        <TextField
          label="По батькові"
          input={
            <input
              type="text"
              {...register("metadata.director.middle_name")}
              disabled={disabled}
              className="form-input"
            />
          }
        />
      </div>

      <div
        className={`grid ${includePosition ? "grid-cols-2" : "grid-cols-1"} gap-4 ${disabled ? "opacity-50 pointer-events-none" : ""}`}
      >
        <TextField
          label="Діє на підставі"
          input={
            <input
              type="text"
              {...register("metadata.director.acting_basis")}
              disabled={disabled}
              className="form-input"
            />
          }
        />
        {includePosition && (
          <TextField
            label="Посада"
            input={
              <input
                type="text"
                {...register("metadata.director.position")}
                disabled={disabled}
                className="form-input"
              />
            }
          />
        )}
      </div>
    </div>
  );
};

const BankingSection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
}> = ({ methods }) => {
  const {
    register,
    formState: { errors },
  } = methods;

  return (
    <div className="form-card mb-6">
      <h3 className="section-title">Банківські реквізити</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Назва банку</label>
          <select
            {...register("metadata.banking.bankName")}
            className="form-select"
          >
            <option value="">Оберіть банк</option>
            {BANK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <TextField
          label="МФО"
          error={errors.metadata?.banking?.mfo}
          input={
            <input
              type="text"
              {...register("metadata.banking.mfo")}
              placeholder="6 цифр"
              maxLength={6}
              className={`form-input ${errors.metadata?.banking?.mfo ? "error" : ""}`}
            />
          }
        />
        <TextField
          label="IBAN"
          error={errors.metadata?.banking?.iban}
          input={
            <input
              type="text"
              {...register("metadata.banking.iban")}
              placeholder="UA..."
              maxLength={29}
              className={`form-input ${errors.metadata?.banking?.iban ? "error" : ""}`}
            />
          }
        />
      </div>
    </div>
  );
};

const ContactSection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  prefix: "metadata" | "metadata.contact_person";
}> = ({ methods, prefix }) => {
  const {
    register,
    control,
    formState: { errors },
  } = methods;
  const phoneFields = useFieldArray({
    control,
    name: `${prefix}.additional_phones` as never,
  });
  const emailFields = useFieldArray({
    control,
    name: `${prefix}.additional_emails` as never,
  });
  const heading =
    prefix === "metadata"
      ? "Контактні дані"
      : "Контактні дані контактної особи";

  return (
    <div className="form-card mb-6">
      <h3 className="section-title">{heading}</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <TextField
          label="Телефон *"
          error={getNestedError(errors, `${prefix}.phone`)}
          input={
            <input
              type="tel"
              {...register(`${prefix}.phone` as never)}
              placeholder="+380..."
              className={`form-input ${getNestedError(errors, `${prefix}.phone`) ? "error" : ""}`}
            />
          }
        />
        <DynamicListField
          label="Додаткові телефони"
          fieldArray={phoneFields}
          renderInput={(index) => (
            <input
              type="tel"
              {...register(`${prefix}.additional_phones.${index}` as never)}
              placeholder="+380..."
              className="form-input"
            />
          )}
          addLabel="+ Додати ще номер"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <TextField
          label="E-mail *"
          error={getNestedError(errors, `${prefix}.email`)}
          input={
            <input
              type="email"
              {...register(`${prefix}.email` as never)}
              className={`form-input ${getNestedError(errors, `${prefix}.email`) ? "error" : ""}`}
            />
          }
        />
        <DynamicListField
          label="Додаткові e-mail"
          fieldArray={emailFields}
          renderInput={(index) => (
            <input
              type="email"
              {...register(`${prefix}.additional_emails.${index}` as never)}
              className="form-input"
            />
          )}
          addLabel="+ Додати ще e-mail"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="WhatsApp"
          input={
            <input
              type="text"
              {...register(`${prefix}.messengers.whatsapp` as never)}
              placeholder="+380..."
              className="form-input"
            />
          }
        />
        <TextField
          label="Viber"
          input={
            <input
              type="text"
              {...register(`${prefix}.messengers.viber` as never)}
              placeholder="+380..."
              className="form-input"
            />
          }
        />
        <TextField
          label="Skype"
          input={
            <input
              type="text"
              {...register(`${prefix}.messengers.skype` as never)}
              className="form-input"
            />
          }
        />
        <TextField
          label="Telegram"
          input={
            <input
              type="text"
              {...register(`${prefix}.messengers.telegram` as never)}
              className="form-input"
            />
          }
        />
      </div>
    </div>
  );
};

const DynamicListField: React.FC<{
  label: string;
  fieldArray: UseFieldArrayReturn<any, never, "id">;
  renderInput: (index: number) => React.ReactNode;
  addLabel: string;
}> = ({ label, fieldArray, renderInput, addLabel }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <div className="flex flex-col gap-3">
      {fieldArray.fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <div className="flex-1">{renderInput(index)}</div>
          {fieldArray.fields.length > 1 && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => fieldArray.remove(index)}
              aria-label="Видалити поле"
            >
              <Minus size={16} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        className="link-action"
        onClick={() => fieldArray.append("")}
      >
        <Plus size={14} />
        {addLabel}
      </button>
    </div>
  </div>
);

const TextField: React.FC<{
  label: string;
  input: React.ReactNode;
  error?: { message?: unknown } | undefined;
}> = ({ label, input, error }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {input}
    {error?.message && (
      <span className="error-message">{String(error.message)}</span>
    )}
  </div>
);

const getNestedError = (errors: any, path: string) => {
  return path.split(".").reduce((acc, part) => acc?.[part], errors);
};
