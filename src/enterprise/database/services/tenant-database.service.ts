import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource, DataSourceOptions } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Organization } from "../../../database/entities/Organization.entity";
import { SubscriptionPlan } from "../../../database/entities/enums/subscription.enum";
import {
  TenantDatabaseConfig,
  DatabasePoolOptions,
  DEFAULT_POOL_OPTIONS,
  ENTERPRISE_POOL_OPTIONS,
} from "../interfaces/tenant-database.interface";

/**
 * Tenant Database Service
 * Manages dedicated database connections per tenant for Enterprise plans
 */
@Injectable()
export class TenantDatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TenantDatabaseService.name);
  private readonly tenantConnections: Map<string, DataSource> = new Map();
  private readonly sharedDataSource: DataSource;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {
    // Shared database for non-enterprise tenants
    this.sharedDataSource = this.createSharedDataSource();
  }

  async onModuleInit() {
    try {
      await this.initializeTenantDatabases();
    } catch (error) {
      this.logger.warn(
        "Failed to initialize tenant databases on startup (this is expected for new/empty databases):",
        error.message,
      );
    }
  }

  async onModuleDestroy() {
    await this.closeAllConnections();
  }

  /**
   * Get database connection for tenant
   * Returns dedicated connection for Enterprise, shared for others
   */
  async getConnection(tenantId: string): Promise<DataSource> {
    // Check if tenant has dedicated database
    const hasDedicatedDb = await this.hasDedicatedDatabase(tenantId);

    if (hasDedicatedDb) {
      return this.getOrCreateDedicatedConnection(tenantId);
    }

    return this.sharedDataSource;
  }

  /**
   * Check if tenant should use dedicated database
   */
  private async hasDedicatedDatabase(tenantId: string): Promise<boolean> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId },
      select: ["subscriptionPlan", "settings"],
    });

    if (!organization) {
      return false;
    }

    // Enterprise plan with dedicated database setting
    return (
      organization.subscriptionPlan === SubscriptionPlan.ENTERPRISE &&
      organization.settings?.dedicatedDatabase === true
    );
  }

  /**
   * Get or create dedicated connection for tenant
   */
  private async getOrCreateDedicatedConnection(
    tenantId: string,
  ): Promise<DataSource> {
    let connection = this.tenantConnections.get(tenantId);

    if (!connection || !connection.isInitialized) {
      connection = await this.createDedicatedConnection(tenantId);
      this.tenantConnections.set(tenantId, connection);
    }

    return connection;
  }

  /**
   * Create dedicated database connection for tenant
   */
  private async createDedicatedConnection(
    tenantId: string,
  ): Promise<DataSource> {
    const config = await this.getTenantDatabaseConfig(tenantId);
    const poolOptions = this.getPoolOptions(config.tenantId);

    const options: DataSourceOptions = {
      type: "postgres",
      host: config.host,
      port: config.port,
      username: config.username,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
      synchronize: false,
      logging: this.configService.get("NODE_ENV") === "development",
      poolSize: poolOptions.max,
      extra: {
        min: poolOptions.min,
        idleTimeoutMillis: poolOptions.idleTimeoutMillis,
        connectionTimeoutMillis: poolOptions.connectionTimeoutMillis,
      },
    };

    const dataSource = new DataSource(options);
    await dataSource.initialize();

    this.logger.log(
      `Dedicated database connection established for tenant: ${tenantId}`,
    );

    return dataSource;
  }

  /**
   * Get tenant database configuration
   */
  private async getTenantDatabaseConfig(
    tenantId: string,
  ): Promise<TenantDatabaseConfig> {
    const organization = await this.organizationRepository.findOne({
      where: { id: tenantId },
    });

    // Check for custom database settings in organization metadata
    const dbConfig = organization?.metadata?.databaseConfig || {};

    return {
      tenantId,
      host:
        dbConfig.host ||
        this.configService.get<string>("DB_HOST") ||
        "localhost",
      port: dbConfig.port || this.configService.get<number>("DB_PORT") || 5432,
      username: dbConfig.username || `tenant_${tenantId.substring(0, 8)}`,
      password:
        dbConfig.password || this.configService.get<string>("DB_PASSWORD"),
      database:
        dbConfig.database || `law_organizer_${tenantId.substring(0, 8)}`,
      ssl: dbConfig.ssl ?? this.configService.get<boolean>("DB_SSL") ?? true,
      poolSize: dbConfig.poolSize,
    };
  }

  /**
   * Get pool options based on tenant plan
   */
  private getPoolOptions(tenantId: string): DatabasePoolOptions {
    // For enterprise tenants, return larger pool
    return ENTERPRISE_POOL_OPTIONS;
  }

  /**
   * Create shared data source for non-enterprise tenants (postgres only; when DB is sqlite, main connection is used)
   */
  private createSharedDataSource(): DataSource {
    const dbType = this.configService.get<string>("DB_TYPE") || "sqlite";
    if (dbType === "sqlite") {
      return new DataSource({
        type: "better-sqlite3",
        database:
          this.configService.get<string>("DB_NAME") || "law_organizer.db",
        entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
        synchronize: false,
        logging: this.configService.get<string>("NODE_ENV") === "development",
      });
    }
    return new DataSource({
      type: "postgres",
      host:
        this.configService.get<string>("DATABASE_HOST") ||
        this.configService.get<string>("DB_HOST") ||
        "localhost",
      port:
        this.configService.get<number>("DATABASE_PORT") ??
        this.configService.get<number>("DB_PORT") ??
        5432,
      username:
        this.configService.get<string>("DATABASE_USER") ||
        this.configService.get<string>("DB_USER"),
      password:
        this.configService.get<string>("DATABASE_PASSWORD") ??
        this.configService.get<string>("DB_PASSWORD"),
      database:
        this.configService.get<string>("DATABASE_NAME") ||
        this.configService.get<string>("DB_NAME") ||
        "law_organizer",
      entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
      synchronize: false,
      logging: this.configService.get<string>("NODE_ENV") === "development",
      poolSize: DEFAULT_POOL_OPTIONS.max,
      extra: {
        min: DEFAULT_POOL_OPTIONS.min,
        idleTimeoutMillis: DEFAULT_POOL_OPTIONS.idleTimeoutMillis,
        connectionTimeoutMillis: DEFAULT_POOL_OPTIONS.connectionTimeoutMillis,
      },
    });
  }

  /**
   * Initialize all tenant databases on startup
   */
  private async initializeTenantDatabases(): Promise<void> {
    const enterprises = await this.organizationRepository.find({
      where: {
        subscriptionPlan: SubscriptionPlan.ENTERPRISE,
        status: "active",
      },
    });

    for (const org of enterprises) {
      if (org.settings?.dedicatedDatabase) {
        try {
          await this.getOrCreateDedicatedConnection(org.id);
          this.logger.log(`Initialized dedicated DB for tenant: ${org.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to initialize dedicated DB for tenant ${org.id}:`,
            error,
          );
        }
      }
    }
  }

  /**
   * Close all tenant connections
   */
  private async closeAllConnections(): Promise<void> {
    for (const [tenantId, connection] of this.tenantConnections) {
      try {
        if (connection.isInitialized) {
          await connection.destroy();
          this.logger.log(`Closed connection for tenant: ${tenantId}`);
        }
      } catch (error) {
        this.logger.error(
          `Failed to close connection for tenant ${tenantId}:`,
          error,
        );
      }
    }

    if (this.sharedDataSource.isInitialized) {
      await this.sharedDataSource.destroy();
    }
  }

  /**
   * Provision new dedicated database for tenant
   */
  async provisionDedicatedDatabase(
    tenantId: string,
  ): Promise<TenantDatabaseConfig> {
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
      await adminConnection.query(
        `CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`,
      );

      // Grant privileges
      await adminConnection.query(
        `GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`,
      );

      // Switch to new database and grant schema privileges
      const tenantDb = new DataSource({
        type: "postgres",
        host: this.configService.get<string>("DB_HOST") || "localhost",
        port: this.configService.get<number>("DB_PORT") || 5432,
        username: this.configService.get<string>("DB_USER"),
        password: this.configService.get<string>("DB_PASSWORD"),
        database: dbName,
      });

      await tenantDb.initialize();
      await tenantDb.query(`GRANT ALL ON SCHEMA public TO "${dbUser}"`);
      await tenantDb.destroy();

      // Update organization metadata
      const organization = await this.organizationRepository.findOne({
        where: { id: tenantId },
      });

      if (organization) {
        organization.settings = {
          ...organization.settings,
          dedicatedDatabase: true,
        };
        organization.metadata = {
          ...organization.metadata,
          databaseConfig: {
            database: dbName,
            username: dbUser,
            host: this.configService.get<string>("DB_HOST") || "localhost",
            port: this.configService.get<number>("DB_PORT") || 5432,
          },
        };
        await this.organizationRepository.save(organization);
      }

      this.logger.log(`Provisioned dedicated database for tenant: ${tenantId}`);

      return {
        tenantId,
        host: this.configService.get<string>("DB_HOST") || "localhost",
        port: this.configService.get<number>("DB_PORT") || 5432,
        username: dbUser,
        password: dbPassword,
        database: dbName,
        ssl: true,
      };
    } catch (error) {
      this.logger.error(
        `Failed to provision database for tenant ${tenantId}:`,
        error,
      );
      throw error;
    } finally {
      await adminConnection.destroy();
    }
  }

  /**
   * Get admin connection for database management
   */
  private async getAdminConnection(): Promise<DataSource> {
    const adminDs = new DataSource({
      type: "postgres",
      host: this.configService.get<string>("DB_HOST") || "localhost",
      port: this.configService.get<number>("DB_PORT") || 5432,
      username:
        this.configService.get<string>("DB_ADMIN_USER") ||
        this.configService.get<string>("DB_USER"),
      password:
        this.configService.get<string>("DB_ADMIN_PASSWORD") ||
        this.configService.get<string>("DB_PASSWORD"),
      database: "postgres",
    });

    await adminDs.initialize();
    return adminDs;
  }

  /**
   * Generate secure password for database user
   */
  private generateSecurePassword(): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 32; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { tenantId: string; isInitialized: boolean }[] {
    const stats = [];

    for (const [tenantId, connection] of this.tenantConnections) {
      stats.push({
        tenantId,
        isInitialized: connection.isInitialized,
      });
    }

    return stats;
  }
}
