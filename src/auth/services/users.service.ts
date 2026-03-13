import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, MoreThan, Repository } from "typeorm";
import { User } from "../../database/entities/User.entity";
import { Organization } from "../../database/entities/Organization.entity";
import { Invitation } from "../../database/entities/Invitation.entity";
import {
  AuditAction,
  InvitationStatus,
  SubscriptionPlan,
  UserRole,
  UserStatus,
} from "../../database/entities/enums/subscription.enum";
import {
  ChangePasswordDto,
  DirectorDto,
  ProfileResponseDto,
  UpdateProfileDto,
  AddressDto,
  LegalEntityDto,
} from "../../users/dto/profile.dto";
import {
  CreateInvitationDto,
  InvitationResponseDto,
  TeamMemberResponseDto,
  UpdateMemberDto,
} from "../../users/dto/user-management.dto";
import {
  generateToken,
  generateSalt,
  hashPassword,
  verifyPassword,
} from "../../common/utils/crypto.util";
import { computeEmailBlindIndex } from "../../common/security/pii-protection";
import { getSubscriptionLimits } from "../../common/security/subscription-limits";
import { AuditService } from "./audit.service";

type UserProfileMetadata = {
  organizationType?: string;
  taxId?: string;
  phoneSecondary?: string[];
  emailPrimary?: string;
  emailSecondary?: string[];
  legalStatus?: string;
  bankName?: string;
  bankMfo?: string;
  iban?: string;
  taxSystem?: string;
  vatPayer?: boolean;
  legalAddress?: AddressDto;
  actualSameAsLegal?: boolean;
  actualAddress?: AddressDto;
  additionalAddresses?: AddressDto[];
  director?: DirectorDto;
  legalEntity?: LegalEntityDto;
  certificateNumber?: string;
  certificateDate?: string;
  issuedBy?: string;
  registryNumber?: string;
  registryDate?: string;
  contractNumber?: string;
  contractWith?: string;
  avatarUrl?: string;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly auditService: AuditService,
  ) {}

  async getProfile(
    tenantId: string,
    userId: string,
  ): Promise<ProfileResponseDto> {
    const user = await this.getTenantUserOrThrow(tenantId, userId);
    return this.mapProfile(user);
  }

  async updateProfile(
    tenantId: string,
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.getTenantUserOrThrow(tenantId, userId);
    this.assertUniqueContacts(dto, user.email);

    user.firstName = dto.firstName;
    user.lastName = dto.lastName;
    user.patronymic = dto.middleName ?? dto.patronymic ?? user.patronymic;
    user.phone = dto.phonePrimary ?? user.phone;
    user.position = dto.position ?? user.position;
    user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
    user.metadata = {
      ...(user.metadata || {}),
      ...this.extractProfileMetadata(dto),
    };

    await this.userRepository.save(user);

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.UPDATE,
      entityType: "UserProfile",
      entityId: user.id,
      changedFields: [
        "organizationType",
        "firstName",
        "lastName",
        "patronymic",
        "phonePrimary",
        "phoneSecondary",
        "emailPrimary",
        "emailSecondary",
        "legalStatus",
        "position",
        "bankName",
        "bankMfo",
        "iban",
        "taxSystem",
        "vatPayer",
        "legalAddress",
        "actualSameAsLegal",
        "actualAddress",
        "additionalAddresses",
        "director",
        "legalEntity",
        "certificateNumber",
        "certificateDate",
        "issuedBy",
        "registryNumber",
        "registryDate",
        "contractNumber",
        "contractWith",
        "avatarUrl",
        "metadata",
      ],
      newValues: {
        firstName: user.firstName,
        lastName: user.lastName,
        patronymic: user.patronymic,
        phonePrimary: user.phone,
        position: user.position,
        avatarUrl: user.avatarUrl,
        metadata: user.metadata,
      },
    });

    return this.mapProfile(user);
  }

  async changePassword(
    tenantId: string,
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.getTenantUserOrThrow(tenantId, userId);
    const validPassword = await verifyPassword(
      dto.currentPassword,
      user.salt,
      user.passwordHash,
    );

    if (!validPassword) {
      throw new BadRequestException("Поточний пароль невірний");
    }

    const newSalt = await generateSalt();
    user.salt = newSalt;
    user.passwordHash = await hashPassword(dto.newPassword, newSalt);
    user.lastPasswordChangeAt = new Date();
    user.sessionInvalidBefore = new Date();

    await this.userRepository.save(user);

    await this.auditService.log({
      tenantId,
      userId,
      action: AuditAction.UPDATE,
      entityType: "UserPassword",
      entityId: user.id,
      changedFields: ["passwordHash", "lastPasswordChangeAt"],
    });
  }

  async listMembers(tenantId: string): Promise<TeamMemberResponseDto[]> {
    const users = await this.userRepository.find({
      where: {
        tenantId,
        deletedAt: IsNull(),
      },
      order: {
        createdAt: "ASC",
      },
    });

    return users.map((user) => this.mapTeamMember(user));
  }

  async updateMember(
    tenantId: string,
    actorUserId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ): Promise<TeamMemberResponseDto> {
    const member = await this.getTenantUserOrThrow(tenantId, memberId);

    if (member.role === UserRole.ORGANIZATION_OWNER) {
      throw new BadRequestException("Неможливо змінити власника організації");
    }

    if (actorUserId === memberId && dto.status === UserStatus.SUSPENDED) {
      throw new BadRequestException("Неможливо призупинити власний акаунт");
    }

    if (dto.role) {
      member.role = dto.role;
    }

    if (dto.status) {
      member.status = dto.status;
    }

    await this.userRepository.save(member);

    await this.auditService.log({
      tenantId,
      userId: actorUserId,
      action: AuditAction.PERMISSION_CHANGE,
      entityType: "UserMembership",
      entityId: member.id,
      changedFields: Object.keys(dto),
      newValues: dto,
    });

    return this.mapTeamMember(member);
  }

  async listInvitations(tenantId: string): Promise<InvitationResponseDto[]> {
    await this.expireStaleInvitations(tenantId);

    const invitations = await this.invitationRepository.find({
      where: {
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["inviter"],
      order: {
        createdAt: "DESC",
      },
    });

    return invitations.map((invitation) => this.mapInvitation(invitation));
  }

  async createInvitation(
    tenantId: string,
    actorUserId: string,
    dto: CreateInvitationDto,
  ): Promise<InvitationResponseDto> {
    await this.ensureInviteCapacity(tenantId);

    const normalizedEmail = dto.email.trim().toLowerCase();
    const emailBlindIndex = computeEmailBlindIndex(
      normalizedEmail,
      "user_email",
    );

    const existingMember = await this.userRepository.findOne({
      where: {
        tenantId,
        emailBlindIndex: emailBlindIndex ?? undefined,
        deletedAt: IsNull(),
      },
    });

    if (existingMember) {
      throw new BadRequestException("Користувач з таким email вже існує");
    }

    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        tenantId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
        deletedAt: IsNull(),
      },
      relations: ["inviter"],
      order: {
        createdAt: "DESC",
      },
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      throw new BadRequestException("Запрошення для цього email вже активне");
    }

    const invitationSeed: Partial<Invitation> = {
      tenantId,
      invitedBy: actorUserId,
      email: normalizedEmail,
      role: dto.role,
      token: generateToken(24),
      status: InvitationStatus.PENDING,
      message: dto.message?.trim() || undefined,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      metadata: {
        deliveryStatus: "pending_manual_dispatch",
      },
    };

    const invitation = this.invitationRepository.create(invitationSeed);

    const saved = await this.invitationRepository.save(invitation);
    const populated = await this.invitationRepository.findOne({
      where: { id: saved.id },
      relations: ["inviter"],
    });

    await this.auditService.log({
      tenantId,
      userId: actorUserId,
      action: AuditAction.CREATE,
      entityType: "Invitation",
      entityId: saved.id,
      newValues: {
        email: saved.email,
        role: saved.role,
        expiresAt: saved.expiresAt,
      },
    });

    return this.mapInvitation(populated ?? saved);
  }

  async revokeInvitation(
    tenantId: string,
    actorUserId: string,
    invitationId: string,
  ): Promise<InvitationResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["inviter"],
    });

    if (!invitation) {
      throw new NotFoundException("Запрошення не знайдено");
    }

    invitation.status = InvitationStatus.REVOKED;
    invitation.revokedAt = new Date();
    await this.invitationRepository.save(invitation);

    await this.auditService.log({
      tenantId,
      userId: actorUserId,
      action: AuditAction.REVOKE,
      entityType: "Invitation",
      entityId: invitation.id,
      changedFields: ["status", "revokedAt"],
    });

    return this.mapInvitation(invitation);
  }

  private async ensureInviteCapacity(tenantId: string): Promise<void> {
    const organization = await this.organizationRepository.findOne({
      where: {
        id: tenantId,
        deletedAt: IsNull(),
      },
    });

    if (!organization) {
      throw new NotFoundException("Організацію не знайдено");
    }

    const limits = getSubscriptionLimits(organization.subscriptionPlan);
    if (limits.maxUsers === null) {
      return;
    }

    const [membersCount, invitationsCount] = await Promise.all([
      this.userRepository.count({
        where: {
          tenantId,
          deletedAt: IsNull(),
        },
      }),
      this.invitationRepository.count({
        where: {
          tenantId,
          status: InvitationStatus.PENDING,
          deletedAt: IsNull(),
          expiresAt: MoreThan(new Date()),
        },
      }),
    ]);

    if (membersCount + invitationsCount >= limits.maxUsers) {
      throw new BadRequestException(
        `Ліміт користувачів для тарифу ${organization.subscriptionPlan} вичерпано`,
      );
    }
  }

  private async expireStaleInvitations(tenantId: string): Promise<void> {
    const staleInvitations = await this.invitationRepository.find({
      where: {
        tenantId,
        status: InvitationStatus.PENDING,
        deletedAt: IsNull(),
      },
    });

    const now = new Date();
    const expired = staleInvitations.filter((item) => item.expiresAt <= now);
    if (expired.length === 0) {
      return;
    }

    await this.invitationRepository.save(
      expired.map((item) => ({
        ...item,
        status: InvitationStatus.EXPIRED,
      })),
    );
  }

  private async getTenantUserOrThrow(
    tenantId: string,
    userId: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        tenantId,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException("Користувача не знайдено");
    }

    return user;
  }

  private extractProfileMetadata(dto: UpdateProfileDto): UserProfileMetadata {
    const normalizeAddress = (address?: AddressDto): AddressDto | undefined => {
      if (!address) {
        return undefined;
      }

      return {
        ...address,
        unit: address.unit ?? address.apartment,
        apartment: undefined,
      };
    };

    return {
      organizationType: dto.organizationType,
      taxId: dto.taxId,
      phoneSecondary: this.uniqueValues(dto.phoneSecondary, "phone"),
      emailPrimary: dto.emailPrimary?.trim().toLowerCase(),
      emailSecondary: this.uniqueValues(dto.emailSecondary, "email"),
      legalStatus: dto.legalStatus,
      bankName: dto.bankName,
      bankMfo: dto.bankMfo,
      iban: dto.iban,
      taxSystem: dto.taxSystem,
      vatPayer: dto.vatPayer,
      legalAddress: normalizeAddress(dto.legalAddress),
      actualSameAsLegal: dto.actualSameAsLegal,
      actualAddress: dto.actualSameAsLegal
        ? normalizeAddress(dto.legalAddress)
        : normalizeAddress(dto.actualAddress),
      additionalAddresses: (dto.additionalAddresses || [])
        .map((item) => normalizeAddress(item))
        .filter((item): item is AddressDto => Boolean(item)),
      director: dto.director,
      legalEntity: dto.legalEntity,
      certificateNumber: dto.certificateNumber,
      certificateDate: dto.certificateDate,
      issuedBy: dto.issuedBy,
      registryNumber: dto.registryNumber,
      registryDate: dto.registryDate,
      contractNumber: dto.contractNumber,
      contractWith: dto.contractWith,
      avatarUrl: dto.avatarUrl,
    };
  }

  private mapProfile(user: User): ProfileResponseDto {
    const metadata = (user.metadata || {}) as UserProfileMetadata;
    const resolveAddress = (
      address?: AddressDto | (AddressDto & { apartment?: string }),
    ): AddressDto | undefined =>
      address
        ? {
            ...address,
            unit: address.unit ?? address.apartment,
            apartment: undefined,
          }
        : undefined;

    return {
      id: user.id,
      email: user.email,
      organizationType:
        metadata.organizationType as ProfileResponseDto["organizationType"],
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic,
      middleName: user.patronymic,
      taxId: metadata.taxId,
      phone: user.phone,
      phonePrimary: user.phone,
      phoneSecondary: metadata.phoneSecondary || [],
      emailPrimary: metadata.emailPrimary,
      emailSecondary: metadata.emailSecondary || [],
      legalStatus: metadata.legalStatus as ProfileResponseDto["legalStatus"],
      position: user.position,
      bankName: metadata.bankName,
      bankMfo: metadata.bankMfo,
      iban: metadata.iban,
      taxSystem: metadata.taxSystem as ProfileResponseDto["taxSystem"],
      vatPayer: metadata.vatPayer,
      legalAddress: resolveAddress(metadata.legalAddress),
      actualSameAsLegal: metadata.actualSameAsLegal,
      actualAddress: resolveAddress(metadata.actualAddress),
      additionalAddresses: (metadata.additionalAddresses || [])
        .map((item) => resolveAddress(item))
        .filter((item): item is AddressDto => Boolean(item)),
      director: metadata.director,
      legalEntity: metadata.legalEntity,
      certificateNumber: metadata.certificateNumber,
      certificateDate: metadata.certificateDate,
      issuedBy: metadata.issuedBy,
      registryNumber: metadata.registryNumber,
      registryDate: metadata.registryDate,
      contractNumber: metadata.contractNumber,
      contractWith: metadata.contractWith,
      avatarUrl: user.avatarUrl,
      role: user.role,
      tenantId: user.tenantId,
      emailVerified: user.emailVerified,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private assertUniqueContacts(
    dto: UpdateProfileDto,
    loginEmail: string,
  ): void {
    const secondaryEmails = this.uniqueValues(dto.emailSecondary, "email");
    const emailPrimary = dto.emailPrimary?.trim().toLowerCase();
    const normalizedLogin = loginEmail.trim().toLowerCase();

    if (
      emailPrimary &&
      (emailPrimary === normalizedLogin ||
        secondaryEmails.includes(emailPrimary))
    ) {
      throw new BadRequestException(
        "Додаткові email не повинні дублювати логін або основний email",
      );
    }

    if (secondaryEmails.includes(normalizedLogin)) {
      throw new BadRequestException(
        "Додаткові email не повинні дублювати логін",
      );
    }

    const secondaryPhones = this.uniqueValues(dto.phoneSecondary, "phone");
    if (dto.phonePrimary && secondaryPhones.includes(dto.phonePrimary)) {
      throw new BadRequestException(
        "Додаткові телефони не повинні дублювати основний номер",
      );
    }
  }

  private uniqueValues(
    values: string[] | undefined,
    type: "email" | "phone",
  ): string[] {
    const normalizer =
      type === "email"
        ? (value: string) => value.trim().toLowerCase()
        : (value: string) => value.trim();

    return Array.from(
      new Set(
        (values || []).map(normalizer).filter((value) => value.length > 0),
      ),
    );
  }

  private mapTeamMember(user: User): TeamMemberResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic,
      email: user.email,
      phone: user.phone,
      position: user.position,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private mapInvitation(invitation: Invitation): InvitationResponseDto {
    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      message: invitation.message,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      invitedBy: invitation.inviter
        ? {
            id: invitation.inviter.id,
            firstName: invitation.inviter.firstName,
            lastName: invitation.inviter.lastName,
          }
        : null,
    };
  }
}
