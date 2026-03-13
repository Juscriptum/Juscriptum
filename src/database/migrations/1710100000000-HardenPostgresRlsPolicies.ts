import { MigrationInterface, QueryRunner } from "typeorm";

export class HardenPostgresRlsPolicies1710100000000 implements MigrationInterface {
  name = "HardenPostgresRlsPolicies1710100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_tenant_id()
      RETURNS UUID AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_user_id()
      RETURNS UUID AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID;
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_user_role()
      RETURNS TEXT AS $$
      BEGIN
        RETURN NULLIF(current_setting('app.current_user_role', TRUE), '');
      EXCEPTION
        WHEN OTHERS THEN
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION current_user_has_elevated_tenant_role()
      RETURNS BOOLEAN AS $$
      BEGIN
        RETURN current_user_role() IN (
          'super_admin',
          'organization_owner',
          'organization_admin'
        );
      END;
      $$ LANGUAGE plpgsql STABLE;
    `);

    await queryRunner.query(`
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users FORCE ROW LEVEL SECURITY;
      ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
      ALTER TABLE clients FORCE ROW LEVEL SECURITY;
      ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
      ALTER TABLE cases FORCE ROW LEVEL SECURITY;
      ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
      ALTER TABLE documents FORCE ROW LEVEL SECURITY;
      ALTER TABLE events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE events FORCE ROW LEVEL SECURITY;
      ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
      ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notifications FORCE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
      ALTER TABLE pricelists ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pricelists FORCE ROW LEVEL SECURITY;
      ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE calculations FORCE ROW LEVEL SECURITY;
      ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
      ALTER TABLE onboarding_progress FORCE ROW LEVEL SECURITY;
      ALTER TABLE user_identities ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_identities FORCE ROW LEVEL SECURITY;
      ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;
      ALTER TABLE document_signatures FORCE ROW LEVEL SECURITY;
    `);

    await this.recreateTenantPolicies(queryRunner, "users");
    await this.recreateTenantPolicies(queryRunner, "events");
    await this.recreateTenantPolicies(queryRunner, "invoices");
    await this.recreateTenantPolicies(queryRunner, "notifications");
    await this.recreateTenantPolicies(queryRunner, "pricelists");
    await this.recreateTenantPolicies(queryRunner, "calculations");
    await this.recreateTenantPolicies(queryRunner, "onboarding_progress");

    await queryRunner.query(
      `DROP POLICY IF EXISTS audit_logs_tenant_select ON audit_logs;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS audit_logs_tenant_insert ON audit_logs;`,
    );
    await queryRunner.query(`
      CREATE POLICY audit_logs_tenant_select ON audit_logs
      FOR SELECT
      USING (tenant_id = current_tenant_id());
    `);
    await queryRunner.query(`
      CREATE POLICY audit_logs_tenant_insert ON audit_logs
      FOR INSERT
      WITH CHECK (tenant_id = current_tenant_id());
    `);

    await queryRunner.query(
      `DROP POLICY IF EXISTS clients_tenant_select ON clients;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS clients_tenant_insert ON clients;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS clients_tenant_update ON clients;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS clients_tenant_delete ON clients;`,
    );
    await queryRunner.query(`
      CREATE POLICY clients_tenant_select ON clients
      FOR SELECT
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY clients_tenant_insert ON clients
      FOR INSERT
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR (
            COALESCE(created_by, current_user_id()) = current_user_id()
            AND COALESCE(assigned_user_id, current_user_id()) = current_user_id()
          )
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY clients_tenant_update ON clients
      FOR UPDATE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_user_id = current_user_id()
        )
      )
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY clients_tenant_delete ON clients
      FOR DELETE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_user_id = current_user_id()
        )
      );
    `);

    await queryRunner.query(
      `DROP POLICY IF EXISTS cases_tenant_select ON cases;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS cases_tenant_insert ON cases;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS cases_tenant_update ON cases;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS cases_tenant_delete ON cases;`,
    );
    await queryRunner.query(`
      CREATE POLICY cases_tenant_select ON cases
      FOR SELECT
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_lawyer_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY cases_tenant_insert ON cases
      FOR INSERT
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR (
            COALESCE(created_by, current_user_id()) = current_user_id()
            AND assigned_lawyer_id = current_user_id()
          )
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY cases_tenant_update ON cases
      FOR UPDATE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_lawyer_id = current_user_id()
        )
      )
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_lawyer_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY cases_tenant_delete ON cases
      FOR DELETE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR assigned_lawyer_id = current_user_id()
        )
      );
    `);

    await queryRunner.query(
      `DROP POLICY IF EXISTS documents_tenant_select ON documents;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS documents_tenant_insert ON documents;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS documents_tenant_update ON documents;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS documents_tenant_delete ON documents;`,
    );
    await queryRunner.query(`
      CREATE POLICY documents_tenant_select ON documents
      FOR SELECT
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR uploaded_by = current_user_id()
          OR signed_by = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY documents_tenant_insert ON documents
      FOR INSERT
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR (
            COALESCE(created_by, current_user_id()) = current_user_id()
            AND uploaded_by = current_user_id()
            AND COALESCE(signed_by, current_user_id()) = current_user_id()
          )
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY documents_tenant_update ON documents
      FOR UPDATE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR uploaded_by = current_user_id()
          OR signed_by = current_user_id()
        )
      )
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR uploaded_by = current_user_id()
          OR signed_by = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY documents_tenant_delete ON documents
      FOR DELETE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR access_scope = 'tenant'
          OR created_by = current_user_id()
          OR uploaded_by = current_user_id()
          OR signed_by = current_user_id()
        )
      );
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS user_identities_tenant_select ON user_identities;
      DROP POLICY IF EXISTS user_identities_tenant_insert ON user_identities;
      DROP POLICY IF EXISTS user_identities_tenant_update ON user_identities;
      DROP POLICY IF EXISTS user_identities_tenant_delete ON user_identities;
    `);
    await queryRunner.query(`
      CREATE POLICY user_identities_tenant_select ON user_identities
      FOR SELECT
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY user_identities_tenant_insert ON user_identities
      FOR INSERT
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY user_identities_tenant_update ON user_identities
      FOR UPDATE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      )
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY user_identities_tenant_delete ON user_identities
      FOR DELETE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);

    await queryRunner.query(`
      DROP POLICY IF EXISTS document_signatures_tenant_select ON document_signatures;
      DROP POLICY IF EXISTS document_signatures_tenant_insert ON document_signatures;
      DROP POLICY IF EXISTS document_signatures_tenant_update ON document_signatures;
      DROP POLICY IF EXISTS document_signatures_tenant_delete ON document_signatures;
    `);
    await queryRunner.query(`
      CREATE POLICY document_signatures_tenant_select ON document_signatures
      FOR SELECT
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
          OR EXISTS (
            SELECT 1
            FROM documents
            WHERE documents.id = document_signatures.document_id
          )
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY document_signatures_tenant_insert ON document_signatures
      FOR INSERT
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND EXISTS (
          SELECT 1
          FROM documents
          WHERE documents.id = document_signatures.document_id
        )
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY document_signatures_tenant_update ON document_signatures
      FOR UPDATE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      )
      WITH CHECK (
        tenant_id = current_tenant_id()
        AND EXISTS (
          SELECT 1
          FROM documents
          WHERE documents.id = document_signatures.document_id
        )
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);
    await queryRunner.query(`
      CREATE POLICY document_signatures_tenant_delete ON document_signatures
      FOR DELETE
      USING (
        tenant_id = current_tenant_id()
        AND (
          current_user_has_elevated_tenant_role()
          OR user_id = current_user_id()
        )
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE clients NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE cases NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE documents NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE events NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE invoices NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE notifications NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE pricelists NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE calculations NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE onboarding_progress NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE user_identities NO FORCE ROW LEVEL SECURITY;
      ALTER TABLE document_signatures NO FORCE ROW LEVEL SECURITY;
    `);

    await queryRunner.query(
      `DROP POLICY IF EXISTS document_signatures_tenant_delete ON document_signatures;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS document_signatures_tenant_update ON document_signatures;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS document_signatures_tenant_insert ON document_signatures;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS document_signatures_tenant_select ON document_signatures;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS user_identities_tenant_delete ON user_identities;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS user_identities_tenant_update ON user_identities;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS user_identities_tenant_insert ON user_identities;`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS user_identities_tenant_select ON user_identities;`,
    );

    await queryRunner.query(
      `DROP FUNCTION IF EXISTS current_user_has_elevated_tenant_role();`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS current_user_role();`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS current_user_id();`);
  }

  private async recreateTenantPolicies(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    const prefix =
      tableName === "onboarding_progress" ? "onboarding_progress" : tableName;

    await queryRunner.query(
      `DROP POLICY IF EXISTS ${prefix}_tenant_select ON ${tableName};`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS ${prefix}_tenant_insert ON ${tableName};`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS ${prefix}_tenant_update ON ${tableName};`,
    );
    await queryRunner.query(
      `DROP POLICY IF EXISTS ${prefix}_tenant_delete ON ${tableName};`,
    );

    await queryRunner.query(`
      CREATE POLICY ${prefix}_tenant_select ON ${tableName}
      FOR SELECT
      USING (tenant_id = current_tenant_id());
    `);
    await queryRunner.query(`
      CREATE POLICY ${prefix}_tenant_insert ON ${tableName}
      FOR INSERT
      WITH CHECK (tenant_id = current_tenant_id());
    `);
    await queryRunner.query(`
      CREATE POLICY ${prefix}_tenant_update ON ${tableName}
      FOR UPDATE
      USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
    `);
    await queryRunner.query(`
      CREATE POLICY ${prefix}_tenant_delete ON ${tableName}
      FOR DELETE
      USING (tenant_id = current_tenant_id());
    `);
  }
}
