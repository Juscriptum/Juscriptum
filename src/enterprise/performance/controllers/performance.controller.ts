import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { QueryOptimizationService } from "../services/query-optimization.service";
import { JwtAuthGuard, SuperAdminGuard } from "../../../auth/guards";

@ApiTags("Performance")
@ApiBearerAuth()
@Controller("v1/performance")
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class PerformanceController {
  constructor(
    private readonly queryOptimizationService: QueryOptimizationService,
  ) {}

  @Get("stats")
  @ApiOperation({ summary: "Get database performance statistics" })
  async getStats() {
    return this.queryOptimizationService.getDatabaseStats();
  }

  @Get("slow-queries")
  @ApiOperation({ summary: "Get slow query logs" })
  async getSlowQueries(@Query("limit") limit?: number) {
    return {
      queries: this.queryOptimizationService.getSlowQueries(limit),
      summary: this.queryOptimizationService.getPerformanceSummary(),
    };
  }

  @Get("index-suggestions/:table")
  @ApiOperation({ summary: "Get index suggestions for table" })
  async getIndexSuggestions(@Param("table") table: string) {
    return this.queryOptimizationService.getIndexSuggestions(table);
  }

  @Post("analyze/:table")
  @ApiOperation({ summary: "Run VACUUM ANALYZE on table" })
  async vacuumAnalyze(@Param("table") table: string) {
    await this.queryOptimizationService.vacuumAnalyze(table);
    return { success: true, message: `VACUUM ANALYZE completed for ${table}` };
  }

  @Post("analyze-query")
  @ApiOperation({ summary: "Analyze query execution plan" })
  async analyzeQuery(@Query("query") query: string) {
    return this.queryOptimizationService.analyzeQueryPlan(query);
  }

  @Delete("slow-queries")
  @ApiOperation({ summary: "Clear slow query logs" })
  async clearSlowQueries() {
    this.queryOptimizationService.clearSlowQueryLogs();
    return { success: true };
  }
}
