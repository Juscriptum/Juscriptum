import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "../auth/guards";
import {
  IsArray,
  IsObject,
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsNumber,
} from "class-validator";
import { Type } from "class-transformer";
import { LoggingService } from "../common/logging";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export class LogEntryDto {
  @IsString()
  timestamp: string;

  @IsEnum(["debug", "info", "warn", "error", "fatal"])
  level: LogLevel;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  context?: string;

  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsObject()
  @IsOptional()
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class LogBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LogEntryDto)
  logs: LogEntryDto[];
}

/**
 * Logs Controller
 * Receives and stores frontend logs
 */
@ApiTags("Logs")
@Controller("logs")
export class LogsController {
  constructor(private readonly loggingService: LoggingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { limit: 30, ttl: 60000 } }) // 30 requests per minute
  @ApiOperation({ summary: "Submit frontend logs" })
  @ApiResponse({ status: 204, description: "Logs received" })
  @ApiResponse({ status: 400, description: "Invalid log data" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async receiveLogs(@Body() dto: LogBatchDto): Promise<void> {
    for (const log of dto.logs) {
      this.processLogEntry(log);
    }
  }

  /**
   * Process a single log entry
   */
  private processLogEntry(log: LogEntryDto): void {
    const context = log.context ? `[Frontend:${log.context}]` : "[Frontend]";
    const metadata = {
      ...log.metadata,
      userId: log.userId,
      tenantId: log.tenantId,
      url: log.url,
      userAgent: log.userAgent,
    };

    switch (log.level) {
      case "debug":
        this.loggingService.debug(`${context} ${log.message}`, metadata);
        break;
      case "info":
        this.loggingService.log(`${context} ${log.message}`, metadata);
        break;
      case "warn":
        this.loggingService.warn(`${context} ${log.message}`, metadata);
        break;
      case "error":
      case "fatal":
        const error = log.error
          ? new Error(`${log.error.name}: ${log.error.message}`)
          : new Error(log.message);
        if (log.error?.stack) {
          error.stack = log.error.stack;
        }
        this.loggingService.error(
          `${context} ${log.message}`,
          error.stack,
          metadata,
        );
        break;
    }
  }
}
