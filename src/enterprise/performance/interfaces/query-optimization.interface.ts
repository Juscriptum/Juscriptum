/**
 * Query Optimization Configuration
 */

export interface QueryOptimizationConfig {
  enableQueryLogging: boolean;
  slowQueryThreshold: number; // milliseconds
  maxQueryTime: number;
  enableQueryPlan: boolean;
  connectionPoolSize: number;
}

export interface QueryPlan {
  plan: string;
  executionTime: number;
  totalCost: number;
  indexesUsed: string[];
  suggestions: string[];
}

export interface SlowQueryLog {
  query: string;
  duration: number;
  timestamp: Date;
  tenantId?: string;
  params?: any[];
  stackTrace?: string;
}

export interface IndexSuggestion {
  table: string;
  columns: string[];
  reason: string;
  estimatedImprovement: string;
}

export const DEFAULT_OPTIMIZATION_CONFIG: QueryOptimizationConfig = {
  enableQueryLogging: true,
  slowQueryThreshold: 1000, // 1 second
  maxQueryTime: 30000, // 30 seconds
  enableQueryPlan: false,
  connectionPoolSize: 10,
};

// Common query patterns that need optimization
export const OPTIMIZATION_PATTERNS = {
  N_PLUS_ONE: "N+1 query detected",
  MISSING_INDEX: "Sequential scan on large table",
  INEFFICIENT_JOIN: "Nested loop join with large dataset",
  UNNECESSARY_SORT: "Sort without index",
  FULL_TABLE_SCAN: "Full table scan detected",
};
