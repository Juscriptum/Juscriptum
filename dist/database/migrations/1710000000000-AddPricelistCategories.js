"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddPricelistCategories1710000000000", {
    enumerable: true,
    get: function() {
        return AddPricelistCategories1710000000000;
    }
});
let AddPricelistCategories1710000000000 = class AddPricelistCategories1710000000000 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pricelist_categories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        pricelist_id UUID NOT NULL,
        parent_id UUID NULL,
        name VARCHAR(255) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}',
        deleted_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by UUID NULL,
        updated_by UUID NULL
      );
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricelist_categories_tenant_id
      ON pricelist_categories(tenant_id);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricelist_categories_pricelist_id
      ON pricelist_categories(pricelist_id);
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricelist_categories_parent_id
      ON pricelist_categories(parent_id);
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pricelist_categories_parent_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pricelist_categories_pricelist_id;`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_pricelist_categories_tenant_id;`);
        await queryRunner.query(`DROP TABLE IF EXISTS pricelist_categories;`);
    }
    constructor(){
        this.name = "AddPricelistCategories1710000000000";
    }
};

//# sourceMappingURL=1710000000000-AddPricelistCategories.js.map