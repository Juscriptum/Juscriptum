import React from "react";
import { UseFormReturn } from "react-hook-form";
import { CreateClientFormData } from "../../schemas/client.schema";

/**
 * Ukraine regions list
 */
export const UKRAINE_REGIONS = [
  "Автономна Республіка Крим",
  "Вінницька область",
  "Волинська область",
  "Дніпропетровська область",
  "Донецька область",
  "Житомирська область",
  "Закарпатська область",
  "Запорізька область",
  "Івано-Франківська область",
  "Київська область",
  "Кіровоградська область",
  "Луганська область",
  "Львівська область",
  "Миколаївська область",
  "Одеська область",
  "Полтавська область",
  "Рівненська область",
  "Сумська область",
  "Тернопільська область",
  "Харківська область",
  "Херсонська область",
  "Хмельницька область",
  "Черкаська область",
  "Чернівецька область",
  "Чернігівська область",
  "м. Київ",
];

/**
 * Address Section Component
 * Reusable form section for address (registration and actual)
 */
export const AddressSection: React.FC<{
  methods: UseFormReturn<CreateClientFormData>;
  isSameAddress: boolean;
  onToggleSameAddress: (checked: boolean) => void;
  primaryAddressTitle: string;
  sameAddressLabel: string;
}> = ({
  methods,
  isSameAddress,
  onToggleSameAddress,
  primaryAddressTitle,
  sameAddressLabel,
}) => {
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
    <>
      {/* Registration Address */}
      <div className="form-card mb-6">
        <h3 className="section-title">{primaryAddressTitle}</h3>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={isSameAddress}
            onChange={(e) => onToggleSameAddress(e.target.checked)}
            className="form-checkbox"
          />
          <span className="text-sm text-gray-700">{sameAddressLabel}</span>
        </label>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Область *</label>
            <select
              {...register("addresses.registration.region")}
              className={`form-select ${getError("addresses.registration.region") ? "error" : ""}`}
            >
              <option value="">Оберіть область</option>
              {UKRAINE_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {getError("addresses.registration.region") && (
              <span className="error-message">
                {getError("addresses.registration.region").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Місто *</label>
            <input
              type="text"
              {...register("addresses.registration.city")}
              className={`form-input ${getError("addresses.registration.city") ? "error" : ""}`}
            />
            {getError("addresses.registration.city") && (
              <span className="error-message">
                {getError("addresses.registration.city").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Код міста</label>
            <input
              type="text"
              {...register("addresses.registration.city_code")}
              className="form-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Вулиця *</label>
            <input
              type="text"
              {...register("addresses.registration.street")}
              className={`form-input ${getError("addresses.registration.street") ? "error" : ""}`}
            />
            {getError("addresses.registration.street") && (
              <span className="error-message">
                {getError("addresses.registration.street").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Будинок *</label>
            <input
              type="text"
              {...register("addresses.registration.building")}
              className={`form-input ${getError("addresses.registration.building") ? "error" : ""}`}
            />
            {getError("addresses.registration.building") && (
              <span className="error-message">
                {getError("addresses.registration.building").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Квартира/офіс/приміщення</label>
            <input
              type="text"
              {...register("addresses.registration.apartment")}
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Actual Address */}
      <div
        className={`form-card mb-6 transition-opacity ${isSameAddress ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h3 className="section-title">Фактична адреса</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="form-group">
            <label className="form-label">Область</label>
            <select
              {...register("addresses.actual.region")}
              disabled={isSameAddress}
              className={`form-select ${getError("addresses.actual.region") ? "error" : ""}`}
            >
              <option value="">Оберіть область</option>
              {UKRAINE_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {getError("addresses.actual.region") && (
              <span className="error-message">
                {getError("addresses.actual.region").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Місто</label>
            <input
              type="text"
              {...register("addresses.actual.city")}
              disabled={isSameAddress}
              className={`form-input ${getError("addresses.actual.city") ? "error" : ""}`}
            />
            {getError("addresses.actual.city") && (
              <span className="error-message">
                {getError("addresses.actual.city").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Код міста</label>
            <input
              type="text"
              {...register("addresses.actual.city_code")}
              disabled={isSameAddress}
              className="form-input"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="form-group">
            <label className="form-label">Вулиця</label>
            <input
              type="text"
              {...register("addresses.actual.street")}
              disabled={isSameAddress}
              className={`form-input ${getError("addresses.actual.street") ? "error" : ""}`}
            />
            {getError("addresses.actual.street") && (
              <span className="error-message">
                {getError("addresses.actual.street").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Будинок</label>
            <input
              type="text"
              {...register("addresses.actual.building")}
              disabled={isSameAddress}
              className={`form-input ${getError("addresses.actual.building") ? "error" : ""}`}
            />
            {getError("addresses.actual.building") && (
              <span className="error-message">
                {getError("addresses.actual.building").message}
              </span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Квартира/офіс/приміщення</label>
            <input
              type="text"
              {...register("addresses.actual.apartment")}
              disabled={isSameAddress}
              className="form-input"
            />
          </div>
        </div>
      </div>
    </>
  );
};
