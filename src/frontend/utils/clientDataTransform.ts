import { CreateClientFormData } from "../schemas/client.schema";
import { ClientType, CreateClientDto } from "../types/client.types";

/**
 * Transform frontend form data to backend DTO structure
 *
 * Frontend schema uses nested structure:
 * - addresses.registration, addresses.actual
 * - metadata.first_name, metadata.phone, etc.
 *
 * Backend expects flat structure:
 * - firstName, lastName, phone, email
 * - address (string), city, region
 * - metadata (JSONB for type-specific fields)
 */
export function transformFormData(
  data: CreateClientFormData,
  clientType: ClientType,
): CreateClientDto {
  const baseDto: Partial<CreateClientDto> = {
    type: clientType,
    createdAt: toClientCreatedAt(data.registration_date),
  };

  // Transform address structure to flat fields
  const addressString = formatAddress(data.addresses.registration);
  const registrationAddress = data.addresses.registration;
  const actualAddress = data.addresses.is_same_address
    ? registrationAddress
    : sanitizeAddress(data.addresses.actual);
  switch (clientType) {
    case "individual": {
      const individualData = data as Extract<
        CreateClientFormData,
        { type: "individual" }
      >;
      const contact = extractContact(individualData.metadata);

      return {
        ...baseDto,
        type: "individual",
        firstName: individualData.metadata.first_name,
        lastName: individualData.metadata.last_name,
        patronymic: individualData.metadata.middle_name,
        phone: contact.phone,
        email: contact.email,
        inn: toOptional(individualData.metadata.inn),
        passportNumber: toOptional(
          individualData.metadata.passport_series_number,
        ),
        passportDate: toOptional(individualData.metadata.birth_date),
        address: addressString,
        city: registrationAddress.city,
        region: registrationAddress.region,
        postalCode: toOptional(registrationAddress.city_code),
        country: "UA",
        notes: toOptional(individualData.comment),
        metadata: {
          client_number: toOptional(individualData.client_number),
          contact: {
            additional_phones: contact.additionalPhones,
            additional_emails: contact.additionalEmails,
            messengers: sanitizeMessengers(individualData.metadata.messengers),
          },
          addresses: {
            registration: registrationAddress,
            actual: actualAddress,
            is_same_address: individualData.addresses.is_same_address,
          },
        },
      } as CreateClientDto;
    }

    case "fop": {
      const fopData = data as Extract<CreateClientFormData, { type: "fop" }>;
      const contact = extractContact(fopData.metadata);

      return {
        ...baseDto,
        type: "fop",
        // FOP uses company name field for business name
        companyName:
          `ФОП ${fopData.metadata.last_name} ${fopData.metadata.first_name} ${fopData.metadata.middle_name || ""}`.trim(),
        firstName: fopData.metadata.first_name,
        lastName: fopData.metadata.last_name,
        patronymic: fopData.metadata.middle_name,
        phone: contact.phone,
        email: contact.email,
        inn: toOptional(fopData.metadata.inn),
        edrpou: toOptional(fopData.metadata.inn), // FOP uses INN as EDRPOU in some cases
        address: addressString,
        city: registrationAddress.city,
        region: registrationAddress.region,
        postalCode: toOptional(registrationAddress.city_code),
        country: "UA",
        notes: toOptional(fopData.comment),
        metadata: {
          client_number: toOptional(fopData.client_number),
          fop: {
            taxationForm: toOptional(fopData.metadata.taxation_form),
            taxationBasis: toOptional(fopData.metadata.taxation_basis),
            registrationDate: toOptional(fopData.metadata.birth_date),
            director: fopData.metadata.director?.is_same_as_client
              ? {
                  firstName: fopData.metadata.first_name,
                  lastName: fopData.metadata.last_name,
                  patronymic: fopData.metadata.middle_name,
                  inn: toOptional(fopData.metadata.inn),
                  phone: contact.phone,
                  email: contact.email,
                }
              : {
                  firstName: toOptional(fopData.metadata.director?.first_name),
                  lastName: toOptional(fopData.metadata.director?.last_name),
                  patronymic: toOptional(
                    fopData.metadata.director?.middle_name,
                  ),
                  position: toOptional(fopData.metadata.director?.position),
                  taxationBasis: toOptional(
                    fopData.metadata.director?.acting_basis ||
                      fopData.metadata.director?.taxation_basis,
                  ),
                },
            banking: sanitizeBanking(fopData.metadata.banking),
          },
          contact: {
            additional_phones: contact.additionalPhones,
            additional_emails: contact.additionalEmails,
            messengers: sanitizeMessengers(fopData.metadata.messengers),
          },
          addresses: {
            registration: registrationAddress,
            actual: actualAddress,
            is_same_address: fopData.addresses.is_same_address,
          },
        },
      } as CreateClientDto;
    }

    case "legal_entity": {
      const legalEntityData = data as Extract<
        CreateClientFormData,
        { type: "legal_entity" }
      >;

      return {
        ...baseDto,
        type: "legal_entity",
        companyName: legalEntityData.metadata.company_name,
        edrpou: legalEntityData.metadata.edrpou,
        phone: toOptional(legalEntityData.metadata.contact_person?.phone),
        email: toOptional(legalEntityData.metadata.contact_person?.email),
        address: addressString,
        city: registrationAddress.city,
        region: registrationAddress.region,
        postalCode: toOptional(registrationAddress.city_code),
        country: "UA",
        notes: toOptional(legalEntityData.comment),
        metadata: {
          client_number: toOptional(legalEntityData.client_number),
          legalEntity: {
            companyForm: legalEntityData.metadata.company_form,
            taxationForm: legalEntityData.metadata.taxation_form,
            contactPerson: {
              firstName: toOptional(
                legalEntityData.metadata.contact_person?.first_name,
              ),
              lastName: toOptional(
                legalEntityData.metadata.contact_person?.last_name,
              ),
              patronymic: toOptional(
                legalEntityData.metadata.contact_person?.middle_name,
              ),
              position: toOptional(
                legalEntityData.metadata.contact_person?.position,
              ),
              phone: toOptional(legalEntityData.metadata.contact_person?.phone),
              email: toOptional(legalEntityData.metadata.contact_person?.email),
              additional_phones: compactList(
                legalEntityData.metadata.contact_person?.additional_phones,
              ),
              additional_emails: compactList(
                legalEntityData.metadata.contact_person?.additional_emails,
              ),
              messengers: sanitizeMessengers(
                legalEntityData.metadata.contact_person?.messengers,
              ),
            },
            director: legalEntityData.metadata.director?.is_same_as_client
              ? {
                  firstName: toOptional(
                    legalEntityData.metadata.contact_person?.first_name,
                  ),
                  lastName: toOptional(
                    legalEntityData.metadata.contact_person?.last_name,
                  ),
                  patronymic: toOptional(
                    legalEntityData.metadata.contact_person?.middle_name,
                  ),
                  position: toOptional(
                    legalEntityData.metadata.contact_person?.position,
                  ),
                }
              : {
                  firstName: toOptional(
                    legalEntityData.metadata.director?.first_name,
                  ),
                  lastName: toOptional(
                    legalEntityData.metadata.director?.last_name,
                  ),
                  patronymic: toOptional(
                    legalEntityData.metadata.director?.middle_name,
                  ),
                  position: toOptional(
                    legalEntityData.metadata.director?.position,
                  ),
                  taxationBasis: toOptional(
                    legalEntityData.metadata.director?.acting_basis ||
                      legalEntityData.metadata.director?.taxation_basis,
                  ),
                },
            banking: sanitizeBanking(legalEntityData.metadata.banking),
          },
          addresses: {
            registration: registrationAddress,
            actual: actualAddress,
            is_same_address: legalEntityData.addresses.is_same_address,
          },
        },
      } as CreateClientDto;
    }

    default:
      throw new Error(`Unknown client type: ${clientType}`);
  }
}

function toClientCreatedAt(value: string): string | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return `${trimmed}T12:00:00.000Z`;
}

function toOptional(value?: string | null): string | undefined {
  if (value == null) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function compactList(values?: Array<string | undefined>): string[] {
  return (values || []).map((value) => value?.trim() || "").filter(Boolean);
}

function sanitizeAddress<T>(address?: T): T | undefined {
  if (!address) return undefined;
  return address;
}

function sanitizeBanking(banking?: {
  bankName?: string;
  mfo?: string;
  iban?: string;
}) {
  if (!banking) return undefined;

  const sanitized = {
    bankName: toOptional(banking.bankName),
    mfo: toOptional(banking.mfo),
    iban: toOptional(banking.iban),
  };

  return sanitized.bankName || sanitized.mfo || sanitized.iban
    ? sanitized
    : undefined;
}

function sanitizeMessengers(messengers?: Record<string, string | undefined>) {
  if (!messengers) return {};

  return Object.fromEntries(
    Object.entries(messengers).filter(([, value]) => !!toOptional(value)),
  );
}

function extractContact(metadata: {
  phone: string;
  email: string;
  additional_phones?: Array<string | undefined>;
  additional_emails?: Array<string | undefined>;
}) {
  return {
    phone: metadata.phone,
    email: metadata.email,
    additionalPhones: compactList(metadata.additional_phones),
    additionalEmails: compactList(metadata.additional_emails),
  };
}

/**
 * Format address object into a single string
 */
function formatAddress(address: {
  street?: string;
  building?: string;
  apartment?: string;
  city?: string;
}): string {
  const parts: string[] = [];

  if (address.street) {
    parts.push(`вул. ${address.street}`);
  }

  if (address.building) {
    parts.push(`буд. ${address.building}`);
  }

  if (address.apartment) {
    parts.push(`кв. ${address.apartment}`);
  }

  return parts.join(", ");
}

/**
 * Validate transformed data before sending to backend
 */
export function validateTransformedData(dto: CreateClientDto): string[] {
  const errors: string[] = [];

  // Type-specific validation
  switch (dto.type) {
    case "individual":
      if (!dto.firstName) errors.push("Ім'я обов'язкове");
      if (!dto.lastName) errors.push("Прізвище обов'язкове");
      if (!dto.phone) errors.push("Телефон обов'язковий");
      if (!dto.email) errors.push("Email обов'язковий");
      break;

    case "fop":
      if (!dto.companyName) errors.push("Назва ФОП обов'язкова");
      if (!dto.firstName) errors.push("Ім'я обов'язкове");
      if (!dto.lastName) errors.push("Прізвище обов'язкове");
      if (!dto.phone) errors.push("Телефон обов'язковий");
      if (!dto.email) errors.push("Email обов'язковий");
      break;

    case "legal_entity":
      if (!dto.companyName) errors.push("Назва компанії обов'язкова");
      if (!dto.edrpou) errors.push("ЄДРПОУ обов'язковий");
      if (!dto.phone) errors.push("Телефон обов'язковий");
      if (!dto.email) errors.push("Email обов'язковий");
      break;
  }

  return errors;
}
