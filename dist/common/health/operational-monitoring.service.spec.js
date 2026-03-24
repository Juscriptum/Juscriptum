"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _redis = require("redis");
const _operationalmonitoringservice = require("./operational-monitoring.service");
const _FileScanRecordentity = require("../../database/entities/FileScanRecord.entity");
const _TrustVerificationJobentity = require("../../database/entities/TrustVerificationJob.entity");
const _Outboxentity = require("../../enterprise/entities/Outbox.entity");
const _Subscriptionentity = require("../../database/entities/Subscription.entity");
const _Userentity = require("../../database/entities/User.entity");
jest.mock("redis", ()=>({
        createClient: jest.fn()
    }));
describe("OperationalMonitoringService", ()=>{
    let service;
    let configService;
    let loggingService;
    let dataSource;
    let repositories;
    beforeEach(()=>{
        repositories = new Map();
        repositories.set(_FileScanRecordentity.FileScanRecord, {
            count: jest.fn()
        });
        repositories.set(_TrustVerificationJobentity.TrustVerificationJob, {
            count: jest.fn()
        });
        repositories.set(_Outboxentity.Outbox, {
            count: jest.fn()
        });
        repositories.set(_Subscriptionentity.Subscription, {
            count: jest.fn()
        });
        repositories.set(_Userentity.User, {
            count: jest.fn()
        });
        dataSource = {
            query: jest.fn().mockResolvedValue([
                {
                    "?column?": 1
                }
            ]),
            getRepository: jest.fn((entity)=>repositories.get(entity))
        };
        configService = {
            get: jest.fn((key, defaultValue)=>{
                if (key === "NODE_ENV") {
                    return "production";
                }
                if (key === "REDIS_ENABLED") {
                    return "true";
                }
                if (key === "REDIS_URL") {
                    return "redis://localhost:6379";
                }
                return defaultValue;
            })
        };
        loggingService = {
            setContext: jest.fn(),
            logSecurityEvent: jest.fn()
        };
        _redis.createClient.mockReturnValue({
            connect: jest.fn().mockResolvedValue(undefined),
            ping: jest.fn().mockResolvedValue("PONG"),
            quit: jest.fn().mockResolvedValue(undefined),
            isOpen: true
        });
        for (const repo of repositories.values()){
            repo.count.mockResolvedValue(0);
        }
        service = new _operationalmonitoringservice.OperationalMonitoringService(dataSource, configService, loggingService);
    });
    it("should report degraded readiness when worker backlog and billing anomalies exist", async ()=>{
        (repositories.get(_Userentity.User)?.count).mockResolvedValueOnce(1);
        (repositories.get(_Subscriptionentity.Subscription)?.count).mockResolvedValueOnce(2);
        (repositories.get(_TrustVerificationJobentity.TrustVerificationJob)?.count).mockResolvedValueOnce(21).mockResolvedValueOnce(0);
        (repositories.get(_FileScanRecordentity.FileScanRecord)?.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
        (repositories.get(_Outboxentity.Outbox)?.count).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
        const report = await service.getReadinessReport();
        expect(report.status).toBe("error");
        expect(report.components.database.status).toBe("ok");
        expect(report.components.redis.status).toBe("ok");
        expect(report.components.monitoring.auth.lockedAccounts).toBe(1);
        expect(report.components.monitoring.workers.trustVerification.status).toBe("error");
        expect(report.components.monitoring.billing.anomalousSubscriptions).toBe(2);
        expect(report.components.monitoring.workers.malwareScanning.infectedLast24h).toBe(1);
    });
    it("should emit deduplicated operational alerts for critical anomalies", async ()=>{
        (repositories.get(_Userentity.User)?.count).mockResolvedValueOnce(2);
        (repositories.get(_Subscriptionentity.Subscription)?.count).mockResolvedValueOnce(1);
        (repositories.get(_TrustVerificationJobentity.TrustVerificationJob)?.count).mockResolvedValueOnce(25).mockResolvedValueOnce(1);
        (repositories.get(_FileScanRecordentity.FileScanRecord)?.count).mockResolvedValueOnce(22).mockResolvedValueOnce(1).mockResolvedValueOnce(3);
        (repositories.get(_Outboxentity.Outbox)?.count).mockResolvedValueOnce(60).mockResolvedValueOnce(1);
        await service.emitOperationalAlerts();
        await service.emitOperationalAlerts();
        expect(loggingService.logSecurityEvent).toHaveBeenCalledWith("infected_uploads_detected", "critical", expect.objectContaining({
            infectedLast24h: 3
        }));
        expect(loggingService.logSecurityEvent).toHaveBeenCalledWith("billing_anomalies_detected", "medium", expect.objectContaining({
            anomalousSubscriptions: 1
        }));
        expect(loggingService.logSecurityEvent).toHaveBeenCalledTimes(8);
    });
});

//# sourceMappingURL=operational-monitoring.service.spec.js.map