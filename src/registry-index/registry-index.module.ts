import { Module } from "@nestjs/common";
import { RegistryIndexBootstrapService } from "./services/registry-index.bootstrap.service";
import { RegistryIndexService } from "./services/registry-index.service";
import { RegistryIndexSchedulerService } from "./services/registry-index.scheduler.service";

@Module({
  providers: [
    RegistryIndexService,
    RegistryIndexSchedulerService,
    RegistryIndexBootstrapService,
  ],
  exports: [RegistryIndexService],
})
export class RegistryIndexModule {}
