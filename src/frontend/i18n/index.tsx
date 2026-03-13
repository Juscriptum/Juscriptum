/**
 * i18n Configuration and Hook
 * Internationalization setup for the Legal CRM SaaS application
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  uk,
  Translations,
  SupportedLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getTranslation as getTrans,
  interpolate,
} from "./uk";
import { formatCurrencyAmount } from "../utils/currency";

/**
 * Available translations
 */
const translations: Record<SupportedLocale, Translations> = {
  uk,
  en: uk, // Fallback to Ukrainian for now
};

/**
 * i18n Context Type
 */
interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
  formatDate: (
    date: Date | string,
    format?: "short" | "medium" | "long" | "full" | "time" | "dateTime",
  ) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency?: string) => string;
}

/**
 * i18n Context
 */
const I18nContext = createContext<I18nContextType | null>(null);

/**
 * i18n Provider Props
 */
interface I18nProviderProps {
  children: ReactNode;
  defaultLocale?: SupportedLocale;
}

/**
 * i18n Provider Component
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLocale = DEFAULT_LOCALE,
}) => {
  const [locale, setLocale] = useState<SupportedLocale>(defaultLocale);

  /**
   * Translation function
   */
  const t = useCallback(
    (key: string, variables?: Record<string, string | number>): string => {
      const translation = getTrans(key, translations[locale]);
      if (variables) {
        return interpolate(translation, variables);
      }
      return translation;
    },
    [locale],
  );

  /**
   * Format date according to locale
   */
  const formatDate = useCallback(
    (
      date: Date | string,
      format:
        | "short"
        | "medium"
        | "long"
        | "full"
        | "time"
        | "dateTime" = "medium",
    ): string => {
      const d = typeof date === "string" ? new Date(date) : date;

      const options: Intl.DateTimeFormatOptions = {};

      switch (format) {
        case "short":
          return d.toLocaleDateString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
        case "medium":
          return d.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        case "long":
          return d.toLocaleDateString(locale, {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        case "full":
          return d.toLocaleDateString(locale, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          });
        case "time":
          return d.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
          });
        case "dateTime":
          return d.toLocaleString(locale, {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
        default:
          return d.toLocaleDateString(locale);
      }
    },
    [locale],
  );

  /**
   * Format number according to locale
   */
  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale],
  );

  /**
   * Format currency according to locale
   */
  const formatCurrency = useCallback(
    (value: number, currency: string = "UAH"): string => {
      return formatCurrencyAmount(value, currency);
    },
    [],
  );

  const value: I18nContextType = {
    locale,
    setLocale,
    t,
    formatDate,
    formatNumber,
    formatCurrency,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

/**
 * useI18n Hook
 * Access i18n functions from context
 */
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};

/**
 * useTranslation Hook
 * Shorthand for just the translation function
 */
export const useTranslation = () => {
  const { t } = useI18n();
  return { t };
};

/**
 * Higher Order Component for i18n
 */
export function withI18n<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  return function I18nComponent(props: P) {
    const i18n = useI18n();
    return <Component {...props} i18n={i18n} />;
  };
}

/**
 * Trans Component - For inline translations with interpolation
 */
interface TransProps {
  k: string;
  values?: Record<string, string | number>;
  className?: string;
}

export const Trans: React.FC<TransProps> = ({ k, values, className }) => {
  const { t } = useI18n();
  return <span className={className}>{t(k, values)}</span>;
};

export { SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { SupportedLocale, I18nContextType };
