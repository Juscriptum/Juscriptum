export type OrganizationType = "SELF_EMPLOYED" | "FOP" | "LEGAL_ENTITY";
export type LegalStatus = "LAWYER" | "ADVOCATE" | "ADVOCATE_BPD";
export type TaxSystem = "non_profit" | "general" | "simplified" | "other";

export interface AddressFormData {
  region: string;
  city: string;
  cityCode: string;
  street: string;
  building: string;
  unit: string;
}

export interface DirectorFormData {
  sameAsUser: boolean;
  firstName: string;
  lastName: string;
  middleName: string;
  actingBasis: string;
  position: string;
}

export interface LegalEntityFormData {
  legalForm: string;
  legalEntityName: string;
  edrpou: string;
  taxSystem: TaxSystem;
}

export interface UserProfile {
  id: string;
  email: string;
  organizationType?: OrganizationType;
  firstName: string;
  lastName: string;
  patronymic?: string;
  middleName?: string;
  taxId?: string;
  phone?: string;
  phonePrimary?: string;
  phoneSecondary?: string[];
  emailPrimary?: string;
  emailSecondary?: string[];
  legalStatus?: LegalStatus;
  position?: string;
  bankName?: string;
  bankMfo?: string;
  iban?: string;
  taxSystem?: TaxSystem;
  vatPayer?: boolean;
  legalAddress?: Partial<AddressFormData>;
  actualSameAsLegal?: boolean;
  actualAddress?: Partial<AddressFormData>;
  additionalAddresses?: Partial<AddressFormData>[];
  director?: Partial<DirectorFormData>;
  legalEntity?: Partial<LegalEntityFormData>;
  certificateNumber?: string;
  certificateDate?: string;
  issuedBy?: string;
  registryNumber?: string;
  registryDate?: string;
  contractNumber?: string;
  contractWith?: string;
  role: UserRole;
  tenantId: string;
  emailVerified: boolean;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole =
  | "super_admin"
  | "organization_owner"
  | "organization_admin"
  | "lawyer"
  | "assistant"
  | "accountant";

export type UserStatus = "pending" | "active" | "suspended" | "deleted";

export interface ProfileFormData {
  organizationType: OrganizationType;
  emailLogin: string;
  password?: string;
  passwordConfirm?: string;
  lastName: string;
  firstName: string;
  middleName: string;
  position: string;
  taxId: string;
  phonePrimary: string;
  phoneSecondary: string[];
  emailPrimary: string;
  emailSecondary: string[];
  legalEntity: LegalEntityFormData;
  director: DirectorFormData;
  legalStatus: LegalStatus;
  bankName: string;
  bankMfo: string;
  iban: string;
  taxSystem: TaxSystem;
  vatPayer: boolean;
  legalAddress: AddressFormData;
  actualSameAsLegal: boolean;
  actualAddress: AddressFormData;
  additionalAddresses: AddressFormData[];
  certificateNumber: string;
  certificateDate: string;
  issuedBy: string;
  registryNumber: string;
  registryDate: string;
  contractNumber: string;
  contractWith: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const UA_REGIONS = [
  "Вінницька",
  "Волинська",
  "Дніпропетровська",
  "Донецька",
  "Житомирська",
  "Закарпатська",
  "Запорізька",
  "Івано-Франківська",
  "Київська",
  "Кіровоградська",
  "Луганська",
  "Львівська",
  "Миколаївська",
  "Одеська",
  "Полтавська",
  "Рівненська",
  "Сумська",
  "Тернопільська",
  "Харківська",
  "Херсонська",
  "Хмельницька",
  "Черкаська",
  "Чернівецька",
  "Чернігівська",
  "м. Київ",
];

export const ORGANIZATION_TYPE_OPTIONS = [
  { value: "SELF_EMPLOYED", label: "Самозайнята особа" },
  { value: "FOP", label: "ФОП" },
  { value: "LEGAL_ENTITY", label: "Юридична особа" },
] as const;

export const LEGAL_STATUS_OPTIONS = [
  { value: "LAWYER", label: "Юрист" },
  { value: "ADVOCATE", label: "Адвокат" },
  { value: "ADVOCATE_BPD", label: "Адвокат + БПД" },
] as const;

export const TAX_SYSTEM_OPTIONS = [
  { value: "non_profit", label: "Неприбуткова організація" },
  { value: "general", label: "Загальна система" },
  { value: "simplified", label: "Спрощена система" },
  { value: "other", label: "Інша" },
] as const;

export const LEGAL_FORM_OPTIONS = [
  "ТОВ",
  "ПП",
  "АТ",
  "ГО",
  "БФ",
  "ОСББ",
  "ДП",
  "Фонд",
  "Інша",
] as const;

export const BANK_OPTIONS = [
  "ПриватБанк",
  "Ощадбанк",
  "Укрсиббанк",
  "ПУМБ",
  "Монобанк",
  "Укргазбанк",
  "Райффайзен Банк",
  "Сенс Банк",
];

export const EMPTY_ADDRESS: AddressFormData = {
  region: "",
  city: "",
  cityCode: "",
  street: "",
  building: "",
  unit: "",
};

export const EMPTY_DIRECTOR: DirectorFormData = {
  sameAsUser: true,
  firstName: "",
  lastName: "",
  middleName: "",
  actingBasis: "",
  position: "",
};

export const EMPTY_LEGAL_ENTITY: LegalEntityFormData = {
  legalForm: "",
  legalEntityName: "",
  edrpou: "",
  taxSystem: "general",
};

export const DEFAULT_PROFILE_FORM: ProfileFormData = {
  organizationType: "SELF_EMPLOYED",
  emailLogin: "",
  password: "",
  passwordConfirm: "",
  lastName: "",
  firstName: "",
  middleName: "",
  position: "",
  taxId: "",
  phonePrimary: "",
  phoneSecondary: [""],
  emailPrimary: "",
  emailSecondary: [""],
  legalEntity: { ...EMPTY_LEGAL_ENTITY },
  director: { ...EMPTY_DIRECTOR },
  legalStatus: "LAWYER",
  bankName: "",
  bankMfo: "",
  iban: "",
  taxSystem: "general",
  vatPayer: false,
  legalAddress: { ...EMPTY_ADDRESS },
  actualSameAsLegal: true,
  actualAddress: { ...EMPTY_ADDRESS },
  additionalAddresses: [],
  certificateNumber: "",
  certificateDate: "",
  issuedBy: "",
  registryNumber: "",
  registryDate: "",
  contractNumber: "",
  contractWith: "",
};
