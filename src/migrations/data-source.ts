import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { DataSource, DataSourceOptions } from "typeorm";
import { normalizeLegacyDateTimeColumnsForDatabase } from "../common/typeorm/legacy-datetime-column-type";
import { DATABASE_ENTITIES } from "../database/entities";

type EnvMap = Record<string, string>;

function loadEnvFiles(): void {
  const loaded: EnvMap = {};

  for (const relativePath of [".env", ".env.local"]) {
    const filePath = resolve(process.cwd(), relativePath);
    if (!existsSync(filePath)) {
      continue;
    }

    const contents = readFileSync(filePath, "utf8");
    for (const rawLine of contents.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex < 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      loaded[key] = value;
    }
  }

  for (const [key, value] of Object.entries(loaded)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== "") {
      return value;
    }
  }

  return undefined;
}

function getBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return value === "true" || value === "1";
}

function buildPostgresOptions(): DataSourceOptions {
  const databaseUrl = getEnv("DATABASE_URL");
  const sslEnabled = getBoolean(getEnv("DB_SSL", "DATABASE_SSL"), false);
  const rejectUnauthorized = getBoolean(
    getEnv("DB_SSL_REJECT_UNAUTHORIZED", "DATABASE_SSL_REJECT_UNAUTHORIZED"),
    true,
  );

  const baseOptions: DataSourceOptions = {
    type: "postgres",
    entities: [...DATABASE_ENTITIES],
    migrations: [resolve(__dirname, "../database/migrations/[0-9]*-*.{ts,js}")],
    synchronize: false,
    logging: false,
  };

  if (databaseUrl) {
    return {
      ...baseOptions,
      url: databaseUrl,
      ...(sslEnabled
        ? {
            ssl: {
              rejectUnauthorized,
            },
          }
        : {}),
    };
  }

  return {
    ...baseOptions,
    host: getEnv("DATABASE_HOST", "DB_HOST", "POSTGRES_HOST") || "localhost",
    port: Number(getEnv("DATABASE_PORT", "DB_PORT", "POSTGRES_PORT") || "5432"),
    username: getEnv("DATABASE_USER", "DB_USER", "POSTGRES_USER") || "postgres",
    password: getEnv("DATABASE_PASSWORD", "DB_PASSWORD", "POSTGRES_PASSWORD"),
    database:
      getEnv("DATABASE_NAME", "DB_NAME", "POSTGRES_DB") || "law_organizer",
    ...(sslEnabled
      ? {
          ssl: {
            rejectUnauthorized,
          },
        }
      : {}),
  };
}

function buildSqliteOptions(): DataSourceOptions {
  return {
    type: "better-sqlite3",
    database: getEnv("DB_NAME", "DATABASE_NAME") || "law_organizer.db",
    entities: [...DATABASE_ENTITIES],
    migrations: [resolve(__dirname, "../database/migrations/[0-9]*-*.{ts,js}")],
    synchronize: false,
    logging: false,
  };
}

export function buildMigrationDataSource(): DataSource {
  loadEnvFiles();

  const dbType = getEnv("DB_TYPE", "DATABASE_TYPE", "TYPEORM_CONNECTION");
  normalizeLegacyDateTimeColumnsForDatabase(dbType);
  const options =
    dbType === "postgres" ? buildPostgresOptions() : buildSqliteOptions();

  return new DataSource(options);
}

export const AppMigrationDataSource = buildMigrationDataSource();

export default AppMigrationDataSource;
