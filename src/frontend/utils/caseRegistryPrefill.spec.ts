import { buildRegistryParticipantsFromPrefill } from "./caseRegistryPrefill";

describe("buildRegistryParticipantsFromPrefill", () => {
  it("keeps the selected registry person with their role for court records", () => {
    const participants = buildRegistryParticipantsFromPrefill({
      source: "court_registry",
      person: "Іваненко Іван Іванович",
      role: "Позивач",
      participants: "Відповідач: ТОВ Ромашка",
    });

    expect(participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Іваненко Іван Іванович",
          role: "Позивач",
        }),
        expect.objectContaining({
          name: "ТОВ Ромашка",
          role: "Відповідач",
        }),
      ]),
    );
  });

  it("fills both sides for ASVP prefill", () => {
    const participants = buildRegistryParticipantsFromPrefill({
      source: "asvp",
      person: "Петренко Петро Петрович",
      role: "Боржник",
      participants:
        "Стягувач: ТОВ Фактор, Боржник: Петренко Петро Петрович",
      counterpartyName: "ТОВ Фактор",
      counterpartyRole: "Кредитор",
    });

    expect(participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Петренко Петро Петрович",
          role: "Боржник",
        }),
        expect.objectContaining({
          name: "ТОВ Фактор",
          role: "Стягувач",
        }),
      ]),
    );
  });

  it("replaces generic other-role entries with the explicit selected role", () => {
    const participants = buildRegistryParticipantsFromPrefill({
      source: "court_registry",
      person: "ОСОБА_1",
      role: "Заявник",
      participants: "ОСОБА_1",
    });

    expect(participants).toEqual([
      expect.objectContaining({
        name: "ОСОБА_1",
        role: "Заявник",
      }),
    ]);
  });
});
