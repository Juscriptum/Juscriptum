import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as express from "express";
import helmet from "helmet";
import { resolve } from "path";
import { AppModule } from "./app.module";
import { EnvironmentValidator } from "./common/config/environment.validator";
import { GlobalExceptionFilter, LoggingService } from "./common/logging";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  logger.log("Starting application...");

  console.log("[DEBUG] Creating Nest application...");
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  console.log("[DEBUG] Nest application created");

  app.useLogger(logger);
  console.log("[DEBUG] Logger set");

  // Validate environment variables
  const configService = app.get(ConfigService);
  console.log("[DEBUG] ConfigService obtained");

  const envValidator = new EnvironmentValidator(configService);
  envValidator.validate();
  console.log("[DEBUG] Environment validated");

  app.use(
    helmet({
      // API responses are fronted by nginx; keep CSP there to avoid conflicting
      // policies while still applying the rest of Helmet's headers in Nest.
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Enable validation with enhanced security options
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages:
        configService.get<string>("NODE_ENV") === "production",
    }),
  );

  const loggingService = await app.resolve(LoggingService);
  app.useGlobalFilters(new GlobalExceptionFilter(loggingService));

  // Global API prefix (health/readiness stay unprefixed, API stays at /v1)
  app.setGlobalPrefix("v1", { exclude: ["health", "readiness"] });

  if (configService.get<string>("NODE_ENV") !== "production") {
    const localStorageDir = resolve(
      configService.get<string>("LOCAL_STORAGE_DIR", "./storage") ||
        "./storage",
    );
    app.use("/storage", express.static(localStorageDir));
  }

  // Enable CORS with security settings
  const allowedOrigins = configService.get<string>("ALLOWED_ORIGINS");
  app.enableCors({
    origin: allowedOrigins?.split(",") || true,
    // The API is bearer-token based and does not rely on browser cookies.
    // Keep cross-site credentials disabled so the perimeter stays explicitly stateless.
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count", "X-Page", "X-Per-Page"],
    maxAge: 3600,
  });

  const port = configService.get<number>("PORT") || 3000;

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `Environment: ${configService.get<string>("NODE_ENV") || "development"}`,
  );
  logger.log(`API Version: v1`);
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
