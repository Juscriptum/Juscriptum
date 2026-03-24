"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExpandRefreshTokenTokenColumn1710600000000", {
    enumerable: true,
    get: function() {
        return ExpandRefreshTokenTokenColumn1710600000000;
    }
});
let ExpandRefreshTokenTokenColumn1710600000000 = class ExpandRefreshTokenTokenColumn1710600000000 {
    async up(queryRunner) {
        const dbType = queryRunner.connection.options.type;
        if (dbType === "postgres") {
            await queryRunner.query(`
        ALTER TABLE refresh_tokens
        ALTER COLUMN token TYPE TEXT
      `);
            return;
        }
        if (dbType === "sqlite" || dbType === "better-sqlite3") {
            await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens_tmp (
          id varchar PRIMARY KEY NOT NULL,
          user_id uuid NOT NULL,
          tenant_id uuid NOT NULL,
          token text NOT NULL,
          device_info json NOT NULL,
          ip_address varchar(45),
          user_agent text,
          expires_at datetime NOT NULL,
          revoked_at datetime,
          replaced_by uuid,
          created_at datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
            await queryRunner.query(`
        INSERT INTO refresh_tokens_tmp (
          id, user_id, tenant_id, token, device_info, ip_address, user_agent,
          expires_at, revoked_at, replaced_by, created_at
        )
        SELECT
          id, user_id, tenant_id, token, device_info, ip_address, user_agent,
          expires_at, revoked_at, replaced_by, created_at
        FROM refresh_tokens
      `);
            await queryRunner.query(`DROP TABLE refresh_tokens`);
            await queryRunner.query(`ALTER TABLE refresh_tokens_tmp RENAME TO refresh_tokens`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant_id ON refresh_tokens(tenant_id)`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)`);
        }
    }
    async down(queryRunner) {
        const dbType = queryRunner.connection.options.type;
        if (dbType === "postgres") {
            await queryRunner.query(`
        ALTER TABLE refresh_tokens
        ALTER COLUMN token TYPE VARCHAR(255)
      `);
            return;
        }
        if (dbType === "sqlite" || dbType === "better-sqlite3") {
            await queryRunner.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens_tmp (
          id varchar PRIMARY KEY NOT NULL,
          user_id uuid NOT NULL,
          tenant_id uuid NOT NULL,
          token varchar(255) NOT NULL,
          device_info json NOT NULL,
          ip_address varchar(45),
          user_agent text,
          expires_at datetime NOT NULL,
          revoked_at datetime,
          replaced_by uuid,
          created_at datetime NOT NULL DEFAULT (datetime('now'))
        )
      `);
            await queryRunner.query(`
        INSERT INTO refresh_tokens_tmp (
          id, user_id, tenant_id, token, device_info, ip_address, user_agent,
          expires_at, revoked_at, replaced_by, created_at
        )
        SELECT
          id, user_id, tenant_id, SUBSTR(token, 1, 255), device_info, ip_address, user_agent,
          expires_at, revoked_at, replaced_by, created_at
        FROM refresh_tokens
      `);
            await queryRunner.query(`DROP TABLE refresh_tokens`);
            await queryRunner.query(`ALTER TABLE refresh_tokens_tmp RENAME TO refresh_tokens`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id)`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_tenant_id ON refresh_tokens(tenant_id)`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at)`);
        }
    }
    constructor(){
        this.name = "ExpandRefreshTokenTokenColumn1710600000000";
    }
};

//# sourceMappingURL=1710600000000-ExpandRefreshTokenTokenColumn.js.map