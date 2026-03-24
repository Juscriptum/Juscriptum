"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _fs = require("fs");
const _path = require("path");
function parseMigrationName(argv) {
    for(let index = 0; index < argv.length; index += 1){
        const value = argv[index];
        if ((value === "-n" || value === "--name") && argv[index + 1]) {
            return argv[index + 1];
        }
        if (value.startsWith("--name=")) {
            return value.slice("--name=".length);
        }
    }
    return argv.find((value)=>!value.startsWith("-")) || null;
}
function toClassCase(value) {
    const parts = value.split(/[^a-zA-Z0-9]+/).map((part)=>part.trim()).filter(Boolean);
    if (parts.length === 0) {
        return "NewMigration";
    }
    return parts.map((part)=>part.charAt(0).toUpperCase() + part.slice(1)).join("");
}
function buildTemplate(className) {
    return `import { MigrationInterface, QueryRunner } from "typeorm";

export class ${className} implements MigrationInterface {
  name = "${className}";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // TODO: implement migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TODO: revert migration
  }
}
`;
}
function main() {
    const rawName = parseMigrationName(process.argv.slice(2));
    if (!rawName) {
        throw new Error("Migration name is required. Use `npm run migration:generate -- -n DescriptiveName`.");
    }
    const timestamp = Date.now();
    const classBase = toClassCase(rawName);
    const className = `${classBase}${timestamp}`;
    const targetDir = (0, _path.resolve)(process.cwd(), "src/database/migrations");
    const targetPath = (0, _path.resolve)(targetDir, `${timestamp}-${classBase}.ts`);
    (0, _fs.mkdirSync)(targetDir, {
        recursive: true
    });
    if ((0, _fs.existsSync)(targetPath)) {
        throw new Error(`Migration file already exists: ${targetPath}`);
    }
    (0, _fs.writeFileSync)(targetPath, buildTemplate(className), "utf8");
    // eslint-disable-next-line no-console
    console.log(`Created migration stub: ${targetPath}`);
}
try {
    main();
} catch (error) {
    // eslint-disable-next-line no-console
    console.error("Migration generate failed:", error);
    process.exit(1);
}

//# sourceMappingURL=generate.js.map