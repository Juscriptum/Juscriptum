import { HardenSoftDeleteIndexesAndInvitations1710600000000 } from "./1710600000000-HardenSoftDeleteIndexesAndInvitations";

describe("HardenSoftDeleteIndexesAndInvitations1710600000000", () => {
  it("should add invitation deleted_at and active partial indexes in up migration", async () => {
    const migration = new HardenSoftDeleteIndexesAndInvitations1710600000000();
    const queryRunner = {
      query: jest.fn(),
    } as any;

    await migration.up(queryRunner);

    const executedSql = queryRunner.query.mock.calls
      .map(([sql]: [string]) => sql)
      .join("\n");

    expect(executedSql).toContain("ALTER TABLE invitations");
    expect(executedSql).toContain("ADD COLUMN IF NOT EXISTS deleted_at");
    expect(executedSql).toContain("idx_invitations_tenant_status_active");
    expect(executedSql).toContain("idx_cases_tenant_status_active");
    expect(executedSql).toContain(
      "idx_notifications_tenant_user_unread_active",
    );
    expect(executedSql).toContain("WHERE deleted_at IS NULL");
  });

  it("should drop the added indexes and invitation deleted_at in down migration", async () => {
    const migration = new HardenSoftDeleteIndexesAndInvitations1710600000000();
    const queryRunner = {
      query: jest.fn(),
    } as any;

    await migration.down(queryRunner);

    const executedSql = queryRunner.query.mock.calls
      .map(([sql]: [string]) => sql)
      .join("\n");

    expect(executedSql).toContain(
      "DROP INDEX IF EXISTS idx_cases_tenant_status_active",
    );
    expect(executedSql).toContain(
      "DROP INDEX IF EXISTS idx_invitations_tenant_status_active",
    );
    expect(executedSql).toContain("DROP COLUMN IF EXISTS deleted_at");
  });
});
