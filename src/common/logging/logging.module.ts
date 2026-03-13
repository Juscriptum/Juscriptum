import { Module, DynamicModule, Provider, Logger } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggingService } from "./logging.service";

/**
 * Logging module configuration options
 */
export interface LoggingModuleOptions {
  enableRequestLogging?: boolean;
  enableMethodLogging?: boolean;
  enablePerformanceLogging?: boolean;
  performanceThreshold?: number;
}

/**
 * Logging module interface for dynamic module
 */
export interface LoggingModuleAsyncOptions extends LoggingModuleOptions {
  imports?: any[];
  inject?: any[];
  useFactory?: (
    ...args: any[]
  ) => Promise<LoggingModuleOptions> | LoggingModuleOptions;
}

/**
 * Logging module provider token
 */
export const LOGGING_OPTIONS = "LOGGING_OPTIONS";

/**
 * Simple console logger factory
 */
function createConsoleLogger(configService: ConfigService): any {
  const logLevel = configService.get("LOG_LEVEL", "debug");
  const logger = new Logger();

  return {
    debug: (message: any, ...meta: any[]) => logger.debug?.(message),
    error: (message: any, trace?: string, ...meta: any[]) =>
      logger.error(message, trace),
    info: (message: any, ...meta: any[]) => logger.log(message),
    warn: (message: any, ...meta: any[]) => logger.warn(message),
    verbose: (message: any, ...meta: any[]) => logger.verbose?.(message),
    log: (level: string, message: any, ...meta: any[]) => logger.log(message),
  };
}

/**
 * Logging Module
 * Provides structured logging with context support
 */
@Module({})
export class LoggingModule {
  /**
   * Register logging module synchronously
   */
  static register(options: LoggingModuleOptions = {}): DynamicModule {
    const optionsProvider: Provider = {
      provide: LOGGING_OPTIONS,
      useValue: options,
    };

    const loggerProvider: Provider = {
      provide: "WINSTON_LOGGER",
      useFactory: (configService: ConfigService) =>
        createConsoleLogger(configService),
      inject: [ConfigService],
    };

    return {
      module: LoggingModule,
      imports: [ConfigModule],
      providers: [optionsProvider, loggerProvider, LoggingService],
      exports: [LoggingService],
      global: true,
    };
  }

  /**
   * Register logging module asynchronously
   */
  static registerAsync(options: LoggingModuleAsyncOptions): DynamicModule {
    const asyncOptionsProvider: Provider = {
      provide: LOGGING_OPTIONS,
      useFactory: options.useFactory || (async () => ({})),
      inject: options.inject || [],
    };

    const loggerProvider: Provider = {
      provide: "WINSTON_LOGGER",
      useFactory: (configService: ConfigService) =>
        createConsoleLogger(configService),
      inject: [ConfigService],
    };

    return {
      module: LoggingModule,
      imports: [...(options.imports || []), ConfigModule],
      providers: [asyncOptionsProvider, loggerProvider, LoggingService],
      exports: [LoggingService],
      global: true,
    };
  }
}
