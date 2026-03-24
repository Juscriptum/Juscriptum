"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _core = require("@nestjs/core");
const _appmodule = require("./app.module");
async function bootstrapWorker() {
    const logger = new _common.Logger("WorkerBootstrap");
    process.env.RUN_SCHEDULED_JOBS = process.env.RUN_SCHEDULED_JOBS ?? "true";
    const app = await _core.NestFactory.createApplicationContext(_appmodule.AppModule, {
        bufferLogs: true
    });
    app.useLogger(logger);
    logger.log("Worker context started");
    const shutdown = async (signal)=>{
        logger.log(`Received ${signal}, shutting down worker context`);
        await app.close();
        process.exit(0);
    };
    process.on("SIGINT", ()=>{
        void shutdown("SIGINT");
    });
    process.on("SIGTERM", ()=>{
        void shutdown("SIGTERM");
    });
}
bootstrapWorker().catch((error)=>{
    // eslint-disable-next-line no-console
    console.error("Worker bootstrap failed:", error);
    process.exit(1);
});

//# sourceMappingURL=worker.js.map