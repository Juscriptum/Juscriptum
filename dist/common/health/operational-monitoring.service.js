"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OperationalMonitoringService", {
    enumerable: true,
    get: function() {
        return OperationalMonitoringService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _schedule = require("@nestjs/schedule");
const _typeorm = require("typeorm");
const _redis = require("redis");
const _logging = require("../logging");
const _scheduledtasks = require("../runtime/scheduled-tasks");
const _FileScanRecordentity = require("../../database/entities/FileScanRecord.entity");
const _TrustVerificationJobentity = require("../../database/entities/TrustVerificationJob.entity");
const _Outboxentity = require("../../enterprise/entities/Outbox.entity");
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const _Userentity = require("../../database/entities/User.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
const TRUST_JOB_BACKLOG_THRESHOLD = 20;
const MALWARE_SCAN_BACKLOG_THRESHOLD = 20;
const OUTBOX_BACKLOG_THRESHOLD = 50;
const ALERT_SUPPRESSION_MS = 15 * 60 * 1000;
let OperationalMonitoringService = class OperationalMonitoringService {
    async getLivenessReport() {
        return {
            status: "ok",
            timestamp: new Date().toISOString()
        };
    }
    async getReadinessReport() {
        const [database, redis, monitoring] = await Promise.all([
            this.checkDatabase(),
            this.checkRedis(),
            this.collectMonitoringSnapshot()
        ]);
        const states = [
            database.status,
            redis.status,
            monitoring.auth.status,
            monitoring.billing.status,
            monitoring.workers.trustVerification.status,
            monitoring.workers.malwareScanning.status,
            monitoring.workers.outbox.status
        ];
        const status = states.includes("error") ? "error" : states.includes("degraded") || states.includes("disabled") ? "degraded" : "ok";
        return {
            status,
            timestamp: new Date().toISOString(),
            components: {
                app: {
                    status: "ok"
                },
                database,
                redis,
                monitoring
            }
        };
    }
    async emitOperationalAlerts() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            return;
        }
        const snapshot = await this.collectMonitoringSnapshot();
        if (snapshot.auth.lockedAccounts > 0) {
            this.emitAlert("auth_locked_accounts_detected", "high", {
                lockedAccounts: snapshot.auth.lockedAccounts
            }, `locked:${snapshot.auth.lockedAccounts}`);
        }
        if (snapshot.workers.trustVerification.failed > 0) {
            this.emitAlert("trust_verification_failures_detected", "high", {
                failedJobs: snapshot.workers.trustVerification.failed,
                dueJobs: snapshot.workers.trustVerification.due
            }, `trust-failed:${snapshot.workers.trustVerification.failed}:${snapshot.workers.trustVerification.due}`);
        }
        if (snapshot.workers.trustVerification.due >= TRUST_JOB_BACKLOG_THRESHOLD) {
            this.emitAlert("trust_verification_backlog_detected", "high", {
                dueJobs: snapshot.workers.trustVerification.due,
                threshold: TRUST_JOB_BACKLOG_THRESHOLD
            }, `trust-backlog:${snapshot.workers.trustVerification.due}`);
        }
        if (snapshot.workers.malwareScanning.infectedLast24h > 0) {
            this.emitAlert("infected_uploads_detected", "critical", {
                infectedLast24h: snapshot.workers.malwareScanning.infectedLast24h
            }, `infected:${snapshot.workers.malwareScanning.infectedLast24h}`);
        }
        if (snapshot.workers.malwareScanning.failed > 0) {
            this.emitAlert("malware_scan_failures_detected", "high", {
                failedScans: snapshot.workers.malwareScanning.failed,
                dueScans: snapshot.workers.malwareScanning.due
            }, `scan-failed:${snapshot.workers.malwareScanning.failed}:${snapshot.workers.malwareScanning.due}`);
        }
        if (snapshot.workers.malwareScanning.due >= MALWARE_SCAN_BACKLOG_THRESHOLD) {
            this.emitAlert("malware_scan_backlog_detected", "high", {
                dueScans: snapshot.workers.malwareScanning.due,
                threshold: MALWARE_SCAN_BACKLOG_THRESHOLD
            }, `scan-backlog:${snapshot.workers.malwareScanning.due}`);
        }
        if (snapshot.workers.outbox.deadLetterRisk > 0 || snapshot.workers.outbox.pending >= OUTBOX_BACKLOG_THRESHOLD) {
            this.emitAlert("outbox_delivery_backlog_detected", snapshot.workers.outbox.deadLetterRisk > 0 ? "high" : "medium", {
                pendingEvents: snapshot.workers.outbox.pending,
                deadLetterRisk: snapshot.workers.outbox.deadLetterRisk
            }, `outbox:${snapshot.workers.outbox.pending}:${snapshot.workers.outbox.deadLetterRisk}`);
        }
        if (snapshot.billing.anomalousSubscriptions > 0) {
            this.emitAlert("billing_anomalies_detected", "medium", {
                anomalousSubscriptions: snapshot.billing.anomalousSubscriptions
            }, `billing:${snapshot.billing.anomalousSubscriptions}`);
        }
    }
    async collectMonitoringSnapshot() {
        const now = new Date();
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const fileScanRepository = this.dataSource.getRepository(_FileScanRecordentity.FileScanRecord);
        const trustRepository = this.dataSource.getRepository(_TrustVerificationJobentity.TrustVerificationJob);
        const hasOutboxMetadata = this.dataSource.hasMetadata(_Outboxentity.Outbox);
        const outboxRepository = hasOutboxMetadata ? this.dataSource.getRepository(_Outboxentity.Outbox) : null;
        const subscriptionRepository = this.dataSource.getRepository(_Subscriptionentity.Subscription);
        const userRepository = this.dataSource.getRepository(_Userentity.User);
        const [lockedAccounts, anomalousSubscriptions, trustDue, trustFailed, malwareDue, malwareFailed, infectedLast24h, outboxPending, outboxDeadLetterRisk] = await Promise.all([
            userRepository.count({
                where: {
                    lockedUntil: (0, _typeorm.MoreThan)(now),
                    deletedAt: (0, _typeorm.IsNull)()
                },
                withDeleted: true
            }),
            subscriptionRepository.count({
                where: [
                    {
                        status: _subscriptionenum.SubscriptionStatus.PAST_DUE
                    },
                    {
                        status: _subscriptionenum.SubscriptionStatus.UNPAID
                    }
                ]
            }),
            trustRepository.count({
                where: [
                    {
                        status: "queued",
                        nextAttemptAt: (0, _typeorm.LessThanOrEqual)(now)
                    },
                    {
                        status: "retrying",
                        nextAttemptAt: (0, _typeorm.LessThanOrEqual)(now)
                    }
                ]
            }),
            trustRepository.count({
                where: {
                    status: "failed"
                }
            }),
            fileScanRepository.count({
                where: [
                    {
                        status: "pending",
                        nextAttemptAt: (0, _typeorm.LessThanOrEqual)(now)
                    },
                    {
                        status: "failed",
                        nextAttemptAt: (0, _typeorm.LessThanOrEqual)(now)
                    }
                ]
            }),
            fileScanRepository.count({
                where: {
                    status: "failed",
                    scanAttempts: (0, _typeorm.MoreThanOrEqual)(3)
                }
            }),
            fileScanRepository.count({
                where: {
                    status: "infected",
                    scannedAt: (0, _typeorm.MoreThan)(last24Hours)
                }
            }),
            outboxRepository ? outboxRepository.count({
                where: {
                    processed: false
                }
            }) : Promise.resolve(0),
            outboxRepository ? outboxRepository.count({
                where: {
                    processed: false,
                    retryCount: (0, _typeorm.MoreThanOrEqual)(3)
                }
            }) : Promise.resolve(0)
        ]);
        return {
            auth: {
                status: lockedAccounts > 0 ? "degraded" : "ok",
                lockedAccounts
            },
            billing: {
                status: anomalousSubscriptions > 0 ? "degraded" : "ok",
                anomalousSubscriptions
            },
            workers: {
                trustVerification: {
                    status: trustFailed > 0 || trustDue >= TRUST_JOB_BACKLOG_THRESHOLD ? "error" : trustDue > 0 ? "degraded" : "ok",
                    due: trustDue,
                    failed: trustFailed
                },
                malwareScanning: {
                    status: malwareFailed > 0 || malwareDue >= MALWARE_SCAN_BACKLOG_THRESHOLD ? "error" : infectedLast24h > 0 || malwareDue > 0 ? "degraded" : "ok",
                    due: malwareDue,
                    failed: malwareFailed,
                    infectedLast24h
                },
                outbox: {
                    status: hasOutboxMetadata ? outboxDeadLetterRisk > 0 || outboxPending >= OUTBOX_BACKLOG_THRESHOLD ? "error" : outboxPending > 0 ? "degraded" : "ok" : "disabled",
                    pending: outboxPending,
                    deadLetterRisk: outboxDeadLetterRisk
                }
            }
        };
    }
    async checkDatabase() {
        const startedAt = Date.now();
        try {
            await this.dataSource.query("SELECT 1");
            return {
                status: "ok",
                latencyMs: Date.now() - startedAt
            };
        } catch (error) {
            return {
                status: "error",
                latencyMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async checkRedis() {
        const nodeEnv = this.configService.get("NODE_ENV", "development");
        const defaultRedis = nodeEnv === "production" ? "true" : "false";
        const redisEnabled = this.configService.get("REDIS_ENABLED", defaultRedis);
        if (redisEnabled === "false" || redisEnabled === "0") {
            return {
                status: "disabled"
            };
        }
        const startedAt = Date.now();
        const client = (0, _redis.createClient)(this.getRedisConfig());
        try {
            await client.connect();
            const pong = await client.ping();
            return {
                status: pong === "PONG" ? "ok" : "error",
                latencyMs: Date.now() - startedAt,
                ...pong === "PONG" ? {} : {
                    error: `Unexpected redis ping: ${pong}`
                }
            };
        } catch (error) {
            return {
                status: "error",
                latencyMs: Date.now() - startedAt,
                error: error instanceof Error ? error.message : String(error)
            };
        } finally{
            if (client.isOpen) {
                await client.quit();
            }
        }
    }
    getRedisConfig() {
        const redisUrl = this.configService.get("REDIS_URL");
        if (redisUrl) {
            return {
                url: redisUrl
            };
        }
        return {
            socket: {
                host: this.configService.get("REDIS_HOST", "localhost"),
                port: this.configService.get("REDIS_PORT", 6379),
                connectTimeout: 3000
            },
            password: this.configService.get("REDIS_PASSWORD"),
            database: this.configService.get("REDIS_DB", 0)
        };
    }
    emitAlert(event, severity, context, fingerprint) {
        const key = `${event}:${fingerprint}`;
        const previous = this.recentAlerts.get(key);
        const now = Date.now();
        if (previous && now - previous < ALERT_SUPPRESSION_MS) {
            return;
        }
        this.recentAlerts.set(key, now);
        this.loggingService.logSecurityEvent(event, severity, {
            eventType: "operations",
            ...context
        });
    }
    constructor(dataSource, configService, loggingService){
        this.dataSource = dataSource;
        this.configService = configService;
        this.loggingService = loggingService;
        this.recentAlerts = new Map();
        this.loggingService.setContext(OperationalMonitoringService.name);
    }
};
_ts_decorate([
    (0, _schedule.Cron)(_schedule.CronExpression.EVERY_5_MINUTES),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], OperationalMonitoringService.prototype, "emitOperationalAlerts", null);
OperationalMonitoringService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _logging.LoggingService === "undefined" ? Object : _logging.LoggingService
    ])
], OperationalMonitoringService);

//# sourceMappingURL=operational-monitoring.service.js.map