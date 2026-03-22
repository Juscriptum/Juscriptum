import { getMetadataArgsStorage, type ColumnType } from "typeorm";

const originalDateTimeColumnTypes = new WeakMap<object, ColumnType | undefined>();

function getOriginalColumnType(column: {
  options: { type?: ColumnType };
}): ColumnType | undefined {
  if (!originalDateTimeColumnTypes.has(column as object)) {
    originalDateTimeColumnTypes.set(column as object, column.options.type);
  }

  return originalDateTimeColumnTypes.get(column as object);
}

function resolveLegacyDateTimeColumnType(
  databaseType: string | undefined,
): ColumnType {
  return databaseType === "postgres" ? "timestamp" : "datetime";
}

export function normalizeLegacyDateTimeColumnsForDatabase(
  databaseType: string | undefined,
): void {
  const normalizedType = resolveLegacyDateTimeColumnType(databaseType);

  for (const column of getMetadataArgsStorage().columns) {
    const originalType = getOriginalColumnType(column);
    if (originalType !== "datetime") {
      continue;
    }

    (column.options as { type?: ColumnType }).type = normalizedType;
  }
}
