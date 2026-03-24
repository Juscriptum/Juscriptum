import {
  CaseParticipant,
  createEmptyParticipant,
  DEFAULT_PARTICIPANT_GROUP_ID,
  inferParticipantGroup,
  normalizeParticipants,
} from "./caseParticipants";

export interface RegistryPrefillParticipantSource {
  source?: "court_registry" | "asvp";
  person?: string;
  role?: string;
  participants?: string;
  counterpartyName?: string;
  counterpartyRole?: string;
}

const OTHER_ROLE_LABEL = "Інше";

const normalizeParticipantValue = (value?: string): string =>
  (value || "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[ʼ’`'ʹꞌ]/g, "'")
    .toLocaleLowerCase("uk-UA");

const createRegistryParticipant = (
  name: string,
  role?: string,
): CaseParticipant => {
  const resolvedRole = (role || "").trim() || OTHER_ROLE_LABEL;
  const groupId =
    resolvedRole === OTHER_ROLE_LABEL
      ? DEFAULT_PARTICIPANT_GROUP_ID
      : inferParticipantGroup(resolvedRole);

  return {
    ...createEmptyParticipant(groupId),
    name: name.trim(),
    role: resolvedRole,
    groupId,
  };
};

const parseRegistryParticipants = (
  participantsRaw?: string,
): Array<{ name: string; role?: string }> => {
  if (!participantsRaw) {
    return [];
  }

  return participantsRaw
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const separatorIndex = item.indexOf(":");

      if (separatorIndex === -1) {
        return { name: item, role: OTHER_ROLE_LABEL };
      }

      return {
        role: item.slice(0, separatorIndex).trim(),
        name: item.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((participant) => participant.name.length > 0);
};

const upsertParticipant = (
  participants: CaseParticipant[],
  name?: string,
  role?: string,
  preferRole: boolean = false,
) => {
  const normalizedName = normalizeParticipantValue(name);

  if (!normalizedName) {
    return;
  }

  const normalizedRole = normalizeParticipantValue(role);
  const exactIndex = participants.findIndex(
    (participant) =>
      normalizeParticipantValue(participant.name) === normalizedName &&
      normalizeParticipantValue(participant.role) === normalizedRole,
  );

  if (exactIndex >= 0) {
    return;
  }

  const sameNameIndex = participants.findIndex(
    (participant) =>
      normalizeParticipantValue(participant.name) === normalizedName,
  );

  if (sameNameIndex >= 0) {
    const currentRole = normalizeParticipantValue(participants[sameNameIndex].role);

    if (
      normalizedRole &&
      (preferRole ||
        !currentRole ||
        currentRole === normalizeParticipantValue(OTHER_ROLE_LABEL))
    ) {
      participants[sameNameIndex] = createRegistryParticipant(
        name || "",
        role || "",
      );
      return;
    }

    return;
  }

  participants.push(createRegistryParticipant(name || "", role || ""));
};

export const buildRegistryParticipantsFromPrefill = (
  prefill: RegistryPrefillParticipantSource,
): CaseParticipant[] => {
  const participants = parseRegistryParticipants(prefill.participants).map(
    (participant) =>
      createRegistryParticipant(participant.name, participant.role),
  );

  upsertParticipant(participants, prefill.person, prefill.role, true);
  upsertParticipant(
    participants,
    prefill.counterpartyName,
    prefill.counterpartyRole,
    false,
  );

  return normalizeParticipants(participants);
};
