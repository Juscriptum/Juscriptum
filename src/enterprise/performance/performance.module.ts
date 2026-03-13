import { Module, Global } from "@nestjs/common";
import { PerformanceController } from "./controllers/performance.controller";
import { QueryOptimizationService } from "./services/query-optimization.service";
import { QueryPerformanceInterceptor } from "./interceptors/query-performance.interceptor";

@Global()
@Module({
  controllers: [PerformanceController],
  providers: [QueryOptimizationService, QueryPerformanceInterceptor],
  exports: [QueryOptimizationService, QueryPerformanceInterceptor],
})
export class PerformanceModule {}
