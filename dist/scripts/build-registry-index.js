"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _registryindexservice = require("../registry-index/services/registry-index.service");
const _loadscriptenv = require("./load-script-env");
function parseArgs(argv) {
    const sourceArg = argv.find((argument)=>argument.startsWith("--source="));
    const force = argv.includes("--force");
    const source = sourceArg?.split("=")[1];
    return {
        source,
        force
    };
}
async function main() {
    (0, _loadscriptenv.loadScriptEnv)();
    const logger = new _common.Logger("BuildRegistryIndexScript");
    const options = parseArgs(process.argv.slice(2));
    const service = new _registryindexservice.RegistryIndexService();
    try {
        logger.log(`Building registry index${options.source ? ` for ${options.source}` : ""}${options.force ? " (force)" : ""}...`);
        await service.rebuildIndexes(options);
        logger.log("Registry index build completed");
    } finally{
        service.onModuleDestroy();
    }
}
main().catch((error)=>{
    console.error(error);
    process.exit(1);
});

//# sourceMappingURL=build-registry-index.js.map