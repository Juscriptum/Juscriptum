"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TenantDatabaseService", {
    enumerable: true,
    get: function() {
        return TenantDatabaseService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _typeorm = require("typeorm");
const _typeorm1 = require("@nestjs/typeorm");
const _Organizationentity = require("../../../database/entities/Organization.entity");
const _subscriptionenum = require("../../../database/entities/enums/subscription.enum");
const _tenantdatabaseinterface = require("../interfaces/tenant-database.interface");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let TenantDatabaseService = class TenantDatabaseService {
    async onModuleInit() {
        try {
            await this.initializeTenantDatabases();
        } catch (error) {
            this.logger.warn("Failed to initialize tenant databases on startup (this is expected for new/empty databases):", error.message);
        }
    }
    async onModuleDestroy() {
        await this.closeAllConnections();
    }
    /**
   * Get database connection for tenant
   * Returns dedicated connection for Enterprise, shared for others
   */ async getConnection(tenantId) {
        // Check if tenant has dedicated database
        const hasDedicatedDb = await this.hasDedicatedDatabase(tenantId);
        if (hasDedicatedDb) {
            return this.getOrCreateDedicatedConnection(tenantId);
        }
        return this.sharedDataSource;
    }
    /**
   * Check if tenant should use dedicated database
   */ async hasDedicatedDatabase(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId
            },
            select: [
                "subscriptionPlan",
                "settings"
            ]
        });
        if (!organization) {
            return false;
        }
        // Enterprise plan with dedicated database setting
        return organization.subscriptionPlan === _subscriptionenum.SubscriptionPlan.ENTERPRISE && organization.settings?.dedicatedDatabase === true;
    }
    /**
   * Get or create dedicated connection for tenant
   */ async getOrCreateDedicatedConnection(tenantId) {
        let connection = this.tenantConnections.get(tenantId);
        if (!connection || !connection.isInitialized) {
            connection = await this.createDedicatedConnection(tenantId);
            this.tenantConnections.set(tenantId, connection);
        }
        return connection;
    }
    /**
   * Create dedicated database connection for tenant
   */ async createDedicatedConnection(tenantId) {
        const config = await this.getTenantDatabaseConfig(tenantId);
        const poolOptions = this.getPoolOptions(config.tenantId);
        const options = {
            type: "postgres",
            host: config.host,
            port: config.port,
            username: config.username,
            password: config.password,
            database: config.database,
            ssl: config.ssl ? {
                rejectUnauthorized: false
            } : false,
            entities: [
                __dirname + "/../../**/*.entity{.ts,.js}"
            ],
            synchronize: false,
            logging: this.configService.get("NODE_ENV") === "development",
            poolSize: poolOptions.max,
            extra: {
                min: poolOptions.min,
                idleTimeoutMillis: poolOptions.idleTimeoutMillis,
                connectionTimeoutMillis: poolOptions.connectionTimeoutMillis
            }
        };
        const dataSource = new _typeorm.DataSource(options);
        await dataSource.initialize();
        this.logger.log(`Dedicated database connection established for tenant: ${tenantId}`);
        return dataSource;
    }
    /**
   * Get tenant database configuration
   */ async getTenantDatabaseConfig(tenantId) {
        const organization = await this.organizationRepository.findOne({
            where: {
                id: tenantId
            }
        });
        // Check for custom database settings in organization metadata
        const dbConfig = organization?.metadata?.databaseConfig || {};
        return {
            tenantId,
            host: dbConfig.host || this.configService.get("DB_HOST") || "localhost",
            port: dbConfig.port || this.configService.get("DB_PORT") || 5432,
            username: dbConfig.username || `tenant_${tenantId.substring(0, 8)}`,
            password: dbConfig.password || this.configService.get("DB_PASSWORD"),
            database: dbConfig.database || `law_organizer_${tenantId.substring(0, 8)}`,
            ssl: dbConfig.ssl ?? this.configService.get("DB_SSL") ?? true,
            poolSize: dbConfig.poolSize
        };
    }
    /**
   * Get pool options based on tenant plan
   */ getPoolOptions(tenantId) {
        // For enterprise tenants, return larger pool
        return _tenantdatabaseinterface.ENTERPRISE_POOL_OPTIONS;
    }
    /**
   * Create shared data source for non-enterprise tenants (postgres only; when DB is sqlite, main connection is used)
   */ createSharedDataSource() {
        const dbType = this.configService.get("DB_TYPE") || "sqlite";
        if (dbType === "sqlite") {
            return new _typeorm.DataSource({
                type: "better-sqlite3",
                database: this.configService.get("DB_NAME") || "law_organizer.db",
                entities: [
                    __dirname + "/../../**/*.entity{.ts,.js}"
                ],
                synchronize: false,
                logging: this.configService.get("NODE_ENV") === "development"
            });
        }
        return new _typeorm.DataSource({
            type: "postgres",
            host: this.configService.get("DATABASE_HOST") || this.configService.get("DB_HOST") || "localhost",
            port: this.configService.get("DATABASE_PORT") ?? this.configService.get("DB_PORT") ?? 5432,
            username: this.configService.get("DATABASE_USER") || this.configService.get("DB_USER"),
            password: this.configService.get("DATABASE_PASSWORD") ?? this.configService.get("DB_PASSWORD"),
            database: this.configService.get("DATABASE_NAME") || this.configService.get("DB_NAME") || "law_organizer",
            entities: [
                __dirname + "/../../**/*.entity{.ts,.js}"
            ],
            synchronize: false,
            logging: this.configService.get("NODE_ENV") === "development",
            poolSize: _tenantdatabaseinterface.DEFAULT_POOL_OPTIONS.max,
            extra: {
                min: _tenantdatabaseinterface.DEFAULT_POOL_OPTIONS.min,
                idleTimeoutMillis: _tenantdatabaseinterface.DEFAULT_POOL_OPTIONS.idleTimeoutMillis,
                connectionTimeoutMillis: _tenantdatabaseinterface.DEFAULT_POOL_OPTIONS.connectionTimeoutMillis
            }
        });
    }
    /**
   * Initialize all tenant databases on startup
   */ async initializeTenantDatabases() {
        const enterprises = await this.organizationRepository.find({
            where: {
                subscriptionPlan: _subscriptionenum.SubscriptionPlan.ENTERPRISE,
                status: "active"
            }
        });
        for (const org of enterprises){
            if (org.settings?.dedicatedDatabase) {
                try {
                    await this.getOrCreateDedicatedConnection(org.id);
                    this.logger.log(`Initialized dedicated DB for tenant: ${org.id}`);
                } catch (error) {
                    this.logger.error(`Failed to initialize dedicated DB for tenant ${org.id}:`, error);
                }
            }
        }
    }
    /**
   * Close all tenant connections
   */ async closeAllConnections() {
        for (const [tenantId, connection] of this.tenantConnections){
            try {
                if (connection.isInitialized) {
                    await connection.destroy();
                    this.logger.log(`Closed connection for tenant: ${tenantId}`);
                }
            } catch (error) {
                this.logger.error(`Failed to close connection for tenant ${tenantId}:`, error);
            }
        }
        if (this.sharedDataSource.isInitialized) {
            await this.sharedDataSource.destroy();
        }
    }
    /**
   * Provision new dedicated database for tenant
   */ async provisionDedicatedDatabase(tenantId) {
        const dbSuffix = tenantId.substring(0, 8);
        const dbName = `law_organizer_${dbSuffix}`;
        const dbUser = `tenant_${dbSuffix}`;
        const dbPassword = this.generateSecurePassword();
        // Get admin connection to create database
        const adminConnection = await this.getAdminConnection();
        try {
            // Create database
            await adminConnection.query(`CREATE DATABASE "${dbName}"`);
            // Create user
            await adminConnection.query(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
            // Grant privileges
            await adminConnection.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`);
            // Switch to new database and grant schema privileges
            const tenantDb = new _typeorm.DataSource({
                type: "postgres",
                host: this.configService.get("DB_HOST") || "localhost",
                port: this.configService.get("DB_PORT") || 5432,
                username: this.configService.get("DB_USER"),
                password: this.configService.get("DB_PASSWORD"),
                database: dbName
            });
            await tenantDb.initialize();
            await tenantDb.query(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
            await tenantDb.destroy();
            // Update organization metadata
            const organization = await this.organizationRepository.findOne({
                where: {
                    id: tenantId
                }
            });
            if (organization) {
                organization.settings = {
                    ...organization.settings,
                    dedicatedDatabase: true
                };
                organization.metadata = {
                    ...organization.metadata,
                    databaseConfig: {
                        database: dbName,
                        username: dbUser,
                        host: this.configService.get("DB_HOST") || "localhost",
                        port: this.configService.get("DB_PORT") || 5432
                    }
                };
                await this.organizationRepository.save(organization);
            }
            this.logger.log(`Provisioned dedicated database for tenant: ${tenantId}`);
            return {
                tenantId,
                host: this.configService.get("DB_HOST") || "localhost",
                port: this.configService.get("DB_PORT") || 5432,
                username: dbUser,
                password: dbPassword,
                database: dbName,
                ssl: true
            };
        } catch (error) {
            this.logger.error(`Failed to provision database for tenant ${tenantId}:`, error);
            throw error;
        } finally{
            await adminConnection.destroy();
        }
    }
    /**
   * Get admin connection for database management
   */ async getAdminConnection() {
        const adminDs = new _typeorm.DataSource({
            type: "postgres",
            host: this.configService.get("DB_HOST") || "localhost",
            port: this.configService.get("DB_PORT") || 5432,
            username: this.configService.get("DB_ADMIN_USER") || this.configService.get("DB_USER"),
            password: this.configService.get("DB_ADMIN_PASSWORD") || this.configService.get("DB_PASSWORD"),
            database: "postgres"
        });
        await adminDs.initialize();
        return adminDs;
    }
    /**
   * Generate secure password for database user
   */ generateSecurePassword() {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";
        for(let i = 0; i < 32; i++){
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }
    /**
   * Get connection statistics
   */ getConnectionStats() {
        const stats = [];
        for (const [tenantId, connection] of this.tenantConnections){
            stats.push({
                tenantId,
                isInitialized: connection.isInitialized
            });
        }
        return stats;
    }
    constructor(configService, organizationRepository){
        this.configService = configService;
        this.organizationRepository = organizationRepository;
        this.logger = new _common.Logger(TenantDatabaseService.name);
        this.tenantConnections = new Map();
        // Shared database for non-enterprise tenants
        this.sharedDataSource = this.createSharedDataSource();
    }
};
TenantDatabaseService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm1.InjectRepository)(_Organizationentity.Organization)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService,
        typeof _typeorm.Repository === "undefined" ? Object : _typeorm.Repository
    ])
], TenantDatabaseService);

//# sourceMappingURL=tenant-database.service.js.map