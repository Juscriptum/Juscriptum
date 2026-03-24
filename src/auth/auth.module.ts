import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RegistryIndexModule } from "../registry-index/registry-index.module";

// Entities
import { User } from "../database/entities/User.entity";
import { Organization } from "../database/entities/Organization.entity";
import { RefreshToken } from "../database/entities/RefreshToken.entity";
import { RevokedAccessToken } from "../database/entities/RevokedAccessToken.entity";
import { Subscription } from "../database/entities/Subscription.entity";
import { AuditLog } from "../database/entities/AuditLog.entity";
import { OnboardingProgress } from "../database/entities/OnboardingProgress.entity";
import { Invitation } from "../database/entities/Invitation.entity";

// Services
import { AuthService } from "./services/auth.service";
import { JwtService } from "./services/jwt.service";
import { OrganizationService } from "./services/organization.service";
import { AuditService } from "./services/audit.service";
import { UsersService } from "./services/users.service";

// Controllers
import { AuthController } from "./controllers/auth.controller";
import { OrganizationController } from "./controllers/organization.controller";
import { UsersController } from "./controllers/users.controller";
import { AuditLogsController } from "./controllers/audit-logs.controller";

// Strategies
import { JwtStrategy } from "./strategies/jwt.strategy";
import { RefreshStrategy } from "./strategies/refresh.strategy";

// Guards
import { JwtAuthGuard } from "./guards";
import {
  TenantGuard,
  RbacGuard,
  SubscriptionGuard,
  SuperAdminGuard,
} from "./guards";

/**
 * Auth Module
 */
@Module({
  imports: [
    RegistryIndexModule,
    TypeOrmModule.forFeature([
      User,
      Organization,
      RefreshToken,
      RevokedAccessToken,
      Subscription,
      AuditLog,
      OnboardingProgress,
      Invitation,
    ]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        const nodeEnv = configService.get<string>("NODE_ENV", "development");

        // CRITICAL: Fail in production if JWT_SECRET is not set
        if (!secret) {
          if (nodeEnv === "production") {
            throw new Error(
              "FATAL: JWT_SECRET environment variable is required in production",
            );
          }
          console.warn(
            "WARNING: Using default JWT secret in development mode. Set JWT_SECRET for production!",
          );
        }

        return {
          secret: secret || "dev-only-secret-key-not-for-production",
          signOptions: {
            expiresIn: configService.get<string>(
              "JWT_ACCESS_TOKEN_EXPIRY",
              "15m",
            ),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [
    AuthController,
    OrganizationController,
    UsersController,
    AuditLogsController,
  ],
  providers: [
    AuthService,
    JwtService,
    OrganizationService,
    AuditService,
    UsersService,
    JwtStrategy,
    RefreshStrategy,
    JwtAuthGuard,
    TenantGuard,
    RbacGuard,
    SubscriptionGuard,
    SuperAdminGuard,
  ],
  exports: [
    AuthService,
    JwtService,
    OrganizationService,
    AuditService,
    UsersService,
    JwtAuthGuard,
    TenantGuard,
    RbacGuard,
    SubscriptionGuard,
    SuperAdminGuard,
  ],
})
export class AuthModule {}
