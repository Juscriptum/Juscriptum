"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
require("reflect-metadata");
const _datasource = require("./data-source");
async function main() {
    const dataSource = (0, _datasource.buildMigrationDataSource)();
    try {
        await dataSource.initialize();
        const hasPending = await dataSource.showMigrations();
        if (!hasPending) {
            // eslint-disable-next-line no-console
            console.log("No pending migrations.");
            return;
        }
        const applied = await dataSource.runMigrations();
        if (applied.length === 0) {
            // eslint-disable-next-line no-console
            console.log("No migrations were applied.");
            return;
        }
        // eslint-disable-next-line no-console
        console.log(`Applied ${applied.length} migration(s): ${applied.map((migration)=>migration.name).join(", ")}`);
    } finally{
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
    }
}
main().catch((error)=>{
    // eslint-disable-next-line no-console
    console.error("Migration run failed:", error);
    process.exit(1);
});

//# sourceMappingURL=run.js.map