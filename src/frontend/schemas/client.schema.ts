import { z } from "zod";

/**
 * Validation patterns for Ukrainian formats
 */
const phoneRegex = /^\+380\d{9}$/;
const innRegex = /^\d{10}$/;
const edrpouRegex = /^\d{8}$/;
const mfoRegex = /^\d{6}$/;
const ibanRegex = /^UA\d{27}$/;

const optionalPhoneSchema = z
  .string()
  .refine(
    (value) => value === "" || phoneRegex.test(value),
    "Телефон має бути у форматі +380XXXXXXXXX",
  )
  .optional();

const optionalEmailSchema = z
  .string()
  .refine(
    (value) => value === "" || z.string().email().safeParse(value).success,
    "Невірний формат email",
  )
  .optional();

const optionalInnSchema = z
  .string()
  .refine(
    (value) => value === "" || innRegex.test(value),
    "ІПН має містити 10 цифр",
  )
  .optional();

const optionalEdrpouSchema = z
  .string()
  .refine(
    (value) => value === "" || edrpouRegex.test(value),
    "ЄДРПОУ має містити 8 цифр",
  )
  .optional();

const optionalMfoSchema = z
  .string()
  .refine(
    (value) => value === "" || mfoRegex.test(value),
    "МФО має містити 6 цифр",
  )
  .optional();

const optionalIbanSchema = z
  .string()
  .refine(
    (value) => value === "" || ibanRegex.test(value),
    "IBAN має бути у форматі UAXXXXXXXXXXXXXXXXXXXXXXXXX",
  )
  .optional();

/**
 * Base address schema
 */
const addressSchema = z.object({
  region: z.string().min(1, "Область обов'язкова"),
  city: z.string().min(1, "Місто обов'язкове"),
  city_code: z.string().optional(),
  street: z.string().min(1, "Вулиця обов'язкова"),
  building: z.string().min(1, "Будинок обов'язковий"),
  apartment: z.string().optional(),
});

const isEmptyAddress = (value: unknown): boolean => {
  if (!value || typeof value !== "object") {
    return true;
  }

  return Object.values(value as Record<string, unknown>).every(
    (fieldValue) => `${fieldValue ?? ""}`.trim() === "",
  );
};

const actualAddressSchema = z.preprocess(
  (value) => (isEmptyAddress(value) ? undefined : value),
  addressSchema.optional(),
);

const addressesSchema = z
  .object({
    registration: addressSchema,
    actual: actualAddressSchema,
    is_same_address: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.is_same_address && !data.actual) {
      for (const field of ["region", "city", "street", "building"] as const) {
        ctx.addIssue({
          code: "custom",
          path: ["actual", field],
          message:
            field === "region"
              ? "Область обов'язкова"
              : field === "city"
                ? "Місто обов'язкове"
                : field === "street"
                  ? "Вулиця обов'язкова"
                  : "Будинок обов'язковий",
        });
      }
    }
  });

/**
 * Contact data schema with messengers
 */
const contactSchema = z.object({
  phone: z
    .string()
    .regex(phoneRegex, "Телефон має бути у форматі +380XXXXXXXXX")
    .min(1, "Телефон обов'язковий"),
  additional_phones: z.array(optionalPhoneSchema).optional(),
  email: z.string().email("Невірний формат email").min(1, "Email обов'язковий"),
  additional_emails: z.array(optionalEmailSchema).optional(),
  messengers: z
    .object({
      whatsapp: z.string().optional(),
      viber: z.string().optional(),
      skype: z.string().optional(),
      telegram: z.string().optional(),
    })
    .optional(),
});

/**
 * Banking requisites schema
 */
const bankingSchema = z.object({
  bankName: z.string().optional(),
  mfo: optionalMfoSchema,
  iban: optionalIbanSchema,
});

/**
 * Director info schema
 */
const directorSchema = z
  .object({
    is_same_as_client: z.boolean(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    middle_name: z.string().optional(),
    position: z.string().optional(),
    taxation_basis: z.string().optional(),
    acting_basis: z.string().optional(),
  })
  .refine(
    (data) => data.is_same_as_client || (data.first_name && data.last_name),
    {
      message:
        "Прізвище та ім'я директора обов'язкові, якщо не співпадає з клієнтом",
      path: ["first_name"],
    },
  );

/**
 * Individual client schema
 */
const individualSchema = z.object({
  type: z.literal("individual"),
  client_number: z.string().optional(),
  registration_date: z.string().min(1, "Дата обов'язкова"),
  addresses: addressesSchema,
  comment: z
    .string()
    .max(5000, "Коментар не може перевищувати 5000 символів")
    .optional(),
  metadata: z.object({
    ...contactSchema.shape,
    first_name: z.string().min(1, "Ім'я обов'язкове"),
    last_name: z.string().min(1, "Прізвище обов'язкове"),
    middle_name: z.string().optional(),
    inn: optionalInnSchema.or(z.literal("")),
    passport_series_number: z.string().optional(),
    birth_date: z.string().optional(),
  }),
});

/**
 * FOP client schema
 */
const fopSchema = z.object({
  type: z.literal("fop"),
  client_number: z.string().optional(),
  registration_date: z.string().min(1, "Дата обов'язкова"),
  addresses: addressesSchema,
  comment: z
    .string()
    .max(5000, "Коментар не може перевищувати 5000 символів")
    .optional(),
  metadata: z.object({
    ...contactSchema.shape,
    first_name: z.string().min(1, "Ім'я обов'язкове"),
    last_name: z.string().min(1, "Прізвище обов'язкове"),
    middle_name: z.string().optional(),
    inn: optionalInnSchema.or(z.literal("")),
    birth_date: z.string().optional(),
    taxation_form: z.string().min(1, "Форма оподаткування обов'язкова"),
    taxation_basis: z.string().min(1, "Діючі підстави обов'язкові"),
    banking: bankingSchema.optional(),
    director: directorSchema,
  }),
});

/**
 * Legal entity client schema
 */
const legalEntitySchema = z.object({
  type: z.literal("legal_entity"),
  client_number: z.string().optional(),
  registration_date: z.string().min(1, "Дата обов'язкова"),
  addresses: addressesSchema,
  comment: z
    .string()
    .max(5000, "Коментар не може перевищувати 5000 символів")
    .optional(),
  metadata: z.object({
    company_form: z.string().min(1, "Організаційно-правова форма обов'язкова"),
    company_name: z.string().min(1, "Назва обов'язкова"),
    edrpou: optionalEdrpouSchema.refine(
      (value) => !!value,
      "ЄДРПОУ обов'язковий",
    ),
    taxation_form: z.string().min(1, "Форма оподаткування обов'язкова"),
    contact_person: z.object({
      ...contactSchema.shape,
      first_name: z.string().min(1, "Ім'я обов'язкове"),
      last_name: z.string().min(1, "Прізвище обов'язкове"),
      middle_name: z.string().optional(),
      position: z.string().min(1, "Посада обов'язкова"),
    }),
    director: directorSchema,
    banking: bankingSchema.optional(),
  }),
});

/**
 * Union schema for all client types
 */
export const createClientSchema = z.discriminatedUnion("type", [
  individualSchema,
  fopSchema,
  legalEntitySchema,
]);

/**
 * Form data type inferred from schema
 */
export type CreateClientFormData = z.infer<typeof createClientSchema>;

/**
 * Export individual schemas for conditional use
 */
export {
  individualSchema,
  fopSchema,
  legalEntitySchema,
  addressSchema,
  addressesSchema,
  contactSchema,
  bankingSchema,
};
