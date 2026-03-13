import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { DocumentSignature } from "../database/entities/DocumentSignature.entity";
import { TrustVerificationJob } from "../database/entities/TrustVerificationJob.entity";
import { UserIdentity } from "../database/entities/UserIdentity.entity";
import { TrustVerificationController } from "./controllers/trust-verification.controller";
import { TrustVerificationService } from "./services/trust-verification.service";
import { TrustVerificationWorkerService } from "./services/trust-verification-worker.service";
import {
  AcskTrustProviderAdapter,
  BankIdNbuTrustProviderAdapter,
  DiiaTrustProviderAdapter,
  ManualTrustProviderAdapter,
} from "./services/trust-provider.adapters";
import { TrustCallbackAuthService } from "./services/trust-callback-auth.service";
import { TrustProviderRegistry } from "./services/trust-provider.registry";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserIdentity,
      DocumentSignature,
      TrustVerificationJob,
    ]),
    AuthModule,
  ],
  controllers: [TrustVerificationController],
  providers: [
    TrustVerificationService,
    TrustVerificationWorkerService,
    TrustProviderRegistry,
    TrustCallbackAuthService,
    AcskTrustProviderAdapter,
    DiiaTrustProviderAdapter,
    BankIdNbuTrustProviderAdapter,
    ManualTrustProviderAdapter,
  ],
  exports: [TrustVerificationService],
})
export class TrustVerificationModule {}
