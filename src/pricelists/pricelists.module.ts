import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PricelistsController } from "./controllers/pricelist.controller";
import { PricelistService } from "./services/pricelist.service";
import {
  Pricelist,
  PricelistCategory,
  PricelistItem,
} from "../database/entities";

/**
 * Pricelists Module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Pricelist, PricelistCategory, PricelistItem]),
  ],
  controllers: [PricelistsController],
  providers: [PricelistService],
  exports: [PricelistService],
})
export class PricelistsModule {}
