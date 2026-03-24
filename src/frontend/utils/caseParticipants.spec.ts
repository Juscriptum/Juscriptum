import {
  buildLegacyParticipantFields,
  inferParticipantGroup,
  normalizeParticipants,
} from "./caseParticipants";

describe("caseParticipants role catalog", () => {
  it("maps representative and advocacy roles to the expected groups", () => {
    expect(inferParticipantGroup("Представник позивача")).toBe(
      "judicial_and_enforcement_representatives",
    );
    expect(inferParticipantGroup("Захисник")).toBe(
      "criminal_and_admin",
    );
    expect(inferParticipantGroup("Представник потерпілого")).toBe(
      "criminal_and_admin_representatives",
    );
    expect(inferParticipantGroup("Представник власника")).toBe(
      "registration_and_property_representatives",
    );
    expect(inferParticipantGroup("Медіатор")).toBe("mediation");
  });

  it("keeps representative plaintiff and defendant roles compatible with legacy side fields", () => {
    const participants = normalizeParticipants([
      {
        id: "1",
        name: "Адвокат Позивача",
        role: "Представник позивача",
        groupId: "",
      },
      {
        id: "2",
        name: "Адвокат Відповідача",
        role: "Представник відповідача",
        groupId: "",
      },
      {
        id: "3",
        name: "Медіатор Сторін",
        role: "Медіатор",
        groupId: "",
      },
    ]);

    expect(buildLegacyParticipantFields(participants)).toEqual({
      plaintiffName: "Адвокат Позивача",
      defendantName: "Адвокат Відповідача",
      thirdParties: "Медіатор: Медіатор Сторін",
    });
  });
});
