import { Client as PgClient } from "pg";
import { DataSource } from "typeorm";
import { EnableRowLevelSecurity1706400000000 } from "./1706400000000-EnableRowLevelSecurity";
import { HardenUserIsolationAndTrustProviders1709900000000 } from "./1709900000000-HardenUserIsolationAndTrustProviders";
import { HardenPostgresRlsPolicies1710100000000 } from "./1710100000000-HardenPostgresRlsPolicies";

const adminDatabaseUrl = process.env.RLS_TEST_DATABASE_URL;
const describeIfPostgres = adminDatabaseUrl ? describe : describe.skip;

describeIfPostgres("HardenPostgresRlsPolicies1710100000000", () => {
  let adminClient: PgClient;
  let dataSource: DataSource;
  let appDataSource: DataSource;
  let databaseName: string;
  const appRole = "rls_test_app";

  beforeAll(async () => {
    const adminUrl = new URL(adminDatabaseUrl as string);
    databaseName = `law_org_rls_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    adminClient = new PgClient({ connectionString: adminUrl.toString() });
    await adminClient.connect();
    await adminClient.query(`DROP ROLE IF EXISTS ${appRole}`);
    await adminClient.query(`CREATE ROLE ${appRole} LOGIN`);
    await adminClient.query(`CREATE DATABASE "${databaseName}"`);
    await adminClient.query(
      `GRANT ALL PRIVILEGES ON DATABASE "${databaseName}" TO ${appRole}`,
    );

    const testUrl = new URL(adminUrl.toString());
    testUrl.pathname = `/${databaseName}`;

    dataSource = new DataSource({
      type: "postgres",
      url: testUrl.toString(),
    });

    await dataSource.initialize();
    await createBaseSchema(dataSource);

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await new EnableRowLevelSecurity1706400000000().up(queryRunner);
    await new HardenUserIsolationAndTrustProviders1709900000000().up(
      queryRunner,
    );
    await new HardenPostgresRlsPolicies1710100000000().up(queryRunner);
    await queryRunner.query(`GRANT USAGE ON SCHEMA public TO ${appRole}`);
    await queryRunner.query(
      `GRANT ALL ON ALL TABLES IN SCHEMA public TO ${appRole}`,
    );
    await queryRunner.release();

    const appUrl = new URL(testUrl.toString());
    appUrl.username = appRole;
    appUrl.password = "";

    appDataSource = new DataSource({
      type: "postgres",
      url: appUrl.toString(),
    });
    await appDataSource.initialize();
  });

  afterAll(async () => {
    if (appDataSource?.isInitialized) {
      await appDataSource.destroy();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }

    if (adminClient) {
      await adminClient.query(
        `
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = $1
            AND pid <> pg_backend_pid()
        `,
        [databaseName],
      );
      await adminClient.query(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await adminClient.query(`DROP ROLE IF EXISTS ${appRole}`);
      await adminClient.end();
    }
  });

  beforeEach(async () => {
    await resetData(dataSource);
    await seedData(dataSource);
  });

  it("blocks cross-tenant and cross-user access for clients, cases, and documents", async () => {
    const client = await appDataSource.createQueryRunner();
    await client.connect();

    await setContext(client, {
      tenantId: "11111111-1111-1111-1111-111111111111",
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
      role: "lawyer",
    });

    const visibleClients = await client.query(
      `SELECT id FROM clients ORDER BY id ASC`,
    );
    const visibleCases = await client.query(
      `SELECT id FROM cases ORDER BY id ASC`,
    );
    const visibleDocuments = await client.query(
      `SELECT id FROM documents ORDER BY id ASC`,
    );

    expect(visibleClients.map((row: any) => row.id)).toEqual([
      "c1111111-1111-1111-1111-111111111111",
      "c3333333-3333-3333-3333-333333333333",
    ]);
    expect(visibleCases.map((row: any) => row.id)).toEqual([
      "a1111111-1111-1111-1111-111111111111",
      "a3333333-3333-3333-3333-333333333333",
    ]);
    expect(visibleDocuments.map((row: any) => row.id)).toEqual([
      "d1111111-1111-1111-1111-111111111111",
      "d3333333-3333-3333-3333-333333333333",
    ]);

    await clearContext(client);
    await client.release();
  });

  it("allows tenant admins to see all tenant records while still blocking other tenants", async () => {
    const client = await appDataSource.createQueryRunner();
    await client.connect();

    await setContext(client, {
      tenantId: "11111111-1111-1111-1111-111111111111",
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9",
      role: "organization_admin",
    });

    const visibleClients = await client.query(
      `SELECT id FROM clients ORDER BY id ASC`,
    );
    const visibleCases = await client.query(
      `SELECT id FROM cases ORDER BY id ASC`,
    );
    const visibleDocuments = await client.query(
      `SELECT id FROM documents ORDER BY id ASC`,
    );

    expect(visibleClients.map((row: any) => row.id)).toEqual([
      "c1111111-1111-1111-1111-111111111111",
      "c2222222-2222-2222-2222-222222222222",
      "c3333333-3333-3333-3333-333333333333",
    ]);
    expect(visibleCases.map((row: any) => row.id)).toEqual([
      "a1111111-1111-1111-1111-111111111111",
      "a2222222-2222-2222-2222-222222222222",
      "a3333333-3333-3333-3333-333333333333",
    ]);
    expect(visibleDocuments.map((row: any) => row.id)).toEqual([
      "d1111111-1111-1111-1111-111111111111",
      "d2222222-2222-2222-2222-222222222222",
      "d3333333-3333-3333-3333-333333333333",
    ]);

    await clearContext(client);
    await client.release();
  });

  it("restricts related trust-provider records to the current actor or visible document", async () => {
    const client = await appDataSource.createQueryRunner();
    await client.connect();

    await setContext(client, {
      tenantId: "11111111-1111-1111-1111-111111111111",
      userId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
      role: "lawyer",
    });

    const visibleIdentities = await client.query(
      `SELECT id FROM user_identities ORDER BY id ASC`,
    );
    const visibleSignatures = await client.query(
      `SELECT id FROM document_signatures ORDER BY id ASC`,
    );

    expect(visibleIdentities.map((row: any) => row.id)).toEqual([
      "e1111111-1111-1111-1111-111111111111",
    ]);
    expect(visibleSignatures.map((row: any) => row.id)).toEqual([
      "f1111111-1111-1111-1111-111111111111",
      "f3333333-3333-3333-3333-333333333333",
    ]);

    await clearContext(client);
    await client.release();
  });

  async function createBaseSchema(target: DataSource): Promise<void> {
    const runner = target.createQueryRunner();
    await runner.connect();

    await runner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await runner.query(`
      CREATE TABLE organizations (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      );
    `);
    await runner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        role VARCHAR(64) NOT NULL,
        email VARCHAR(255),
        deleted_at TIMESTAMP NULL
      );
    `);
    await runner.query(`
      CREATE TABLE clients (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        status VARCHAR(32),
        type VARCHAR(32),
        access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned',
        assigned_user_id UUID NULL REFERENCES users(id),
        created_by UUID NULL REFERENCES users(id),
        updated_by UUID NULL REFERENCES users(id),
        metadata JSONB DEFAULT '{}'::jsonb,
        deleted_at TIMESTAMP NULL
      );
    `);
    await runner.query(`
      CREATE TABLE cases (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        assigned_lawyer_id UUID NOT NULL REFERENCES users(id),
        access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned',
        case_number VARCHAR(64),
        case_type VARCHAR(32),
        priority VARCHAR(32),
        status VARCHAR(32),
        metadata JSONB DEFAULT '{}'::jsonb,
        created_by UUID NULL REFERENCES users(id),
        updated_by UUID NULL REFERENCES users(id),
        deleted_at TIMESTAMP NULL
      );
    `);
    await runner.query(`
      CREATE TABLE documents (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        case_id UUID NULL REFERENCES cases(id) ON DELETE SET NULL,
        client_id UUID NULL REFERENCES clients(id) ON DELETE SET NULL,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        signed_by UUID NULL REFERENCES users(id),
        access_scope VARCHAR(32) NOT NULL DEFAULT 'assigned',
        access_level VARCHAR(32) DEFAULT 'internal',
        file_name VARCHAR(255),
        original_name VARCHAR(255),
        type VARCHAR(32),
        status VARCHAR(32),
        created_by UUID NULL REFERENCES users(id),
        updated_by UUID NULL REFERENCES users(id),
        deleted_at TIMESTAMP NULL
      );
    `);
    await runner.query(`
      CREATE TABLE events (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    await runner.query(`
      CREATE TABLE invoices (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    await runner.query(`
      CREATE TABLE pricelists (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    await runner.query(`
      CREATE TABLE calculations (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    await runner.query(`
      CREATE TABLE notifications (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
      );
    `);
    await runner.query(`
      CREATE TABLE audit_logs (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NULL REFERENCES users(id)
      );
    `);
    await runner.query(`
      CREATE TABLE onboarding_progress (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id UUID NULL REFERENCES users(id)
      );
    `);

    await runner.release();
  }

  async function resetData(target: DataSource): Promise<void> {
    await target.query(`TRUNCATE TABLE document_signatures CASCADE`);
    await target.query(`TRUNCATE TABLE user_identities CASCADE`);
    await target.query(`TRUNCATE TABLE documents CASCADE`);
    await target.query(`TRUNCATE TABLE cases CASCADE`);
    await target.query(`TRUNCATE TABLE clients CASCADE`);
    await target.query(`TRUNCATE TABLE users CASCADE`);
    await target.query(`TRUNCATE TABLE organizations CASCADE`);
  }

  async function seedData(target: DataSource): Promise<void> {
    const runner = target.createQueryRunner();
    await runner.connect();

    await clearContext(runner);

    await runner.query(`
      INSERT INTO organizations (id, name)
      VALUES
        ('11111111-1111-1111-1111-111111111111', 'Tenant One'),
        ('22222222-2222-2222-2222-222222222222', 'Tenant Two')
    `);

    await runner.query(`
      INSERT INTO users (id, tenant_id, role, email)
      VALUES
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '11111111-1111-1111-1111-111111111111', 'lawyer', 'lawyer1@tenant1.test'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '11111111-1111-1111-1111-111111111111', 'lawyer', 'lawyer2@tenant1.test'),
        ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa9', '11111111-1111-1111-1111-111111111111', 'organization_admin', 'admin@tenant1.test'),
        ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '22222222-2222-2222-2222-222222222222', 'lawyer', 'lawyer1@tenant2.test')
    `);

    await runner.query(`
      INSERT INTO clients (id, tenant_id, status, type, access_scope, assigned_user_id, created_by, metadata)
      VALUES
        ('c1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'active', 'individual', 'assigned', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '{}'::jsonb),
        ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'active', 'individual', 'assigned', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '{}'::jsonb),
        ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'active', 'individual', 'tenant', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '{}'::jsonb),
        ('c4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'active', 'individual', 'tenant', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '{}'::jsonb)
    `);

    await runner.query(`
      INSERT INTO cases (id, tenant_id, client_id, assigned_lawyer_id, access_scope, case_number, case_type, priority, status, metadata, created_by)
      VALUES
        ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'assigned', 'CASE-1', 'civil', 'medium', 'active', '{}'::jsonb, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
        ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'assigned', 'CASE-2', 'civil', 'medium', 'active', '{}'::jsonb, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
        ('a3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'tenant', 'CASE-3', 'civil', 'medium', 'active', '{}'::jsonb, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
        ('a4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'c4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'tenant', 'CASE-4', 'civil', 'medium', 'active', '{}'::jsonb, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1')
    `);

    await runner.query(`
      INSERT INTO documents (id, tenant_id, case_id, client_id, uploaded_by, signed_by, access_scope, access_level, file_name, original_name, type, status, created_by)
      VALUES
        ('d1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL, 'assigned', 'internal', 'doc-1.pdf', 'doc-1.pdf', 'contract', 'draft', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1'),
        ('d2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', NULL, 'assigned', 'internal', 'doc-2.pdf', 'doc-2.pdf', 'contract', 'draft', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
        ('d3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'tenant', 'internal', 'doc-3.pdf', 'doc-3.pdf', 'contract', 'signed', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2'),
        ('d4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'a4444444-4444-4444-4444-444444444444', 'c4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', NULL, 'tenant', 'internal', 'doc-4.pdf', 'doc-4.pdf', 'contract', 'draft', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1')
    `);

    await runner.query(`
      INSERT INTO user_identities (id, tenant_id, user_id, provider, status, external_subject_id)
      VALUES
        ('e1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'manual', 'verified', 'subject-1'),
        ('e2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'manual', 'verified', 'subject-2'),
        ('e3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'manual', 'verified', 'subject-3')
    `);

    await runner.query(`
      INSERT INTO document_signatures (id, tenant_id, document_id, user_id, provider, verification_status, signature_hash)
      VALUES
        ('f1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'd1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'manual', 'verified', 'hash-1'),
        ('f2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'd2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'manual', 'verified', 'hash-2'),
        ('f3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'd3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'manual', 'verified', 'hash-3'),
        ('f4444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'd4444444-4444-4444-4444-444444444444', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'manual', 'verified', 'hash-4')
    `);

    await runner.release();
  }

  async function setContext(
    runner: ReturnType<DataSource["createQueryRunner"]>,
    context: { tenantId: string; userId: string; role: string },
  ): Promise<void> {
    await runner.query(
      `
        SELECT
          set_config('app.current_tenant_id', $1, false),
          set_config('app.current_user_id', $2, false),
          set_config('app.current_user_role', $3, false)
      `,
      [context.tenantId, context.userId, context.role],
    );
  }

  async function clearContext(
    runner: ReturnType<DataSource["createQueryRunner"]>,
  ): Promise<void> {
    await runner.query(
      `
        SELECT
          set_config('app.current_tenant_id', '', false),
          set_config('app.current_user_id', '', false),
          set_config('app.current_user_role', '', false)
      `,
    );
  }
});
