import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggingModule } from "./common/logging";
import { RedisThrottlerStorage } from "./common/security/redis-throttler.storage";
import { normalizeLegacyDateTimeColumnsForDatabase } from "./common/typeorm/legacy-datetime-column-type";
import {
  RlsContextStore,
  RlsInterceptor,
  RlsQueryRunnerPatcher,
} from "./common/interceptors/rls.interceptor";
import { AuthModule } from "./auth";
import { BillingModule } from "./billing";
import { CasesModule } from "./cases";
import { ClientsModule } from "./clients";
import { DocumentsModule } from "./documents";
import { EventsModule } from "./events";
import { PricelistsModule } from "./pricelists";
import { InvoicesModule } from "./invoices";
import { CalculationsModule } from "./calculations";
import { DashboardModule } from "./dashboard";
import { FileStorageModule } from "./file-storage";
import { NotificationsModule } from "./notifications";
import { NotesModule } from "./notes";
import { TrustVerificationModule } from "./trust-verification/trust-verification.module";
import { ExternalDataModule } from "./external-data/external-data.module";
import { PlatformAdminModule } from "./platform-admin";
// import { EnterpriseModule } from './enterprise/enterprise.module';
import { HealthModule } from "./common/health";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const storage = new RedisThrottlerStorage(configService);
        await storage.initialize();

        return [
          {
            ttl: 60000,
            limit: 100,
            storage,
          },
        ];
      },
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>("NODE_ENV", "development");
        const dbType = configService.get<string>("DB_TYPE", "sqlite");

        normalizeLegacyDateTimeColumnsForDatabase(dbType);

        // Support both ts-jest (TS sources) and compiled JS runtime.
        const entitiesPath = `${__dirname}/database/entities/*.entity{.ts,.js}`;

        if (dbType === "sqlite" || nodeEnv === "development") {
          return {
            type: "better-sqlite3",
            database: configService.get<string>("DB_NAME", "law_organizer.db"),
            entities: [entitiesPath],
            synchronize: true, // Enabled for development to auto-create tables
            logging: true,
          };
        }
        return {
          type: "postgres",
          host:
            configService.get<string>("DATABASE_HOST") ||
            configService.get<string>("DB_HOST", "localhost"),
          port:
            configService.get<number>("DATABASE_PORT") ??
            configService.get<number>("DB_PORT", 5432),
          username:
            configService.get<string>("DATABASE_USER") ||
            configService.get<string>("DB_USER"),
          password:
            configService.get<string>("DATABASE_PASSWORD") ??
            configService.get<string>("DB_PASSWORD", ""),
          database:
            configService.get<string>("DATABASE_NAME") ||
            configService.get<string>("DB_NAME", "law_organizer"),
          entities: [entitiesPath],
          synchronize: nodeEnv !== "production",
          logging: nodeEnv === "development",
        };
      },
      inject: [ConfigService],
    }),
    LoggingModule.register({
      enableRequestLogging: false,
      enableMethodLogging: false,
      enablePerformanceLogging: false,
      performanceThreshold: 1000,
    }),
    // EnterpriseModule, // Temporarily disabled for debugging
    AuthModule,
    BillingModule,
    CasesModule,
    ClientsModule,
    DocumentsModule,
    EventsModule,
    PricelistsModule,
    InvoicesModule,
    CalculationsModule,
    DashboardModule,
    FileStorageModule,
    NotificationsModule,
    NotesModule,
    TrustVerificationModule,
    PlatformAdminModule,
    ExternalDataModule,
    HealthModule,
  ],
  providers: [
    RlsContextStore,
    RlsQueryRunnerPatcher,
    {
      provide: APP_INTERCEPTOR,
      useClass: RlsInterceptor,
    },
  ],
})
export class AppModule {}
