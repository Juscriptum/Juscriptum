"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotesController", {
    enumerable: true,
    get: function() {
        return NotesController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _guards = require("../../auth/guards");
const _auditservice = require("../../auth/services/audit.service");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _notedto = require("../dto/note.dto");
const _notesservice = require("../services/notes.service");
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
let NotesController = class NotesController {
    async findAll(filters, req) {
        return this.notesService.findAll(req.user?.tenant_id, filters, req.user);
    }
    async findById(id, req) {
        return this.notesService.findById(req.user?.tenant_id, id, req.user);
    }
    async create(dto, req) {
        return this.notesService.create(req.user?.tenant_id, req.user?.user_id, dto, req.user);
    }
    async update(id, dto, req) {
        return this.notesService.update(req.user?.tenant_id, id, req.user?.user_id, dto, req.user);
    }
    async delete(id, req) {
        await this.notesService.delete(req.user?.tenant_id, id, req.user?.user_id, req.user);
    }
    constructor(notesService){
        this.notesService = notesService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all notes"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Notes retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _notedto.NoteFiltersDto === "undefined" ? Object : _notedto.NoteFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], NotesController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get note by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Note retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], NotesController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Create note"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Note created"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _notedto.CreateNoteDto === "undefined" ? Object : _notedto.CreateNoteDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], NotesController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _swagger.ApiOperation)({
        summary: "Update note"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Note updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _notedto.UpdateNoteDto === "undefined" ? Object : _notedto.UpdateNoteDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], NotesController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT, _subscriptionenum.UserRole.ACCOUNTANT),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete note"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Note deleted"
    }),
    (0, _auditservice.Audit)("delete"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], NotesController.prototype, "delete", null);
NotesController = _ts_decorate([
    (0, _swagger.ApiTags)("Notes"),
    (0, _common.Controller)("notes"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _notesservice.NotesService === "undefined" ? Object : _notesservice.NotesService
    ])
], NotesController);

//# sourceMappingURL=notes.controller.js.map