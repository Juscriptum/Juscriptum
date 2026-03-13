import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CasesController } from "./controllers/cases.controller";
import { CaseService } from "./services/case.service";
import { CaseRegistrySyncService } from "./services/case-registry-sync.service";
import { Case } from "../database/entities/Case.entity";
import { Client } from "../database/entities/Client.entity";
import { Organization } from "../database/entities/Organization.entity";
import { Event } from "../database/entities/Event.entity";
import { ClientsModule } from "../clients/clients.module";

/**
 * Cases Module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Case, Client, Organization, Event]),
    ClientsModule,
  ],
  controllers: [CasesController],
  providers: [CaseService, CaseRegistrySyncService],
  exports: [CaseService],
})
export class CasesModule {}
