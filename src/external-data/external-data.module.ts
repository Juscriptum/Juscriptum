import { Module } from "@nestjs/common";
import { RegistryIndexModule } from "../registry-index/registry-index.module";
import {
  EXTERNAL_DATA_SOURCE_DEFINITIONS,
  buildDefaultExternalDataDefinitions,
} from "./external-data.constants";
import { ExternalDataSchedulerService } from "./services/external-data.scheduler.service";
import { ExternalDataService } from "./services/external-data.service";

@Module({
  imports: [RegistryIndexModule],
  providers: [
    {
      provide: EXTERNAL_DATA_SOURCE_DEFINITIONS,
      useFactory: () => buildDefaultExternalDataDefinitions(),
    },
    ExternalDataService,
    ExternalDataSchedulerService,
  ],
  exports: [ExternalDataService],
})
export class ExternalDataModule {}
