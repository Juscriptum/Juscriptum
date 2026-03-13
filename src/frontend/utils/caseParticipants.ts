import { Case } from "../types/case.types";

export interface CaseParticipant {
  id: string;
  name: string;
  role: string;
  groupId: string;
  isCustomRole?: boolean;
}

export interface ParticipantRoleGroup {
  id: string;
  label: string;
  roles: string[];
}

export const PARTICIPANT_ROLE_GROUPS: ParticipantRoleGroup[] = [
  {
    id: "judicial_and_enforcement",
    label: "Судові справи та виконавче провадження",
    roles: [
      "Позивач",
      "Відповідач",
      "Третя особа із самостійними вимогами",
      "Третя особа без самостійних вимог",
      "Заявник",
      "Заінтересована особа",
      "Скаржник",
      "Стягувач",
      "Боржник",
      "Правонаступник стягувача",
      "Правонаступник боржника",
      "Скаржник на дії/бездіяльність виконавця",
    ],
  },
  {
    id: "criminal_and_admin",
    label:
      "Кримінальні провадження та справи про адміністративні правопорушення",
    roles: [
      "Заявник про кримінальне правопорушення",
      "Викривач",
      "Підозрюваний",
      "Обвинувачений",
      "Потерпілий",
      "Цивільний позивач",
      "Цивільний відповідач",
      "Представник юридичної особи, щодо якої здійснюється провадження",
      "Засуджений",
      "Виправданий",
      "Особа, яка притягається до адміністративної відповідальності",
      "Потерпілий у справі про адміністративне правопорушення",
      "Скаржник",
    ],
  },
  {
    id: "registration_and_property",
    label: "Реєстраційні, корпоративні справи та про нерухомість",
    roles: [
      "Заявник",
      "Скаржник",
      "Засновник",
      "Учасник",
      "Керівник",
      "Підписант",
      "Кінцевий бенефіціарний власник",
      "Власник",
      "Співвласник",
      "Правонабувач",
      "Іпотекодержатель",
      "Обтяжувач",
      "Орендар",
      "Користувач",
      "Землекористувач",
    ],
  },
  {
    id: "mediation",
    label: "Медіація",
    roles: ["Сторона медіації", "Ініціатор медіації", "Учасник медіації"],
  },
];

export const DEFAULT_PARTICIPANT_GROUP_ID = PARTICIPANT_ROLE_GROUPS[0].id;

const PLAINTIFF_ROLE_MATCHER =
  /(позивач|заявник|скаржник|стягувач|викривач|потерпілий|цивільний позивач)/iu;
const DEFENDANT_ROLE_MATCHER =
  /(відповідач|боржник|підозрюваний|обвинувачений|засуджений|виправданий|цивільний відповідач)/iu;

export const createEmptyParticipant = (
  groupId: string = DEFAULT_PARTICIPANT_GROUP_ID,
): CaseParticipant => ({
  id: crypto.randomUUID(),
  name: "",
  role: "",
  groupId,
  isCustomRole: false,
});

export const inferParticipantGroup = (role?: string): string => {
  const normalizedRole = (role || "").trim().toLocaleLowerCase("uk-UA");

  if (!normalizedRole) {
    return DEFAULT_PARTICIPANT_GROUP_ID;
  }

  const matchingGroup = PARTICIPANT_ROLE_GROUPS.find((group) =>
    group.roles.some(
      (option) => option.toLocaleLowerCase("uk-UA") === normalizedRole,
    ),
  );

  return matchingGroup?.id || DEFAULT_PARTICIPANT_GROUP_ID;
};

export const normalizeParticipants = (
  participants: CaseParticipant[] = [],
): CaseParticipant[] =>
  participants
    .map((participant) => ({
      ...participant,
      id: participant.id || crypto.randomUUID(),
      name: (participant.name || "").trim(),
      role: (participant.role || "").trim(),
      groupId: participant.groupId || inferParticipantGroup(participant.role),
      isCustomRole: participant.isCustomRole || false,
    }))
    .filter((participant) => participant.name || participant.role)
    .map((participant) => ({
      ...participant,
      isCustomRole:
        participant.isCustomRole ||
        !PARTICIPANT_ROLE_GROUPS.some((group) =>
          group.roles.includes(participant.role),
        ),
    }));

export const buildLegacyParticipantFields = (
  participants: CaseParticipant[] = [],
): {
  plaintiffName: string;
  defendantName: string;
  thirdParties: string;
} => {
  const normalizedParticipants = normalizeParticipants(participants);
  const plaintiffs: string[] = [];
  const defendants: string[] = [];
  const others: string[] = [];

  normalizedParticipants.forEach((participant) => {
    const label = participant.role
      ? `${participant.role}: ${participant.name}`
      : participant.name;

    if (PLAINTIFF_ROLE_MATCHER.test(participant.role)) {
      plaintiffs.push(participant.name || label);
      return;
    }

    if (DEFENDANT_ROLE_MATCHER.test(participant.role)) {
      defendants.push(participant.name || label);
      return;
    }

    others.push(label);
  });

  return {
    plaintiffName: plaintiffs.join("; "),
    defendantName: defendants.join("; "),
    thirdParties: others.join("\n"),
  };
};

const parseLegacyParticipants = (caseItem: Case): CaseParticipant[] => {
  const participants: CaseParticipant[] = [];

  const append = (raw: string | undefined, role: string) => {
    if (!raw) {
      return;
    }

    raw
      .split(/[;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((name) => {
        participants.push({
          id: crypto.randomUUID(),
          name,
          role,
          groupId: inferParticipantGroup(role),
          isCustomRole: false,
        });
      });
  };

  append(caseItem.plaintiffName, "Позивач");
  append(caseItem.defendantName, "Відповідач");

  if (caseItem.thirdParties) {
    caseItem.thirdParties
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        const separatorIndex = item.indexOf(":");
        const role =
          separatorIndex >= 0 ? item.slice(0, separatorIndex) : "Інше";
        const name =
          separatorIndex >= 0 ? item.slice(separatorIndex + 1).trim() : item;

        participants.push({
          id: crypto.randomUUID(),
          name,
          role: role.trim(),
          groupId: inferParticipantGroup(role),
          isCustomRole: separatorIndex < 0,
        });
      });
  }

  return participants;
};

export const extractParticipantsFromCase = (
  caseItem: Case,
): CaseParticipant[] => {
  const metadataParticipants = Array.isArray(
    caseItem.metadata?.caseParticipants,
  )
    ? caseItem.metadata.caseParticipants
    : [];

  if (metadataParticipants.length > 0) {
    return normalizeParticipants(metadataParticipants as CaseParticipant[]);
  }

  return parseLegacyParticipants(caseItem);
};

export const buildParticipantMetadata = (
  metadata: Record<string, any> | undefined,
  participants: CaseParticipant[],
) => ({
  ...(metadata || {}),
  caseParticipants: normalizeParticipants(participants),
});
