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
    get PlatformAdminAuthService () {
        return _platformadminauthservice.PlatformAdminAuthService;
    },
    get PlatformAdminJwtService () {
        return _platformadminjwtservice.PlatformAdminJwtService;
    },
    get PlatformAdminReadService () {
        return _platformadminreadservice.PlatformAdminReadService;
    }
});
const _platformadminauthservice = require("./platform-admin-auth.service");
const _platformadminjwtservice = require("./platform-admin-jwt.service");
const _platformadminreadservice = require("./platform-admin-read.service");

//# sourceMappingURL=index.js.map