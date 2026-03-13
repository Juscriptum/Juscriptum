import {
  computeEmailBlindIndex,
  computeIdentifierBlindIndex,
  computePhoneBlindIndex,
  detectSearchablePiiKind,
  createEncryptedStringTransformer,
  decryptFieldValue,
  encryptFieldValue,
  redactPiiData,
} from "./pii-protection";

describe("pii-protection", () => {
  const originalKey = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = "a".repeat(64);
  });

  afterAll(() => {
    process.env.ENCRYPTION_KEY = originalKey;
  });

  it("encrypts and decrypts field values", () => {
    const encrypted = encryptFieldValue("sensitive-value");

    expect(encrypted).toContain("enc:v1:");
    expect(encrypted).not.toContain("sensitive-value");
    expect(decryptFieldValue(encrypted)).toBe("sensitive-value");
  });

  it("supports migration-safe plaintext reads in the transformer", () => {
    const transformer = createEncryptedStringTransformer();

    expect(transformer.from("plaintext")).toBe("plaintext");
    expect(transformer.from(null)).toBeNull();
  });

  it("redacts nested PII keys and encrypted payloads", () => {
    const encryptedPhone = encryptFieldValue("+380501234567");

    expect(
      redactPiiData({
        firstName: "Іван",
        metadata: {
          passportNumber: "AB123456",
          nested: [{ phone: "+380501234567" }, encryptedPhone],
        },
      }),
    ).toEqual({
      firstName: "[REDACTED]",
      metadata: {
        passportNumber: "[REDACTED]",
        nested: [{ phone: "[REDACTED]" }, "[ENCRYPTED]"],
      },
    });
  });

  it("produces stable blind indexes from normalized values", () => {
    expect(computeEmailBlindIndex(" User@Example.com ", "user_email")).toBe(
      computeEmailBlindIndex("user@example.com", "user_email"),
    );
    expect(computePhoneBlindIndex("+380 (50) 123-45-67")).toBe(
      computePhoneBlindIndex("380501234567"),
    );
    expect(computeIdentifierBlindIndex("12 34-56 78", "client_edrpou")).toBe(
      computeIdentifierBlindIndex("12345678", "client_edrpou"),
    );
  });

  it("detects searchable PII query kinds", () => {
    expect(detectSearchablePiiKind("user@example.com")).toBe("email");
    expect(detectSearchablePiiKind("+380501234567")).toBe("phone");
    expect(detectSearchablePiiKind("12345678")).toBe("identifier");
    expect(detectSearchablePiiKind("Іван")).toBeNull();
  });
});
