"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegistryIndexSourceMonitorService", {
    enumerable: true,
    get: function() {
        return RegistryIndexSourceMonitorService;
    }
});
const _common = require("@nestjs/common");
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _promises = require("node:fs/promises");
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _scheduledtasks = require("../../common/runtime/scheduled-tasks");
const _registryindexservice = require("./registry-index.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RegistryIndexSourceMonitorService = class RegistryIndexSourceMonitorService {
    async onApplicationBootstrap() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)()) {
            await this.warnIfSourceFilesNeedWorker();
            return;
        }
        if (this.intervalMs <= 0) {
            return;
        }
        await this.primeSeenSignatures();
        this.intervalHandle = setInterval(()=>{
            void this.scanForSourceChanges();
        }, this.intervalMs);
        this.intervalHandle.unref?.();
    }
    onModuleDestroy() {
        if (!this.intervalHandle) {
            return;
        }
        clearInterval(this.intervalHandle);
        this.intervalHandle = null;
    }
    async primeSeenSignatures() {
        for (const source of this.getSources()){
            this.lastSeenSignatures.set(source, await this.computeSourceDirectorySignature(source));
        }
    }
    async scanForSourceChanges() {
        if (!(0, _scheduledtasks.shouldRunScheduledTasks)() || this.scanInProgress) {
            return;
        }
        this.scanInProgress = true;
        try {
            for (const source of this.getSources()){
                const currentSignature = await this.computeSourceDirectorySignature(source);
                const previousSignature = this.lastSeenSignatures.get(source) || "";
                if (!currentSignature) {
                    this.lastSeenSignatures.set(source, "");
                    continue;
                }
                if (currentSignature === previousSignature) {
                    continue;
                }
                this.logger.log(`Detected new or changed ${source} CSV files, starting shared index rebuild`);
                await this.registryIndexService.rebuildIndexes({
                    source
                });
                this.lastSeenSignatures.set(source, await this.computeSourceDirectorySignature(source));
            }
        } catch (error) {
            this.logger.warn(`Registry source monitor warning: ${error instanceof Error ? error.message : String(error)}`);
        } finally{
            this.scanInProgress = false;
        }
    }
    async computeSourceDirectorySignature(source) {
        const directory = this.sourceDirectories[source];
        try {
            const filePaths = await this.listCsvFilesRecursively(directory);
            if (filePaths.length === 0) {
                return "";
            }
            const hash = _crypto.createHash("sha256");
            for (const filePath of filePaths){
                const fileStat = await (0, _promises.stat)(filePath);
                hash.update(_path.relative(directory, filePath));
                hash.update(String(fileStat.size));
                hash.update(String(fileStat.mtimeMs));
            }
            return hash.digest("hex");
        } catch (error) {
            const errno = error;
            if (errno?.code === "ENOENT") {
                return "";
            }
            throw error;
        }
    }
    async listCsvFilesRecursively(directory) {
        try {
            const entries = await (0, _promises.readdir)(directory, {
                withFileTypes: true
            });
            const filePaths = [];
            for (const entry of entries){
                const entryPath = _path.join(directory, entry.name);
                if (entry.isDirectory()) {
                    filePaths.push(...await this.listCsvFilesRecursively(entryPath));
                    continue;
                }
                if (entry.name.toLowerCase().endsWith(".csv")) {
                    filePaths.push(entryPath);
                }
            }
            return filePaths.sort();
        } catch (error) {
            const errno = error;
            if (errno?.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    getSources() {
        return [
            "court_stan",
            "asvp",
            "court_dates"
        ];
    }
    async warnIfSourceFilesNeedWorker() {
        const sourcesWithPendingFiles = [];
        for (const source of this.getSources()){
            const signature = await this.computeSourceDirectorySignature(source);
            if (signature) {
                sourcesWithPendingFiles.push(source);
            }
        }
        if (sourcesWithPendingFiles.length === 0) {
            return;
        }
        const sourceList = sourcesWithPendingFiles.join(", ");
        this.logger.warn(`Detected CSV files in ${sourceList}, but registry source monitoring is disabled in this process because RUN_SCHEDULED_JOBS=false. Start the dedicated worker or run npm run build:registry-index -- --source=<source> --force.`);
    }
    constructor(registryIndexService){
        this.registryIndexService = registryIndexService;
        this.logger = new _common.Logger(RegistryIndexSourceMonitorService.name);
        this.intervalMs = Number(process.env.REGISTRY_SOURCE_MONITOR_INTERVAL_MS || "30000");
        this.sourceDirectories = {
            court_stan: _path.resolve(process.cwd(), "court_stan"),
            asvp: _path.resolve(process.cwd(), "asvp"),
            court_dates: _path.resolve(process.cwd(), "court_dates")
        };
        this.lastSeenSignatures = new Map();
        this.intervalHandle = null;
        this.scanInProgress = false;
    }
};
RegistryIndexSourceMonitorService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _registryindexservice.RegistryIndexService === "undefined" ? Object : _registryindexservice.RegistryIndexService
    ])
], RegistryIndexSourceMonitorService);

//# sourceMappingURL=registry-index.source-monitor.service.js.map