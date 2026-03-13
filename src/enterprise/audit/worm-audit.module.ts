import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditController } from "./controllers/audit.controller";
import { WormAuditService } from "./services/worm-audit.service";
import { AuditInterceptor } from "./interceptors/audit.interceptor";
import { WormAuditLog } from "./entities/WormAuditLog.entity";
import { Organization } from "../../database/entities/Organization.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([WormAuditLog, Organization])],
  controllers: [AuditController],
  providers: [WormAuditService, AuditInterceptor],
  exports: [WormAuditService, AuditInterceptor],
})
export class WormAuditModule {}
