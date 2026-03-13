import { IEvent } from "@nestjs/cqrs";

export class UserCreatedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly role: string,
    public readonly createdAt: Date,
  ) {}
}

export class UserUpdatedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly changes: Record<string, any>,
    public readonly updatedAt: Date,
  ) {}
}

export class UserDeletedEvent implements IEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly deletedAt: Date,
  ) {}
}

export class AuditLogEvent implements IEvent {
  constructor(
    public readonly tenantId: string,
    public readonly action: string,
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly timestamp: Date,
    public readonly userId?: string,
    public readonly newValues?: Record<string, any>,
    public readonly oldValues?: Record<string, any>,
    public readonly changedFields?: string[],
  ) {}
}
