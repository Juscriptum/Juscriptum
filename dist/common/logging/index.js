/**
 * Logging Module
 *
 * Provides structured, context-aware logging for the Law Organizer application.
 *
 * Features:
 * - Multi-level logging (debug, info, warn, error, fatal)
 * - Multiple log transports (console, file, Sentry)
 * - Request/response logging with correlation IDs
 * - Automatic context propagation (tenant_id, user_id, request_id)
 * - Sensitive data redaction
 * - Performance monitoring
 * - Daily log rotation with compression
 * - Integration with existing AuditLog service
 *
 * @module common/logging
 */ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
_export_star(require("./logging.module"), exports);
_export_star(require("./logging.service"), exports);
_export_star(require("./logging.middleware"), exports);
_export_star(require("./logging.interceptor"), exports);
_export_star(require("./global-exception.filter"), exports);
_export_star(require("./logger.config"), exports);
function _export_star(from, to) {
    Object.keys(from).forEach(function(k) {
        if (k !== "default" && !Object.prototype.hasOwnProperty.call(to, k)) {
            Object.defineProperty(to, k, {
                enumerable: true,
                get: function() {
                    return from[k];
                }
            });
        }
    });
    return from;
}

//# sourceMappingURL=index.js.map