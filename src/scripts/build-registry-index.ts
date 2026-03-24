import { Logger } from "@nestjs/common";
import { RegistryIndexService } from "../registry-index/services/registry-index.service";
import { loadScriptEnv } from "./load-script-env";

function parseArgs(argv: string[]): {
  source?: "court_stan" | "asvp" | "court_dates";
  force: boolean;
} {
  const sourceArg = argv.find((argument) => argument.startsWith("--source="));
  const force = argv.includes("--force");
  const source = sourceArg?.split("=")[1] as
    | "court_stan"
    | "asvp"
    | "court_dates"
    | undefined;

  return { source, force };
}

async function main() {
  loadScriptEnv();
  const logger = new Logger("BuildRegistryIndexScript");
  const options = parseArgs(process.argv.slice(2));
  const service = new RegistryIndexService();

  try {
    logger.log(
      `Building registry index${options.source ? ` for ${options.source}` : ""}${options.force ? " (force)" : ""}...`,
    );
    await service.rebuildIndexes(options);
    logger.log("Registry index build completed");
  } finally {
    service.onModuleDestroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
