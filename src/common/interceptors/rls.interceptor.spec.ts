import { DataSource } from "typeorm";
import { RlsContextStore, RlsQueryRunnerPatcher } from "./rls.interceptor";

describe("RlsQueryRunnerPatcher", () => {
  it("applies request RLS context before the first query on a runner", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const release = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query, release } as any;
    const dataSource = {
      options: { type: "postgres" },
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const contextStore = new RlsContextStore();
    const patcher = new RlsQueryRunnerPatcher(dataSource, contextStore);

    patcher.onModuleInit();

    await contextStore.run(
      {
        tenantId: "tenant-1",
        userId: "user-1",
        role: "lawyer",
      },
      async () => {
        const patchedQueryRunner = dataSource.createQueryRunner();
        await patchedQueryRunner.query("SELECT 42");
      },
    );

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("set_config('app.current_tenant_id'"),
      ["tenant-1", "user-1", "lawyer"],
    );
    expect(query).toHaveBeenNthCalledWith(2, "SELECT 42", undefined);
  });

  it("clears stale RLS context when no authenticated request context exists", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const release = jest.fn().mockResolvedValue(undefined);
    const queryRunner = { query, release } as any;
    const dataSource = {
      options: { type: "postgres" },
      createQueryRunner: jest.fn(() => queryRunner),
    } as unknown as DataSource;
    const contextStore = new RlsContextStore();
    const patcher = new RlsQueryRunnerPatcher(dataSource, contextStore);

    patcher.onModuleInit();

    const patchedQueryRunner = dataSource.createQueryRunner();
    await patchedQueryRunner.query("SELECT now()");

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("set_config('app.current_tenant_id', '', false)"),
    );
    expect(query).toHaveBeenNthCalledWith(2, "SELECT now()", undefined);
  });
});
