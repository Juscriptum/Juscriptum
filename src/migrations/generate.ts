import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

function parseMigrationName(argv: string[]): string | null {
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if ((value === "-n" || value === "--name") && argv[index + 1]) {
      return argv[index + 1];
    }

    if (value.startsWith("--name=")) {
      return value.slice("--name=".length);
    }
  }

  return argv.find((value) => !value.startsWith("-")) || null;
}

function toClassCase(value: string): string {
  const parts = value
    .split(/[^a-zA-Z0-9]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "NewMigration";
  }

  return parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function buildTemplate(className: string): string {
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

function main(): void {
  const rawName = parseMigrationName(process.argv.slice(2));
  if (!rawName) {
    throw new Error(
      "Migration name is required. Use `npm run migration:generate -- -n DescriptiveName`.",
    );
  }

  const timestamp = Date.now();
  const classBase = toClassCase(rawName);
  const className = `${classBase}${timestamp}`;
  const targetDir = resolve(process.cwd(), "src/database/migrations");
  const targetPath = resolve(targetDir, `${timestamp}-${classBase}.ts`);

  mkdirSync(targetDir, { recursive: true });

  if (existsSync(targetPath)) {
    throw new Error(`Migration file already exists: ${targetPath}`);
  }

  writeFileSync(targetPath, buildTemplate(className), "utf8");

  // eslint-disable-next-line no-console
  console.log(`Created migration stub: ${targetPath}`);
}

try {
  main();
} catch (error: unknown) {
  // eslint-disable-next-line no-console
  console.error("Migration generate failed:", error);
  process.exit(1);
}
