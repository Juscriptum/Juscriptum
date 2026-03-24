"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "QueryOptimizationService", {
    enumerable: true,
    get: function() {
        return QueryOptimizationService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _typeorm = require("typeorm");
const _queryoptimizationinterface = require("../interfaces/query-optimization.interface");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let QueryOptimizationService = class QueryOptimizationService {
    /**
   * Setup TypeORM query logger
   */ setupQueryLogger() {
        this.dataSource.setOptions({
            logging: this.config.enableQueryLogging,
            logger: {
                logQuery: (query, parameters)=>{
                // Query logging handled by middleware
                },
                logQueryError: (error, query, parameters)=>{
                    this.logger.error(`Query Error: ${error}\nQuery: ${query}`);
                },
                logQuerySlow: (time, query, parameters)=>{
                    this.logSlowQuery(query, time, parameters);
                },
                logSchemaBuild: (message)=>{
                    this.logger.log(message);
                },
                logMigration: (message)=>{
                    this.logger.log(message);
                },
                log: (level, message)=>{
                    switch(level){
                        case "log":
                        case "info":
                            this.logger.log(message);
                            break;
                        case "warn":
                            this.logger.warn(message);
                            break;
                    }
                }
            }
        });
    }
    /**
   * Log slow query
   */ logSlowQuery(query, duration, params, tenantId) {
        const logEntry = {
            query,
            duration,
            timestamp: new Date(),
            tenantId,
            params: params
        };
        this.slowQueryLogs.push(logEntry);
        // Trim logs if exceeding max size
        if (this.slowQueryLogs.length > this.maxLogSize) {
            this.slowQueryLogs = this.slowQueryLogs.slice(-this.maxLogSize);
        }
        this.logger.warn(`Slow query (${duration}ms): ${query.substring(0, 200)}...`);
    }
    /**
   * Get slow query logs
   */ getSlowQueries(limit = 100) {
        return this.slowQueryLogs.sort((a, b)=>b.duration - a.duration).slice(0, limit);
    }
    /**
   * Analyze query execution plan
   */ async analyzeQueryPlan(query, params) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            // Get execution plan
            const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
            const result = await queryRunner.query(explainQuery, params);
            const plan = result[0];
            const planData = plan["QUERY PLAN"]?.[0] || plan[0]?.["QUERY PLAN"] || plan;
            const suggestions = this.generatePlanSuggestions(planData);
            return {
                plan: JSON.stringify(planData, null, 2),
                executionTime: planData["Execution Time"] || 0,
                totalCost: planData["Total Cost"] || 0,
                indexesUsed: this.extractIndexes(planData),
                suggestions
            };
        } finally{
            await queryRunner.release();
        }
    }
    /**
   * Generate suggestions from query plan
   */ generatePlanSuggestions(planData) {
        const suggestions = [];
        const planStr = JSON.stringify(planData);
        // Check for sequential scans
        if (planStr.includes("Seq Scan")) {
            suggestions.push("Consider adding an index to avoid sequential scan");
        }
        // Check for nested loops with high row count
        if (planStr.includes("Nested Loop")) {
            const nestedLoops = (planStr.match(/Nested Loop/g) || []).length;
            if (nestedLoops > 2) {
                suggestions.push("Multiple nested loops detected - consider restructuring query or adding indexes");
            }
        }
        // Check for sort operations
        if (planStr.includes("Sort") && planStr.includes("Sort Method: external merge")) {
            suggestions.push("External merge sort detected - consider increasing work_mem or adding index for ORDER BY");
        }
        // Check for hash joins
        if (planStr.includes("Hash Join") && planStr.includes("Hash Cond")) {
            // Usually good, but check if hash is spilling to disk
            if (planStr.includes("Hash Buckets")) {
                suggestions.push("Hash join detected - ensure join columns are indexed");
            }
        }
        return suggestions;
    }
    /**
   * Extract indexes used from query plan
   */ extractIndexes(planData) {
        const indexes = [];
        const planStr = JSON.stringify(planData);
        // Look for index scan patterns
        const indexMatches = planStr.matchAll(/Index Scan using (\w+)/g);
        for (const match of indexMatches){
            indexes.push(match[1]);
        }
        const bitmapMatches = planStr.matchAll(/Bitmap Index Scan on (\w+)/g);
        for (const match of bitmapMatches){
            indexes.push(match[1]);
        }
        return [
            ...new Set(indexes)
        ];
    }
    /**
   * Get index suggestions for table
   */ async getIndexSuggestions(tableName) {
        const queryRunner = this.dataSource.createQueryRunner();
        const suggestions = [];
        try {
            await queryRunner.connect();
            // Get table statistics
            const statsQuery = `
                SELECT
                    schemaname,
                    relname as table_name,
                    n_live_tup as row_count,
                    n_dead_tup as dead_rows,
                    last_vacuum,
                    last_autovacuum,
                    last_analyze,
                    last_autoanalyze
                FROM pg_stat_user_tables
                WHERE relname = $1
            `;
            const stats = await queryRunner.query(statsQuery, [
                tableName
            ]);
            if (stats.length === 0) {
                return [];
            }
            const tableStats = stats[0];
            // Check for high dead row ratio
            if (tableStats.dead_rows > 0 && tableStats.row_count > 0) {
                const deadRatio = tableStats.dead_rows / tableStats.row_count;
                if (deadRatio > 0.2) {
                    suggestions.push({
                        table: tableName,
                        columns: [],
                        reason: `High dead row ratio (${(deadRatio * 100).toFixed(1)}%) - consider running VACUUM`,
                        estimatedImprovement: "Improved query performance and space reclamation"
                    });
                }
            }
            // Get missing index suggestions from pg_stat_user_indexes
            const indexQuery = `
                SELECT
                    indexrelname as index_name,
                    idx_scan as index_scans,
                    idx_tup_read as tuples_read,
                    idx_tup_fetch as tuples_fetched
                FROM pg_stat_user_indexes
                JOIN pg_index USING (indexrelid)
                WHERE relname = $1
                AND NOT indisunique
                ORDER BY idx_scan ASC
            `;
            const unusedIndexes = await queryRunner.query(indexQuery, [
                tableName
            ]);
            for (const idx of unusedIndexes.slice(0, 3)){
                if (idx.index_scans === 0) {
                    suggestions.push({
                        table: tableName,
                        columns: [
                            idx.index_name
                        ],
                        reason: `Index ${idx.index_name} has never been used - consider removing`,
                        estimatedImprovement: "Reduced write overhead and storage"
                    });
                }
            }
            // Get frequently queried columns from pg_stats
            const columnStatsQuery = `
                SELECT
                    column_name,
                    n_distinct,
                    null_frac
                FROM pg_stats
                WHERE tablename = $1
                ORDER BY n_distinct DESC
            `;
            const columnStats = await queryRunner.query(columnStatsQuery, [
                tableName
            ]);
            for (const col of columnStats.slice(0, 3)){
                if (col.n_distinct > 0.1 && col.n_distinct < 1 && col.null_frac < 0.1) {
                    suggestions.push({
                        table: tableName,
                        columns: [
                            col.column_name
                        ],
                        reason: `Column ${col.column_name} has good selectivity - consider indexing if frequently used in WHERE`,
                        estimatedImprovement: "Potential 10x-100x query speedup"
                    });
                }
            }
            return suggestions;
        } finally{
            await queryRunner.release();
        }
    }
    /**
   * Get database statistics
   */ async getDatabaseStats() {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            const tableCountQuery = `SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`;
            const indexCountQuery = `SELECT count(*) FROM pg_indexes WHERE schemaname = 'public'`;
            const totalSizeQuery = `SELECT pg_size_pretty(pg_database_size(current_database()))`;
            const connectionCountQuery = `SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()`;
            const cacheHitQuery = `
                SELECT
                    sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
                FROM pg_statio_user_tables
            `;
            const [tables, indexes, size, connections, cache] = await Promise.all([
                queryRunner.query(tableCountQuery),
                queryRunner.query(indexCountQuery),
                queryRunner.query(totalSizeQuery),
                queryRunner.query(connectionCountQuery),
                queryRunner.query(cacheHitQuery)
            ]);
            return {
                tableCount: parseInt(tables[0].count),
                indexCount: parseInt(indexes[0].count),
                totalSize: size[0].pg_size_pretty,
                connectionCount: parseInt(connections[0].count),
                cacheHitRatio: parseFloat(cache[0]?.ratio || "0")
            };
        } finally{
            await queryRunner.release();
        }
    }
    /**
   * Run VACUUM ANALYZE on table
   */ async vacuumAnalyze(tableName) {
        const queryRunner = this.dataSource.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.query(`VACUUM ANALYZE "${tableName}"`);
            this.logger.log(`VACUUM ANALYZE completed for table: ${tableName}`);
        } finally{
            await queryRunner.release();
        }
    }
    /**
   * Clear slow query logs
   */ clearSlowQueryLogs() {
        this.slowQueryLogs = [];
    }
    /**
   * Get query performance summary
   */ getPerformanceSummary() {
        if (this.slowQueryLogs.length === 0) {
            return {
                totalSlowQueries: 0,
                averageDuration: 0,
                slowestQuery: null
            };
        }
        const totalDuration = this.slowQueryLogs.reduce((sum, log)=>sum + log.duration, 0);
        const slowest = this.slowQueryLogs.reduce((prev, current)=>current.duration > prev.duration ? current : prev);
        return {
            totalSlowQueries: this.slowQueryLogs.length,
            averageDuration: totalDuration / this.slowQueryLogs.length,
            slowestQuery: slowest
        };
    }
    constructor(dataSource, configService){
        this.dataSource = dataSource;
        this.configService = configService;
        this.logger = new _common.Logger(QueryOptimizationService.name);
        this.slowQueryLogs = [];
        this.maxLogSize = 1000;
        this.config = {
            ..._queryoptimizationinterface.DEFAULT_OPTIMIZATION_CONFIG,
            slowQueryThreshold: this.configService.get("SLOW_QUERY_THRESHOLD", 1000),
            enableQueryLogging: this.configService.get("ENABLE_QUERY_LOGGING", true)
        };
        this.setupQueryLogger();
    }
};
QueryOptimizationService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], QueryOptimizationService);

//# sourceMappingURL=query-optimization.service.js.map