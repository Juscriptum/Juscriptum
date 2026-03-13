import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateClientFormData } from "../../schemas/client.schema";

/**
 * Person Name Fields Component
 * Reusable form fields for person name (last name, first name, patronymic)
 */
export const PersonNameFields: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  prefix: string;
  required?: boolean;
  disabled?: boolean;
}> = ({ methods, prefix, required = true, disabled = false }) => {
  const {
    register,
    formState: { errors },
  } = methods;

  // Helper to get nested error
  const getError = (field: string) => {
    const parts = field.split(".");
    let error: any = errors;
    for (const part of parts) {
      error = error?.[part];
    }
    return error;
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      <div className="form-group">
        <label className="form-label">Прізвище {required && "*"}</label>
        <input
          type="text"
          {...register(`${prefix}.last_name` as any)}
          disabled={disabled}
          className={`form-input ${getError(`${prefix}.last_name`) ? "error" : ""}`}
        />
        {getError(`${prefix}.last_name`) && (
          <span className="error-message">
            {getError(`${prefix}.last_name`).message}
          </span>
        )}
      </div>
      <div className="form-group">
        <label className="form-label">Ім'я {required && "*"}</label>
        <input
          type="text"
          {...register(`${prefix}.first_name` as any)}
          disabled={disabled}
          className={`form-input ${getError(`${prefix}.first_name`) ? "error" : ""}`}
        />
        {getError(`${prefix}.first_name`) && (
          <span className="error-message">
            {getError(`${prefix}.first_name`).message}
          </span>
        )}
      </div>
      <div className="form-group">
        <label className="form-label">По батькові {required && "*"}</label>
        <input
          type="text"
          {...register(`${prefix}.middle_name` as any)}
          disabled={disabled}
          className={`form-input ${getError(`${prefix}.middle_name`) ? "error" : ""}`}
        />
        {getError(`${prefix}.middle_name`) && (
          <span className="error-message">
            {getError(`${prefix}.middle_name`).message}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Contact Fields Component
 * Reusable form fields for contact information (phone, email)
 */
export const ContactFields: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  prefix: string;
  required?: boolean;
}> = ({ methods, prefix, required = true }) => {
  const {
    register,
    formState: { errors },
  } = methods;

  const getError = (field: string) => {
    const parts = field.split(".");
    let error: any = errors;
    for (const part of parts) {
      error = error?.[part];
    }
    return error;
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div className="form-group">
        <label className="form-label">Телефон {required && "*"}</label>
        <input
          type="tel"
          {...register(`${prefix}.phone` as any)}
          placeholder="+380XXXXXXXXX"
          className={`form-input ${getError(`${prefix}.phone`) ? "error" : ""}`}
        />
        {getError(`${prefix}.phone`) && (
          <span className="error-message">
            {getError(`${prefix}.phone`).message}
          </span>
        )}
      </div>
      <div className="form-group">
        <label className="form-label">Email {required && "*"}</label>
        <input
          type="email"
          {...register(`${prefix}.email` as any)}
          className={`form-input ${getError(`${prefix}.email`) ? "error" : ""}`}
        />
        {getError(`${prefix}.email`) && (
          <span className="error-message">
            {getError(`${prefix}.email`).message}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Banking Fields Component
 * Reusable form fields for banking information
 */
export const BankingFields: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  prefix: string;
}> = ({ methods, prefix }) => {
  const {
    register,
    formState: { errors },
  } = methods;

  const getError = (field: string) => {
    const parts = field.split(".");
    let error: any = errors;
    for (const part of parts) {
      error = error?.[part];
    }
    return error;
  };

  return (
    <div className="form-card mb-6">
      <h3 className="section-title">Банківські реквізити</h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="form-group">
          <label className="form-label">Назва банку</label>
          <select
            {...register(`${prefix}.bankName` as any)}
            className="form-select"
          >
            <option value="">Оберіть банк</option>
            <option value="privat">ПриватБанк</option>
            <option value="oschad">Ощадбанк</option>
            <option value="ukrexim">Укрексімбанк</option>
            <option value="raiffeisen">Райффайзен Банк</option>
            <option value="ukrsib">УкрСиббанк</option>
            <option value="mono">Монобанк</option>
            <option value="other">Інший</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">МФО</label>
          <input
            type="text"
            {...register(`${prefix}.mfo` as any)}
            placeholder="6 цифр"
            maxLength={6}
            className={`form-input ${getError(`${prefix}.mfo`) ? "error" : ""}`}
          />
          {getError(`${prefix}.mfo`) && (
            <span className="error-message">
              {getError(`${prefix}.mfo`).message}
            </span>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">IBAN</label>
          <input
            type="text"
            {...register(`${prefix}.iban` as any)}
            placeholder="UA..."
            maxLength={29}
            className={`form-input ${getError(`${prefix}.iban`) ? "error" : ""}`}
          />
          {getError(`${prefix}.iban`) && (
            <span className="error-message">
              {getError(`${prefix}.iban`).message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Director Fields Component
 * Reusable form fields for director information
 */
export const DirectorFields: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  prefix: string;
  clientDataPrefix: string;
}> = ({ methods, prefix, clientDataPrefix }) => {
  const {
    register,
    watch,
    formState: { errors },
  } = methods;
  const isSameAsClient = watch(`${prefix}.is_same_as_client` as any);

  const getError = (field: string) => {
    const parts = field.split(".");
    let error: any = errors;
    for (const part of parts) {
      error = error?.[part];
    }
    return error;
  };

  return (
    <div className="form-card mb-6">
      <h3 className="section-title">
        Контакти керівника (або особи, відповідальної за підписання договорів)
      </h3>

      <label className="flex items-center gap-2 mb-4">
        <input
          type="checkbox"
          {...register(`${prefix}.is_same_as_client` as any)}
          className="form-checkbox"
        />
        <span className="text-sm text-gray-700">
          Співпадає з даними користувача
        </span>
      </label>

      <div
        className={`grid grid-cols-3 gap-4 mb-4 ${isSameAsClient ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="form-group">
          <label className="form-label">Прізвище</label>
          <input
            type="text"
            {...register(`${prefix}.last_name` as any)}
            disabled={isSameAsClient}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Ім'я</label>
          <input
            type="text"
            {...register(`${prefix}.first_name` as any)}
            disabled={isSameAsClient}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">По батькові</label>
          <input
            type="text"
            {...register(`${prefix}.middle_name` as any)}
            disabled={isSameAsClient}
            className="form-input"
          />
        </div>
      </div>

      <div
        className={`grid grid-cols-2 gap-4 ${isSameAsClient ? "opacity-50 pointer-events-none" : ""}`}
      >
        <div className="form-group">
          <label className="form-label">Діючі підстави</label>
          <input
            type="text"
            {...register(`${prefix}.taxation_basis` as any)}
            disabled={isSameAsClient}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
};
