import { Logger } from "@nestjs/common";
import { ExternalDataService } from "../external-data/services/external-data.service";
import { RegistryIndexService } from "../registry-index/services/registry-index.service";
import { loadScriptEnv } from "./load-script-env";

function parseArgs(argv: string[]): {
  source?: "court_stan" | "court_dates" | "reestr" | "asvp";
  dryRun: boolean;
  force: boolean;
} {
  const sourceArg = argv.find((argument) => argument.startsWith("--source="));
  const dryRun = argv.includes("--dry-run");
  const force = argv.includes("--force");
  const source = sourceArg?.split("=")[1] as
    | "court_stan"
    | "court_dates"
    | "reestr"
    | "asvp"
    | undefined;

  return { source, dryRun, force };
}

async function main() {
  loadScriptEnv();
  const logger = new Logger("UpdateExternalDataScript");
  const options = parseArgs(process.argv.slice(2));
  const registryIndexService = new RegistryIndexService();
  const externalDataService = new ExternalDataService(registryIndexService);

  try {
    logger.log(
      `Updating external data${options.source ? ` for ${options.source}` : ""}${options.dryRun ? " (dry-run)" : ""}${options.force ? " (force)" : ""}...`,
    );
    await externalDataService.updateExternalData(options);
    logger.log("External data update completed");
  } finally {
    registryIndexService.onModuleDestroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
