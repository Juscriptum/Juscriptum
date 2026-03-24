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
    get LogBatchDto () {
        return LogBatchDto;
    },
    get LogEntryDto () {
        return LogEntryDto;
    },
    get LogsController () {
        return LogsController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _throttler = require("@nestjs/throttler");
const _guards = require("../auth/guards");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _logging = require("../common/logging");
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
let LogEntryDto = class LogEntryDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "timestamp", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "debug",
        "info",
        "warn",
        "error",
        "fatal"
    ]),
    _ts_metadata("design:type", typeof LogLevel === "undefined" ? Object : LogLevel)
], LogEntryDto.prototype, "level", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "message", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "context", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "tenantId", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "url", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], LogEntryDto.prototype, "userAgent", void 0);
_ts_decorate([
    (0, _classvalidator.IsObject)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", typeof Record === "undefined" ? Object : Record)
], LogEntryDto.prototype, "metadata", void 0);
_ts_decorate([
    (0, _classvalidator.IsObject)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", Object)
], LogEntryDto.prototype, "error", void 0);
let LogBatchDto = class LogBatchDto {
};
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>LogEntryDto),
    _ts_metadata("design:type", Array)
], LogBatchDto.prototype, "logs", void 0);
let LogsController = class LogsController {
    async receiveLogs(dto) {
        for (const log of dto.logs){
            this.processLogEntry(log);
        }
    }
    /**
   * Process a single log entry
   */ processLogEntry(log) {
        const context = log.context ? `[Frontend:${log.context}]` : "[Frontend]";
        const metadata = {
            ...log.metadata,
            userId: log.userId,
            tenantId: log.tenantId,
            url: log.url,
            userAgent: log.userAgent
        };
        switch(log.level){
            case "debug":
                this.loggingService.debug(`${context} ${log.message}`, metadata);
                break;
            case "info":
                this.loggingService.log(`${context} ${log.message}`, metadata);
                break;
            case "warn":
                this.loggingService.warn(`${context} ${log.message}`, metadata);
                break;
            case "error":
            case "fatal":
                const error = log.error ? new Error(`${log.error.name}: ${log.error.message}`) : new Error(log.message);
                if (log.error?.stack) {
                    error.stack = log.error.stack;
                }
                this.loggingService.error(`${context} ${log.message}`, error.stack, metadata);
                break;
        }
    }
    constructor(loggingService){
        this.loggingService = loggingService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _common.UseGuards)(_guards.JwtAuthGuard),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _throttler.Throttle)({
        default: {
            limit: 30,
            ttl: 60000
        }
    }),
    (0, _swagger.ApiOperation)({
        summary: "Submit frontend logs"
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: "Logs received"
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: "Invalid log data"
    }),
    (0, _swagger.ApiResponse)({
        status: 401,
        description: "Unauthorized"
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof LogBatchDto === "undefined" ? Object : LogBatchDto
    ]),
    _ts_metadata("design:returntype", Promise)
], LogsController.prototype, "receiveLogs", null);
LogsController = _ts_decorate([
    (0, _swagger.ApiTags)("Logs"),
    (0, _common.Controller)("logs"),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _logging.LoggingService === "undefined" ? Object : _logging.LoggingService
    ])
], LogsController);

//# sourceMappingURL=logs.controller.js.map