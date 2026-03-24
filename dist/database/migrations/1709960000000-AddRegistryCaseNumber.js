"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddRegistryCaseNumber1709960000000", {
    enumerable: true,
    get: function() {
        return AddRegistryCaseNumber1709960000000;
    }
});
let AddRegistryCaseNumber1709960000000 = class AddRegistryCaseNumber1709960000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE cases
      ADD COLUMN IF NOT EXISTS registry_case_number VARCHAR(100);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE cases
      DROP COLUMN IF EXISTS registry_case_number;
    `);
    }
    constructor(){
        this.name = "AddRegistryCaseNumber1709960000000";
    }
};

//# sourceMappingURL=1709960000000-AddRegistryCaseNumber.js.map