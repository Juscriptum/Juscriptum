"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get RlsContextStore () {
        return RlsContextStore;
    },
    get RlsInterceptor () {
        return RlsInterceptor;
    },
    get RlsQueryRunnerPatcher () {
        return RlsQueryRunnerPatcher;
    }
});
const _common = require("@nestjs/common");
const _rxjs = require("rxjs");
const _typeorm = require("typeorm");
const _nodeasync_hooks = require("node:async_hooks");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RlsContextStore = class RlsContextStore {
    run(context, callback) {
        return this.storage.run(context, callback);
    }
    get() {
        return this.storage.getStore() ?? null;
    }
    constructor(){
        this.storage = new _nodeasync_hooks.AsyncLocalStorage();
    }
};
RlsContextStore = _ts_decorate([
    (0, _common.Injectable)()
], RlsContextStore);
let RlsInterceptor = class RlsInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user?.tenant_id || !user.user_id || !user.role) {
            return next.handle();
        }
        return new _rxjs.Observable((subscriber)=>{
            let subscription;
            this.contextStore.run({
                tenantId: user.tenant_id,
                userId: user.user_id,
                role: user.role
            }, ()=>{
                subscription = next.handle().subscribe({
                    next: (value)=>subscriber.next(value),
                    error: (error)=>subscriber.error(error),
                    complete: ()=>subscriber.complete()
                });
            });
            return ()=>subscription?.unsubscribe();
        });
    }
    constructor(contextStore){
        this.contextStore = contextStore;
    }
};
RlsInterceptor = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof RlsContextStore === "undefined" ? Object : RlsContextStore
    ])
], RlsInterceptor);
let RlsQueryRunnerPatcher = class RlsQueryRunnerPatcher {
    onModuleInit() {
        if (this.patched || this.dataSource.options.type !== "postgres") {
            return;
        }
        const originalCreateQueryRunner = this.dataSource.createQueryRunner.bind(this.dataSource);
        this.dataSource.createQueryRunner = (...args)=>{
            const queryRunner = originalCreateQueryRunner(...args);
            const patchedQueryRunner = queryRunner;
            const originalQuery = queryRunner.query.bind(queryRunner);
            const originalRelease = queryRunner.release.bind(queryRunner);
            let lastAppliedContextKey = null;
            let applyingContext = false;
            patchedQueryRunner.query = async (query, parameters, useStructuredResult)=>{
                if (!applyingContext && !this.isSessionContextQuery(query)) {
                    const context = this.contextStore.get();
                    const nextContextKey = this.getContextKey(context);
                    if (lastAppliedContextKey !== nextContextKey) {
                        applyingContext = true;
                        try {
                            if (context) {
                                await originalQuery(`
                    SELECT
                      set_config('app.current_tenant_id', $1, false),
                      set_config('app.current_user_id', $2, false),
                      set_config('app.current_user_role', $3, false)
                  `, [
                                    context.tenantId,
                                    context.userId,
                                    context.role
                                ]);
                            } else {
                                await originalQuery(`
                    SELECT
                      set_config('app.current_tenant_id', '', false),
                      set_config('app.current_user_id', '', false),
                      set_config('app.current_user_role', '', false)
                  `);
                            }
                            lastAppliedContextKey = nextContextKey;
                        } finally{
                            applyingContext = false;
                        }
                    }
                }
                return originalQuery(query, parameters, useStructuredResult);
            };
            patchedQueryRunner.release = async ()=>{
                lastAppliedContextKey = null;
                return originalRelease();
            };
            return queryRunner;
        };
        this.patched = true;
        this.logger.log("Patched Postgres query runners for request-scoped RLS");
    }
    getContextKey(context) {
        if (!context) {
            return "__anonymous__";
        }
        return `${context.tenantId}:${context.userId}:${context.role}`;
    }
    isSessionContextQuery(query) {
        const normalized = query.toLowerCase();
        return normalized.includes("set_config('app.current_");
    }
    constructor(dataSource, contextStore){
        this.dataSource = dataSource;
        this.contextStore = contextStore;
        this.logger = new _common.Logger(RlsQueryRunnerPatcher.name);
        this.patched = false;
    }
};
RlsQueryRunnerPatcher = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource,
        typeof RlsContextStore === "undefined" ? Object : RlsContextStore
    ])
], RlsQueryRunnerPatcher);

//# sourceMappingURL=rls.interceptor.js.map