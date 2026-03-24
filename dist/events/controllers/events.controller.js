"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EventsController", {
    enumerable: true,
    get: function() {
        return EventsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _eventservice = require("../services/event.service");
const _eventdto = require("../dto/event.dto");
const _guards = require("../../auth/guards");
const _auditservice = require("../../auth/services/audit.service");
const _accesscontroldecorators = require("../../auth/decorators/access-control.decorators");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
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
let EventsController = class EventsController {
    async findAll(filters, req) {
        const tenantId = req.user?.tenant_id;
        return this.eventService.findAll(tenantId, filters);
    }
    async getStatistics(req) {
        const tenantId = req.user?.tenant_id;
        return this.eventService.getStatistics(tenantId);
    }
    async getUpcoming(req, days) {
        const tenantId = req.user?.tenant_id;
        return this.eventService.getUpcoming(tenantId, days ? parseInt(days) : 30);
    }
    async getCalendarEvents(startDate, endDate, req) {
        const tenantId = req.user?.tenant_id;
        return this.eventService.getCalendarEvents(tenantId, new Date(startDate), new Date(endDate));
    }
    async findById(id, req) {
        const tenantId = req.user?.tenant_id;
        return this.eventService.findById(tenantId, id);
    }
    async create(dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.eventService.create(tenantId, userId, dto);
    }
    async update(id, dto, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.eventService.update(tenantId, id, userId, dto);
    }
    async delete(id, req) {
        const tenantId = req.user?.tenant_id;
        const userId = req.user?.user_id;
        return this.eventService.delete(tenantId, id, userId);
    }
    constructor(eventService){
        this.eventService = eventService;
    }
};
_ts_decorate([
    (0, _common.Get)(),
    (0, _swagger.ApiOperation)({
        summary: "Get all events"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Events retrieved"
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _eventdto.EventFiltersDto === "undefined" ? Object : _eventdto.EventFiltersDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)("statistics"),
    (0, _swagger.ApiOperation)({
        summary: "Get event statistics"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Statistics retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "getStatistics", null);
_ts_decorate([
    (0, _common.Get)("upcoming"),
    (0, _swagger.ApiOperation)({
        summary: "Get upcoming events"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Upcoming events retrieved"
    }),
    _ts_param(0, (0, _common.Req)()),
    _ts_param(1, (0, _common.Query)("days")),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "getUpcoming", null);
_ts_decorate([
    (0, _common.Get)("calendar"),
    (0, _swagger.ApiOperation)({
        summary: "Get calendar events for integration"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Calendar events retrieved"
    }),
    _ts_param(0, (0, _common.Query)("startDate")),
    _ts_param(1, (0, _common.Query)("endDate")),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "getCalendarEvents", null);
_ts_decorate([
    (0, _common.Get)(":id"),
    (0, _swagger.ApiOperation)({
        summary: "Get event by ID"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Event retrieved"
    }),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "findById", null);
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _swagger.ApiOperation)({
        summary: "Create new event"
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: "Event created"
    }),
    (0, _auditservice.Audit)("create"),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _eventdto.CreateEventDto === "undefined" ? Object : _eventdto.CreateEventDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "create", null);
_ts_decorate([
    (0, _common.Put)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _swagger.ApiOperation)({
        summary: "Update event"
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: "Event updated"
    }),
    (0, _auditservice.Audit)("update"),
    _ts_param(0, (0, _common.Param)("id")),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Req)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _eventdto.UpdateEventDto === "undefined" ? Object : _eventdto.UpdateEventDto,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], EventsController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(":id"),
    (0, _common.UseGuards)(_guards.RbacGuard),
    (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.ORGANIZATION_ADMIN, _subscriptionenum.UserRole.LAWYER, _subscriptionenum.UserRole.ASSISTANT),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _swagger.ApiOperation)({
        summary: "Delete event"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Event deleted"
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
], EventsController.prototype, "delete", null);
EventsController = _ts_decorate([
    (0, _swagger.ApiTags)("Events"),
    (0, _common.Controller)("events"),
    (0, _common.UseGuards)(_guards.JwtAuthGuard, _guards.TenantGuard),
    (0, _swagger.ApiBearerAuth)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _eventservice.EventService === "undefined" ? Object : _eventservice.EventService
    ])
], EventsController);

//# sourceMappingURL=events.controller.js.map