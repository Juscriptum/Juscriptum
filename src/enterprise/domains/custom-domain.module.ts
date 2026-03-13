import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomDomainController } from "./controllers/custom-domain.controller";
import { CustomDomainService } from "./services/custom-domain.service";
import { DomainRoutingMiddleware } from "./middleware/domain-routing.middleware";
import { CustomDomain } from "./entities/CustomDomain.entity";
import { Organization } from "../../database/entities/Organization.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CustomDomain, Organization])],
  controllers: [CustomDomainController],
  providers: [CustomDomainService, DomainRoutingMiddleware],
  exports: [CustomDomainService, DomainRoutingMiddleware],
})
export class CustomDomainModule {}
