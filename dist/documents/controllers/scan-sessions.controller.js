"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ScanSessionsController", {
    enumerable: true,
    get: function() {
        return ScanSessionsController;
    }
});
const _common = require("@nestjs/common");
const _platformexpress = require("@nestjs/platform-express");
const _swagger = require("@nestjs/swagger");
const _guards = require("../../auth/guards");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _scansessiondto = require("../dto/scan-session.dto");
const _scansessionservice = require("../services/scan-session.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let ScanSessionsController = class ScanSessionsController {
    async createSession(dto, req) {
        return this.scanSessionService.createSession(req.user?.tenant_id, req.user?.user_id, dto, req.user);
    }
    async getStatus(sessionId, req) {
        return this.scanSessionService.getStatus(req.user?.tenant_id, sessionId, req.user);
    }
    async openMobileSession(sessionId, query) {
        return this.scanSessionService.openMobileSession(sessionId, query.token);
    }
    async uploadPage(sessionId, file, dto) {
        return this.scanSessionService.uploadPage(sessionId, file, dto);
    }
    async deletePage(sessionId, pageId, query) {
        return this.scanSessionService.deletePage(sessionId, pageId, query.token);
    }
    async reorderPages(sessionId, dto) {
        return this.scanSessionService.reorderPages(sessionId, dto);
    }
    async finalizeSession(sessionId, dto) {
        return this.scanSessionService.finalizeSession(sessionId, dto);
    }
    constructor(scanSessionService){
        this.scanSessionService = scanSessionService;
    }
};
_ts_decorate([
    (0, _common.Post)("scan-sessions"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard, _guards.RbacGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _swagger.ApiOperation)({
        summary: "Create scan session"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Scan session created"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _scansessiondto.CreateScanSessionDto === "undefined" ? Object : _scansessiondto.CreateScanSessionDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "createSession", null);
_ts_decorate([
    (0, _common.Get)("scan-sessions/:sessionId"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _swagger.ApiOperation)({
        summary: "Get scan session status for desktop UI"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Scan session status returned"
    }),
    _ts_param(0, (0, _common.Param)("sessionId")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "getStatus", null);
_ts_decorate([
    (0, _common.Get)("scan-sessions/:sessionId/mobile"),
    (0, _swagger.ApiOperation)({
        summary: "Validate mobile scan session access"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Mobile session opened"
    }),
    _ts_param(0, (0, _common.Param)("sessionId")),
    _ts_param(1, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _scansessiondto.MobileTokenDto === "undefined" ? Object : _scansessiondto.MobileTokenDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "openMobileSession", null);
_ts_decorate([
    (0, _common.Post)("scan-sessions/:sessionId/pages"),
    (0, _common.UseInterceptors)((0, _platformexpress.FileInterceptor)("image_file")),
    (0, _swagger.ApiConsumes)("multipart/form-data"),
    (0, _swagger.ApiOperation)({
        summary: "Upload scan page from mobile device"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Page uploaded"
    }),
    _ts_param(0, (0, _common.Param)("sessionId")),
    _ts_param(1, (0, _common.UploadedFile)()),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof Express === "undefined" || typeof Express.Multer === "undefined" || typeof Express.Multer.File === "undefined" ? Object : Express.Multer.File,
        typeof _scansessiondto.UploadScanPageDto === "undefined" ? Object : _scansessiondto.UploadScanPageDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "uploadPage", null);
_ts_decorate([
    (0, _common.Delete)("scan-sessions/:sessionId/pages/:pageId"),
    (0, _swagger.ApiOperation)({
        summary: "Delete uploaded scan page"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Page deleted"
    }),
    _ts_param(0, (0, _common.Param)("sessionId")),
    _ts_param(1, (0, _common.Param)("pageId")),
    _ts_param(2, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        typeof _scansessiondto.MobileTokenDto === "undefined" ? Object : _scansessiondto.MobileTokenDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "deletePage", null);
_ts_decorate([
    (0, _common.Patch)("scan-sessions/:sessionId/pages/reorder"),
    (0, _swagger.ApiOperation)({
        summary: "Reorder pages inside scan session"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Pages reordered"
    }),
    _ts_param(0, (0, _common.Param)("sessionId")),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _scansessiondto.ReorderScanPagesDto === "undefined" ? Object : _scansessiondto.ReorderScanPagesDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "reorderPages", null);
_ts_decorate([
    (0, _common.Post)("scan-sessions/:sessionId/finalize"),
    (0, _swagger.ApiOperation)({
        summary: "Finalize mobile scan into PDF document"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Scan finalized"
    }),
    _ts_param(0, (0, _common.Param)("sessionId")),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _scansessiondto.FinalizeScanSessionDto === "undefined" ? Object : _scansessiondto.FinalizeScanSessionDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ScanSessionsController.prototype, "finalizeSession", null);
ScanSessionsController = _ts_decorate([
    (0, _swagger.ApiTags)("Scan Sessions"),
    (0, _common.Controller)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _scansessionservice.ScanSessionService === "undefined" ? Object : _scansessionservice.ScanSessionService
    ])
], ScanSessionsController);

//# sourceMappingURL=scan-sessions.controller.js.map