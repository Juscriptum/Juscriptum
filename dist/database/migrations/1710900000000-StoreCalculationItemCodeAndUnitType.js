"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StoreCalculationItemCodeAndUnitType1710900000000", {
    enumerable: true,
    get: function() {
        return StoreCalculationItemCodeAndUnitType1710900000000;
    }
});
let StoreCalculationItemCodeAndUnitType1710900000000 = class StoreCalculationItemCodeAndUnitType1710900000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "calculation_items"
      ADD COLUMN "code" varchar(100)
    `);
        await queryRunner.query(`
      ALTER TABLE "calculation_items"
      ADD COLUMN "unit_type" varchar(20)
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "calculation_items"
      DROP COLUMN "unit_type"
    `);
        await queryRunner.query(`
      ALTER TABLE "calculation_items"
      DROP COLUMN "code"
    `);
    }
    constructor(){
        this.name = "StoreCalculationItemCodeAndUnitType1710900000000";
    }
};

//# sourceMappingURL=1710900000000-StoreCalculationItemCodeAndUnitType.js.map