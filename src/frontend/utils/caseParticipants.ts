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

const JUDICIAL_AND_ENFORCEMENT_ROLES = [
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
] as const;

const JUDICIAL_AND_ENFORCEMENT_REPRESENTATIVE_ROLES = [
  "Представник позивача",
  "Представник відповідача",
  "Представник третьої особи із самостійними вимогами",
  "Представник третьої особи без самостійних вимог",
  "Представник заявника",
  "Представник заінтересованої особи",
  "Представник скаржника",
  "Представник стягувача",
  "Представник боржника",
  "Представник правонаступника стягувача",
  "Представник правонаступника боржника",
  "Представник скаржника на дії/бездіяльність виконавця",
] as const;

const CRIMINAL_AND_ADMIN_ROLES = [
  "Заявник про кримінальне правопорушення",
  "Викривач",
  "Підозрюваний",
  "Обвинувачений",
  "Потерпілий",
  "Цивільний позивач",
  "Цивільний відповідач",
  "Засуджений",
  "Виправданий",
  "Особа, яка притягається до адміністративної відповідальності",
  "Потерпілий у справі про адміністративне правопорушення",
  "Скаржник",
  "Захисник",
] as const;

const CRIMINAL_AND_ADMIN_REPRESENTATIVE_ROLES = [
  "Представник потерпілого",
  "Законний представник потерпілого",
  "Представник цивільного позивача",
  "Представник цивільного відповідача",
  "Законний представник підозрюваного",
  "Законний представник обвинуваченого",
  "Представник юридичної особи, щодо якої здійснюється провадження",
  "Представник особи, яка притягається до адміністративної відповідальності",
  "Представник потерпілого у справі про адміністративне правопорушення",
] as const;

const REGISTRATION_AND_PROPERTY_ROLES = [
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
] as const;

const REGISTRATION_AND_PROPERTY_REPRESENTATIVE_ROLES = [
  "Представник заявника",
  "Представник скаржника",
  "Представник засновника",
  "Представник учасника",
  "Представник керівника",
  "Представник підписанта",
  "Представник кінцевого бенефіціарного власника",
  "Представник власника",
  "Представник співвласника",
  "Представник правонабувача",
  "Представник іпотекодержателя",
  "Представник обтяжувача",
  "Представник орендаря",
  "Представник користувача",
  "Представник землекористувача",
] as const;

const MEDIATION_ROLES = [
  "Сторона медіації",
  "Ініціатор медіації",
  "Учасник медіації",
  "Медіатор",
] as const;

const MEDIATION_REPRESENTATIVE_ROLES = [
  "Представник сторони медіації",
  "Представник ініціатора медіації",
  "Представник учасника медіації",
] as const;

export const PARTICIPANT_ROLE_GROUPS: ParticipantRoleGroup[] = [
  {
    id: "judicial_and_enforcement",
    label: "Судові справи та виконавче провадження",
    roles: [...JUDICIAL_AND_ENFORCEMENT_ROLES],
  },
  {
    id: "judicial_and_enforcement_representatives",
    label: "Представники у судових справах та виконавчому провадженні",
    roles: [...JUDICIAL_AND_ENFORCEMENT_REPRESENTATIVE_ROLES],
  },
  {
    id: "criminal_and_admin",
    label:
      "Кримінальні провадження та справи про адміністративні правопорушення",
    roles: [...CRIMINAL_AND_ADMIN_ROLES],
  },
  {
    id: "criminal_and_admin_representatives",
    label:
      "Захист і представництво у кримінальних та адміністративних справах",
    roles: [...CRIMINAL_AND_ADMIN_REPRESENTATIVE_ROLES],
  },
  {
    id: "registration_and_property",
    label: "Реєстраційні, корпоративні справи та про нерухомість",
    roles: [...REGISTRATION_AND_PROPERTY_ROLES],
  },
  {
    id: "registration_and_property_representatives",
    label: "Представники у реєстраційних, корпоративних і майнових справах",
    roles: [...REGISTRATION_AND_PROPERTY_REPRESENTATIVE_ROLES],
  },
  {
    id: "mediation",
    label: "Медіація",
    roles: [...MEDIATION_ROLES],
  },
  {
    id: "mediation_representatives",
    label: "Представники у медіації",
    roles: [...MEDIATION_REPRESENTATIVE_ROLES],
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
