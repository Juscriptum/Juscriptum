import React, { useMemo, useState } from "react";
import {
  AddressFormData,
  BANK_OPTIONS,
  DEFAULT_PROFILE_FORM,
  DirectorFormData,
  EMPTY_ADDRESS,
  EMPTY_DIRECTOR,
  EMPTY_LEGAL_ENTITY,
  LEGAL_FORM_OPTIONS,
  LEGAL_STATUS_OPTIONS,
  ORGANIZATION_TYPE_OPTIONS,
  ProfileFormData,
  TAX_SYSTEM_OPTIONS,
  UA_REGIONS,
  UserProfile,
} from "../../types/profile.types";
import "./UserProfileDetailsForm.css";

type ProfileMode = "create" | "edit";
type Errors = Record<string, string>;

interface UserProfileDetailsFormProps {
  email: string;
  initialData?: Partial<UserProfile>;
  submitLabel?: string;
  onSubmit: (data: ProfileFormData) => Promise<void>;
  onSkip?: () => void;
  introTitle?: string;
  introText?: string;
  mode?: ProfileMode;
}

const phoneRegex = /^\+380\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const taxIdRegex = /^\d{10}$/;
const edrpouRegex = /^\d{8}$/;
const bankMfoRegex = /^\d{6}$/;
const ibanRegex = /^UA\d{27}$/;

const buildFormState = (
  email: string,
  profile?: Partial<UserProfile>,
): ProfileFormData => ({
  ...DEFAULT_PROFILE_FORM,
  emailLogin: profile?.email || email,
  organizationType:
    profile?.organizationType || DEFAULT_PROFILE_FORM.organizationType,
  lastName: profile?.lastName || "",
  firstName: profile?.firstName || "",
  middleName: profile?.middleName || profile?.patronymic || "",
  position: profile?.position || "",
  taxId: profile?.taxId || "",
  phonePrimary: profile?.phonePrimary || profile?.phone || "",
  phoneSecondary:
    profile?.phoneSecondary && profile.phoneSecondary.length > 0
      ? profile.phoneSecondary
      : [""],
  emailPrimary: profile?.emailPrimary || "",
  emailSecondary:
    profile?.emailSecondary && profile.emailSecondary.length > 0
      ? profile.emailSecondary
      : [""],
  legalEntity: {
    ...EMPTY_LEGAL_ENTITY,
    legalForm: profile?.legalEntity?.legalForm || "",
    legalEntityName: profile?.legalEntity?.legalEntityName || "",
    edrpou: profile?.legalEntity?.edrpou || "",
    taxSystem:
      profile?.legalEntity?.taxSystem || profile?.taxSystem || "general",
  },
  director: {
    ...EMPTY_DIRECTOR,
    ...(profile?.director || {}),
    sameAsUser: profile?.director?.sameAsUser ?? EMPTY_DIRECTOR.sameAsUser,
  },
  legalStatus: profile?.legalStatus || DEFAULT_PROFILE_FORM.legalStatus,
  bankName: profile?.bankName || "",
  bankMfo: profile?.bankMfo || "",
  iban: profile?.iban || "",
  taxSystem: profile?.taxSystem || DEFAULT_PROFILE_FORM.taxSystem,
  vatPayer: Boolean(profile?.vatPayer),
  legalAddress: {
    ...EMPTY_ADDRESS,
    region: profile?.legalAddress?.region || "",
    city: profile?.legalAddress?.city || "",
    cityCode: profile?.legalAddress?.cityCode || "",
    street: profile?.legalAddress?.street || "",
    building: profile?.legalAddress?.building || "",
    unit:
      profile?.legalAddress?.unit ||
      (profile?.legalAddress as { apartment?: string } | undefined)
        ?.apartment ||
      "",
  },
  actualSameAsLegal:
    profile?.actualSameAsLegal ?? DEFAULT_PROFILE_FORM.actualSameAsLegal,
  actualAddress: {
    ...EMPTY_ADDRESS,
    region: profile?.actualAddress?.region || "",
    city: profile?.actualAddress?.city || "",
    cityCode: profile?.actualAddress?.cityCode || "",
    street: profile?.actualAddress?.street || "",
    building: profile?.actualAddress?.building || "",
    unit:
      profile?.actualAddress?.unit ||
      (profile?.actualAddress as { apartment?: string } | undefined)
        ?.apartment ||
      "",
  },
  additionalAddresses: (profile?.additionalAddresses || []).map((address) => ({
    ...EMPTY_ADDRESS,
    region: address.region || "",
    city: address.city || "",
    cityCode: address.cityCode || "",
    street: address.street || "",
    building: address.building || "",
    unit:
      address.unit ||
      (address as { apartment?: string } | undefined)?.apartment ||
      "",
  })),
  certificateNumber: profile?.certificateNumber || "",
  certificateDate: profile?.certificateDate || "",
  issuedBy: profile?.issuedBy || "",
  registryNumber: profile?.registryNumber || "",
  registryDate: profile?.registryDate || "",
  contractNumber: profile?.contractNumber || "",
  contractWith: profile?.contractWith || "",
});

const sanitizePhone = (value: string): string => {
  const normalized = value.replace(/[^\d+]/g, "");

  if (!normalized) {
    return "";
  }

  if (normalized.startsWith("+")) {
    return `+${normalized.slice(1).replace(/\D/g, "").slice(0, 12)}`;
  }

  if (normalized.startsWith("380")) {
    return `+${normalized.replace(/\D/g, "").slice(0, 12)}`;
  }

  return `+${normalized.replace(/\D/g, "").slice(0, 12)}`;
};

const sanitizeDigits = (value: string, maxLength: number): string =>
  value.replace(/\D/g, "").slice(0, maxLength);

const sanitizeIban = (value: string): string =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 29);

const cloneAddress = (address: AddressFormData): AddressFormData => ({
  region: address.region,
  city: address.city,
  cityCode: address.cityCode,
  street: address.street,
  building: address.building,
  unit: address.unit,
});

const isAddressEmpty = (address: AddressFormData): boolean =>
  !address.region.trim() &&
  !address.city.trim() &&
  !address.cityCode.trim() &&
  !address.street.trim() &&
  !address.building.trim() &&
  !address.unit.trim();

const buildDirectorFromUser = (
  form: ProfileFormData,
  organizationType: ProfileFormData["organizationType"],
): DirectorFormData => ({
  sameAsUser: true,
  lastName: form.lastName,
  firstName: form.firstName,
  middleName: form.middleName,
  actingBasis: form.director.actingBasis,
  position: organizationType === "LEGAL_ENTITY" ? form.director.position : "",
});

export const UserProfileDetailsForm: React.FC<UserProfileDetailsFormProps> = ({
  email,
  initialData,
  submitLabel = "Зберегти дані профілю",
  onSubmit,
  onSkip,
  introTitle,
  introText,
  mode = "edit",
}) => {
  const [form, setForm] = useState<ProfileFormData>(() =>
    buildFormState(email, initialData),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isLegalEntity = form.organizationType === "LEGAL_ENTITY";
  const isFop = form.organizationType === "FOP";
  const showDirector = form.organizationType !== "SELF_EMPLOYED";
  const showLegalEntity = isLegalEntity;
  const showFopRegistration = isFop;
  const legalAddressTitle = isFop
    ? "Адреса реєстрації (прописка)"
    : "Юридична адреса";
  const actualAddressToggleLabel = isFop
    ? "Фактична адреса співпадає з адресою реєстрації"
    : "Фактична адреса співпадає з юридичною";
  const personalBlockTitle = isLegalEntity
    ? "Особисті дані користувача"
    : "Особисті дані";

  const resolvedDirector = useMemo(
    () =>
      form.director.sameAsUser
        ? buildDirectorFromUser(form, form.organizationType)
        : form.director,
    [form],
  );

  const resolvedActualAddress = useMemo(
    () =>
      form.actualSameAsLegal
        ? cloneAddress(form.legalAddress)
        : form.actualAddress,
    [form.actualAddress, form.actualSameAsLegal, form.legalAddress],
  );

  const setField = <K extends keyof ProfileFormData>(
    key: K,
    value: ProfileFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setServerError(null);
  };

  const setAddressField = (
    key: "legalAddress" | "actualAddress",
    field: keyof AddressFormData,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === "cityCode" ? sanitizeDigits(value, 10) : value,
      },
    }));
    setServerError(null);
  };

  const setAdditionalAddressField = (
    index: number,
    field: keyof AddressFormData,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      additionalAddresses: prev.additionalAddresses.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === "cityCode" ? sanitizeDigits(value, 10) : value,
            }
          : item,
      ),
    }));
    setServerError(null);
  };

  const setDirectorField = (
    field: keyof DirectorFormData,
    value: string | boolean,
  ) => {
    setForm((prev) => ({
      ...prev,
      director: {
        ...prev.director,
        [field]: value,
      },
    }));
    setServerError(null);
  };

  const setLegalEntityField = (
    field: keyof ProfileFormData["legalEntity"],
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      legalEntity: {
        ...prev.legalEntity,
        [field]: field === "edrpou" ? sanitizeDigits(value, 8) : value,
      },
    }));
    setServerError(null);
  };

  const updateArrayValue = (
    field: "phoneSecondary" | "emailSecondary",
    index: number,
    value: string,
  ) => {
    const next = [...form[field]];
    next[index] =
      field === "phoneSecondary"
        ? sanitizePhone(value)
        : value.trim().toLowerCase();
    setField(field, next as ProfileFormData[typeof field]);
  };

  const addArrayValue = (field: "phoneSecondary" | "emailSecondary") => {
    setField(field, [...form[field], ""] as ProfileFormData[typeof field]);
  };

  const removeArrayValue = (
    field: "phoneSecondary" | "emailSecondary",
    index: number,
  ) => {
    const next = form[field].filter((_, itemIndex) => itemIndex !== index);
    setField(
      field,
      (next.length > 0 ? next : [""]) as ProfileFormData[typeof field],
    );
  };

  const addAdditionalAddress = () => {
    setField("additionalAddresses", [
      ...form.additionalAddresses,
      { ...EMPTY_ADDRESS },
    ]);
  };

  const removeAdditionalAddress = (index: number) => {
    setField(
      "additionalAddresses",
      form.additionalAddresses.filter((_, itemIndex) => itemIndex !== index),
    );
  };

  const validateAddress = (
    address: AddressFormData,
    keyPrefix: string,
    nextErrors: Errors,
  ) => {
    if (!address.region.trim())
      nextErrors[`${keyPrefix}.region`] = "Оберіть область";
    if (!address.city.trim()) nextErrors[`${keyPrefix}.city`] = "Вкажіть місто";
    if (!address.street.trim())
      nextErrors[`${keyPrefix}.street`] = "Вкажіть вулицю";
    if (!address.building.trim())
      nextErrors[`${keyPrefix}.building`] = "Вкажіть будинок";
  };

  const validate = (): boolean => {
    const nextErrors: Errors = {};

    if (!form.emailLogin.trim()) {
      nextErrors.emailLogin = "Обов'язкове поле";
    } else if (!emailRegex.test(form.emailLogin.trim().toLowerCase())) {
      nextErrors.emailLogin = "Невірний формат email";
    }

    if (mode === "create" && !form.password?.trim()) {
      nextErrors.password = "Вкажіть пароль";
    }

    if (form.password && form.password.length < 8) {
      nextErrors.password = "Пароль має містити щонайменше 8 символів";
    }

    if (
      (mode === "create" || form.password) &&
      form.password !== form.passwordConfirm
    ) {
      nextErrors.passwordConfirm = "Паролі не співпадають";
    }

    if (!form.lastName.trim()) nextErrors.lastName = "Обов'язкове поле";
    if (!form.firstName.trim()) nextErrors.firstName = "Обов'язкове поле";

    if (form.taxId && !taxIdRegex.test(form.taxId)) {
      nextErrors.taxId = "ІПН має містити 10 цифр";
    }

    if (form.position && form.position.length > 100) {
      nextErrors.position = "Не більше 100 символів";
    }

    if (form.phonePrimary && !phoneRegex.test(form.phonePrimary)) {
      nextErrors.phonePrimary = "Телефон має бути у форматі +380XXXXXXXXX";
    }

    if (form.emailPrimary && !emailRegex.test(form.emailPrimary)) {
      nextErrors.emailPrimary = "Невірний формат email";
    }

    const normalizedSecondaryPhones = form.phoneSecondary
      .map((item) => item.trim())
      .filter(Boolean);
    if (normalizedSecondaryPhones.some((item) => !phoneRegex.test(item))) {
      nextErrors.phoneSecondary =
        "Додаткові телефони мають бути у форматі +380XXXXXXXXX";
    }
    if (
      form.phonePrimary &&
      normalizedSecondaryPhones.includes(form.phonePrimary.trim())
    ) {
      nextErrors.phoneSecondary =
        "Додаткові телефони не повинні дублювати основний";
    }

    const normalizedSecondaryEmails = form.emailSecondary
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (normalizedSecondaryEmails.some((item) => !emailRegex.test(item))) {
      nextErrors.emailSecondary = "Перевірте формат додаткових email";
    }
    if (
      form.emailPrimary &&
      normalizedSecondaryEmails.includes(form.emailPrimary.trim().toLowerCase())
    ) {
      nextErrors.emailSecondary =
        "Додаткові email не повинні дублювати основний";
    }
    if (
      normalizedSecondaryEmails.includes(form.emailLogin.trim().toLowerCase())
    ) {
      nextErrors.emailSecondary = "Додаткові email не повинні дублювати логін";
    }

    if (!form.legalStatus) {
      nextErrors.legalStatus = "Оберіть статус";
    }

    if (showLegalEntity) {
      if (!form.legalEntity.legalForm.trim()) {
        nextErrors["legalEntity.legalForm"] =
          "Оберіть організаційно-правову форму";
      }
      if (!form.legalEntity.legalEntityName.trim()) {
        nextErrors["legalEntity.legalEntityName"] =
          "Вкажіть назву юридичної особи";
      }
      if (!edrpouRegex.test(form.legalEntity.edrpou)) {
        nextErrors["legalEntity.edrpou"] = "ЄДРПОУ має містити 8 цифр";
      }
    }

    if (showDirector) {
      if (!resolvedDirector.lastName.trim()) {
        nextErrors["director.lastName"] = "Обов'язкове поле";
      }
      if (!resolvedDirector.firstName.trim()) {
        nextErrors["director.firstName"] = "Обов'язкове поле";
      }
      if (!resolvedDirector.actingBasis.trim()) {
        nextErrors["director.actingBasis"] = "Вкажіть підставу діяльності";
      }
      if (isLegalEntity && !resolvedDirector.position.trim()) {
        nextErrors["director.position"] = "Вкажіть посаду";
      }
    }

    if (form.bankMfo && !bankMfoRegex.test(form.bankMfo)) {
      nextErrors.bankMfo = "МФО має містити 6 цифр";
    }

    if (form.iban && !ibanRegex.test(form.iban)) {
      nextErrors.iban = "IBAN має бути у форматі UA + 27 цифр";
    }

    validateAddress(form.legalAddress, "legalAddress", nextErrors);

    if (!form.actualSameAsLegal) {
      validateAddress(form.actualAddress, "actualAddress", nextErrors);
    }

    form.additionalAddresses.forEach((address, index) => {
      if (isAddressEmpty(address)) {
        return;
      }

      validateAddress(address, `additionalAddresses.${index}`, nextErrors);
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    setServerError(null);

    try {
      await onSubmit({
        ...form,
        emailLogin: form.emailLogin.trim().toLowerCase(),
        phonePrimary: form.phonePrimary.trim(),
        emailPrimary: form.emailPrimary.trim().toLowerCase(),
        phoneSecondary: form.phoneSecondary
          .map((item) => item.trim())
          .filter(Boolean),
        emailSecondary: form.emailSecondary
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean),
        taxId: form.taxId.trim(),
        legalEntity: {
          ...form.legalEntity,
          legalForm: form.legalEntity.legalForm.trim(),
          legalEntityName: form.legalEntity.legalEntityName.trim(),
          edrpou: form.legalEntity.edrpou.trim(),
          taxSystem: isLegalEntity
            ? form.legalEntity.taxSystem
            : form.taxSystem,
        },
        director: resolvedDirector,
        actualAddress: resolvedActualAddress,
        additionalAddresses: form.additionalAddresses.filter(
          (address) => !isAddressEmpty(address),
        ),
      });
    } catch (error: any) {
      const responseMessage = error?.response?.data?.message;
      setServerError(
        Array.isArray(responseMessage)
          ? responseMessage.join(". ")
          : responseMessage || "Не вдалося зберегти дані профілю",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderTextInput = (
    name: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    options?: {
      type?: string;
      placeholder?: string;
      readOnly?: boolean;
      disabled?: boolean;
      errorKey?: string;
    },
  ) => (
    <label className="profile-detail-field">
      <span>{label}</span>
      <input
        type={options?.type || "text"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={options?.placeholder}
        readOnly={options?.readOnly}
        disabled={options?.disabled}
        className={errors[options?.errorKey || name] ? "error" : ""}
      />
      {errors[options?.errorKey || name] ? (
        <small>{errors[options?.errorKey || name]}</small>
      ) : null}
    </label>
  );

  const renderAddressSection = (
    title: string,
    field: "legalAddress" | "actualAddress",
    value: AddressFormData,
    disabled: boolean,
  ) => (
    <section className="profile-detail-card">
      <div className="profile-detail-card-head">
        <h3>{title}</h3>
      </div>

      <div className="profile-detail-grid profile-detail-grid--address">
        <label className="profile-detail-field">
          <span>Область</span>
          <select
            value={value.region}
            onChange={(event) =>
              setAddressField(field, "region", event.target.value)
            }
            disabled={disabled}
            className={errors[`${field}.region`] ? "error" : ""}
          >
            <option value="">Оберіть область</option>
            {UA_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
          {errors[`${field}.region`] ? (
            <small>{errors[`${field}.region`]}</small>
          ) : null}
        </label>

        {renderTextInput(`${field}.city`, "Місто", value.city, (next) =>
          setAddressField(field, "city", next),
        )}
        {renderTextInput(
          `${field}.cityCode`,
          "Код міста",
          value.cityCode,
          (next) => setAddressField(field, "cityCode", next),
          { disabled },
        )}
        {renderTextInput(`${field}.street`, "Вулиця", value.street, (next) =>
          setAddressField(field, "street", next),
        )}
        {renderTextInput(
          `${field}.building`,
          "Будинок",
          value.building,
          (next) => setAddressField(field, "building", next),
          { disabled },
        )}
        {renderTextInput(
          `${field}.unit`,
          "Квартира / офіс / приміщення",
          value.unit,
          (next) => setAddressField(field, "unit", next),
          { disabled },
        )}
      </div>
    </section>
  );

  return (
    <form className="profile-details-form" onSubmit={handleSubmit}>
      {introTitle || introText ? (
        <div className="profile-detail-intro">
          {introTitle ? <h2>{introTitle}</h2> : null}
          {introText ? <p>{introText}</p> : null}
        </div>
      ) : null}

      {serverError ? (
        <div className="profile-detail-alert">{serverError}</div>
      ) : null}

      <section className="profile-detail-card">
        <div className="profile-detail-card-head">
          <h3>Організаційна структура</h3>
          <p>Оберіть тип суб'єкта, щоб перебудувати склад блоків форми.</p>
        </div>

        <div className="profile-detail-type-grid">
          {ORGANIZATION_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                form.organizationType === option.value
                  ? "profile-type-card active"
                  : "profile-type-card"
              }
              onClick={() => setField("organizationType", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="profile-detail-card">
        <div className="profile-detail-card-head">
          <h3>{personalBlockTitle}</h3>
        </div>

        <div className="profile-detail-grid">
          {renderTextInput(
            "emailLogin",
            "Логін / email входу",
            form.emailLogin,
            (next) => setField("emailLogin", next),
            { type: "email", readOnly: mode === "edit" },
          )}
          {mode === "create"
            ? renderTextInput(
                "password",
                "Пароль",
                form.password || "",
                (next) => setField("password", next),
                { type: "password" },
              )
            : null}
          {mode === "create"
            ? renderTextInput(
                "passwordConfirm",
                "Підтвердження пароля",
                form.passwordConfirm || "",
                (next) => setField("passwordConfirm", next),
                { type: "password" },
              )
            : null}
          {renderTextInput("lastName", "Прізвище", form.lastName, (next) =>
            setField("lastName", next),
          )}
          {renderTextInput("firstName", "Ім'я", form.firstName, (next) =>
            setField("firstName", next),
          )}
          {renderTextInput(
            "middleName",
            "По батькові",
            form.middleName,
            (next) => setField("middleName", next),
          )}
          {renderTextInput("taxId", "ІПН", form.taxId, (next) =>
            setField("taxId", sanitizeDigits(next, 10)),
          )}
          {renderTextInput("position", "Посада", form.position, (next) =>
            setField("position", next),
          )}
          {renderTextInput(
            "phonePrimary",
            "Основний телефон",
            form.phonePrimary,
            (next) => setField("phonePrimary", sanitizePhone(next)),
            { placeholder: "+380XXXXXXXXX" },
          )}
          {renderTextInput(
            "emailPrimary",
            "Основний email",
            form.emailPrimary,
            (next) => setField("emailPrimary", next.trim().toLowerCase()),
            { type: "email" },
          )}
        </div>

        <div className="profile-detail-array">
          <div className="profile-detail-array-head">
            <span>Додаткові телефони</span>
            <button
              type="button"
              onClick={() => addArrayValue("phoneSecondary")}
            >
              + Додати ще номер
            </button>
          </div>
          {form.phoneSecondary.map((phone, index) => (
            <div key={`phone-${index}`} className="profile-detail-array-row">
              <input
                type="tel"
                value={phone}
                placeholder="+380XXXXXXXXX"
                onChange={(event) =>
                  updateArrayValue("phoneSecondary", index, event.target.value)
                }
              />
              <button
                type="button"
                onClick={() => removeArrayValue("phoneSecondary", index)}
              >
                Видалити
              </button>
            </div>
          ))}
          {errors.phoneSecondary ? (
            <small>{errors.phoneSecondary}</small>
          ) : null}
        </div>

        <div className="profile-detail-array">
          <div className="profile-detail-array-head">
            <span>Додаткові email</span>
            <button
              type="button"
              onClick={() => addArrayValue("emailSecondary")}
            >
              + Додати ще e-mail
            </button>
          </div>
          {form.emailSecondary.map((item, index) => (
            <div key={`email-${index}`} className="profile-detail-array-row">
              <input
                type="email"
                value={item}
                placeholder="name@example.com"
                onChange={(event) =>
                  updateArrayValue("emailSecondary", index, event.target.value)
                }
              />
              <button
                type="button"
                onClick={() => removeArrayValue("emailSecondary", index)}
              >
                Видалити
              </button>
            </div>
          ))}
          {errors.emailSecondary ? (
            <small>{errors.emailSecondary}</small>
          ) : null}
        </div>
      </section>

      {showLegalEntity ? (
        <section className="profile-detail-card">
          <div className="profile-detail-card-head">
            <h3>Дані юридичної особи</h3>
          </div>

          <div className="profile-detail-grid">
            <label className="profile-detail-field">
              <span>Організаційно-правова форма</span>
              <select
                value={form.legalEntity.legalForm}
                onChange={(event) =>
                  setLegalEntityField("legalForm", event.target.value)
                }
                className={errors["legalEntity.legalForm"] ? "error" : ""}
              >
                <option value="">Оберіть форму</option>
                {LEGAL_FORM_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors["legalEntity.legalForm"] ? (
                <small>{errors["legalEntity.legalForm"]}</small>
              ) : null}
            </label>

            {renderTextInput(
              "legalEntity.legalEntityName",
              "Власна назва юридичної особи",
              form.legalEntity.legalEntityName,
              (next) => setLegalEntityField("legalEntityName", next),
              { errorKey: "legalEntity.legalEntityName" },
            )}
            {renderTextInput(
              "legalEntity.edrpou",
              "Код ЄДРПОУ",
              form.legalEntity.edrpou,
              (next) => setLegalEntityField("edrpou", next),
              { errorKey: "legalEntity.edrpou" },
            )}
            <label className="profile-detail-field">
              <span>Форма оподаткування</span>
              <select
                value={form.legalEntity.taxSystem}
                onChange={(event) =>
                  setLegalEntityField("taxSystem", event.target.value)
                }
              >
                {TAX_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      ) : null}

      {showDirector ? (
        <section className="profile-detail-card">
          <div className="profile-detail-card-head">
            <h3>
              Контакти керівника (або особи, відповідальної за підписання
              договорів)
            </h3>
          </div>

          <label className="profile-detail-checkbox">
            <input
              type="checkbox"
              checked={form.director.sameAsUser}
              onChange={(event) =>
                setDirectorField("sameAsUser", event.target.checked)
              }
            />
            <span>Збігається з даними користувача</span>
          </label>

          <div className="profile-detail-grid">
            {renderTextInput(
              "director.lastName",
              "Прізвище керівника",
              resolvedDirector.lastName,
              (next) => setDirectorField("lastName", next),
              {
                errorKey: "director.lastName",
                readOnly: form.director.sameAsUser,
                disabled: form.director.sameAsUser,
              },
            )}
            {renderTextInput(
              "director.firstName",
              "Ім'я керівника",
              resolvedDirector.firstName,
              (next) => setDirectorField("firstName", next),
              {
                errorKey: "director.firstName",
                readOnly: form.director.sameAsUser,
                disabled: form.director.sameAsUser,
              },
            )}
            {renderTextInput(
              "director.middleName",
              "По батькові керівника",
              resolvedDirector.middleName,
              (next) => setDirectorField("middleName", next),
              {
                readOnly: form.director.sameAsUser,
                disabled: form.director.sameAsUser,
              },
            )}
            {renderTextInput(
              "director.actingBasis",
              "Діє на підставі",
              resolvedDirector.actingBasis,
              (next) => setDirectorField("actingBasis", next),
              { errorKey: "director.actingBasis" },
            )}
            {isLegalEntity
              ? renderTextInput(
                  "director.position",
                  "Посада",
                  resolvedDirector.position,
                  (next) => setDirectorField("position", next),
                  { errorKey: "director.position" },
                )
              : null}
          </div>
        </section>
      ) : null}

      <section className="profile-detail-card">
        <div className="profile-detail-card-head">
          <h3>Статус юридичної діяльності</h3>
        </div>

        <div className="profile-detail-type-grid profile-detail-type-grid--compact">
          {LEGAL_STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={
                form.legalStatus === option.value
                  ? "profile-type-card active"
                  : "profile-type-card"
              }
              onClick={() => setField("legalStatus", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        {errors.legalStatus ? <small>{errors.legalStatus}</small> : null}
      </section>

      <section className="profile-detail-card">
        <div className="profile-detail-card-head">
          <h3>Банківські реквізити</h3>
        </div>

        <div className="profile-detail-grid">
          <label className="profile-detail-field">
            <span>Назва банку</span>
            <select
              value={form.bankName}
              onChange={(event) => setField("bankName", event.target.value)}
            >
              <option value="">Оберіть банк</option>
              {BANK_OPTIONS.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </label>
          {renderTextInput("bankMfo", "МФО", form.bankMfo, (next) =>
            setField("bankMfo", sanitizeDigits(next, 6)),
          )}
          {renderTextInput("iban", "IBAN", form.iban, (next) =>
            setField("iban", sanitizeIban(next)),
          )}
          {!isLegalEntity ? (
            <label className="profile-detail-field">
              <span>Форма оподаткування</span>
              <select
                value={form.taxSystem}
                onChange={(event) =>
                  setField(
                    "taxSystem",
                    event.target.value as ProfileFormData["taxSystem"],
                  )
                }
              >
                {TAX_SYSTEM_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="profile-detail-toggle">
            <span>Платник ПДВ</span>
            <input
              type="checkbox"
              checked={form.vatPayer}
              onChange={(event) => setField("vatPayer", event.target.checked)}
            />
          </label>
        </div>
      </section>

      {renderAddressSection(
        legalAddressTitle,
        "legalAddress",
        form.legalAddress,
        false,
      )}

      <section className="profile-detail-card">
        <label className="profile-detail-checkbox">
          <input
            type="checkbox"
            checked={form.actualSameAsLegal}
            onChange={(event) =>
              setField("actualSameAsLegal", event.target.checked)
            }
          />
          <span>{actualAddressToggleLabel}</span>
        </label>
      </section>

      {renderAddressSection(
        "Фактична адреса",
        "actualAddress",
        resolvedActualAddress,
        form.actualSameAsLegal,
      )}

      <section className="profile-detail-card">
        <div className="profile-detail-array-head">
          <span>Додаткові адреси</span>
          <button type="button" onClick={addAdditionalAddress}>
            + Додати ще адресу
          </button>
        </div>

        {form.additionalAddresses.length === 0 ? (
          <p className="profile-detail-muted">Додаткові адреси не додані.</p>
        ) : (
          <div className="profile-detail-stack">
            {form.additionalAddresses.map((address, index) => (
              <section
                key={`additional-address-${index}`}
                className="profile-detail-subcard"
              >
                <div className="profile-detail-array-head">
                  <strong>{`Додаткова адреса ${index + 1}`}</strong>
                  <button
                    type="button"
                    onClick={() => removeAdditionalAddress(index)}
                  >
                    Видалити
                  </button>
                </div>

                <div className="profile-detail-grid profile-detail-grid--address">
                  <label className="profile-detail-field">
                    <span>Область</span>
                    <select
                      value={address.region}
                      onChange={(event) =>
                        setAdditionalAddressField(
                          index,
                          "region",
                          event.target.value,
                        )
                      }
                      className={
                        errors[`additionalAddresses.${index}.region`]
                          ? "error"
                          : ""
                      }
                    >
                      <option value="">Оберіть область</option>
                      {UA_REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                  </label>
                  {renderTextInput(
                    `additionalAddresses.${index}.city`,
                    "Місто",
                    address.city,
                    (next) => setAdditionalAddressField(index, "city", next),
                  )}
                  {renderTextInput(
                    `additionalAddresses.${index}.cityCode`,
                    "Код міста",
                    address.cityCode,
                    (next) =>
                      setAdditionalAddressField(index, "cityCode", next),
                  )}
                  {renderTextInput(
                    `additionalAddresses.${index}.street`,
                    "Вулиця",
                    address.street,
                    (next) => setAdditionalAddressField(index, "street", next),
                  )}
                  {renderTextInput(
                    `additionalAddresses.${index}.building`,
                    "Будинок",
                    address.building,
                    (next) =>
                      setAdditionalAddressField(index, "building", next),
                  )}
                  {renderTextInput(
                    `additionalAddresses.${index}.unit`,
                    "Квартира / офіс / приміщення",
                    address.unit,
                    (next) => setAdditionalAddressField(index, "unit", next),
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {showFopRegistration ? (
        <section className="profile-detail-card">
          <div className="profile-detail-card-head">
            <h3>Діє на підставі / реєстраційні дані</h3>
          </div>

          <div className="profile-detail-grid">
            {renderTextInput(
              "certificateNumber",
              "№ свідоцтва / виписки / витягу",
              form.certificateNumber,
              (next) => setField("certificateNumber", next),
            )}
            {renderTextInput(
              "certificateDate",
              "Дата видачі",
              form.certificateDate,
              (next) => setField("certificateDate", next),
              { type: "date" },
            )}
            {renderTextInput("issuedBy", "Ким виданий", form.issuedBy, (next) =>
              setField("issuedBy", next),
            )}
            {renderTextInput(
              "registryNumber",
              "Номер рішення / запису ЄДР",
              form.registryNumber,
              (next) => setField("registryNumber", next),
            )}
            {renderTextInput(
              "registryDate",
              "Дата рішення / запису ЄДР",
              form.registryDate,
              (next) => setField("registryDate", next),
              { type: "date" },
            )}
            {renderTextInput(
              "contractNumber",
              "Номер контракту",
              form.contractNumber,
              (next) => setField("contractNumber", next),
            )}
            {renderTextInput(
              "contractWith",
              "З ким",
              form.contractWith,
              (next) => setField("contractWith", next),
            )}
          </div>
        </section>
      ) : null}

      <div className="profile-detail-actions">
        {onSkip ? (
          <button type="button" className="skip-button" onClick={onSkip}>
            Пропустити
          </button>
        ) : null}
        <button type="submit" className="next-button" disabled={isSaving}>
          {isSaving ? "Збереження..." : submitLabel}
        </button>
      </div>
    </form>
  );
};
