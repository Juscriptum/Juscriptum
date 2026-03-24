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
    get DATA_ACCESS_SCOPES () {
        return DATA_ACCESS_SCOPES;
    },
    get assertCanAccessRecord () {
        return assertCanAccessRecord;
    },
    get assertCanAssignToUser () {
        return assertCanAssignToUser;
    },
    get assertSameTenant () {
        return assertSameTenant;
    },
    get buildScopedQueryCondition () {
        return buildScopedQueryCondition;
    },
    get canAccessRecord () {
        return canAccessRecord;
    },
    get isElevatedTenantRole () {
        return isElevatedTenantRole;
    }
});
const _common = require("@nestjs/common");
const DATA_ACCESS_SCOPES = [
    "private",
    "assigned",
    "tenant"
];
function isElevatedTenantRole(role) {
    return [
        "super_admin",
        "organization_owner",
        "organization_admin"
    ].includes(role ?? "");
}
function assertSameTenant(user, tenantId) {
    if (!user?.tenant_id || user.tenant_id !== tenantId) {
        throw new _common.ForbiddenException("Невірний tenant context");
    }
}
function assertCanAssignToUser(actor, targetUserId) {
    if (!targetUserId || isElevatedTenantRole(actor.role)) {
        return;
    }
    if (targetUserId !== actor.user_id) {
        throw new _common.ForbiddenException("Ви не можете призначати записи іншому користувачу");
    }
}
function canAccessRecord(actor, record) {
    if (isElevatedTenantRole(actor.role)) {
        return true;
    }
    const scope = record.accessScope ?? "assigned";
    const relatedUserIds = [
        record.createdBy,
        record.assignedUserId,
        record.assignedLawyerId,
        record.uploadedBy,
        record.signedBy
    ].filter(Boolean);
    if (scope === "tenant") {
        return true;
    }
    return relatedUserIds.includes(actor.user_id);
}
function assertCanAccessRecord(actor, record) {
    if (!canAccessRecord(actor, record)) {
        throw new _common.ForbiddenException("Доступ до запису обмежено політикою ізоляції даних");
    }
}
function buildScopedQueryCondition(alias, actor, assignmentColumns = []) {
    if (!actor || isElevatedTenantRole(actor.role)) {
        return null;
    }
    const relatedColumns = [
        `${alias}.createdBy`,
        ...assignmentColumns
    ].map((column)=>`${column} = :scopedUserId`);
    return {
        clause: `(${alias}.accessScope = :tenantAccessScope OR ${relatedColumns.join(" OR ")})`,
        parameters: {
            scopedUserId: actor.user_id,
            tenantAccessScope: "tenant"
        }
    };
}

//# sourceMappingURL=access-control.js.map