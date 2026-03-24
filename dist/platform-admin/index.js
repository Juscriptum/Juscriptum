"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminModule", {
    enumerable: true,
    get: function() {
        return _platformadminmodule.PlatformAdminModule;
    }
});
const _platformadminmodule = require("./platform-admin.module");
_export_star(require("./blueprint"), exports);
_export_star(require("./dto/platform-admin-login.dto"), exports);
_export_star(require("./dto/platform-admin-read-model.dto"), exports);
_export_star(require("./guards"), exports);
_export_star(require("./interfaces/platform-admin-jwt.interface"), exports);
_export_star(require("./services"), exports);
_export_star(require("./strategies"), exports);
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