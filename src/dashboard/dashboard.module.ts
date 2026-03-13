import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DashboardController } from "./controllers/dashboard.controller";
import { DashboardService } from "./services/dashboard.service";
import { Case } from "../database/entities/Case.entity";
import { Client } from "../database/entities/Client.entity";
import { Event } from "../database/entities/Event.entity";
import { AuditLog } from "../database/entities/AuditLog.entity";
import { Invoice } from "../database/entities/Invoice.entity";

/**
 * Dashboard Module
 * Provides statistics and widget data for the main dashboard
 */
@Module({
  imports: [TypeOrmModule.forFeature([Case, Client, Event, AuditLog, Invoice])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
