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
    get PlatformAdminRole () {
        return PlatformAdminRole;
    },
    get PlatformAdminStatus () {
        return PlatformAdminStatus;
    }
});
var PlatformAdminRole = /*#__PURE__*/ function(PlatformAdminRole) {
    PlatformAdminRole["PLATFORM_OWNER"] = "platform_owner";
    PlatformAdminRole["PLATFORM_SUPPORT_ADMIN"] = "platform_support_admin";
    PlatformAdminRole["PLATFORM_SECURITY_ADMIN"] = "platform_security_admin";
    PlatformAdminRole["PLATFORM_BILLING_ADMIN"] = "platform_billing_admin";
    return PlatformAdminRole;
}({});
var PlatformAdminStatus = /*#__PURE__*/ function(PlatformAdminStatus) {
    PlatformAdminStatus["ACTIVE"] = "active";
    PlatformAdminStatus["SUSPENDED"] = "suspended";
    PlatformAdminStatus["DELETED"] = "deleted";
    return PlatformAdminStatus;
}({});

//# sourceMappingURL=platform-admin.enum.js.map