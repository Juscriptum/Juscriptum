import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CalculationsController } from "./controllers/calculation.controller";
import { CalculationService } from "./services/calculation.service";
import {
  Case,
  Calculation,
  CalculationItem,
  Client,
  PricelistItem,
} from "../database/entities";

/**
 * Calculations Module
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Calculation,
      CalculationItem,
      PricelistItem,
      Case,
      Client,
    ]),
  ],
  controllers: [CalculationsController],
  providers: [CalculationService],
  exports: [CalculationService],
})
export class CalculationsModule {}
