"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get AuditLogEvent () {
        return AuditLogEvent;
    },
    get UserCreatedEvent () {
        return UserCreatedEvent;
    },
    get UserDeletedEvent () {
        return UserDeletedEvent;
    },
    get UserUpdatedEvent () {
        return UserUpdatedEvent;
    }
});
let UserCreatedEvent = class UserCreatedEvent {
    constructor(userId, tenantId, firstName, lastName, email, role, createdAt){
        this.userId = userId;
        this.tenantId = tenantId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.createdAt = createdAt;
    }
};
let UserUpdatedEvent = class UserUpdatedEvent {
    constructor(userId, tenantId, changes, updatedAt){
        this.userId = userId;
        this.tenantId = tenantId;
        this.changes = changes;
        this.updatedAt = updatedAt;
    }
};
let UserDeletedEvent = class UserDeletedEvent {
    constructor(userId, tenantId, deletedAt){
        this.userId = userId;
        this.tenantId = tenantId;
        this.deletedAt = deletedAt;
    }
};
let AuditLogEvent = class AuditLogEvent {
    constructor(tenantId, action, entityType, entityId, timestamp, userId, newValues, oldValues, changedFields){
        this.tenantId = tenantId;
        this.action = action;
        this.entityType = entityType;
        this.entityId = entityId;
        this.timestamp = timestamp;
        this.userId = userId;
        this.newValues = newValues;
        this.oldValues = oldValues;
        this.changedFields = changedFields;
    }
};

//# sourceMappingURL=user.events.js.map