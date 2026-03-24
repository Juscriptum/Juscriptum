"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _core = require("@nestjs/core");
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _express = /*#__PURE__*/ _interop_require_wildcard(require("express"));
const _helmet = /*#__PURE__*/ _interop_require_default(require("helmet"));
const _path = require("path");
const _appmodule = require("./app.module");
const _environmentvalidator = require("./common/config/environment.validator");
const _logging = require("./common/logging");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
async function bootstrap() {
    const logger = new _common.Logger("Bootstrap");
    logger.log("Starting application...");
    console.log("[DEBUG] Creating Nest application...");
    const app = await _core.NestFactory.create(_appmodule.AppModule, {
        bufferLogs: true,
        rawBody: true
    });
    console.log("[DEBUG] Nest application created");
    app.useLogger(logger);
    console.log("[DEBUG] Logger set");
    // Validate environment variables
    const configService = app.get(_config.ConfigService);
    console.log("[DEBUG] ConfigService obtained");
    const envValidator = new _environmentvalidator.EnvironmentValidator(configService);
    envValidator.validate();
    console.log("[DEBUG] Environment validated");
    app.use((0, _helmet.default)({
        // API responses are fronted by nginx; keep CSP there to avoid conflicting
        // policies while still applying the rest of Helmet's headers in Nest.
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));
    // Enable validation with enhanced security options
    app.useGlobalPipes(new _common.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true
        },
        disableErrorMessages: configService.get("NODE_ENV") === "production"
    }));
    const loggingService = await app.resolve(_logging.LoggingService);
    app.useGlobalFilters(new _logging.GlobalExceptionFilter(loggingService));
    // Global API prefix (health/readiness stay unprefixed, API stays at /v1)
    app.setGlobalPrefix("v1", {
        exclude: [
            "health",
            "readiness"
        ]
    });
    if (configService.get("NODE_ENV") !== "production") {
        const localStorageDir = (0, _path.resolve)(configService.get("LOCAL_STORAGE_DIR", "./storage") || "./storage");
        app.use("/storage", _express.static(localStorageDir));
    }
    // Enable CORS with security settings
    const allowedOrigins = configService.get("ALLOWED_ORIGINS");
    app.enableCors({
        origin: allowedOrigins?.split(",") || true,
        // The API is bearer-token based and does not rely on browser cookies.
        // Keep cross-site credentials disabled so the perimeter stays explicitly stateless.
        credentials: false,
        methods: [
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With"
        ],
        exposedHeaders: [
            "X-Total-Count",
            "X-Page",
            "X-Per-Page"
        ],
        maxAge: 3600
    });
    const port = configService.get("PORT") || 3000;
    await app.listen(port);
    logger.log(`Application is running on: http://localhost:${port}`);
    logger.log(`Environment: ${configService.get("NODE_ENV") || "development"}`);
    logger.log(`API Version: v1`);
}
bootstrap().catch((err)=>{
    console.error("Bootstrap failed:", err);
    process.exit(1);
});

//# sourceMappingURL=main.js.map