"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _typeorm = require("typeorm");
const _Organizationentity = require("../../database/entities/Organization.entity");
const _legacydatetimecolumntype = require("./legacy-datetime-column-type");
describe("normalizeLegacyDateTimeColumnsForDatabase", ()=>{
    it("maps legacy datetime columns to timestamp for postgres and restores datetime for sqlite", ()=>{
        const column = (0, _typeorm.getMetadataArgsStorage)().columns.find((candidate)=>candidate.target === _Organizationentity.Organization && candidate.propertyName === "trialEndAt");
        expect(column).toBeDefined();
        expect(column?.options.type).toBe("datetime");
        (0, _legacydatetimecolumntype.normalizeLegacyDateTimeColumnsForDatabase)("postgres");
        expect(column?.options.type).toBe("timestamp");
        (0, _legacydatetimecolumntype.normalizeLegacyDateTimeColumnsForDatabase)("sqlite");
        expect(column?.options.type).toBe("datetime");
    });
});

//# sourceMappingURL=legacy-datetime-column-type.spec.js.map