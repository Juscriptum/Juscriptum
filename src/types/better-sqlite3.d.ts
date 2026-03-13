declare module "better-sqlite3" {
  class Database {
    constructor(path: string, options?: Record<string, unknown>);
    pragma(value: string): unknown;
    exec(sql: string): this;
    prepare(sql: string): any;
    transaction<T extends (...args: any[]) => any>(fn: T): T;
    close(): void;
  }

  export = Database;
}
