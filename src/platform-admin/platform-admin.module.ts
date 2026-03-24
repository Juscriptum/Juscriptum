import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import {
  AuditLog,
  Document,
  Organization,
  PlatformAdminRefreshToken,
  PlatformAdminRevokedAccessToken,
  PlatformAdminUser,
  Subscription,
  User,
} from "../database/entities";
import { PlatformAdminAuthController } from "./controllers/platform-admin-auth.controller";
import { PlatformAdminBlueprintController } from "./controllers/platform-admin-blueprint.controller";
import { PlatformAdminDashboardController } from "./controllers/platform-admin-dashboard.controller";
import { PlatformAdminOrganizationsController } from "./controllers/platform-admin-organizations.controller";
import { PlatformAdminJwtAuthGuard } from "./guards";
import {
  PlatformAdminAuthService,
  PlatformAdminJwtService,
  PlatformAdminReadService,
} from "./services";
import { PlatformAdminJwtStrategy } from "./strategies/platform-admin-jwt.strategy";
import { HealthModule } from "../common/health";

@Module({
  imports: [
    HealthModule,
    TypeOrmModule.forFeature([
      Organization,
      User,
      Subscription,
      Document,
      AuditLog,
      PlatformAdminUser,
      PlatformAdminRefreshToken,
      PlatformAdminRevokedAccessToken,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("PLATFORM_ADMIN_JWT_SECRET");
        const nodeEnv = configService.get<string>("NODE_ENV", "development");

        if (!secret && nodeEnv === "production") {
          throw new Error(
            "FATAL: PLATFORM_ADMIN_JWT_SECRET environment variable is required in production",
          );
        }

        if (!secret) {
          console.warn(
            "WARNING: Using default platform-admin JWT secret in development mode. Set PLATFORM_ADMIN_JWT_SECRET for production!",
          );
        }

        return {
          secret: secret || "platform-admin-dev-only-secret-not-for-production",
          signOptions: {
            expiresIn: configService.get<string>(
              "PLATFORM_ADMIN_JWT_ACCESS_TOKEN_EXPIRY",
              "15m",
            ),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [
    PlatformAdminAuthController,
    PlatformAdminBlueprintController,
    PlatformAdminDashboardController,
    PlatformAdminOrganizationsController,
  ],
  providers: [
    PlatformAdminAuthService,
    PlatformAdminJwtService,
    PlatformAdminReadService,
    PlatformAdminJwtStrategy,
    PlatformAdminJwtAuthGuard,
  ],
  exports: [
    PlatformAdminAuthService,
    PlatformAdminJwtAuthGuard,
    PlatformAdminReadService,
  ],
})
export class PlatformAdminModule {}
