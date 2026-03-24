import React from "react";
import "./ContactText.css";

const EMAIL_VALUE_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const CONTACT_MATCH_REGEX =
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\+?\d[\d\s()-]{8,}\d/gi;

interface ContactTextProps {
  value?: string | null;
  emptyValue?: string;
}

const normalizePhoneHref = (value: string): string => {
  const trimmed = value.trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return "";
  }

  return `${trimmed.startsWith("+") ? "+" : ""}${digitsOnly}`;
};

const buildContactHref = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (EMAIL_VALUE_REGEX.test(trimmed)) {
    return `mailto:${trimmed}`;
  }

  const normalizedPhone = normalizePhoneHref(trimmed);
  return normalizedPhone ? `tel:${normalizedPhone}` : null;
};

export const ContactText: React.FC<ContactTextProps> = ({
  value,
  emptyValue = "Не вказано",
}) => {
  const normalized = typeof value === "string" ? value.trim() : "";

  if (!normalized) {
    return <>{emptyValue}</>;
  }

  const matches = Array.from(
    normalized.matchAll(new RegExp(CONTACT_MATCH_REGEX.source, "gi")),
  );

  if (matches.length === 0) {
    return <>{normalized}</>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    const matchValue = match[0];
    const matchIndex = match.index ?? 0;

    if (matchIndex > cursor) {
      parts.push(normalized.slice(cursor, matchIndex));
    }

    const href = buildContactHref(matchValue);

    if (href) {
      parts.push(
        <a
          key={`${matchValue}-${index}`}
          href={href}
          className="contact-text__link"
        >
          {matchValue}
        </a>,
      );
    } else {
      parts.push(matchValue);
    }

    cursor = matchIndex + matchValue.length;
  });

  if (cursor < normalized.length) {
    parts.push(normalized.slice(cursor));
  }

  return <>{parts}</>;
};

export default ContactText;
