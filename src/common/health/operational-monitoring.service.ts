import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  DataSource,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  MoreThanOrEqual,
} from "typeorm";
import { createClient } from "redis";
import { LoggingService } from "../logging";
import { shouldRunScheduledTasks } from "../runtime/scheduled-tasks";
import { FileScanRecord } from "../../database/entities/FileScanRecord.entity";
import { TrustVerificationJob } from "../../database/entities/TrustVerificationJob.entity";
import { Outbox } from "../../enterprise/entities/Outbox.entity";
import { Subscription } from "../../database/entities/Subscription.entity";
import { SubscriptionStatus } from "../../database/entities/enums/subscription.enum";
import { User } from "../../database/entities/User.entity";

type ComponentState = "ok" | "degraded" | "error" | "disabled";

interface WorkerSnapshot {
  status: ComponentState;
  due: number;
  failed: number;
}

interface MonitoringSnapshot {
  auth: {
    status: ComponentState;
    lockedAccounts: number;
  };
  billing: {
    status: ComponentState;
    anomalousSubscriptions: number;
  };
  workers: {
    trustVerification: WorkerSnapshot;
    malwareScanning: WorkerSnapshot & {
      infectedLast24h: number;
    };
    outbox: {
      status: ComponentState;
      pending: number;
      deadLetterRisk: number;
    };
  };
}

const TRUST_JOB_BACKLOG_THRESHOLD = 20;
const MALWARE_SCAN_BACKLOG_THRESHOLD = 20;
const OUTBOX_BACKLOG_THRESHOLD = 50;
const ALERT_SUPPRESSION_MS = 15 * 60 * 1000;

@Injectable()
export class OperationalMonitoringService {
  private readonly recentAlerts = new Map<string, number>();

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.loggingService.setContext(OperationalMonitoringService.name);
  }

  async getLivenessReport(): Promise<{ status: "ok"; timestamp: string }> {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  async getReadinessReport(): Promise<{
    status: Exclude<ComponentState, "disabled">;
    timestamp: string;
    components: {
      app: { status: "ok" };
      database: { status: ComponentState; latencyMs?: number; error?: string };
      redis: { status: ComponentState; latencyMs?: number; error?: string };
      monitoring: MonitoringSnapshot;
    };
  }> {
    const [database, redis, monitoring] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.collectMonitoringSnapshot(),
    ]);

    const states: ComponentState[] = [
      database.status,
      redis.status,
      monitoring.auth.status,
      monitoring.billing.status,
      monitoring.workers.trustVerification.status,
      monitoring.workers.malwareScanning.status,
      monitoring.workers.outbox.status,
    ];

    const status: "ok" | "degraded" | "error" = states.includes("error")
      ? "error"
      : states.includes("degraded") || states.includes("disabled")
        ? "degraded"
        : "ok";

    return {
      status,
      timestamp: new Date().toISOString(),
      components: {
        app: { status: "ok" },
        database,
        redis,
        monitoring,
      },
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async emitOperationalAlerts(): Promise<void> {
    if (!shouldRunScheduledTasks()) {
      return;
    }

    const snapshot = await this.collectMonitoringSnapshot();

    if (snapshot.auth.lockedAccounts > 0) {
      this.emitAlert(
        "auth_locked_accounts_detected",
        "high",
        {
          lockedAccounts: snapshot.auth.lockedAccounts,
        },
        `locked:${snapshot.auth.lockedAccounts}`,
      );
    }

    if (snapshot.workers.trustVerification.failed > 0) {
      this.emitAlert(
        "trust_verification_failures_detected",
        "high",
        {
          failedJobs: snapshot.workers.trustVerification.failed,
          dueJobs: snapshot.workers.trustVerification.due,
        },
        `trust-failed:${snapshot.workers.trustVerification.failed}:${snapshot.workers.trustVerification.due}`,
      );
    }

    if (snapshot.workers.trustVerification.due >= TRUST_JOB_BACKLOG_THRESHOLD) {
      this.emitAlert(
        "trust_verification_backlog_detected",
        "high",
        {
          dueJobs: snapshot.workers.trustVerification.due,
          threshold: TRUST_JOB_BACKLOG_THRESHOLD,
        },
        `trust-backlog:${snapshot.workers.trustVerification.due}`,
      );
    }

    if (snapshot.workers.malwareScanning.infectedLast24h > 0) {
      this.emitAlert(
        "infected_uploads_detected",
        "critical",
        {
          infectedLast24h: snapshot.workers.malwareScanning.infectedLast24h,
        },
        `infected:${snapshot.workers.malwareScanning.infectedLast24h}`,
      );
    }

    if (snapshot.workers.malwareScanning.failed > 0) {
      this.emitAlert(
        "malware_scan_failures_detected",
        "high",
        {
          failedScans: snapshot.workers.malwareScanning.failed,
          dueScans: snapshot.workers.malwareScanning.due,
        },
        `scan-failed:${snapshot.workers.malwareScanning.failed}:${snapshot.workers.malwareScanning.due}`,
      );
    }

    if (
      snapshot.workers.malwareScanning.due >= MALWARE_SCAN_BACKLOG_THRESHOLD
    ) {
      this.emitAlert(
        "malware_scan_backlog_detected",
        "high",
        {
          dueScans: snapshot.workers.malwareScanning.due,
          threshold: MALWARE_SCAN_BACKLOG_THRESHOLD,
        },
        `scan-backlog:${snapshot.workers.malwareScanning.due}`,
      );
    }

    if (
      snapshot.workers.outbox.deadLetterRisk > 0 ||
      snapshot.workers.outbox.pending >= OUTBOX_BACKLOG_THRESHOLD
    ) {
      this.emitAlert(
        "outbox_delivery_backlog_detected",
        snapshot.workers.outbox.deadLetterRisk > 0 ? "high" : "medium",
        {
          pendingEvents: snapshot.workers.outbox.pending,
          deadLetterRisk: snapshot.workers.outbox.deadLetterRisk,
        },
        `outbox:${snapshot.workers.outbox.pending}:${snapshot.workers.outbox.deadLetterRisk}`,
      );
    }

    if (snapshot.billing.anomalousSubscriptions > 0) {
      this.emitAlert(
        "billing_anomalies_detected",
        "medium",
        {
          anomalousSubscriptions: snapshot.billing.anomalousSubscriptions,
        },
        `billing:${snapshot.billing.anomalousSubscriptions}`,
      );
    }
  }

  private async collectMonitoringSnapshot(): Promise<MonitoringSnapshot> {
    const now = new Date();
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const fileScanRepository = this.dataSource.getRepository(FileScanRecord);
    const trustRepository = this.dataSource.getRepository(TrustVerificationJob);
    const outboxRepository = this.dataSource.getRepository(Outbox);
    const subscriptionRepository = this.dataSource.getRepository(Subscription);
    const userRepository = this.dataSource.getRepository(User);

    const [
      lockedAccounts,
      anomalousSubscriptions,
      trustDue,
      trustFailed,
      malwareDue,
      malwareFailed,
      infectedLast24h,
      outboxPending,
      outboxDeadLetterRisk,
    ] = await Promise.all([
      userRepository.count({
        where: {
          lockedUntil: MoreThan(now),
          deletedAt: IsNull(),
        },
        withDeleted: true,
      }),
      subscriptionRepository.count({
        where: [
          { status: SubscriptionStatus.PAST_DUE },
          { status: SubscriptionStatus.UNPAID },
        ],
      }),
      trustRepository.count({
        where: [
          { status: "queued", nextAttemptAt: LessThanOrEqual(now) },
          { status: "retrying", nextAttemptAt: LessThanOrEqual(now) },
        ],
      }),
      trustRepository.count({
        where: {
          status: "failed",
        },
      }),
      fileScanRepository.count({
        where: [
          { status: "pending", nextAttemptAt: LessThanOrEqual(now) },
          { status: "failed", nextAttemptAt: LessThanOrEqual(now) },
        ],
      }),
      fileScanRepository.count({
        where: {
          status: "failed",
          scanAttempts: MoreThanOrEqual(3),
        },
      }),
      fileScanRepository.count({
        where: {
          status: "infected",
          scannedAt: MoreThan(last24Hours),
        },
      }),
      outboxRepository.count({
        where: {
          processed: false,
        },
      }),
      outboxRepository.count({
        where: {
          processed: false,
          retryCount: MoreThanOrEqual(3),
        },
      }),
    ]);

    return {
      auth: {
        status: lockedAccounts > 0 ? "degraded" : "ok",
        lockedAccounts,
      },
      billing: {
        status: anomalousSubscriptions > 0 ? "degraded" : "ok",
        anomalousSubscriptions,
      },
      workers: {
        trustVerification: {
          status:
            trustFailed > 0 || trustDue >= TRUST_JOB_BACKLOG_THRESHOLD
              ? "error"
              : trustDue > 0
                ? "degraded"
                : "ok",
          due: trustDue,
          failed: trustFailed,
        },
        malwareScanning: {
          status:
            malwareFailed > 0 || malwareDue >= MALWARE_SCAN_BACKLOG_THRESHOLD
              ? "error"
              : infectedLast24h > 0 || malwareDue > 0
                ? "degraded"
                : "ok",
          due: malwareDue,
          failed: malwareFailed,
          infectedLast24h,
        },
        outbox: {
          status:
            outboxDeadLetterRisk > 0 ||
            outboxPending >= OUTBOX_BACKLOG_THRESHOLD
              ? "error"
              : outboxPending > 0
                ? "degraded"
                : "ok",
          pending: outboxPending,
          deadLetterRisk: outboxDeadLetterRisk,
        },
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: ComponentState;
    latencyMs?: number;
    error?: string;
  }> {
    const startedAt = Date.now();

    try {
      await this.dataSource.query("SELECT 1");
      return {
        status: "ok",
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: "error",
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkRedis(): Promise<{
    status: ComponentState;
    latencyMs?: number;
    error?: string;
  }> {
    const nodeEnv = this.configService.get<string>("NODE_ENV", "development");
    const defaultRedis = nodeEnv === "production" ? "true" : "false";
    const redisEnabled = this.configService.get<string>(
      "REDIS_ENABLED",
      defaultRedis,
    );

    if (redisEnabled === "false" || redisEnabled === "0") {
      return {
        status: "disabled",
      };
    }

    const startedAt = Date.now();
    const client = createClient(this.getRedisConfig());

    try {
      await client.connect();
      const pong = await client.ping();

      return {
        status: pong === "PONG" ? "ok" : "error",
        latencyMs: Date.now() - startedAt,
        ...(pong === "PONG" ? {} : { error: `Unexpected redis ping: ${pong}` }),
      };
    } catch (error) {
      return {
        status: "error",
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (client.isOpen) {
        await client.quit();
      }
    }
  }

  private getRedisConfig():
    | { url: string }
    | {
        socket: { host: string; port: number; connectTimeout: number };
        password?: string;
        database: number;
      } {
    const redisUrl = this.configService.get<string>("REDIS_URL");

    if (redisUrl) {
      return { url: redisUrl };
    }

    return {
      socket: {
        host: this.configService.get<string>("REDIS_HOST", "localhost"),
        port: this.configService.get<number>("REDIS_PORT", 6379),
        connectTimeout: 3000,
      },
      password: this.configService.get<string>("REDIS_PASSWORD"),
      database: this.configService.get<number>("REDIS_DB", 0),
    };
  }

  private emitAlert(
    event: string,
    severity: "medium" | "high" | "critical",
    context: Record<string, unknown>,
    fingerprint: string,
  ): void {
    const key = `${event}:${fingerprint}`;
    const previous = this.recentAlerts.get(key);
    const now = Date.now();

    if (previous && now - previous < ALERT_SUPPRESSION_MS) {
      return;
    }

    this.recentAlerts.set(key, now);
    this.loggingService.logSecurityEvent(event, severity, {
      eventType: "operations",
      ...context,
    });
  }
}
