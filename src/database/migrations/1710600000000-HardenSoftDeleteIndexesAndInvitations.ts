import { MigrationInterface, QueryRunner } from "typeorm";

export class HardenSoftDeleteIndexesAndInvitations1710600000000 implements MigrationInterface {
  name = "HardenSoftDeleteIndexesAndInvitations1710600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE invitations
      ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invitations_tenant_status_active
      ON invitations (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invitations_tenant_email_active
      ON invitations (tenant_id, email)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invitations_expires_at_active
      ON invitations (expires_at)
      WHERE status = 'pending' AND deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_tenant_status_active
      ON cases (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_cases_tenant_deadline_active
      ON cases (tenant_id, deadline_date)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_tenant_status_active
      ON clients (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_tenant_type_active
      ON clients (tenant_id, type)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_tenant_status_active
      ON documents (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_documents_tenant_uploaded_active
      ON documents (tenant_id, uploaded_by)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_tenant_date_active
      ON events (tenant_id, event_date)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_tenant_status_active
      ON events (tenant_id, status)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status_active
      ON invoices (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_tenant_invoice_date_active
      ON invoices (tenant_id, invoice_date)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_calculations_tenant_status_active
      ON calculations (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_calculations_tenant_date_active
      ON calculations (tenant_id, calculation_date)
      WHERE deleted_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user_active_created
      ON notifications (tenant_id, user_id, created_at DESC)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user_unread_active
      ON notifications (tenant_id, user_id, created_at DESC)
      WHERE deleted_at IS NULL AND read_at IS NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricelists_tenant_status_active
      ON pricelists (tenant_id, status)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricelist_categories_tenant_pricelist_active
      ON pricelist_categories (tenant_id, pricelist_id, parent_id)
      WHERE deleted_at IS NULL
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_pricelist_items_tenant_pricelist_active
      ON pricelist_items (tenant_id, pricelist_id, category)
      WHERE deleted_at IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_pricelist_items_tenant_pricelist_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_pricelist_categories_tenant_pricelist_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_pricelists_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notifications_tenant_user_unread_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_notifications_tenant_user_active_created`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_calculations_tenant_date_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_calculations_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_tenant_invoice_date_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invoices_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_events_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_events_tenant_date_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_documents_tenant_uploaded_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_documents_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_clients_tenant_type_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_clients_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_cases_tenant_deadline_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_cases_tenant_status_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invitations_expires_at_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invitations_tenant_email_active`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_invitations_tenant_status_active`,
    );
    await queryRunner.query(`
      ALTER TABLE invitations
      DROP COLUMN IF EXISTS deleted_at
    `);
  }
}
