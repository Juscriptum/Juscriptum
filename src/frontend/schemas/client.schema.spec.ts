import { createClientSchema } from "./client.schema";

const buildBaseFormData = () => ({
  type: "individual" as const,
  registration_date: "2026-03-07",
  client_number: "",
  comment: "",
  addresses: {
    registration: {
      region: "м. Київ",
      city: "Київ",
      city_code: "",
      street: "Хрещатик",
      building: "1",
      apartment: "",
    },
    actual: {
      region: "",
      city: "",
      city_code: "",
      street: "",
      building: "",
      apartment: "",
    },
    is_same_address: true,
  },
  metadata: {
    first_name: "Іван",
    last_name: "Петренко",
    middle_name: "Іванович",
    inn: "",
    passport_series_number: "",
    birth_date: "",
    phone: "+380671234567",
    additional_phones: [""],
    email: "ivan@example.com",
    additional_emails: [""],
    messengers: {},
  },
});

describe("createClientSchema", () => {
  it("allows submit when actual address is empty and marked as same as registration", () => {
    const result = createClientSchema.safeParse(buildBaseFormData());

    expect(result.success).toBe(true);
  });

  it("requires actual address when it is marked as different", () => {
    const result = createClientSchema.safeParse({
      ...buildBaseFormData(),
      addresses: {
        ...buildBaseFormData().addresses,
        is_same_address: false,
      },
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.path.join(".") === "addresses.actual.region",
        ),
      ).toBe(true);
    }
  });
});
