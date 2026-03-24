"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _externaldataservice = require("../external-data/services/external-data.service");
const _registryindexservice = require("../registry-index/services/registry-index.service");
const _loadscriptenv = require("./load-script-env");
function parseArgs(argv) {
    const sourceArg = argv.find((argument)=>argument.startsWith("--source="));
    const dryRun = argv.includes("--dry-run");
    const force = argv.includes("--force");
    const source = sourceArg?.split("=")[1];
    return {
        source,
        dryRun,
        force
    };
}
async function main() {
    (0, _loadscriptenv.loadScriptEnv)();
    const logger = new _common.Logger("UpdateExternalDataScript");
    const options = parseArgs(process.argv.slice(2));
    const registryIndexService = new _registryindexservice.RegistryIndexService();
    const externalDataService = new _externaldataservice.ExternalDataService(registryIndexService);
    try {
        logger.log(`Updating external data${options.source ? ` for ${options.source}` : ""}${options.dryRun ? " (dry-run)" : ""}${options.force ? " (force)" : ""}...`);
        await externalDataService.updateExternalData(options);
        logger.log("External data update completed");
    } finally{
        registryIndexService.onModuleDestroy();
    }
}
main().catch((error)=>{
    console.error(error);
    process.exit(1);
});

//# sourceMappingURL=update-external-data.js.map