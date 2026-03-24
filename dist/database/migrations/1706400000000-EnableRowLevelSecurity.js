"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EnableRowLevelSecurity1706400000000", {
    enumerable: true,
    get: function() {
        return EnableRowLevelSecurity1706400000000;
    }
});
let EnableRowLevelSecurity1706400000000 = class EnableRowLevelSecurity1706400000000 {
    async up(queryRunner) {
        // =====================================================
        // STEP 1: Create tenant context function
        // =====================================================
        // This function safely extracts tenant_id from session context
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
        // =====================================================
        // STEP 2: Enable RLS on all tenant-scoped tables
        // =====================================================
        // Users table
        await queryRunner.query(`
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        `);
        // Clients table
        await queryRunner.query(`
            ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
        `);
        // Cases table
        await queryRunner.query(`
            ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
        `);
        // Documents table
        await queryRunner.query(`
            ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        `);
        // Events table
        await queryRunner.query(`
            ALTER TABLE events ENABLE ROW LEVEL SECURITY;
        `);
        // Invoices table
        await queryRunner.query(`
            ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
        `);
        // Pricelists table
        await queryRunner.query(`
            ALTER TABLE pricelists ENABLE ROW LEVEL SECURITY;
        `);
        // Calculations table
        await queryRunner.query(`
            ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;
        `);
        // Notifications table
        await queryRunner.query(`
            ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
        `);
        // Audit logs table
        await queryRunner.query(`
            ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        `);
        // Onboarding progress table
        await queryRunner.query(`
            ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
        `);
        // =====================================================
        // STEP 3: Create RLS policies for each table
        // =====================================================
        // USERS policies
        await queryRunner.query(`
            CREATE POLICY users_tenant_select ON users
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY users_tenant_insert ON users
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY users_tenant_update ON users
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY users_tenant_delete ON users
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // CLIENTS policies
        await queryRunner.query(`
            CREATE POLICY clients_tenant_select ON clients
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY clients_tenant_insert ON clients
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY clients_tenant_update ON clients
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY clients_tenant_delete ON clients
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // CASES policies
        await queryRunner.query(`
            CREATE POLICY cases_tenant_select ON cases
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY cases_tenant_insert ON cases
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY cases_tenant_update ON cases
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY cases_tenant_delete ON cases
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // DOCUMENTS policies
        await queryRunner.query(`
            CREATE POLICY documents_tenant_select ON documents
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY documents_tenant_insert ON documents
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY documents_tenant_update ON documents
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY documents_tenant_delete ON documents
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // EVENTS policies
        await queryRunner.query(`
            CREATE POLICY events_tenant_select ON events
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY events_tenant_insert ON events
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY events_tenant_update ON events
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY events_tenant_delete ON events
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // INVOICES policies
        await queryRunner.query(`
            CREATE POLICY invoices_tenant_select ON invoices
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY invoices_tenant_insert ON invoices
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY invoices_tenant_update ON invoices
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY invoices_tenant_delete ON invoices
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // NOTIFICATIONS policies
        await queryRunner.query(`
            CREATE POLICY notifications_tenant_select ON notifications
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY notifications_tenant_insert ON notifications
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY notifications_tenant_update ON notifications
                FOR UPDATE
                USING (tenant_id = current_tenant_id());
        `);
        await queryRunner.query(`
            CREATE POLICY notifications_tenant_delete ON notifications
                FOR DELETE
                USING (tenant_id = current_tenant_id());
        `);
        // AUDIT_LOGS policies (read-only for compliance)
        await queryRunner.query(`
            CREATE POLICY audit_logs_tenant_select ON audit_logs
                FOR SELECT
                USING (tenant_id = current_tenant_id() OR current_tenant_id() IS NULL);
        `);
        await queryRunner.query(`
            CREATE POLICY audit_logs_tenant_insert ON audit_logs
                FOR INSERT
                WITH CHECK (tenant_id = current_tenant_id());
        `);
        // =====================================================
        // STEP 4: Create indexes for RLS performance
        // =====================================================
        // These indexes ensure RLS policies don't cause full table scans
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON clients(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_cases_tenant_id ON cases(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_events_tenant_id ON events(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
        `);
        // =====================================================
        // STEP 5: Grant necessary permissions
        // =====================================================
        // RLS requires proper permissions to work with policies
        // Granting to a hard-coded application role breaks fresh environments where
        // that role has not been provisioned yet, so only grant if it exists.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'law_organizer') THEN
                    GRANT ALL ON ALL TABLES IN SCHEMA public TO law_organizer;
                END IF;
            END
            $$;
        `);
    }
    async down(queryRunner) {
        // WARNING: Disabling RLS in production is a security risk
        // Drop policies
        await queryRunner.query(`DROP POLICY IF EXISTS users_tenant_select ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS users_tenant_insert ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS users_tenant_update ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS users_tenant_delete ON users;`);
        await queryRunner.query(`DROP POLICY IF EXISTS clients_tenant_select ON clients;`);
        await queryRunner.query(`DROP POLICY IF EXISTS clients_tenant_insert ON clients;`);
        await queryRunner.query(`DROP POLICY IF EXISTS clients_tenant_update ON clients;`);
        await queryRunner.query(`DROP POLICY IF EXISTS clients_tenant_delete ON clients;`);
        await queryRunner.query(`DROP POLICY IF EXISTS cases_tenant_select ON cases;`);
        await queryRunner.query(`DROP POLICY IF EXISTS cases_tenant_insert ON cases;`);
        await queryRunner.query(`DROP POLICY IF EXISTS cases_tenant_update ON cases;`);
        await queryRunner.query(`DROP POLICY IF EXISTS cases_tenant_delete ON cases;`);
        await queryRunner.query(`DROP POLICY IF EXISTS documents_tenant_select ON documents;`);
        await queryRunner.query(`DROP POLICY IF EXISTS documents_tenant_insert ON documents;`);
        await queryRunner.query(`DROP POLICY IF EXISTS documents_tenant_update ON documents;`);
        await queryRunner.query(`DROP POLICY IF EXISTS documents_tenant_delete ON documents;`);
        await queryRunner.query(`DROP POLICY IF EXISTS events_tenant_select ON events;`);
        await queryRunner.query(`DROP POLICY IF EXISTS events_tenant_insert ON events;`);
        await queryRunner.query(`DROP POLICY IF EXISTS events_tenant_update ON events;`);
        await queryRunner.query(`DROP POLICY IF EXISTS events_tenant_delete ON events;`);
        await queryRunner.query(`DROP POLICY IF EXISTS invoices_tenant_select ON invoices;`);
        await queryRunner.query(`DROP POLICY IF EXISTS invoices_tenant_insert ON invoices;`);
        await queryRunner.query(`DROP POLICY IF EXISTS invoices_tenant_update ON invoices;`);
        await queryRunner.query(`DROP POLICY IF EXISTS invoices_tenant_delete ON invoices;`);
        await queryRunner.query(`DROP POLICY IF EXISTS notifications_tenant_select ON notifications;`);
        await queryRunner.query(`DROP POLICY IF EXISTS notifications_tenant_insert ON notifications;`);
        await queryRunner.query(`DROP POLICY IF EXISTS notifications_tenant_update ON notifications;`);
        await queryRunner.query(`DROP POLICY IF EXISTS notifications_tenant_delete ON notifications;`);
        await queryRunner.query(`DROP POLICY IF EXISTS audit_logs_tenant_select ON audit_logs;`);
        await queryRunner.query(`DROP POLICY IF EXISTS audit_logs_tenant_insert ON audit_logs;`);
        // Disable RLS
        await queryRunner.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE clients DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE cases DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE documents DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE events DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE invoices DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;`);
        await queryRunner.query(`ALTER TABLE onboarding_progress DISABLE ROW LEVEL SECURITY;`);
        // Drop helper function
        await queryRunner.query(`DROP FUNCTION IF EXISTS current_tenant_id();`);
    // Drop indexes (optional - may want to keep for performance)
    // await queryRunner.query(`DROP INDEX IF EXISTS idx_users_tenant_id;`);
    // ... etc
    }
    constructor(){
        this.name = "EnableRowLevelSecurity1706400000000";
    }
};

//# sourceMappingURL=1706400000000-EnableRowLevelSecurity.js.map