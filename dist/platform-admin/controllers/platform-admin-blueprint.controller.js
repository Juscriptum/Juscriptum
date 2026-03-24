"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PlatformAdminBlueprintController", {
    enumerable: true,
    get: function() {
        return PlatformAdminBlueprintController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _blueprint = require("../blueprint");
const _guards = require("../guards");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PlatformAdminBlueprintController = class PlatformAdminBlueprintController {
    getBlueprint() {
        return _blueprint.PLATFORM_ADMIN_BLUEPRINT;
    }
};
_ts_decorate([
    (0, _common.Get)("blueprint"),
    (0, _swagger.ApiOperation)({
        summary: "Return the current platform-admin architecture blueprint and API roadmap"
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof _blueprint.PlatformAdminBlueprint === "undefined" ? Object : _blueprint.PlatformAdminBlueprint)
], PlatformAdminBlueprintController.prototype, "getBlueprint", null);
PlatformAdminBlueprintController = _ts_decorate([
    (0, _swagger.ApiTags)("Platform Admin"),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.Controller)("platform-admin"),
    (0, _common.UseGuards)(_guards.PlatformAdminJwtAuthGuard)
], PlatformAdminBlueprintController);

//# sourceMappingURL=platform-admin-blueprint.controller.js.map