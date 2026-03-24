"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get AppMigrationDataSource () {
        return AppMigrationDataSource;
    },
    get buildMigrationDataSource () {
        return buildMigrationDataSource;
    },
    get default () {
        return _default;
    }
});
const _fs = require("fs");
const _path = require("path");
const _typeorm = require("typeorm");
const _legacydatetimecolumntype = require("../common/typeorm/legacy-datetime-column-type");
const _entities = require("../database/entities");
function loadEnvFiles() {
    const loaded = {};
    for (const relativePath of [
        ".env",
        ".env.local"
    ]){
        const filePath = (0, _path.resolve)(process.cwd(), relativePath);
        if (!(0, _fs.existsSync)(filePath)) {
            continue;
        }
        const contents = (0, _fs.readFileSync)(filePath, "utf8");
        for (const rawLine of contents.split(/\r?\n/)){
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
            if (value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) {
                value = value.slice(1, -1);
            }
            loaded[key] = value;
        }
    }
    for (const [key, value] of Object.entries(loaded)){
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
}
function getEnv(...keys) {
    for (const key of keys){
        const value = process.env[key];
        if (value !== undefined && value !== "") {
            return value;
        }
    }
    return undefined;
}
function getBoolean(value, fallback) {
    if (value === undefined) {
        return fallback;
    }
    return value === "true" || value === "1";
}
function buildPostgresOptions() {
    const databaseUrl = getEnv("DATABASE_URL");
    const sslEnabled = getBoolean(getEnv("DB_SSL", "DATABASE_SSL"), false);
    const rejectUnauthorized = getBoolean(getEnv("DB_SSL_REJECT_UNAUTHORIZED", "DATABASE_SSL_REJECT_UNAUTHORIZED"), true);
    const baseOptions = {
        type: "postgres",
        entities: [
            ..._entities.DATABASE_ENTITIES
        ],
        migrations: [
            (0, _path.resolve)(__dirname, "../database/migrations/[0-9]*-*.{ts,js}")
        ],
        synchronize: false,
        logging: false
    };
    if (databaseUrl) {
        return {
            ...baseOptions,
            url: databaseUrl,
            ...sslEnabled ? {
                ssl: {
                    rejectUnauthorized
                }
            } : {}
        };
    }
    return {
        ...baseOptions,
        host: getEnv("DATABASE_HOST", "DB_HOST", "POSTGRES_HOST") || "localhost",
        port: Number(getEnv("DATABASE_PORT", "DB_PORT", "POSTGRES_PORT") || "5432"),
        username: getEnv("DATABASE_USER", "DB_USER", "POSTGRES_USER") || "postgres",
        password: getEnv("DATABASE_PASSWORD", "DB_PASSWORD", "POSTGRES_PASSWORD"),
        database: getEnv("DATABASE_NAME", "DB_NAME", "POSTGRES_DB") || "law_organizer",
        ...sslEnabled ? {
            ssl: {
                rejectUnauthorized
            }
        } : {}
    };
}
function buildSqliteOptions() {
    return {
        type: "better-sqlite3",
        database: getEnv("DB_NAME", "DATABASE_NAME") || "law_organizer.db",
        entities: [
            ..._entities.DATABASE_ENTITIES
        ],
        migrations: [
            (0, _path.resolve)(__dirname, "../database/migrations/[0-9]*-*.{ts,js}")
        ],
        synchronize: false,
        logging: false
    };
}
function buildMigrationDataSource() {
    loadEnvFiles();
    const dbType = getEnv("DB_TYPE", "DATABASE_TYPE", "TYPEORM_CONNECTION");
    (0, _legacydatetimecolumntype.normalizeLegacyDateTimeColumnsForDatabase)(dbType);
    const options = dbType === "postgres" ? buildPostgresOptions() : buildSqliteOptions();
    return new _typeorm.DataSource(options);
}
const AppMigrationDataSource = buildMigrationDataSource();
const _default = AppMigrationDataSource;

//# sourceMappingURL=data-source.js.map