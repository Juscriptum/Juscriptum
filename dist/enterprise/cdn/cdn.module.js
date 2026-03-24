"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CdnModule", {
    enumerable: true,
    get: function() {
        return CdnModule;
    }
});
const _common = require("@nestjs/common");
const _cdncontroller = require("./controllers/cdn.controller");
const _cdnservice = require("./services/cdn.service");
const _cdnheadersinterceptor = require("./interceptors/cdn-headers.interceptor");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CdnModule = class CdnModule {
};
CdnModule = _ts_decorate([
    (0, _common.Global)(),
    (0, _common.Module)({
        controllers: [
            _cdncontroller.CdnController
        ],
        providers: [
            _cdnservice.CdnService,
            _cdnheadersinterceptor.CdnHeadersInterceptor
        ],
        exports: [
            _cdnservice.CdnService,
            _cdnheadersinterceptor.CdnHeadersInterceptor
        ]
    })
], CdnModule);

//# sourceMappingURL=cdn.module.js.map