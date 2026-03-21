import { Module } from "@nestjs/common";
import { RegistryIndexBootstrapService } from "./services/registry-index.bootstrap.service";
import { RegistryIndexService } from "./services/registry-index.service";
import { RegistryIndexSchedulerService } from "./services/registry-index.scheduler.service";
import { RegistryIndexSourceMonitorService } from "./services/registry-index.source-monitor.service";

@Module({
  providers: [
    RegistryIndexService,
    RegistryIndexSchedulerService,
    RegistryIndexBootstrapService,
    RegistryIndexSourceMonitorService,
  ],
  exports: [RegistryIndexService],
})
export class RegistryIndexModule {}
