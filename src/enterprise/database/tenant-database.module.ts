import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TenantDatabaseService } from "./services/tenant-database.service";
import { DatabaseRoutingMiddleware } from "./middleware/database-routing.middleware";
import { Organization } from "../../database/entities/Organization.entity";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  providers: [TenantDatabaseService, DatabaseRoutingMiddleware],
  exports: [TenantDatabaseService, DatabaseRoutingMiddleware],
})
export class TenantDatabaseModule {}
