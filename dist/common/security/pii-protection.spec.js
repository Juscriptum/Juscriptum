"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _piiprotection = require("./pii-protection");
describe("pii-protection", ()=>{
    const originalKey = process.env.ENCRYPTION_KEY;
    beforeEach(()=>{
        process.env.ENCRYPTION_KEY = "a".repeat(64);
    });
    afterAll(()=>{
        process.env.ENCRYPTION_KEY = originalKey;
    });
    it("encrypts and decrypts field values", ()=>{
        const encrypted = (0, _piiprotection.encryptFieldValue)("sensitive-value");
        expect(encrypted).toContain("enc:v1:");
        expect(encrypted).not.toContain("sensitive-value");
        expect((0, _piiprotection.decryptFieldValue)(encrypted)).toBe("sensitive-value");
    });
    it("supports migration-safe plaintext reads in the transformer", ()=>{
        const transformer = (0, _piiprotection.createEncryptedStringTransformer)();
        expect(transformer.from("plaintext")).toBe("plaintext");
        expect(transformer.from(null)).toBeNull();
    });
    it("redacts nested PII keys and encrypted payloads", ()=>{
        const encryptedPhone = (0, _piiprotection.encryptFieldValue)("+380501234567");
        expect((0, _piiprotection.redactPiiData)({
            firstName: "Іван",
            metadata: {
                passportNumber: "AB123456",
                nested: [
                    {
                        phone: "+380501234567"
                    },
                    encryptedPhone
                ]
            }
        })).toEqual({
            firstName: "[REDACTED]",
            metadata: {
                passportNumber: "[REDACTED]",
                nested: [
                    {
                        phone: "[REDACTED]"
                    },
                    "[ENCRYPTED]"
                ]
            }
        });
    });
    it("produces stable blind indexes from normalized values", ()=>{
        expect((0, _piiprotection.computeEmailBlindIndex)(" User@Example.com ", "user_email")).toBe((0, _piiprotection.computeEmailBlindIndex)("user@example.com", "user_email"));
        expect((0, _piiprotection.computePhoneBlindIndex)("+380 (50) 123-45-67")).toBe((0, _piiprotection.computePhoneBlindIndex)("380501234567"));
        expect((0, _piiprotection.computeIdentifierBlindIndex)("12 34-56 78", "client_edrpou")).toBe((0, _piiprotection.computeIdentifierBlindIndex)("12345678", "client_edrpou"));
    });
    it("detects searchable PII query kinds", ()=>{
        expect((0, _piiprotection.detectSearchablePiiKind)("user@example.com")).toBe("email");
        expect((0, _piiprotection.detectSearchablePiiKind)("+380501234567")).toBe("phone");
        expect((0, _piiprotection.detectSearchablePiiKind)("12345678")).toBe("identifier");
        expect((0, _piiprotection.detectSearchablePiiKind)("Іван")).toBeNull();
    });
});

//# sourceMappingURL=pii-protection.spec.js.map