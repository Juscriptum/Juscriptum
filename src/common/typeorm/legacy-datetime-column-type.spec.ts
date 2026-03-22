import { getMetadataArgsStorage } from "typeorm";
import { Organization } from "../../database/entities/Organization.entity";
import { normalizeLegacyDateTimeColumnsForDatabase } from "./legacy-datetime-column-type";

describe("normalizeLegacyDateTimeColumnsForDatabase", () => {
  it("maps legacy datetime columns to timestamp for postgres and restores datetime for sqlite", () => {
    const column = getMetadataArgsStorage().columns.find(
      (candidate) =>
        candidate.target === Organization &&
        candidate.propertyName === "trialEndAt",
    );

    expect(column).toBeDefined();
    expect(column?.options.type).toBe("datetime");

    normalizeLegacyDateTimeColumnsForDatabase("postgres");
    expect(column?.options.type).toBe("timestamp");

    normalizeLegacyDateTimeColumnsForDatabase("sqlite");
    expect(column?.options.type).toBe("datetime");
  });
});
