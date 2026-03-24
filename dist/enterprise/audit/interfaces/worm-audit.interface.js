/**
 * WORM (Write Once Read Many) Audit Storage Configuration
 * Provides immutable audit logging for compliance
 */ "use strict";
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
    get DEFAULT_WORM_CONFIG () {
        return DEFAULT_WORM_CONFIG;
    },
    get ENTERPRISE_RETENTION_DAYS () {
        return ENTERPRISE_RETENTION_DAYS;
    },
    get STANDARD_RETENTION_DAYS () {
        return STANDARD_RETENTION_DAYS;
    }
});
const DEFAULT_WORM_CONFIG = {
    enabled: true,
    retentionDays: 2555,
    storageType: "s3",
    encryptionEnabled: true,
    compressionEnabled: true
};
const ENTERPRISE_RETENTION_DAYS = 2555; // 7 years
const STANDARD_RETENTION_DAYS = 365; // 1 year

//# sourceMappingURL=worm-audit.interface.js.map