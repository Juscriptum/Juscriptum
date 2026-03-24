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
    get ActivityFeedDto () {
        return ActivityFeedDto;
    },
    get DashboardStatsResponseDto () {
        return DashboardStatsResponseDto;
    },
    get RecentCaseDto () {
        return RecentCaseDto;
    },
    get RevenueDataPointDto () {
        return RevenueDataPointDto;
    },
    get StatCardDto () {
        return StatCardDto;
    },
    get TaskDto () {
        return TaskDto;
    },
    get UpcomingEventDto () {
        return UpcomingEventDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let StatCardDto = class StatCardDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Stat label"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], StatCardDto.prototype, "label", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Stat value"
    }),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], StatCardDto.prototype, "value", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Change from previous period (percentage)"
    }),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], StatCardDto.prototype, "change", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Trend direction"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], StatCardDto.prototype, "trend", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Icon identifier"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], StatCardDto.prototype, "icon", void 0);
let RecentCaseDto = class RecentCaseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Case ID"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecentCaseDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Case number"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecentCaseDto.prototype, "caseNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Case title"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecentCaseDto.prototype, "title", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Client name"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecentCaseDto.prototype, "clientName", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Case status"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecentCaseDto.prototype, "status", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Case priority"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecentCaseDto.prototype, "priority", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Next hearing date"
    }),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RecentCaseDto.prototype, "nextHearingDate", void 0);
let UpcomingEventDto = class UpcomingEventDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Event ID"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpcomingEventDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Event title"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpcomingEventDto.prototype, "title", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Event type"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpcomingEventDto.prototype, "type", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Event date and time"
    }),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UpcomingEventDto.prototype, "eventDate", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Event location"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpcomingEventDto.prototype, "location", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Related case number"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpcomingEventDto.prototype, "caseNumber", void 0);
let ActivityFeedDto = class ActivityFeedDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Activity ID"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ActivityFeedDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "User who performed the action"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ActivityFeedDto.prototype, "userName", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Action performed"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ActivityFeedDto.prototype, "action", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Entity type"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ActivityFeedDto.prototype, "entityType", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Entity description"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ActivityFeedDto.prototype, "entityDescription", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Timestamp"
    }),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], ActivityFeedDto.prototype, "timestamp", void 0);
let TaskDto = class TaskDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Task ID"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TaskDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Task title"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TaskDto.prototype, "title", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Task type"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TaskDto.prototype, "type", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Due date"
    }),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], TaskDto.prototype, "dueDate", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Related case number"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TaskDto.prototype, "caseNumber", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Priority"
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], TaskDto.prototype, "priority", void 0);
let RevenueDataPointDto = class RevenueDataPointDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Date"
    }),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], RevenueDataPointDto.prototype, "date", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Amount"
    }),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], RevenueDataPointDto.prototype, "amount", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Paid amount"
    }),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], RevenueDataPointDto.prototype, "paidAmount", void 0);
let DashboardStatsResponseDto = class DashboardStatsResponseDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Statistics cards"
    }),
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], DashboardStatsResponseDto.prototype, "stats", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Recent cases"
    }),
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], DashboardStatsResponseDto.prototype, "recentCases", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Upcoming events"
    }),
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], DashboardStatsResponseDto.prototype, "upcomingEvents", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Recent activity"
    }),
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], DashboardStatsResponseDto.prototype, "activityFeed", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Pending tasks"
    }),
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], DashboardStatsResponseDto.prototype, "pendingTasks", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: "Revenue data for chart"
    }),
    (0, _classvalidator.IsArray)(),
    _ts_metadata("design:type", Array)
], DashboardStatsResponseDto.prototype, "revenueData", void 0);

//# sourceMappingURL=dashboard-response.dto.js.map