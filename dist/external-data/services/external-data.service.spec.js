"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _fflate = require("fflate");
const _http = require("http");
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _promises = require("node:fs/promises");
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _externaldataservice = require("./external-data.service");
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
describe("ExternalDataService", ()=>{
    let tempDirectory;
    let server;
    let baseUrl;
    let targetDirectory;
    let previousAsvpResumableArchiveMinBytes;
    let previousAsvpArchiveChunkBytes;
    let registryIndexService;
    beforeEach(async ()=>{
        tempDirectory = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), "external-data-"));
        targetDirectory = _path.join(tempDirectory, "court_stan");
        await (0, _promises.mkdir)(targetDirectory, {
            recursive: true
        });
        previousAsvpResumableArchiveMinBytes = process.env.ASVP_RESUMABLE_ARCHIVE_MIN_BYTES;
        previousAsvpArchiveChunkBytes = process.env.ASVP_ARCHIVE_CHUNK_BYTES;
        registryIndexService = {
            getImportState: jest.fn().mockResolvedValue(null),
            upsertImportState: jest.fn().mockResolvedValue(undefined),
            rebuildIndexes: jest.fn().mockResolvedValue(undefined)
        };
    });
    afterEach(async ()=>{
        await new Promise((resolve)=>{
            if (!server) {
                resolve();
                return;
            }
            server.close(()=>resolve());
        });
        restoreEnv("ASVP_RESUMABLE_ARCHIVE_MIN_BYTES", previousAsvpResumableArchiveMinBytes);
        restoreEnv("ASVP_ARCHIVE_CHUNK_BYTES", previousAsvpArchiveChunkBytes);
        await (0, _promises.rm)(tempDirectory, {
            recursive: true,
            force: true
        });
    });
    it("downloads a CSV resource and rebuilds the matching index", async ()=>{
        const csvBody = `"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"\n"Суд"\t"1/1"\t""\t"01.01.2026"\t""\t""\t"позивач: Іван Іванов"\t""\t""\t""\t""\t""\t""\n`;
        const resources = {
            "/court.csv": Buffer.from(csvBody, "utf-8")
        };
        ({ server, baseUrl } = await startStaticServer(resources));
        const definitions = [
            {
                code: "court_stan",
                targetDirectory,
                indexedSource: "court_stan",
                resources: [
                    {
                        name: "court",
                        url: `${baseUrl}/court.csv`
                    }
                ]
            }
        ];
        const service = new _externaldataservice.ExternalDataService(registryIndexService, definitions);
        await service.updateExternalData({
            source: "court_stan"
        });
        expect((await (0, _promises.readFile)(_path.join(targetDirectory, "court.csv"))).toString("utf-8")).toContain(`"Суд"`);
        expect(registryIndexService.rebuildIndexes).toHaveBeenCalledWith({
            source: "court_stan"
        });
        expect(registryIndexService.upsertImportState).toHaveBeenCalled();
    });
    it("downloads an ASVP ZIP resource, streams it into year split files, and triggers the sharded ASVP rebuild path", async ()=>{
        targetDirectory = _path.join(tempDirectory, "asvp");
        await (0, _promises.mkdir)(targetDirectory, {
            recursive: true
        });
        const csvBody = _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"'
        ].join("\n"), "cp1251");
        const resources = {
            "/asvp.zip": Buffer.from((0, _fflate.zipSync)({
                "28-ex_csv_asvp.csv": Buffer.from(csvBody)
            }))
        };
        ({ server, baseUrl } = await startStaticServer(resources));
        const definitions = [
            {
                code: "asvp",
                targetDirectory,
                indexedSource: "asvp",
                resources: [
                    {
                        name: "asvp",
                        url: `${baseUrl}/asvp.zip`
                    }
                ]
            }
        ];
        const service = new _externaldataservice.ExternalDataService(registryIndexService, definitions);
        await service.updateExternalData({
            source: "asvp"
        });
        expect((await (0, _promises.readFile)(_path.join(targetDirectory, "split", "asvp-2026.csv"))).toString("utf-8")).toContain("Палінкаш Андрій Андрійович");
        expect(registryIndexService.rebuildIndexes).toHaveBeenCalledWith({
            source: "asvp"
        });
        expect(registryIndexService.upsertImportState).toHaveBeenCalled();
        await expect((0, _promises.readFile)(_path.join(targetDirectory, "asvp.zip"))).rejects.toThrow();
    });
    it("downloads an ASVP ZIP resource in resumable range chunks when forced", async ()=>{
        targetDirectory = _path.join(tempDirectory, "asvp-ranged");
        await (0, _promises.mkdir)(targetDirectory, {
            recursive: true
        });
        process.env.ASVP_RESUMABLE_ARCHIVE_MIN_BYTES = "1";
        process.env.ASVP_ARCHIVE_CHUNK_BYTES = "1024";
        const csvBody = _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Іваненко Іван Іванович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2025 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"'
        ].join("\n"), "cp1251");
        const resources = {
            "/asvp-ranged.zip": Buffer.from((0, _fflate.zipSync)({
                "28-ex_csv_asvp.csv": Buffer.from(csvBody)
            }))
        };
        ({ server, baseUrl } = await startStaticServer(resources));
        const definitions = [
            {
                code: "asvp",
                targetDirectory,
                indexedSource: "asvp",
                resources: [
                    {
                        name: "asvp",
                        url: `${baseUrl}/asvp-ranged.zip`
                    }
                ]
            }
        ];
        const service = new _externaldataservice.ExternalDataService(registryIndexService, definitions);
        await service.updateExternalData({
            source: "asvp"
        });
        expect((await (0, _promises.readFile)(_path.join(targetDirectory, "split", "asvp-2025.csv"))).toString("utf-8")).toContain("Іваненко Іван Іванович");
        expect(registryIndexService.rebuildIndexes).toHaveBeenCalledWith({
            source: "asvp"
        });
    });
    it("extracts a ZIP archive into the target directory", async ()=>{
        const zipped = Buffer.from((0, _fflate.zipSync)({
            "FSU.csv": Buffer.from("id,name\n1,Test\n", "utf-8")
        }));
        const resources = {
            "/reestr.zip": zipped
        };
        ({ server, baseUrl } = await startStaticServer(resources));
        const definitions = [
            {
                code: "reestr",
                targetDirectory,
                resources: [
                    {
                        name: "reestr",
                        url: `${baseUrl}/reestr.zip`
                    }
                ]
            }
        ];
        const service = new _externaldataservice.ExternalDataService(registryIndexService, definitions);
        await service.updateExternalData({
            source: "reestr"
        });
        expect((await (0, _promises.readFile)(_path.join(targetDirectory, "FSU.csv"))).toString("utf-8")).toContain("Test");
        expect(registryIndexService.rebuildIndexes).not.toHaveBeenCalled();
    });
});
async function startStaticServer(resources) {
    const server = (0, _http.createServer)((request, response)=>{
        const payload = resources[request.url || ""];
        if (!payload) {
            response.statusCode = 404;
            response.end("missing");
            return;
        }
        response.setHeader("content-length", String(payload.length));
        response.setHeader("content-type", request.url?.endsWith(".zip") ? "application/zip" : "text/csv");
        response.setHeader("etag", `"${Buffer.from(request.url || "").toString("hex")}"`);
        response.setHeader("last-modified", new Date("2026-03-13T10:00:00Z").toUTCString());
        response.setHeader("accept-ranges", "bytes");
        const rangeHeader = request.headers.range;
        if (rangeHeader) {
            const match = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader);
            if (!match) {
                response.statusCode = 416;
                response.end();
                return;
            }
            const start = Number(match[1]);
            const end = Math.min(Number(match[2] || String(payload.length - 1)), payload.length - 1);
            if (!Number.isFinite(start) || start >= payload.length || end < start) {
                response.statusCode = 416;
                response.end();
                return;
            }
            const chunk = payload.subarray(start, end + 1);
            response.statusCode = 206;
            response.setHeader("content-length", String(chunk.length));
            response.setHeader("content-range", `bytes ${start}-${end}/${payload.length}`);
            if (request.method === "HEAD") {
                response.end();
                return;
            }
            response.end(chunk);
            return;
        }
        if (request.method === "HEAD") {
            response.statusCode = 200;
            response.end();
            return;
        }
        response.statusCode = 200;
        response.end(payload);
    });
    await new Promise((resolve)=>server.listen(0, resolve));
    const port = server.address().port;
    return {
        server,
        baseUrl: `http://127.0.0.1:${port}`
    };
}
function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = value;
}

//# sourceMappingURL=external-data.service.spec.js.map