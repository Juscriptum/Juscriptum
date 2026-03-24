"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ExpandCalendarEventScheduling1710700000000", {
    enumerable: true,
    get: function() {
        return ExpandCalendarEventScheduling1710700000000;
    }
});
let ExpandCalendarEventScheduling1710700000000 = class ExpandCalendarEventScheduling1710700000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS end_date TIMESTAMP NULL
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS end_time TIME NULL
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS is_all_day BOOLEAN NOT NULL DEFAULT false
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS responsible_contact TEXT NULL
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS reminder_value INTEGER NOT NULL DEFAULT 1
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS reminder_unit VARCHAR(16) NOT NULL DEFAULT 'days'
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(16) NULL
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS recurrence_interval INTEGER NULL
    `);
        await queryRunner.query(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS recurrence_end_date TIMESTAMP NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_end_date
      ON events (end_date)
      WHERE deleted_at IS NULL
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_events_recurrence_pattern
      ON events (recurrence_pattern)
      WHERE deleted_at IS NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_events_recurrence_pattern`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_events_end_date`);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS recurrence_end_date
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS recurrence_interval
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS recurrence_pattern
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS is_recurring
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS reminder_unit
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS reminder_value
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS responsible_contact
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS is_all_day
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS end_time
    `);
        await queryRunner.query(`
      ALTER TABLE events
      DROP COLUMN IF EXISTS end_date
    `);
    }
    constructor(){
        this.name = "ExpandCalendarEventScheduling1710700000000";
    }
};

//# sourceMappingURL=1710700000000-ExpandCalendarEventScheduling.js.map