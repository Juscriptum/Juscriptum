import { ConfigService } from "@nestjs/config";
import { DataSource, Repository } from "typeorm";
import { createClient } from "redis";
import { OperationalMonitoringService } from "./operational-monitoring.service";
import { LoggingService } from "../logging";
import { FileScanRecord } from "../../database/entities/FileScanRecord.entity";
import { TrustVerificationJob } from "../../database/entities/TrustVerificationJob.entity";
import { Outbox } from "../../enterprise/entities/Outbox.entity";
import { Subscription } from "../../database/entities/Subscription.entity";
import { User } from "../../database/entities/User.entity";

jest.mock("redis", () => ({
  createClient: jest.fn(),
}));

type EntityClass = abstract new (...args: any[]) => any;

describe("OperationalMonitoringService", () => {
  let service: OperationalMonitoringService;
  let configService: jest.Mocked<ConfigService>;
  let loggingService: jest.Mocked<LoggingService>;
  let dataSource: {
    query: jest.Mock;
    getRepository: jest.Mock;
  };
  let repositories: Map<EntityClass, jest.Mocked<Partial<Repository<any>>>>;

  beforeEach(() => {
    repositories = new Map<
      EntityClass,
      jest.Mocked<Partial<Repository<any>>>
    >();
    repositories.set(FileScanRecord, { count: jest.fn() });
    repositories.set(TrustVerificationJob, { count: jest.fn() });
    repositories.set(Outbox, { count: jest.fn() });
    repositories.set(Subscription, { count: jest.fn() });
    repositories.set(User, { count: jest.fn() });

    dataSource = {
      query: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
      getRepository: jest.fn((entity: EntityClass) => repositories.get(entity)),
    };

    configService = {
      get: jest.fn((key: string, defaultValue?: unknown) => {
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
      }),
    } as unknown as jest.Mocked<ConfigService>;

    loggingService = {
      setContext: jest.fn(),
      logSecurityEvent: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>;

    (createClient as jest.Mock).mockReturnValue({
      connect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue("PONG"),
      quit: jest.fn().mockResolvedValue(undefined),
      isOpen: true,
    });

    for (const repo of repositories.values()) {
      (repo.count as jest.Mock).mockResolvedValue(0);
    }

    service = new OperationalMonitoringService(
      dataSource as unknown as DataSource,
      configService,
      loggingService,
    );
  });

  it("should report degraded readiness when worker backlog and billing anomalies exist", async () => {
    (repositories.get(User)?.count as jest.Mock).mockResolvedValueOnce(1);
    (repositories.get(Subscription)?.count as jest.Mock).mockResolvedValueOnce(
      2,
    );
    (repositories.get(TrustVerificationJob)?.count as jest.Mock)
      .mockResolvedValueOnce(21)
      .mockResolvedValueOnce(0);
    (repositories.get(FileScanRecord)?.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(1);
    (repositories.get(Outbox)?.count as jest.Mock)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const report = await service.getReadinessReport();

    expect(report.status).toBe("error");
    expect(report.components.database.status).toBe("ok");
    expect(report.components.redis.status).toBe("ok");
    expect(report.components.monitoring.auth.lockedAccounts).toBe(1);
    expect(report.components.monitoring.workers.trustVerification.status).toBe(
      "error",
    );
    expect(report.components.monitoring.billing.anomalousSubscriptions).toBe(2);
    expect(
      report.components.monitoring.workers.malwareScanning.infectedLast24h,
    ).toBe(1);
  });

  it("should emit deduplicated operational alerts for critical anomalies", async () => {
    (repositories.get(User)?.count as jest.Mock).mockResolvedValueOnce(2);
    (repositories.get(Subscription)?.count as jest.Mock).mockResolvedValueOnce(
      1,
    );
    (repositories.get(TrustVerificationJob)?.count as jest.Mock)
      .mockResolvedValueOnce(25)
      .mockResolvedValueOnce(1);
    (repositories.get(FileScanRecord)?.count as jest.Mock)
      .mockResolvedValueOnce(22)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);
    (repositories.get(Outbox)?.count as jest.Mock)
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(1);

    await service.emitOperationalAlerts();
    await service.emitOperationalAlerts();

    expect(loggingService.logSecurityEvent).toHaveBeenCalledWith(
      "infected_uploads_detected",
      "critical",
      expect.objectContaining({
        infectedLast24h: 3,
      }),
    );
    expect(loggingService.logSecurityEvent).toHaveBeenCalledWith(
      "billing_anomalies_detected",
      "medium",
      expect.objectContaining({
        anomalousSubscriptions: 1,
      }),
    );
    expect(loggingService.logSecurityEvent).toHaveBeenCalledTimes(8);
  });
});
