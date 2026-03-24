import { existsSync, readFileSync } from "fs";
import * as path from "path";

export function loadScriptEnv(): void {
  const initialEnvKeys = new Set(Object.keys(process.env));

  for (const fileName of [".env", ".env.local"]) {
    const filePath = path.resolve(process.cwd(), fileName);

    if (!existsSync(filePath)) {
      continue;
    }

    const contents = readFileSync(filePath, "utf-8");

    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();

      if (!key || initialEnvKeys.has(key)) {
        continue;
      }

      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}
