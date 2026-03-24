"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _rlsinterceptor = require("./rls.interceptor");
describe("RlsQueryRunnerPatcher", ()=>{
    it("applies request RLS context before the first query on a runner", async ()=>{
        const query = jest.fn().mockResolvedValue([]);
        const release = jest.fn().mockResolvedValue(undefined);
        const queryRunner = {
            query,
            release
        };
        const dataSource = {
            options: {
                type: "postgres"
            },
            createQueryRunner: jest.fn(()=>queryRunner)
        };
        const contextStore = new _rlsinterceptor.RlsContextStore();
        const patcher = new _rlsinterceptor.RlsQueryRunnerPatcher(dataSource, contextStore);
        patcher.onModuleInit();
        await contextStore.run({
            tenantId: "tenant-1",
            userId: "user-1",
            role: "lawyer"
        }, async ()=>{
            const patchedQueryRunner = dataSource.createQueryRunner();
            await patchedQueryRunner.query("SELECT 42");
        });
        expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("set_config('app.current_tenant_id'"), [
            "tenant-1",
            "user-1",
            "lawyer"
        ]);
        expect(query).toHaveBeenNthCalledWith(2, "SELECT 42", undefined, undefined);
    });
    it("preserves TypeORM structured-result queries after applying RLS context", async ()=>{
        const query = jest.fn().mockResolvedValue({
            records: []
        });
        const release = jest.fn().mockResolvedValue(undefined);
        const queryRunner = {
            query,
            release
        };
        const dataSource = {
            options: {
                type: "postgres"
            },
            createQueryRunner: jest.fn(()=>queryRunner)
        };
        const contextStore = new _rlsinterceptor.RlsContextStore();
        const patcher = new _rlsinterceptor.RlsQueryRunnerPatcher(dataSource, contextStore);
        patcher.onModuleInit();
        const patchedQueryRunner = dataSource.createQueryRunner();
        await patchedQueryRunner.query("SELECT * FROM users", [
            "user-1"
        ], true);
        expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("set_config('app.current_tenant_id', '', false)"));
        expect(query).toHaveBeenNthCalledWith(2, "SELECT * FROM users", [
            "user-1"
        ], true);
    });
    it("clears stale RLS context when no authenticated request context exists", async ()=>{
        const query = jest.fn().mockResolvedValue([]);
        const release = jest.fn().mockResolvedValue(undefined);
        const queryRunner = {
            query,
            release
        };
        const dataSource = {
            options: {
                type: "postgres"
            },
            createQueryRunner: jest.fn(()=>queryRunner)
        };
        const contextStore = new _rlsinterceptor.RlsContextStore();
        const patcher = new _rlsinterceptor.RlsQueryRunnerPatcher(dataSource, contextStore);
        patcher.onModuleInit();
        const patchedQueryRunner = dataSource.createQueryRunner();
        await patchedQueryRunner.query("SELECT now()");
        expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining("set_config('app.current_tenant_id', '', false)"));
        expect(query).toHaveBeenNthCalledWith(2, "SELECT now()", undefined, undefined);
    });
});

//# sourceMappingURL=rls.interceptor.spec.js.map