const UAH_DISPLAY_VALUES = new Set(["UAH", "uah", "грн", "₴"]);

export interface CurrencyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const formatCurrencyLabel = (currency?: string): string => {
  const normalizedCurrency = String(currency || "").trim();

  if (!normalizedCurrency) {
    return "грн";
  }

  return UAH_DISPLAY_VALUES.has(normalizedCurrency)
    ? "грн"
    : normalizedCurrency.toUpperCase();
};

export const formatCurrencyAmount = (
  amount: number,
  currency = "UAH",
  options: CurrencyFormatOptions = {},
): string => {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const minimumFractionDigits = options.minimumFractionDigits ?? 2;
  const maximumFractionDigits = options.maximumFractionDigits ?? 2;

  return `${normalizedAmount.toLocaleString("uk-UA", {
    minimumFractionDigits,
    maximumFractionDigits,
  })} ${formatCurrencyLabel(currency)}`;
};

const UNITS_MASCULINE = [
  "",
  "один",
  "два",
  "три",
  "чотири",
  "п'ять",
  "шість",
  "сім",
  "вісім",
  "дев'ять",
];

const UNITS_FEMININE = [
  "",
  "одна",
  "дві",
  "три",
  "чотири",
  "п'ять",
  "шість",
  "сім",
  "вісім",
  "дев'ять",
];

const TEENS = [
  "десять",
  "одинадцять",
  "дванадцять",
  "тринадцять",
  "чотирнадцять",
  "п'ятнадцять",
  "шістнадцять",
  "сімнадцять",
  "вісімнадцять",
  "дев'ятнадцять",
];

const TENS = [
  "",
  "",
  "двадцять",
  "тридцять",
  "сорок",
  "п'ятдесят",
  "шістдесят",
  "сімдесят",
  "вісімдесят",
  "дев'яносто",
];

const HUNDREDS = [
  "",
  "сто",
  "двісті",
  "триста",
  "чотириста",
  "п'ятсот",
  "шістсот",
  "сімсот",
  "вісімсот",
  "дев'ятсот",
];

const getPluralForm = (
  value: number,
  singular: string,
  paucal: string,
  plural: string,
) => {
  const normalized = Math.abs(value) % 100;
  const remainder = normalized % 10;

  if (normalized > 10 && normalized < 20) {
    return plural;
  }

  if (remainder === 1) {
    return singular;
  }

  if (remainder >= 2 && remainder <= 4) {
    return paucal;
  }

  return plural;
};

const convertTripletToWords = (
  value: number,
  gender: "masculine" | "feminine",
) => {
  if (value === 0) {
    return "";
  }

  const units = gender === "feminine" ? UNITS_FEMININE : UNITS_MASCULINE;
  const parts: string[] = [];
  const hundreds = Math.floor(value / 100);
  const tensUnits = value % 100;
  const tens = Math.floor(tensUnits / 10);
  const unit = tensUnits % 10;

  if (hundreds > 0) {
    parts.push(HUNDREDS[hundreds]);
  }

  if (tensUnits >= 10 && tensUnits < 20) {
    parts.push(TEENS[tensUnits - 10]);
  } else {
    if (tens > 1) {
      parts.push(TENS[tens]);
    }

    if (unit > 0) {
      parts.push(units[unit]);
    }
  }

  return parts.join(" ");
};

const getIntegerAmountInWords = (value: number): string => {
  if (value === 0) {
    return "нуль";
  }

  const scales: Array<{
    value: number;
    forms: [string, string, string];
    gender: "masculine" | "feminine";
  }> = [
    {
      value: 1_000_000_000,
      forms: ["мільярд", "мільярди", "мільярдів"],
      gender: "masculine",
    },
    {
      value: 1_000_000,
      forms: ["мільйон", "мільйони", "мільйонів"],
      gender: "masculine",
    },
    {
      value: 1_000,
      forms: ["тисяча", "тисячі", "тисяч"],
      gender: "feminine",
    },
  ];

  let remainder = Math.floor(Math.abs(value));
  const parts: string[] = [];

  scales.forEach((scale) => {
    const chunk = Math.floor(remainder / scale.value);
    if (chunk > 0) {
      parts.push(convertTripletToWords(chunk, scale.gender));
      parts.push(getPluralForm(chunk, ...scale.forms));
      remainder %= scale.value;
    }
  });

  if (remainder > 0) {
    parts.push(convertTripletToWords(remainder, "feminine"));
  }

  return parts.filter(Boolean).join(" ").trim();
};

export const formatCurrencyInWordsUk = (amount: number): string => {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const isNegative = normalizedAmount < 0;
  const totalKopiyky = Math.round(
    (Math.abs(normalizedAmount) + Number.EPSILON) * 100,
  );
  const hryvnia = Math.floor(totalKopiyky / 100);
  const kopiyky = totalKopiyky % 100;
  const prefix = isNegative ? "мінус " : "";

  return `${prefix}${getIntegerAmountInWords(hryvnia)} грн ${String(kopiyky).padStart(2, "0")} коп`;
};
