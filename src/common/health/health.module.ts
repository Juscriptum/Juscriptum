import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { OperationalMonitoringService } from "./operational-monitoring.service";

@Module({
  controllers: [HealthController],
  providers: [OperationalMonitoringService],
  exports: [OperationalMonitoringService],
})
export class HealthModule {}
