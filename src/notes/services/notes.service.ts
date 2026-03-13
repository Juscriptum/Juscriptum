import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { JwtPayload } from "../../auth/interfaces/jwt.interface";
import {
  assertCanAccessRecord,
  assertCanAssignToUser,
  assertSameTenant,
  buildScopedQueryCondition,
  DataAccessScope,
} from "../../common/security/access-control";
import { detectSqlInjection } from "../../common/utils/validation.util";
import { Case } from "../../database/entities/Case.entity";
import { Client } from "../../database/entities/Client.entity";
import { Note } from "../../database/entities/Note.entity";
import { User } from "../../database/entities/User.entity";
import { CreateNoteDto, NoteFiltersDto, UpdateNoteDto } from "../dto/note.dto";

type LinkedRecords = {
  client: Client | null;
  caseEntity: Case | null;
  user: User | null;
  clientId: string | null;
};

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(
    tenantId: string,
    filters: NoteFiltersDto = {},
    actor?: JwtPayload,
  ): Promise<{ data: Note[]; total: number; page: number; limit: number }> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const query = this.noteRepository
      .createQueryBuilder("note")
      .where("note.tenantId = :tenantId AND note.deletedAt IS NULL", {
        tenantId,
      });

    const scopeCondition = buildScopedQueryCondition("note", actor, [
      "note.assignedUserId",
    ]);

    if (scopeCondition) {
      query.andWhere(scopeCondition.clause, scopeCondition.parameters);
    }

    if (filters.clientId) {
      query.andWhere("note.clientId = :clientId", {
        clientId: filters.clientId,
      });
    }

    if (filters.caseId) {
      query.andWhere("note.caseId = :caseId", { caseId: filters.caseId });
    }

    if (filters.userId) {
      query.andWhere("note.userId = :userId", { userId: filters.userId });
    }

    if (filters.pinned !== undefined) {
      query.andWhere("note.pinned = :pinned", { pinned: filters.pinned });
    }

    if (filters.search) {
      if (detectSqlInjection(filters.search)) {
        throw new ForbiddenException("Invalid search query");
      }

      query.andWhere(
        "(LOWER(note.title) LIKE LOWER(:search) OR LOWER(note.content) LIKE LOWER(:search))",
        {
          search: `%${filters.search}%`,
        },
      );
    }

    const sortFieldMap = {
      createdAt: "note.createdAt",
      updatedAt: "note.updatedAt",
      title: "note.title",
    } as const;
    const sortBy = filters.sortBy || "updatedAt";
    const sortOrder = filters.sortOrder || "DESC";

    query
      .orderBy("note.pinned", "DESC")
      .addOrderBy(sortFieldMap[sortBy], sortOrder);

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
      limit,
    };
  }

  async findById(
    tenantId: string,
    id: string,
    actor?: JwtPayload,
  ): Promise<Note> {
    if (actor) {
      assertSameTenant(actor, tenantId);
    }

    const note = await this.noteRepository.findOne({
      where: {
        id,
        tenantId,
        deletedAt: IsNull(),
      },
      relations: ["client", "case", "user", "assignedUser"],
    });

    if (!note) {
      throw new NotFoundException("Нотатку не знайдено");
    }

    if (actor) {
      assertCanAccessRecord(actor, note);
    }

    return note;
  }

  async create(
    tenantId: string,
    authorUserId: string,
    dto: CreateNoteDto,
    actor?: JwtPayload,
  ): Promise<Note> {
    if (actor) {
      assertSameTenant(actor, tenantId);
      assertCanAssignToUser(actor, dto.assignedUserId || dto.userId);
    }

    const links = await this.resolveLinks(
      tenantId,
      {
        clientId: this.normalizeReference(dto.clientId),
        caseId: this.normalizeReference(dto.caseId),
        userId: this.normalizeReference(dto.userId),
      },
      actor,
    );

    const assignedUserId =
      this.normalizeReference(dto.assignedUserId) ||
      links.caseEntity?.assignedLawyerId ||
      links.client?.assignedUserId ||
      links.user?.id ||
      authorUserId;

    const note = this.noteRepository.create({
      tenantId,
      title: this.resolveTitle(dto.title, dto.content),
      content: dto.content?.trim() || "",
      pinned: Boolean(dto.pinned),
      tags: this.normalizeTags(dto.tags),
      accessScope: this.resolveAccessScope(
        dto.accessScope,
        links.caseEntity?.accessScope,
        links.client?.accessScope,
      ),
      assignedUserId,
      clientId: links.clientId,
      caseId: links.caseEntity?.id || null,
      userId: links.user?.id || null,
      metadata: dto.metadata || {},
      createdBy: authorUserId,
      updatedBy: authorUserId,
    });

    return this.noteRepository.save(note);
  }

  async update(
    tenantId: string,
    id: string,
    userId: string,
    dto: UpdateNoteDto,
    actor?: JwtPayload,
  ): Promise<Note> {
    const note = await this.findById(tenantId, id, actor);

    if (actor) {
      const requestedAssignee = this.hasOwn(dto, "assignedUserId")
        ? this.normalizeReference(dto.assignedUserId)
        : note.assignedUserId;
      const requestedUserId = this.hasOwn(dto, "userId")
        ? this.normalizeReference(dto.userId)
        : note.userId;

      assertCanAssignToUser(actor, requestedAssignee || requestedUserId);
    }

    const requestedCaseId = this.hasOwn(dto, "caseId")
      ? this.normalizeReference(dto.caseId)
      : note.caseId;
    const requestedClientId = this.hasOwn(dto, "clientId")
      ? this.normalizeReference(dto.clientId)
      : note.clientId;
    const requestedUserId = this.hasOwn(dto, "userId")
      ? this.normalizeReference(dto.userId)
      : note.userId;

    const links = await this.resolveLinks(
      tenantId,
      {
        clientId: requestedClientId,
        caseId: requestedCaseId,
        userId: requestedUserId,
      },
      actor,
    );

    const resolvedAssignedUserId =
      (this.hasOwn(dto, "assignedUserId")
        ? this.normalizeReference(dto.assignedUserId)
        : note.assignedUserId) ||
      links.caseEntity?.assignedLawyerId ||
      links.client?.assignedUserId ||
      links.user?.id ||
      note.createdBy ||
      userId;

    if (this.hasOwn(dto, "title") || this.hasOwn(dto, "content")) {
      const nextContent = this.hasOwn(dto, "content")
        ? dto.content?.trim() || ""
        : note.content;
      const nextTitle = this.hasOwn(dto, "title")
        ? this.resolveTitle(dto.title, nextContent)
        : this.resolveTitle(note.title, nextContent);

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
      note.accessScope = this.resolveAccessScope(
        dto.accessScope,
        links.caseEntity?.accessScope,
        links.client?.accessScope,
      );
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

  async delete(
    tenantId: string,
    id: string,
    userId: string,
    actor?: JwtPayload,
  ): Promise<void> {
    const note = await this.findById(tenantId, id, actor);
    note.deletedAt = new Date();
    note.updatedBy = userId;
    await this.noteRepository.save(note);
  }

  private async resolveLinks(
    tenantId: string,
    refs: {
      clientId?: string | null;
      caseId?: string | null;
      userId?: string | null;
    },
    actor?: JwtPayload,
  ): Promise<LinkedRecords> {
    let client: Client | null = null;
    let caseEntity: Case | null = null;
    let user: User | null = null;

    if (refs.caseId) {
      caseEntity = await this.caseRepository.findOne({
        where: {
          id: refs.caseId,
          tenantId,
          deletedAt: IsNull(),
        },
        relations: ["client"],
      });

      if (!caseEntity) {
        throw new NotFoundException("Пов'язану справу не знайдено");
      }

      if (actor) {
        assertCanAccessRecord(actor, caseEntity);
      }

      if (refs.clientId && caseEntity.clientId !== refs.clientId) {
        throw new BadRequestException(
          "Справа не належить до вказаного клієнта",
        );
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
            deletedAt: IsNull(),
          },
        });
      }

      if (!client) {
        throw new NotFoundException("Пов'язаного клієнта не знайдено");
      }

      if (actor) {
        assertCanAccessRecord(actor, client);
      }
    }

    if (refs.userId) {
      user = await this.userRepository.findOne({
        where: {
          id: refs.userId,
          tenantId,
          deletedAt: IsNull(),
        },
      });

      if (!user) {
        throw new NotFoundException("Пов'язаного користувача не знайдено");
      }
    }

    return {
      client,
      caseEntity,
      user,
      clientId,
    };
  }

  private normalizeReference(value?: string | null): string | null {
    if (typeof value !== "string") {
      return value ?? null;
    }

    const normalized = value.trim();
    return normalized || null;
  }

  private resolveTitle(title?: string | null, content?: string | null): string {
    const normalizedTitle = title?.trim();
    if (normalizedTitle) {
      return normalizedTitle.slice(0, 255);
    }

    const firstLine = (content || "")
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);

    if (firstLine) {
      return firstLine.slice(0, 255);
    }

    return "Нова нотатка";
  }

  private normalizeTags(tags?: string[] | null): string[] {
    return (tags || [])
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  private resolveAccessScope(
    requested?: DataAccessScope,
    caseScope?: DataAccessScope | null,
    clientScope?: DataAccessScope | null,
  ): DataAccessScope {
    return requested || caseScope || clientScope || "assigned";
  }

  private hasOwn<T extends object>(value: T, key: keyof T): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
  }
}
