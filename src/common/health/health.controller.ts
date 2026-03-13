import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import { Response } from "express";
import { OperationalMonitoringService } from "./operational-monitoring.service";

/**
 * Health check endpoint for load balancers and Docker HEALTHCHECK
 */
@Controller()
export class HealthController {
  constructor(
    private readonly operationalMonitoringService: OperationalMonitoringService,
  ) {}

  @Get("health")
  async check() {
    return this.operationalMonitoringService.getLivenessReport();
  }

  @Get("readiness")
  async readiness(@Res({ passthrough: true }) response: Response) {
    const report = await this.operationalMonitoringService.getReadinessReport();

    if (report.status !== "ok") {
      response.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return report;
  }
}
