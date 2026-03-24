"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OutboxProcessor", {
    enumerable: true,
    get: function() {
        return OutboxProcessor;
    }
});
const _common = require("@nestjs/common");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("@nestjs/typeorm");
const _cqrs = require("@nestjs/cqrs");
const _typeorm1 = require("typeorm");
const _Outboxentity = require("../entities/Outbox.entity");
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
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
let OutboxProcessor = class OutboxProcessor {
    /**
   * Process outbox events every minute
   */ async processOutbox() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        this.logger.debug("Processing outbox events");
        try {
            // Get pending events
            const events = await this.outboxRepository.find({
                where: {
                    processed: false
                },
                order: {
                    createdAt: "ASC"
                },
                take: this.BATCH_SIZE
            });
            if (events.length === 0) {
                return;
            }
            this.logger.log(`Processing ${events.length} outbox events`);
            // Process each event
            for (const event of events){
                await this.processEvent(event);
            }
        } catch (error) {
            this.logger.error("Failed to process outbox events:", error);
        }
    }
    /**
   * Process a single event
   */ async processEvent(event) {
        try {
            // Publish event to event bus
            switch(event.eventType){
                case "UserCreatedEvent":
                    this.eventBus.publish(event.payload);
                    break;
                case "UserUpdatedEvent":
                    this.eventBus.publish(event.payload);
                    break;
                case "AuditLogEvent":
                    this.eventBus.publish(event.payload);
                    break;
                // Add more event types as needed
                default:
                    this.logger.warn(`Unknown event type: ${event.eventType}`);
                    return;
            }
            // Mark as processed
            await this.outboxRepository.update({
                id: event.id
            }, {
                processed: true,
                processedAt: new Date(),
                lastError: undefined
            });
            this.logger.debug(`Event ${event.id} processed successfully`);
        } catch (error) {
            const newRetryCount = event.retryCount + 1;
            // Update retry count
            await this.outboxRepository.update({
                id: event.id
            }, {
                retryCount: newRetryCount,
                lastError: {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                    timestamp: new Date().toISOString()
                }
            });
            this.logger.error(`Failed to process event ${event.id} (attempt ${newRetryCount}):`, error);
            // Move to dead letter queue if max retries reached
            if (newRetryCount >= this.MAX_RETRIES) {
                await this.moveToDeadLetterQueue(event);
            }
        }
    }
    /**
   * Move failed event to dead letter queue
   */ async moveToDeadLetterQueue(event) {
        this.logger.warn(`Moving event ${event.id} to dead letter queue`);
        // TODO: Implement dead letter queue
        await this.outboxRepository.delete({
            id: event.id
        });
    }
    constructor(outboxRepository, eventBus){
        this.outboxRepository = outboxRepository;
        this.eventBus = eventBus;
        this.logger = new _common.Logger(OutboxProcessor.name);
        this.MAX_RETRIES = 3;
        this.BATCH_SIZE = 100;
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_MINUTE),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], OutboxProcessor.prototype, "processOutbox", null);
OutboxProcessor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Outboxentity.Outbox)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _cqrs.EventBus === "undefined" ? Object : _cqrs.EventBus
    ])
], OutboxProcessor);

//# sourceMappingURL=outbox.processor.js.map