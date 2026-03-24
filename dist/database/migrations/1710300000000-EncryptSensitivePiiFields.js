"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EncryptSensitivePiiFields1710300000000", {
    enumerable: true,
    get: function() {
        return EncryptSensitivePiiFields1710300000000;
    }
});
const _typeorm = require("typeorm");
const _piiprotection = require("../../common/security/pii-protection");
let EncryptSensitivePiiFields1710300000000 = class EncryptSensitivePiiFields1710300000000 {
    async up(queryRunner) {
        await this.ensureTextColumns(queryRunner, "organizations", [
            "tax_number",
            "taxNumber",
            "phone",
            "address"
        ]);
        await this.ensureTextColumns(queryRunner, "users", [
            "phone",
            "mfa_secret",
            "mfaSecret",
            "bar_number",
            "barNumber"
        ]);
        await this.ensureTextColumns(queryRunner, "clients", [
            "inn",
            "secondary_phone",
            "secondaryPhone",
            "address",
            "postal_code",
            "postalCode",
            "passport_number",
            "passportNumber",
            "notes"
        ]);
        await this.backfillEncryptedColumns(queryRunner, {
            tableName: "organizations",
            columns: [
                "tax_number",
                "taxNumber",
                "phone",
                "address"
            ]
        });
        await this.backfillEncryptedColumns(queryRunner, {
            tableName: "users",
            columns: [
                "phone",
                "mfa_secret",
                "mfaSecret",
                "bar_number",
                "barNumber"
            ]
        });
        await this.backfillEncryptedColumns(queryRunner, {
            tableName: "clients",
            columns: [
                "inn",
                "secondary_phone",
                "secondaryPhone",
                "address",
                "postal_code",
                "postalCode",
                "passport_number",
                "passportNumber",
                "notes"
            ]
        });
    }
    async down(_queryRunner) {
    // Encrypted backfill is intentionally irreversible in migrations.
    }
    async ensureTextColumns(queryRunner, tableName, columnCandidates) {
        const table = await queryRunner.getTable(tableName);
        if (!table) {
            return;
        }
        for (const candidate of columnCandidates){
            const column = table.findColumnByName(candidate);
            if (!column) {
                continue;
            }
            if (column.type === "text") {
                continue;
            }
            await queryRunner.changeColumn(table, column, new _typeorm.TableColumn({
                ...column,
                type: "text",
                length: ""
            }));
        }
    }
    async backfillEncryptedColumns(queryRunner, target) {
        const table = await queryRunner.getTable(target.tableName);
        if (!table) {
            return;
        }
        const existingColumns = target.columns.filter((column)=>table.findColumnByName(column));
        if (existingColumns.length === 0) {
            return;
        }
        const rows = await queryRunner.query(`SELECT id, ${existingColumns.map((column)=>`"${column}"`).join(", ")} FROM "${target.tableName}"`);
        for (const row of rows){
            const updatedColumns = [];
            const parameters = [];
            for (const column of existingColumns){
                const value = row[column];
                if (typeof value !== "string" || value.length === 0 || (0, _piiprotection.isEncryptedValue)(value)) {
                    continue;
                }
                updatedColumns.push(`"${column}" = $${updatedColumns.length + 1}`);
                parameters.push((0, _piiprotection.encryptFieldValue)(value));
            }
            if (updatedColumns.length === 0) {
                continue;
            }
            parameters.push(row.id);
            await queryRunner.query(`UPDATE "${target.tableName}" SET ${updatedColumns.join(", ")} WHERE id = $${parameters.length}`, parameters);
        }
    }
    constructor(){
        this.name = "EncryptSensitivePiiFields1710300000000";
    }
};

//# sourceMappingURL=1710300000000-EncryptSensitivePiiFields.js.map