"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EnvironmentValidator", {
    enumerable: true,
    get: function() {
        return EnvironmentValidator;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let EnvironmentValidator = class EnvironmentValidator {
    /**
   * Validate all required environment variables
   * Throws error if critical variables are missing in production
   */ validate() {
        const nodeEnv = this.configService.get("NODE_ENV", "development");
        const isProduction = nodeEnv === "production";
        this.logger.log(`Validating environment variables for ${nodeEnv} environment`);
        const errors = [];
        // Critical security variables
        this.validateVariable("JWT_SECRET", isProduction, errors, {
            minLength: 32,
            description: "JWT secret key for access tokens"
        });
        this.validateVariable("JWT_REFRESH_SECRET", isProduction, errors, {
            minLength: 32,
            description: "JWT secret key for refresh tokens"
        });
        this.validateVariable("PLATFORM_ADMIN_JWT_SECRET", isProduction, errors, {
            minLength: 32,
            description: "JWT secret key for platform-admin access and refresh tokens"
        });
        this.validateVariable("ENCRYPTION_KEY", isProduction, errors, {
            minLength: 64,
            sensitive: true,
            description: "64-character hex key for field-level encryption"
        });
        // Database configuration
        this.validateAnyVariable([
            "DB_TYPE"
        ], errors);
        this.validateAnyVariable([
            "DB_NAME",
            "DATABASE_NAME"
        ], errors);
        const dbType = this.configService.get("DB_TYPE") || this.configService.get("DATABASE_TYPE");
        if (dbType === "postgres") {
            this.validateAnyVariable([
                "DB_HOST",
                "DATABASE_HOST"
            ], errors);
            this.validateAnyVariable([
                "DB_PORT",
                "DATABASE_PORT"
            ], errors);
            this.validateAnyVariable([
                "DB_USER",
                "DATABASE_USER"
            ], errors);
            this.validateAnyVariable([
                "DB_PASSWORD",
                "DATABASE_PASSWORD"
            ], errors, {
                sensitive: true
            });
        }
        // Application URL
        this.validateVariable("APP_URL", isProduction, errors);
        this.validateVariable("ALLOWED_ORIGINS", isProduction, errors, {
            description: "comma-separated allowed frontend origins"
        });
        const redisEnabled = this.configService.get("REDIS_ENABLED", isProduction ? "true" : "false");
        if (redisEnabled === "false" || redisEnabled === "0") {
            if (isProduction) {
                errors.push("REDIS_ENABLED must not be false in production because throttling requires Redis-backed storage");
            }
        } else if (!this.configService.get("REDIS_URL")) {
            this.validateVariable("REDIS_HOST", isProduction, errors, {
                description: "Redis host for distributed throttling"
            });
            this.validateVariable("REDIS_PORT", isProduction, errors, {
                description: "Redis port for distributed throttling"
            });
        }
        // Email configuration (critical for password reset)
        this.validateVariable("SMTP_HOST", isProduction, errors);
        this.validateVariable("SMTP_PORT", isProduction, errors);
        this.validateVariable("SMTP_USER", isProduction, errors);
        this.validateVariable("SMTP_PASSWORD", isProduction, errors, {
            sensitive: true
        });
        // File storage configuration
        this.validateVariable("STORAGE_PROVIDER", isProduction, errors);
        if (this.configService.get("STORAGE_PROVIDER") === "s3") {
            this.validateVariable("AWS_S3_BUCKET", isProduction, errors);
            this.validateVariable("AWS_ACCESS_KEY_ID", isProduction, errors);
            this.validateVariable("AWS_SECRET_ACCESS_KEY", isProduction, errors, {
                sensitive: true
            });
            this.validateVariable("AWS_REGION", isProduction, errors);
        }
        const malwareScannerMode = this.configService.get("MALWARE_SCANNER_MODE", isProduction ? "" : "stub");
        if (!malwareScannerMode) {
            errors.push("MALWARE_SCANNER_MODE is required");
        } else if (isProduction && malwareScannerMode === "disabled") {
            errors.push("MALWARE_SCANNER_MODE must not be disabled in production because uploaded files must pass malware scanning");
        }
        this.validateTrustProviderEnvironment(isProduction, errors);
        // Stripe configuration (if billing is enabled)
        const stripeKey = this.configService.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
            this.logger.log("Stripe payment integration detected");
        }
        // WayForPay configuration (if billing is enabled)
        const wayforpayMerchant = this.configService.get("WAYFORPAY_MERCHANT_ACCOUNT");
        if (wayforpayMerchant) {
            this.logger.log("WayForPay payment integration detected");
        }
        // Security warnings
        this.checkSecurityWarnings();
        // Report errors
        if (errors.length > 0) {
            const errorMessage = `Environment validation failed:\n${errors.map((e)=>`  - ${e}`).join("\n")}`;
            this.logger.error(errorMessage);
            if (isProduction) {
                throw new Error(`FATAL: ${errorMessage}`);
            } else {
                this.logger.warn("Continuing in development mode despite missing environment variables");
            }
        } else {
            this.logger.log("Environment validation successful");
        }
    }
    /**
   * Validate a single environment variable
   */ validateVariable(key, isProduction, errors, options) {
        const value = this.configService.get(key);
        if (!value) {
            const message = options?.description ? `${key} (${options.description}) is required` : `${key} is required`;
            errors.push(message);
            return;
        }
        if (options?.minLength && value.length < options.minLength) {
            errors.push(`${key} must be at least ${options.minLength} characters long (currently ${value.length})`);
        }
        // Log non-sensitive values
        if (!options?.sensitive) {
            this.logger.debug(`${key} = ${value}`);
        } else {
            this.logger.debug(`${key} = [REDACTED]`);
        }
    }
    validateAnyVariable(keys, errors, options) {
        for (const key of keys){
            const value = this.configService.get(key);
            if (value) {
                this.validateVariable(key, false, errors, options);
                return;
            }
        }
        const label = keys.join(" or ");
        errors.push(options?.description ? `${label} (${options.description}) is required` : `${label} is required`);
    }
    /**
   * Check for security warnings
   */ checkSecurityWarnings() {
        const nodeEnv = this.configService.get("NODE_ENV", "development");
        const jwtSecret = this.configService.get("JWT_SECRET");
        const dbSync = this.configService.get("DB_SYNC", "true");
        const platformAdminJwtSecret = this.configService.get("PLATFORM_ADMIN_JWT_SECRET");
        const platformAdminBootstrapToken = this.configService.get("PLATFORM_ADMIN_BOOTSTRAP_TOKEN");
        // Warn about default secrets
        if (jwtSecret && (jwtSecret.includes("your-secret") || jwtSecret.includes("dev-only"))) {
            this.logger.warn("WARNING: Using default/weak JWT secret. Set a strong, unique JWT_SECRET in production!");
        }
        if (platformAdminJwtSecret && (platformAdminJwtSecret.includes("your-secret") || platformAdminJwtSecret.includes("dev-only") || platformAdminJwtSecret.includes("CHANGE_ME"))) {
            this.logger.warn("WARNING: Using default/weak PLATFORM_ADMIN_JWT_SECRET. Set a strong, unique secret for the owner back office.");
        }
        if (platformAdminBootstrapToken && (platformAdminBootstrapToken.length < 24 || platformAdminBootstrapToken.includes("CHANGE_ME"))) {
            this.logger.warn("WARNING: PLATFORM_ADMIN_BOOTSTRAP_TOKEN is weak or placeholder-like. Use a long random one-time secret and remove it after first-owner bootstrap.");
        }
        // Warn about database synchronization in production
        if (nodeEnv === "production" && dbSync !== "false") {
            this.logger.warn("WARNING: DB_SYNC is enabled in production. This should be disabled for safety!");
        }
        // Warn about development mode
        if (nodeEnv === "development") {
            this.logger.warn("Running in DEVELOPMENT mode. Do not use this configuration in production!");
        }
        // Check CORS configuration
        const allowedOrigins = this.configService.get("ALLOWED_ORIGINS");
        if (!allowedOrigins && nodeEnv === "production") {
            this.logger.warn("WARNING: ALLOWED_ORIGINS is not set. CORS will accept all origins in production!");
        }
        // Check rate limiting
        const throttleLimit = this.configService.get("THROTTLE_LIMIT", 100);
        if (throttleLimit > 200 && nodeEnv === "production") {
            this.logger.warn(`WARNING: THROTTLE_LIMIT is very high (${throttleLimit}). Consider lowering for better security.`);
        }
        // Check encryption
        const encryptPii = this.configService.get("ENCRYPT_PII");
        if (!encryptPii || encryptPii === "false") {
            this.logger.warn("WARNING: PII encryption is disabled. Enable ENCRYPT_PII=true for GDPR compliance in production.");
        }
    }
    validateTrustProviderEnvironment(isProduction, errors) {
        const providers = [
            {
                label: "ACSK",
                modeKey: "ACSK_TRUST_MODE",
                required: [
                    "ACSK_TRUST_VERIFY_SIGNATURE_URL",
                    "ACSK_TRUST_VERIFY_IDENTITY_URL",
                    "ACSK_TRUST_CALLBACK_SECRET"
                ]
            },
            {
                label: "DIIA",
                modeKey: "DIIA_TRUST_MODE",
                required: [
                    "DIIA_CLIENT_ID",
                    "DIIA_CLIENT_SECRET",
                    "DIIA_IDENTITY_VERIFY_URL",
                    "DIIA_SIGN_VERIFY_URL",
                    "DIIA_CALLBACK_SECRET"
                ]
            },
            {
                label: "BANKID_NBU",
                modeKey: "BANKID_NBU_MODE",
                required: [
                    "BANKID_CLIENT_ID",
                    "BANKID_CLIENT_SECRET",
                    "BANKID_NBU_IDENTITY_URL",
                    "BANKID_NBU_CALLBACK_SECRET"
                ]
            }
        ];
        for (const provider of providers){
            const mode = this.configService.get(provider.modeKey, "stub");
            if (mode !== "live") {
                continue;
            }
            for (const key of provider.required){
                this.validateVariable(key, isProduction, errors, {
                    description: `${provider.label} live trust integration`,
                    sensitive: key.includes("SECRET") || key.includes("PASSWORD") || key.includes("TOKEN")
                });
            }
        }
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(EnvironmentValidator.name);
    }
};
EnvironmentValidator = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], EnvironmentValidator);

//# sourceMappingURL=environment.validator.js.map