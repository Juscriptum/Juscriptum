"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsersService", {
    enumerable: true,
    get: function() {
        return UsersService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Userentity = require("../../database/entities/User.entity");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _Invitationentity = require("../../database/entities/Invitation.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _cryptoutil = require("../../common/utils/crypto.util");
const _piiprotection = require("../../common/security/pii-protection");
const _subscriptionlimits = require("../../common/security/subscription-limits");
const _auditservice = require("./audit.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let UsersService = class UsersService {
    async getProfile(tenantId, userId) {
        const user = await this.getTenantUserOrThrow(tenantId, userId);
        return this.mapProfile(user);
    }
    async updateProfile(tenantId, userId, dto) {
        const user = await this.getTenantUserOrThrow(tenantId, userId);
        this.assertUniqueContacts(dto, user.email);
        user.firstName = dto.firstName;
        user.lastName = dto.lastName;
        user.patronymic = dto.middleName ?? dto.patronymic ?? user.patronymic;
        user.phone = dto.phonePrimary ?? user.phone;
        user.position = dto.position ?? user.position;
        user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
        user.metadata = {
            ...user.metadata || {},
            ...this.extractProfileMetadata(dto)
        };
        await this.userRepository.save(user);
        await this.auditService.log({
            tenantId,
            userId,
            action: _subscriptionenum.AuditAction.UPDATE,
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
                "metadata"
            ],
            newValues: {
                firstName: user.firstName,
                lastName: user.lastName,
                patronymic: user.patronymic,
                phonePrimary: user.phone,
                position: user.position,
                avatarUrl: user.avatarUrl,
                metadata: user.metadata
            }
        });
        return this.mapProfile(user);
    }
    async changePassword(tenantId, userId, dto) {
        const user = await this.getTenantUserOrThrow(tenantId, userId);
        const validPassword = await (0, _cryptoutil.verifyPassword)(dto.currentPassword, user.salt, user.passwordHash);
        if (!validPassword) {
            throw new _common.BadRequestException("Поточний пароль невірний");
        }
        const newSalt = await (0, _cryptoutil.generateSalt)();
        user.salt = newSalt;
        user.passwordHash = await (0, _cryptoutil.hashPassword)(dto.newPassword, newSalt);
        user.lastPasswordChangeAt = new Date();
        user.sessionInvalidBefore = new Date();
        await this.userRepository.save(user);
        await this.auditService.log({
            tenantId,
            userId,
            action: _subscriptionenum.AuditAction.UPDATE,
            entityType: "UserPassword",
            entityId: user.id,
            changedFields: [
                "passwordHash",
                "lastPasswordChangeAt"
            ]
        });
    }
    async listMembers(tenantId) {
        const users = await this.userRepository.find({
            where: {
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            order: {
                createdAt: "ASC"
            }
        });
        return users.map((user)=>this.mapTeamMember(user));
    }
    async updateMember(tenantId, actorUserId, memberId, dto) {
        const member = await this.getTenantUserOrThrow(tenantId, memberId);
        if (member.role === _subscriptionenum.UserRole.ORGANIZATION_OWNER) {
            throw new _common.BadRequestException("Неможливо змінити власника організації");
        }
        if (actorUserId === memberId && dto.status === _subscriptionenum.UserStatus.SUSPENDED) {
            throw new _common.BadRequestException("Неможливо призупинити власний акаунт");
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
            action: _subscriptionenum.AuditAction.PERMISSION_CHANGE,
            entityType: "UserMembership",
            entityId: member.id,
            changedFields: Object.keys(dto),
            newValues: dto
        });
        return this.mapTeamMember(member);
    }
    async listInvitations(tenantId) {
        await this.expireStaleInvitations(tenantId);
        const invitations = await this.invitationRepository.find({
            where: {
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "inviter"
            ],
            order: {
                createdAt: "DESC"
            }
        });
        return invitations.map((invitation)=>this.mapInvitation(invitation));
    }
    async createInvitation(tenantId, actorUserId, dto) {
        await this.ensureInviteCapacity(tenantId);
        const normalizedEmail = dto.email.trim().toLowerCase();
        const emailBlindIndex = (0, _piiprotection.computeEmailBlindIndex)(normalizedEmail, "user_email");
        const existingMember = await this.userRepository.findOne({
            where: {
                tenantId,
                emailBlindIndex: emailBlindIndex ?? undefined,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (existingMember) {
            throw new _common.BadRequestException("Користувач з таким email вже існує");
        }
        const existingInvitation = await this.invitationRepository.findOne({
            where: {
                tenantId,
                email: normalizedEmail,
                status: _subscriptionenum.InvitationStatus.PENDING,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "inviter"
            ],
            order: {
                createdAt: "DESC"
            }
        });
        if (existingInvitation && existingInvitation.expiresAt > new Date()) {
            throw new _common.BadRequestException("Запрошення для цього email вже активне");
        }
        const invitationSeed = {
            tenantId,
            invitedBy: actorUserId,
            email: normalizedEmail,
            role: dto.role,
            token: (0, _cryptoutil.generateToken)(24),
            status: _subscriptionenum.InvitationStatus.PENDING,
            message: dto.message?.trim() || undefined,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            metadata: {
                deliveryStatus: "pending_manual_dispatch"
            }
        };
        const invitation = this.invitationRepository.create(invitationSeed);
        const saved = await this.invitationRepository.save(invitation);
        const populated = await this.invitationRepository.findOne({
            where: {
                id: saved.id
            },
            relations: [
                "inviter"
            ]
        });
        await this.auditService.log({
            tenantId,
            userId: actorUserId,
            action: _subscriptionenum.AuditAction.CREATE,
            entityType: "Invitation",
            entityId: saved.id,
            newValues: {
                email: saved.email,
                role: saved.role,
                expiresAt: saved.expiresAt
            }
        });
        return this.mapInvitation(populated ?? saved);
    }
    async revokeInvitation(tenantId, actorUserId, invitationId) {
        const invitation = await this.invitationRepository.findOne({
            where: {
                id: invitationId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "inviter"
            ]
        });
        if (!invitation) {
            throw new _common.NotFoundException("Запрошення не знайдено");
        }
        invitation.status = _subscriptionenum.InvitationStatus.REVOKED;
        invitation.revokedAt = new Date();
        await this.invitationRepository.save(invitation);
        await this.auditService.log({
            tenantId,
            userId: actorUserId,
            action: _subscriptionenum.AuditAction.REVOKE,
            entityType: "Invitation",
            entityId: invitation.id,
            changedFields: [
                "status",
                "revokedAt"
            ]
        });
        return this.mapInvitation(invitation);
    }
    async ensureInviteCapacity(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!organization) {
            throw new _common.NotFoundException("Організацію не знайдено");
        }
        const limits = (0, _subscriptionlimits.getSubscriptionLimits)(organization.subscriptionPlan);
        if (limits.maxUsers === null) {
            return;
        }
        const [membersCount, invitationsCount] = await Promise.all([
            this.userRepository.count({
                where: {
                    tenantId,
                    deletedAt: (0, _typeorm1.IsNull)()
                }
            }),
            this.invitationRepository.count({
                where: {
                    tenantId,
                    status: _subscriptionenum.InvitationStatus.PENDING,
                    deletedAt: (0, _typeorm1.IsNull)(),
                    expiresAt: (0, _typeorm1.MoreThan)(new Date())
                }
            })
        ]);
        if (membersCount + invitationsCount >= limits.maxUsers) {
            throw new _common.BadRequestException(`Ліміт користувачів для тарифу ${organization.subscriptionPlan} вичерпано`);
        }
    }
    async expireStaleInvitations(tenantId) {
        const staleInvitations = await this.invitationRepository.find({
            where: {
                tenantId,
                status: _subscriptionenum.InvitationStatus.PENDING,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        const now = new Date();
        const expired = staleInvitations.filter((item)=>item.expiresAt <= now);
        if (expired.length === 0) {
            return;
        }
        await this.invitationRepository.save(expired.map((item)=>({
                ...item,
                status: _subscriptionenum.InvitationStatus.EXPIRED
            })));
    }
    async getTenantUserOrThrow(tenantId, userId) {
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!user) {
            throw new _common.NotFoundException("Користувача не знайдено");
        }
        return user;
    }
    extractProfileMetadata(dto) {
        const normalizeAddress = (address)=>{
            if (!address) {
                return undefined;
            }
            return {
                ...address,
                unit: address.unit ?? address.apartment,
                apartment: undefined
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
            actualAddress: dto.actualSameAsLegal ? normalizeAddress(dto.legalAddress) : normalizeAddress(dto.actualAddress),
            additionalAddresses: (dto.additionalAddresses || []).map((item)=>normalizeAddress(item)).filter((item)=>Boolean(item)),
            director: dto.director,
            legalEntity: dto.legalEntity,
            certificateNumber: dto.certificateNumber,
            certificateDate: dto.certificateDate,
            issuedBy: dto.issuedBy,
            registryNumber: dto.registryNumber,
            registryDate: dto.registryDate,
            contractNumber: dto.contractNumber,
            contractWith: dto.contractWith,
            avatarUrl: dto.avatarUrl
        };
    }
    mapProfile(user) {
        const metadata = user.metadata || {};
        const resolveAddress = (address)=>address ? {
                ...address,
                unit: address.unit ?? address.apartment,
                apartment: undefined
            } : undefined;
        return {
            id: user.id,
            email: user.email,
            organizationType: metadata.organizationType,
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
            legalStatus: metadata.legalStatus,
            position: user.position,
            bankName: metadata.bankName,
            bankMfo: metadata.bankMfo,
            iban: metadata.iban,
            taxSystem: metadata.taxSystem,
            vatPayer: metadata.vatPayer,
            legalAddress: resolveAddress(metadata.legalAddress),
            actualSameAsLegal: metadata.actualSameAsLegal,
            actualAddress: resolveAddress(metadata.actualAddress),
            additionalAddresses: (metadata.additionalAddresses || []).map((item)=>resolveAddress(item)).filter((item)=>Boolean(item)),
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
            updatedAt: user.updatedAt
        };
    }
    assertUniqueContacts(dto, loginEmail) {
        const secondaryEmails = this.uniqueValues(dto.emailSecondary, "email");
        const emailPrimary = dto.emailPrimary?.trim().toLowerCase();
        const normalizedLogin = loginEmail.trim().toLowerCase();
        if (emailPrimary && (emailPrimary === normalizedLogin || secondaryEmails.includes(emailPrimary))) {
            throw new _common.BadRequestException("Додаткові email не повинні дублювати логін або основний email");
        }
        if (secondaryEmails.includes(normalizedLogin)) {
            throw new _common.BadRequestException("Додаткові email не повинні дублювати логін");
        }
        const secondaryPhones = this.uniqueValues(dto.phoneSecondary, "phone");
        if (dto.phonePrimary && secondaryPhones.includes(dto.phonePrimary)) {
            throw new _common.BadRequestException("Додаткові телефони не повинні дублювати основний номер");
        }
    }
    uniqueValues(values, type) {
        const normalizer = type === "email" ? (value)=>value.trim().toLowerCase() : (value)=>value.trim();
        return Array.from(new Set((values || []).map(normalizer).filter((value)=>value.length > 0)));
    }
    mapTeamMember(user) {
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
            updatedAt: user.updatedAt
        };
    }
    mapInvitation(invitation) {
        return {
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            status: invitation.status,
            message: invitation.message,
            expiresAt: invitation.expiresAt,
            createdAt: invitation.createdAt,
            invitedBy: invitation.inviter ? {
                id: invitation.inviter.id,
                firstName: invitation.inviter.firstName,
                lastName: invitation.inviter.lastName
            } : null
        };
    }
    constructor(userRepository, organizationRepository, invitationRepository, auditService){
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.invitationRepository = invitationRepository;
        this.auditService = auditService;
    }
};
UsersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Userentity.User)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Organizationentity.Organization)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Invitationentity.Invitation)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _auditservice.AuditService === "undefined" ? Object : _auditservice.AuditService
    ])
], UsersService);

//# sourceMappingURL=users.service.js.map