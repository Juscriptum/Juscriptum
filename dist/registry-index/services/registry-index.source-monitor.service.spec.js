"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _promises = require("node:fs/promises");
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _registryindexsourcemonitorservice = require("./registry-index.source-monitor.service");
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
describe("RegistryIndexSourceMonitorService", ()=>{
    const originalRunScheduledJobs = process.env.RUN_SCHEDULED_JOBS;
    let tempDirectory;
    beforeEach(async ()=>{
        tempDirectory = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), "registry-source-monitor-"));
        await (0, _promises.mkdir)(_path.join(tempDirectory, "court_stan"));
        await (0, _promises.mkdir)(_path.join(tempDirectory, "asvp"));
        await (0, _promises.mkdir)(_path.join(tempDirectory, "court_dates"));
    });
    afterEach(async ()=>{
        restoreEnv("RUN_SCHEDULED_JOBS", originalRunScheduledJobs);
        await (0, _promises.rm)(tempDirectory, {
            recursive: true,
            force: true
        });
        jest.restoreAllMocks();
    });
    it("warns when csv files are present but scheduled tasks are disabled", async ()=>{
        process.env.RUN_SCHEDULED_JOBS = "false";
        await (0, _promises.mkdir)(_path.join(tempDirectory, "asvp", "split"), {
            recursive: true
        });
        await (0, _promises.writeFile)(_path.join(tempDirectory, "asvp", "split", "asvp-2026.csv"), "header");
        const rebuildIndexes = jest.fn();
        const service = new _registryindexsourcemonitorservice.RegistryIndexSourceMonitorService({
            rebuildIndexes
        });
        service.sourceDirectories = {
            court_stan: _path.join(tempDirectory, "court_stan"),
            asvp: _path.join(tempDirectory, "asvp"),
            court_dates: _path.join(tempDirectory, "court_dates")
        };
        const warnSpy = jest.spyOn(service["logger"], "warn").mockImplementation(()=>undefined);
        await service.onApplicationBootstrap();
        expect(rebuildIndexes).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("RUN_SCHEDULED_JOBS=false"));
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("asvp"));
    });
});
function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = value;
}

//# sourceMappingURL=registry-index.source-monitor.service.spec.js.map