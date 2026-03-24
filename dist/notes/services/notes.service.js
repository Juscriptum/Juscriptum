"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotesService", {
    enumerable: true,
    get: function() {
        return NotesService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _accesscontrol = require("../../common/security/access-control");
const _validationutil = require("../../common/utils/validation.util");
const _Caseentity = require("../../database/entities/Case.entity");
const _Cliententity = require("../../database/entities/Client.entity");
const _Noteentity = require("../../database/entities/Note.entity");
const _Userentity = require("../../database/entities/User.entity");
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
let NotesService = class NotesService {
    async findAll(tenantId, filters = {}, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const query = this.noteRepository.createQueryBuilder("note").where("note.tenantId = :tenantId AND note.deletedAt IS NULL", {
            tenantId
        });
        const scopeCondition = (0, _accesscontrol.buildScopedQueryCondition)("note", actor, [
            "note.assignedUserId"
        ]);
        if (scopeCondition) {
            query.andWhere(scopeCondition.clause, scopeCondition.parameters);
        }
        if (filters.clientId) {
            query.andWhere("note.clientId = :clientId", {
                clientId: filters.clientId
            });
        }
        if (filters.caseId) {
            query.andWhere("note.caseId = :caseId", {
                caseId: filters.caseId
            });
        }
        if (filters.userId) {
            query.andWhere("note.userId = :userId", {
                userId: filters.userId
            });
        }
        if (filters.pinned !== undefined) {
            query.andWhere("note.pinned = :pinned", {
                pinned: filters.pinned
            });
        }
        if (filters.search) {
            if ((0, _validationutil.detectSqlInjection)(filters.search)) {
                throw new _common.ForbiddenException("Invalid search query");
            }
            query.andWhere("(LOWER(note.title) LIKE LOWER(:search) OR LOWER(note.content) LIKE LOWER(:search))", {
                search: `%${filters.search}%`
            });
        }
        const sortFieldMap = {
            createdAt: "note.createdAt",
            updatedAt: "note.updatedAt",
            title: "note.title"
        };
        const sortBy = filters.sortBy || "updatedAt";
        const sortOrder = filters.sortOrder || "DESC";
        query.orderBy("note.pinned", "DESC").addOrderBy(sortFieldMap[sortBy], sortOrder);
        const page = filters.page || 1;
        const limit = filters.limit || 100;
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        query.leftJoinAndSelect("note.client", "client");
        query.leftJoinAndSelect("note.case", "case");
        query.leftJoinAndSelect("note.user", "user");
        query.leftJoinAndSelect("note.assignedUser", "assignedUser");
        const [data, total] = await query.getManyAndCount();
        return {
            data,
            total,
            page,
            limit
        };
    }
    async findById(tenantId, id, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const note = await this.noteRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "client",
                "case",
                "user",
                "assignedUser"
            ]
        });
        if (!note) {
            throw new _common.NotFoundException("Нотатку не знайдено");
        }
        if (actor) {
            (0, _accesscontrol.assertCanAccessRecord)(actor, note);
        }
        return note;
    }
    async create(tenantId, authorUserId, dto, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
            (0, _accesscontrol.assertCanAssignToUser)(actor, dto.assignedUserId || dto.userId);
        }
        const links = await this.resolveLinks(tenantId, {
            clientId: this.normalizeReference(dto.clientId),
            caseId: this.normalizeReference(dto.caseId),
            userId: this.normalizeReference(dto.userId)
        }, actor);
        const assignedUserId = this.normalizeReference(dto.assignedUserId) || links.caseEntity?.assignedLawyerId || links.client?.assignedUserId || links.user?.id || authorUserId;
        const note = this.noteRepository.create({
            tenantId,
            title: this.resolveTitle(dto.title, dto.content),
            content: dto.content?.trim() || "",
            pinned: Boolean(dto.pinned),
            tags: this.normalizeTags(dto.tags),
            accessScope: this.resolveAccessScope(dto.accessScope, links.caseEntity?.accessScope, links.client?.accessScope),
            assignedUserId,
            clientId: links.clientId,
            caseId: links.caseEntity?.id || null,
            userId: links.user?.id || null,
            metadata: dto.metadata || {},
            createdBy: authorUserId,
            updatedBy: authorUserId
        });
        return this.noteRepository.save(note);
    }
    async update(tenantId, id, userId, dto, actor) {
        const note = await this.findById(tenantId, id, actor);
        if (actor) {
            const requestedAssignee = this.hasOwn(dto, "assignedUserId") ? this.normalizeReference(dto.assignedUserId) : note.assignedUserId;
            const requestedUserId = this.hasOwn(dto, "userId") ? this.normalizeReference(dto.userId) : note.userId;
            (0, _accesscontrol.assertCanAssignToUser)(actor, requestedAssignee || requestedUserId);
        }
        const requestedCaseId = this.hasOwn(dto, "caseId") ? this.normalizeReference(dto.caseId) : note.caseId;
        const requestedClientId = this.hasOwn(dto, "clientId") ? this.normalizeReference(dto.clientId) : note.clientId;
        const requestedUserId = this.hasOwn(dto, "userId") ? this.normalizeReference(dto.userId) : note.userId;
        const links = await this.resolveLinks(tenantId, {
            clientId: requestedClientId,
            caseId: requestedCaseId,
            userId: requestedUserId
        }, actor);
        const resolvedAssignedUserId = (this.hasOwn(dto, "assignedUserId") ? this.normalizeReference(dto.assignedUserId) : note.assignedUserId) || links.caseEntity?.assignedLawyerId || links.client?.assignedUserId || links.user?.id || note.createdBy || userId;
        if (this.hasOwn(dto, "title") || this.hasOwn(dto, "content")) {
            const nextContent = this.hasOwn(dto, "content") ? dto.content?.trim() || "" : note.content;
            const nextTitle = this.hasOwn(dto, "title") ? this.resolveTitle(dto.title, nextContent) : this.resolveTitle(note.title, nextContent);
            note.title = nextTitle;
            note.content = nextContent;
        }
        if (this.hasOwn(dto, "pinned")) {
            note.pinned = Boolean(dto.pinned);
        }
        if (this.hasOwn(dto, "tags")) {
            note.tags = this.normalizeTags(dto.tags);
        }
        if (this.hasOwn(dto, "accessScope")) {
            note.accessScope = this.resolveAccessScope(dto.accessScope, links.caseEntity?.accessScope, links.client?.accessScope);
        }
        if (this.hasOwn(dto, "metadata")) {
            note.metadata = dto.metadata || {};
        }
        note.assignedUserId = resolvedAssignedUserId;
        note.clientId = links.clientId;
        note.caseId = links.caseEntity?.id || null;
        note.userId = links.user?.id || null;
        note.updatedBy = userId;
        await this.noteRepository.save(note);
        return this.findById(tenantId, id, actor);
    }
    async delete(tenantId, id, userId, actor) {
        const note = await this.findById(tenantId, id, actor);
        note.deletedAt = new Date();
        note.updatedBy = userId;
        await this.noteRepository.save(note);
    }
    async resolveLinks(tenantId, refs, actor) {
        let client = null;
        let caseEntity = null;
        let user = null;
        if (refs.caseId) {
            caseEntity = await this.caseRepository.findOne({
                where: {
                    id: refs.caseId,
                    tenantId,
                    deletedAt: (0, _typeorm1.IsNull)()
                },
                relations: [
                    "client"
                ]
            });
            if (!caseEntity) {
                throw new _common.NotFoundException("Пов'язану справу не знайдено");
            }
            if (actor) {
                (0, _accesscontrol.assertCanAccessRecord)(actor, caseEntity);
            }
            if (refs.clientId && caseEntity.clientId !== refs.clientId) {
                throw new _common.BadRequestException("Справа не належить до вказаного клієнта");
            }
        }
        const clientId = refs.clientId || caseEntity?.clientId || null;
        if (clientId) {
            if (caseEntity?.client && caseEntity.client.id === clientId) {
                client = caseEntity.client;
            } else {
                client = await this.clientRepository.findOne({
                    where: {
                        id: clientId,
                        tenantId,
                        deletedAt: (0, _typeorm1.IsNull)()
                    }
                });
            }
            if (!client) {
                throw new _common.NotFoundException("Пов'язаного клієнта не знайдено");
            }
            if (actor) {
                (0, _accesscontrol.assertCanAccessRecord)(actor, client);
            }
        }
        if (refs.userId) {
            user = await this.userRepository.findOne({
                where: {
                    id: refs.userId,
                    tenantId,
                    deletedAt: (0, _typeorm1.IsNull)()
                }
            });
            if (!user) {
                throw new _common.NotFoundException("Пов'язаного користувача не знайдено");
            }
        }
        return {
            client,
            caseEntity,
            user,
            clientId
        };
    }
    normalizeReference(value) {
        if (typeof value !== "string") {
            return value ?? null;
        }
        const normalized = value.trim();
        return normalized || null;
    }
    resolveTitle(title, content) {
        const normalizedTitle = title?.trim();
        if (normalizedTitle) {
            return normalizedTitle.slice(0, 255);
        }
        const firstLine = (content || "").split("\n").map((line)=>line.trim()).find(Boolean);
        if (firstLine) {
            return firstLine.slice(0, 255);
        }
        return "Нова нотатка";
    }
    normalizeTags(tags) {
        return (tags || []).map((tag)=>tag.trim()).filter(Boolean).slice(0, 10);
    }
    resolveAccessScope(requested, caseScope, clientScope) {
        return requested || caseScope || clientScope || "assigned";
    }
    hasOwn(value, key) {
        return Object.prototype.hasOwnProperty.call(value, key);
    }
    constructor(noteRepository, clientRepository, caseRepository, userRepository){
        this.noteRepository = noteRepository;
        this.clientRepository = clientRepository;
        this.caseRepository = caseRepository;
        this.userRepository = userRepository;
    }
};
NotesService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Noteentity.Note)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Cliententity.Client)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Caseentity.Case)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_Userentity.User)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], NotesService);

//# sourceMappingURL=notes.service.js.map