import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ClientsController } from "./controllers/clients.controller";
import { ClientService } from "./services/client.service";
import { CourtRegistryService } from "./services/court-registry.service";
import { Client } from "../database/entities/Client.entity";
import { Case } from "../database/entities/Case.entity";
import { Event } from "../database/entities/Event.entity";
import { ClientNumberRelease } from "../database/entities/ClientNumberRelease.entity";
import { Organization } from "../database/entities/Organization.entity";
import { RegistryIndexModule } from "../registry-index/registry-index.module";

/**
 * Clients Module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Case,
      Event,
      ClientNumberRelease,
      Organization,
    ]),
    RegistryIndexModule,
  ],
  controllers: [ClientsController],
  providers: [ClientService, CourtRegistryService],
  exports: [ClientService, CourtRegistryService],
})
export class ClientsModule {}
