/**
 * Tenant Database Configuration
 * Supports dedicated database per tenant for Enterprise plans
 */

export interface TenantDatabaseConfig {
  tenantId: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?: boolean;
  poolSize?: number;
}

export interface DatabasePoolOptions {
  min: number;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export const DEFAULT_POOL_OPTIONS: DatabasePoolOptions = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

export const ENTERPRISE_POOL_OPTIONS: DatabasePoolOptions = {
  min: 5,
  max: 50,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
};
