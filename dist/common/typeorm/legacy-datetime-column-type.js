"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "normalizeLegacyDateTimeColumnsForDatabase", {
    enumerable: true,
    get: function() {
        return normalizeLegacyDateTimeColumnsForDatabase;
    }
});
const _typeorm = require("typeorm");
const originalDateTimeColumnTypes = new WeakMap();
function getOriginalColumnType(column) {
    if (!originalDateTimeColumnTypes.has(column)) {
        originalDateTimeColumnTypes.set(column, column.options.type);
    }
    return originalDateTimeColumnTypes.get(column);
}
function resolveLegacyDateTimeColumnType(databaseType) {
    return databaseType === "postgres" ? "timestamp" : "datetime";
}
function normalizeLegacyDateTimeColumnsForDatabase(databaseType) {
    const normalizedType = resolveLegacyDateTimeColumnType(databaseType);
    for (const column of (0, _typeorm.getMetadataArgsStorage)().columns){
        const originalType = getOriginalColumnType(column);
        if (originalType !== "datetime") {
            continue;
        }
        column.options.type = normalizedType;
    }
}

//# sourceMappingURL=legacy-datetime-column-type.js.map