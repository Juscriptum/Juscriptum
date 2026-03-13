import { CreateClientFormData } from "../schemas/client.schema";
import { Client, ClientStatus, ClientType } from "../types/client.types";

const EMPTY_ADDRESS = {
  region: "",
  city: "",
  city_code: "",
  street: "",
  building: "",
  apartment: "",
};

export const getDefaultClientFormData = (): CreateClientFormData =>
  ({
    type: "individual",
    registration_date: new Date().toISOString().split("T")[0],
    client_number: "",
    addresses: {
      registration: { ...EMPTY_ADDRESS },
      actual: { ...EMPTY_ADDRESS },
      is_same_address: true,
    },
    metadata: {
      first_name: "",
      last_name: "",
      middle_name: "",
      inn: "",
      passport_series_number: "",
      birth_date: "",
      taxation_form: "",
      taxation_basis: "",
      company_form: "",
      company_name: "",
      edrpou: "",
      phone: "",
      additional_phones: [""],
      email: "",
      additional_emails: [""],
      messengers: {},
      contact_person: {
        first_name: "",
        last_name: "",
        middle_name: "",
        position: "",
        phone: "",
        additional_phones: [""],
        email: "",
        additional_emails: [""],
        messengers: {},
      },
      director: {
        is_same_as_client: true,
        first_name: "",
        last_name: "",
        middle_name: "",
        position: "",
        acting_basis: "",
      },
      banking: {
        bankName: "",
        mfo: "",
        iban: "",
      },
    },
  }) as CreateClientFormData;

export const getClientDisplayName = (client: Client): string => {
  if (client.type === "individual") {
    return (
      [client.lastName, client.firstName, client.patronymic]
        .filter(Boolean)
        .join(" ")
        .trim() || "Клієнт без імені"
    );
  }
  if (client.type === "fop") {
    const personName = [client.lastName, client.firstName, client.patronymic]
      .filter(Boolean)
      .join(" ")
      .trim();
    return client.companyName || (personName ? `ФОП ${personName}` : "ФОП");
  }
  return client.companyName || "Юридична особа";
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: "Активний",
  inactive: "Неактивний",
  blocked: "Заблокований",
  archived: "Архівний",
};

export const CLIENT_STATUS_CLASSES: Record<ClientStatus, string> = {
  active: "client-status-active",
  inactive: "client-status-inactive",
  blocked: "client-status-blocked",
  archived: "client-status-archived",
};

export const getClientTypeLabel = (type: ClientType) => {
  switch (type) {
    case "individual":
      return "Фізична особа";
    case "fop":
      return "ФОП";
    case "legal_entity":
      return "Юридична особа";
    default:
      return type;
  }
};

export const mapClientToFormData = (client: Client): CreateClientFormData => {
  const defaults = getDefaultClientFormData();
  const defaultMetadata = defaults.metadata as {
    director?: {
      is_same_as_client: boolean;
      first_name: string;
      last_name: string;
      middle_name: string;
      position: string;
      acting_basis: string;
    };
    banking?: {
      bankName: string;
      mfo: string;
      iban: string;
    };
  };
  const addresses = extractAddresses(client);
  const registrationDate = client.createdAt
    ? client.createdAt.split("T")[0]
    : defaults.registration_date;

  if (client.type === "individual") {
    const contact = client.metadata?.contact || {};
    return {
      ...defaults,
      type: "individual",
      registration_date: registrationDate,
      client_number: client.metadata?.client_number || "",
      comment: client.notes || "",
      addresses,
      metadata: {
        ...defaults.metadata,
        first_name: client.firstName || "",
        last_name: client.lastName || "",
        middle_name: client.patronymic || "",
        inn: client.inn || "",
        passport_series_number: client.passportNumber || "",
        birth_date: client.passportDate || "",
        phone: client.phone || "",
        additional_phones: fillList(contact.additional_phones),
        email: client.email || "",
        additional_emails: fillList(contact.additional_emails),
        messengers: contact.messengers || {},
        director: { ...defaultMetadata.director },
        banking: { ...defaultMetadata.banking },
      },
    } as unknown as CreateClientFormData;
  }

  if (client.type === "fop") {
    const contact = client.metadata?.contact || {};
    const fop = client.metadata?.fop || {};
    const director = fop.director || {};
    const sameAsClient =
      (!director.firstName && !director.lastName) ||
      (director.firstName === client.firstName &&
        director.lastName === client.lastName);

    return {
      ...defaults,
      type: "fop",
      registration_date: registrationDate,
      client_number: client.metadata?.client_number || "",
      comment: client.notes || "",
      addresses,
      metadata: {
        ...defaults.metadata,
        first_name: client.firstName || "",
        last_name: client.lastName || "",
        middle_name: client.patronymic || "",
        inn: client.inn || "",
        birth_date: fop.registrationDate || client.passportDate || "",
        taxation_form: fop.taxationForm || "",
        taxation_basis: fop.taxationBasis || "",
        phone: client.phone || "",
        additional_phones: fillList(contact.additional_phones),
        email: client.email || "",
        additional_emails: fillList(contact.additional_emails),
        messengers: contact.messengers || {},
        director: {
          is_same_as_client: sameAsClient,
          first_name: sameAsClient ? "" : director.firstName || "",
          last_name: sameAsClient ? "" : director.lastName || "",
          middle_name: sameAsClient ? "" : director.patronymic || "",
          position: sameAsClient ? "" : director.position || "",
          acting_basis: sameAsClient ? "" : director.taxationBasis || "",
        },
        banking: {
          bankName: fop.banking?.bankName || "",
          mfo: fop.banking?.mfo || "",
          iban: fop.banking?.iban || "",
        },
      },
    } as unknown as CreateClientFormData;
  }

  const legalEntity = client.metadata?.legalEntity || {};
  const contactPerson = legalEntity.contactPerson || {};
  const director = legalEntity.director || {};
  const sameAsClient =
    (!director.firstName && !director.lastName) ||
    (director.firstName === contactPerson.firstName &&
      director.lastName === contactPerson.lastName);

  return {
    ...defaults,
    type: "legal_entity",
    registration_date: registrationDate,
    client_number: client.metadata?.client_number || "",
    comment: client.notes || "",
    addresses,
    metadata: {
      company_form: legalEntity.companyForm || "",
      company_name: client.companyName || "",
      edrpou: client.edrpou || "",
      taxation_form: legalEntity.taxationForm || "",
      contact_person: {
        first_name: contactPerson.firstName || "",
        last_name: contactPerson.lastName || "",
        middle_name: contactPerson.patronymic || "",
        position: contactPerson.position || "",
        phone: client.phone || contactPerson.phone || "",
        additional_phones: fillList(contactPerson.additional_phones),
        email: client.email || contactPerson.email || "",
        additional_emails: fillList(contactPerson.additional_emails),
        messengers: contactPerson.messengers || {},
      },
      director: {
        is_same_as_client: sameAsClient,
        first_name: sameAsClient ? "" : director.firstName || "",
        last_name: sameAsClient ? "" : director.lastName || "",
        middle_name: sameAsClient ? "" : director.patronymic || "",
        position: sameAsClient ? "" : director.position || "",
        acting_basis: sameAsClient ? "" : director.taxationBasis || "",
      },
      banking: {
        bankName: legalEntity.banking?.bankName || "",
        mfo: legalEntity.banking?.mfo || "",
        iban: legalEntity.banking?.iban || "",
      },
    },
  } as unknown as CreateClientFormData;
};

function fillList(values?: string[]): [string, ...string[]] | [""] {
  const normalized = (values || []).filter(Boolean);
  return normalized.length > 0
    ? ([normalized[0], ...normalized.slice(1)] as [string, ...string[]])
    : [""];
}

function extractAddresses(client: Client) {
  const stored = client.metadata?.addresses;
  const registration = stored?.registration || parseFlatAddress(client);
  const actual = stored?.actual || registration;

  return {
    registration: {
      ...EMPTY_ADDRESS,
      ...registration,
    },
    actual: {
      ...EMPTY_ADDRESS,
      ...actual,
    },
    is_same_address:
      stored?.is_same_address ?? isSameAddress(registration, actual),
  };
}

function isSameAddress(a: Record<string, string>, b: Record<string, string>) {
  return [
    "region",
    "city",
    "city_code",
    "street",
    "building",
    "apartment",
  ].every((key) => (a?.[key] || "") === (b?.[key] || ""));
}

function parseFlatAddress(client: Client) {
  const raw = client.address || "";
  const streetMatch = raw.match(/вул\.\s*([^,]+)/i);
  const buildingMatch = raw.match(/буд\.\s*([^,]+)/i);
  const apartmentMatch = raw.match(/кв\.\s*([^,]+)/i);

  return {
    region: client.region || "",
    city: client.city || "",
    city_code: client.postalCode || "",
    street: streetMatch?.[1]?.trim() || "",
    building: buildingMatch?.[1]?.trim() || "",
    apartment: apartmentMatch?.[1]?.trim() || "",
  };
}
