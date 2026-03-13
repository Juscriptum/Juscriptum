import {
  transformFormData,
  validateTransformedData,
} from "../clientDataTransform";
import { CreateClientFormData } from "../../schemas/client.schema";
import { ClientType } from "../../types/client.types";

describe("clientDataTransform", () => {
  const baseFormData: CreateClientFormData = {
    type: "individual",
    registration_date: "2026-02-27",
    addresses: {
      registration: {
        region: "Київська область",
        city: "Київ",
        city_code: "044",
        street: "Хрещатик",
        building: "1",
        apartment: "10",
      },
      is_same_address: true,
    },
    comment: "Тестовий клієнт",
    metadata: {
      first_name: "Іван",
      last_name: "Петренко",
      middle_name: "Іванович",
      phone: "+380501234567",
      email: "ivan@example.com",
      inn: "1234567890",
      additional_phones: [],
      additional_emails: [],
      messengers: {},
    },
  };

  describe("transformFormData - individual", () => {
    it("should transform individual client data correctly", () => {
      const result = transformFormData(baseFormData, "individual");

      expect(result.type).toBe("individual");
      expect(result.createdAt).toBe("2026-02-27T12:00:00.000Z");
      expect(result.firstName).toBe("Іван");
      expect(result.lastName).toBe("Петренко");
      expect(result.patronymic).toBe("Іванович");
      expect(result.phone).toBe("+380501234567");
      expect(result.email).toBe("ivan@example.com");
      expect(result.inn).toBe("1234567890");
      expect(result.city).toBe("Київ");
      expect(result.region).toBe("Київська область");
      expect(result.postalCode).toBe("044");
      expect(result.country).toBe("UA");
      expect(result.notes).toBe("Тестовий клієнт");
    });

    it("should format address correctly", () => {
      const result = transformFormData(baseFormData, "individual");

      expect(result.address).toBe("вул. Хрещатик, буд. 1, кв. 10");
    });

    it("should handle same address correctly", () => {
      const result = transformFormData(baseFormData, "individual");

      expect(result.metadata?.addresses?.is_same_address).toBe(true);
      expect(result.metadata?.addresses?.actual).toEqual(
        result.metadata?.addresses?.registration,
      );
    });

    it("should handle different addresses correctly", () => {
      const dataWithDifferentAddress: CreateClientFormData = {
        ...baseFormData,
        addresses: {
          ...baseFormData.addresses,
          is_same_address: false,
          actual: {
            region: "Львівська область",
            city: "Львів",
            street: "Вулиця",
            building: "5",
          },
        },
      };

      const result = transformFormData(dataWithDifferentAddress, "individual");

      expect(result.metadata?.addresses?.is_same_address).toBe(false);
      expect(result.metadata?.addresses?.actual?.city).toBe("Львів");
    });

    it("should handle contact metadata correctly", () => {
      const dataWithContact: CreateClientFormData = {
        ...baseFormData,
        metadata: {
          ...baseFormData.metadata,
          additional_phones: ["+380671234567"],
          additional_emails: ["work@example.com"],
          messengers: {
            telegram: "@ivanpet",
            viber: "+380501234567",
          },
        },
      };

      const result = transformFormData(dataWithContact, "individual");

      expect(result.metadata?.contact?.additional_phones).toContain(
        "+380671234567",
      );
      expect(result.metadata?.contact?.additional_emails).toContain(
        "work@example.com",
      );
      expect(result.metadata?.contact?.messengers?.telegram).toBe("@ivanpet");
    });

    it("should handle passport data correctly", () => {
      const dataWithPassport: CreateClientFormData = {
        ...baseFormData,
        metadata: {
          ...baseFormData.metadata,
          passport_series_number: "АА 123456",
          birth_date: "1990-01-15",
        },
      };

      const result = transformFormData(dataWithPassport, "individual");

      expect(result.passportNumber).toBe("АА 123456");
      expect(result.passportDate).toBe("1990-01-15");
    });

    it("should handle optional fields as undefined when empty", () => {
      const dataWithEmptyOptionals: CreateClientFormData = {
        ...baseFormData,
        metadata: {
          ...baseFormData.metadata,
          inn: "",
          passport_series_number: "",
        },
      };

      const result = transformFormData(dataWithEmptyOptionals, "individual");

      expect(result.inn).toBeUndefined();
      expect(result.passportNumber).toBeUndefined();
    });
  });

  describe("transformFormData - FOP", () => {
    const fopFormData: CreateClientFormData = {
      type: "fop",
      registration_date: "2026-02-27",
      addresses: baseFormData.addresses,
      comment: "ФОП тест",
      metadata: {
        first_name: "Петро",
        last_name: "Сидоренко",
        middle_name: "Миколайович",
        phone: "+380671234567",
        email: "fop@example.com",
        inn: "0987654321",
        birth_date: "1985-05-20",
        taxation_form: "загальна",
        taxation_basis: "Стаття 3",
        banking: {
          bankName: "ПриватБанк",
          mfo: "305299",
          iban: "UA123456789012345678901234567",
        },
        director: {
          is_same_as_client: true,
        },
        additional_phones: [],
        additional_emails: [],
      },
    };

    it("should transform FOP client data correctly", () => {
      const result = transformFormData(fopFormData, "fop");

      expect(result.type).toBe("fop");
      expect(result.companyName).toBe("ФОП Сидоренко Петро Миколайович");
      expect(result.firstName).toBe("Петро");
      expect(result.lastName).toBe("Сидоренко");
      expect(result.inn).toBe("0987654321");
      expect(result.edrpou).toBe("0987654321"); // FOP uses INN as EDRPOU
    });

    it("should handle FOP with different director", () => {
      const fopWithDifferentDirector: CreateClientFormData = {
        ...fopFormData,
        metadata: {
          ...fopFormData.metadata,
          director: {
            is_same_as_client: false,
            first_name: "Олег",
            last_name: "Бондар",
            middle_name: "Васильович",
            taxation_basis: "Доручення",
          },
        },
      } as CreateClientFormData;

      const result = transformFormData(fopWithDifferentDirector, "fop");

      expect(result.metadata?.fop?.director?.firstName).toBe("Олег");
      expect(result.metadata?.fop?.director?.lastName).toBe("Бондар");
      expect(result.metadata?.fop?.director?.taxationBasis).toBe("Доручення");
    });

    it("should handle FOP with same director as client", () => {
      const result = transformFormData(fopFormData, "fop");

      expect(result.metadata?.fop?.director?.firstName).toBe("Петро");
      expect(result.metadata?.fop?.director?.lastName).toBe("Сидоренко");
      expect(result.metadata?.fop?.director?.inn).toBe("0987654321");
    });

    it("should handle FOP banking information", () => {
      const result = transformFormData(fopFormData, "fop");

      expect(result.metadata?.fop?.banking?.bankName).toBe("ПриватБанк");
      expect(result.metadata?.fop?.banking?.mfo).toBe("305299");
      expect(result.metadata?.fop?.banking?.iban).toBe(
        "UA123456789012345678901234567",
      );
    });

    it("should handle FOP taxation information", () => {
      const result = transformFormData(fopFormData, "fop");

      expect(result.metadata?.fop?.taxationBasis).toBe("Стаття 3");
      expect(result.metadata?.fop?.registrationDate).toBe("1985-05-20");
    });
  });

  describe("transformFormData - legal_entity", () => {
    const legalEntityFormData: CreateClientFormData = {
      type: "legal_entity",
      registration_date: "2026-02-27",
      addresses: baseFormData.addresses,
      comment: "Юридична особа тест",
      metadata: {
        company_form: "ТОВ",
        company_name: 'ТОВ "Технології Майбутнього"',
        edrpou: "12345678",
        taxation_form: "загальна",
        contact_person: {
          first_name: "Марія",
          last_name: "Коваль",
          middle_name: "Олександрівна",
          position: "Директор",
          phone: "+380441234567",
          email: "director@techfuture.ua",
          additional_phones: [],
          additional_emails: [],
        },
        director: {
          is_same_as_client: true,
        },
        banking: {
          bankName: "Ощадбанк",
          mfo: "300465",
          iban: "UA987654321098765432109876543",
        },
      },
    };

    it("should transform legal entity client data correctly", () => {
      const result = transformFormData(legalEntityFormData, "legal_entity");

      expect(result.type).toBe("legal_entity");
      expect(result.companyName).toBe('ТОВ "Технології Майбутнього"');
      expect(result.edrpou).toBe("12345678");
      expect(result.phone).toBe("+380441234567");
      expect(result.email).toBe("director@techfuture.ua");
    });

    it("should handle legal entity contact person", () => {
      const result = transformFormData(legalEntityFormData, "legal_entity");

      expect(result.metadata?.legalEntity?.contactPerson?.firstName).toBe(
        "Марія",
      );
      expect(result.metadata?.legalEntity?.contactPerson?.lastName).toBe(
        "Коваль",
      );
      expect(result.metadata?.legalEntity?.contactPerson?.position).toBe(
        "Директор",
      );
    });

    it("should handle legal entity with different director", () => {
      const legalEntityWithDifferentDirector: CreateClientFormData = {
        ...legalEntityFormData,
        metadata: {
          ...legalEntityFormData.metadata,
          director: {
            is_same_as_client: false,
            first_name: "Андрій",
            last_name: "Мельник",
            middle_name: "Ігорович",
            position: "Генеральний директор",
            taxation_basis: "Статут",
          },
        },
      };

      const result = transformFormData(
        legalEntityWithDifferentDirector,
        "legal_entity",
      );

      expect(result.metadata?.legalEntity?.director?.firstName).toBe("Андрій");
      expect(result.metadata?.legalEntity?.director?.position).toBe(
        "Генеральний директор",
      );
    });

    it("should handle legal entity company information", () => {
      const result = transformFormData(legalEntityFormData, "legal_entity");

      expect(result.metadata?.legalEntity?.companyForm).toBe("ТОВ");
      expect(result.metadata?.legalEntity?.taxationForm).toBe("загальна");
    });

    it("should handle legal entity banking information", () => {
      const result = transformFormData(legalEntityFormData, "legal_entity");

      expect(result.metadata?.legalEntity?.banking?.bankName).toBe("Ощадбанк");
      expect(result.metadata?.legalEntity?.banking?.mfo).toBe("300465");
    });
  });

  describe("validateTransformedData", () => {
    it("should return no errors for valid individual client", () => {
      const dto = transformFormData(baseFormData, "individual");
      const errors = validateTransformedData(dto);

      expect(errors).toHaveLength(0);
    });

    it("should return errors for missing required individual fields", () => {
      const dto = {
        type: "individual" as ClientType,
      };

      const errors = validateTransformedData(dto);

      expect(errors).toContain("Ім'я обов'язкове");
      expect(errors).toContain("Прізвище обов'язкове");
      expect(errors).toContain("Телефон обов'язковий");
      expect(errors).toContain("Email обов'язковий");
    });

    it("should return errors for missing required FOP fields", () => {
      const dto = {
        type: "fop" as ClientType,
        firstName: "Петро",
        lastName: "Сидоренко",
      };

      const errors = validateTransformedData(dto);

      expect(errors).toContain("Назва ФОП обов'язкова");
      expect(errors).toContain("Телефон обов'язковий");
      expect(errors).toContain("Email обов'язковий");
    });

    it("should return errors for missing required legal entity fields", () => {
      const dto = {
        type: "legal_entity" as ClientType,
        companyName: 'ТОВ "Тест"',
      };

      const errors = validateTransformedData(dto);

      expect(errors).toContain("ЄДРПОУ обов'язковий");
      expect(errors).toContain("Телефон обов'язковий");
      expect(errors).toContain("Email обов'язковий");
    });

    it("should return no errors for valid FOP client", () => {
      const fopData: CreateClientFormData = {
        type: "fop",
        registration_date: baseFormData.registration_date,
        addresses: baseFormData.addresses,
        metadata: {
          first_name: "Петро",
          last_name: "Сидоренко",
          middle_name: "",
          phone: "+380501234567",
          email: "test@example.com",
          inn: "1234567890",
          additional_phones: [],
          additional_emails: [],
          messengers: {},
          birth_date: "",
          taxation_form: "загальна",
          taxation_basis: "Стаття 3",
          director: {
            is_same_as_client: true,
          },
        },
      };
      const dto = transformFormData(fopData, "fop");
      const errors = validateTransformedData(dto);

      expect(errors).toHaveLength(0);
    });

    it("should return no errors for valid legal entity client", () => {
      const legalEntityData: CreateClientFormData = {
        ...baseFormData,
        type: "legal_entity",
        metadata: {
          company_form: "ТОВ",
          company_name: 'ТОВ "Тест"',
          edrpou: "12345678",
          taxation_form: "загальна",
          contact_person: {
            first_name: "Іван",
            last_name: "Петренко",
            middle_name: "Іванович",
            position: "Директор",
            phone: "+380501234567",
            email: "test@example.com",
            additional_phones: [],
            additional_emails: [],
          },
          director: {
            is_same_as_client: true,
          },
        },
      };
      const dto = transformFormData(legalEntityData, "legal_entity");
      const errors = validateTransformedData(dto);

      expect(errors).toHaveLength(0);
    });
  });

  describe("Edge cases", () => {
    it("should throw error for unknown client type", () => {
      expect(() =>
        transformFormData(baseFormData, "unknown" as ClientType),
      ).toThrow("Unknown client type: unknown");
    });

    it("should handle empty address gracefully", () => {
      const dataWithEmptyAddress: CreateClientFormData = {
        ...baseFormData,
        addresses: {
          registration: {
            region: "Київська область",
            city: "Київ",
            street: "",
            building: "",
          },
          is_same_address: true,
        },
      };

      const result = transformFormData(dataWithEmptyAddress, "individual");

      expect(result.address).toBe("");
    });

    it("should handle partial address", () => {
      const dataWithPartialAddress: CreateClientFormData = {
        ...baseFormData,
        addresses: {
          registration: {
            region: "Київська область",
            city: "Київ",
            street: "Хрещатик",
            building: "1",
            apartment: undefined,
          },
          is_same_address: true,
        },
      };

      const result = transformFormData(dataWithPartialAddress, "individual");

      expect(result.address).toBe("вул. Хрещатик, буд. 1");
    });
  });
});
