"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _promises = require("node:fs/promises");
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
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
const Database = require("better-sqlite3");
describe("RegistryIndexService", ()=>{
    let tempDirectory;
    let service;
    const originalCourtStanSplitMinBytes = process.env.COURT_STAN_PRE_SPLIT_MIN_BYTES;
    const originalCourtStanSplitRowsPerFile = process.env.COURT_STAN_SPLIT_ROWS_PER_FILE;
    const originalCourtStanDeleteImportedFiles = process.env.COURT_STAN_DELETE_IMPORTED_FILES;
    const originalCourtDatesSplitMinBytes = process.env.COURT_DATES_PRE_SPLIT_MIN_BYTES;
    const originalCourtDatesSplitRowsPerFile = process.env.COURT_DATES_SPLIT_ROWS_PER_FILE;
    const originalCourtDatesDeleteImportedFiles = process.env.COURT_DATES_DELETE_IMPORTED_FILES;
    const originalAsvpSplitMinBytes = process.env.ASVP_PRE_SPLIT_MIN_BYTES;
    const originalAsvpSplitRowsPerFile = process.env.ASVP_SPLIT_ROWS_PER_FILE;
    const originalAsvpPreSplitEnabled = process.env.ASVP_PRE_SPLIT_ENABLED;
    const originalAsvpInsertRowsPerTransaction = process.env.ASVP_INSERT_ROWS_PER_TRANSACTION;
    const originalDeleteImportedAsvpFiles = process.env.ASVP_DELETE_IMPORTED_FILES;
    beforeEach(async ()=>{
        tempDirectory = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), "registry-index-"));
        await (0, _promises.mkdir)(_path.join(tempDirectory, "court_stan"));
        await (0, _promises.mkdir)(_path.join(tempDirectory, "asvp"));
        await (0, _promises.mkdir)(_path.join(tempDirectory, "court_dates"));
        service = new _registryindexservice.RegistryIndexService(_path.join(tempDirectory, "storage", "registry-index.db"));
        service.courtStanDirectory = _path.join(tempDirectory, "court_stan");
        service.asvpDirectory = _path.join(tempDirectory, "asvp");
        service.courtDatesDirectory = _path.join(tempDirectory, "court_dates");
    });
    afterEach(async ()=>{
        service?.onModuleDestroy();
        restoreEnv("COURT_STAN_PRE_SPLIT_MIN_BYTES", originalCourtStanSplitMinBytes);
        restoreEnv("COURT_STAN_SPLIT_ROWS_PER_FILE", originalCourtStanSplitRowsPerFile);
        restoreEnv("COURT_STAN_DELETE_IMPORTED_FILES", originalCourtStanDeleteImportedFiles);
        restoreEnv("COURT_DATES_PRE_SPLIT_MIN_BYTES", originalCourtDatesSplitMinBytes);
        restoreEnv("COURT_DATES_SPLIT_ROWS_PER_FILE", originalCourtDatesSplitRowsPerFile);
        restoreEnv("COURT_DATES_DELETE_IMPORTED_FILES", originalCourtDatesDeleteImportedFiles);
        restoreEnv("ASVP_PRE_SPLIT_MIN_BYTES", originalAsvpSplitMinBytes);
        restoreEnv("ASVP_SPLIT_ROWS_PER_FILE", originalAsvpSplitRowsPerFile);
        restoreEnv("ASVP_PRE_SPLIT_ENABLED", originalAsvpPreSplitEnabled);
        restoreEnv("ASVP_INSERT_ROWS_PER_TRANSACTION", originalAsvpInsertRowsPerTransaction);
        restoreEnv("ASVP_DELETE_IMPORTED_FILES", originalDeleteImportedAsvpFiles);
        await (0, _promises.rm)(tempDirectory, {
            recursive: true,
            force: true
        });
    });
    it("builds court and court_dates indexes and searches by participant/case", async ()=>{
        await (0, _promises.writeFile)(_path.join(tempDirectory, "court_stan", "registry.csv"), [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Яворівський районний суд Львівської області"\t"460/670/13-ц"\t"2/460/590/13"\t"20.02.2013"\t"головуючий суддя: Варениця Василь Степанович"\t""\t"позивач: Долинська Іванна Степанівна, відповідач: Іщук Григорій Володимирович"\t"14.03.2013"\t"Розглянуто"\t""\t""\t"на цивільну справу"\t"про розірвання шлюбу"'
        ].join("\n"), "utf-8");
        await (0, _promises.writeFile)(_path.join(tempDirectory, "court_dates", "dates.csv"), [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"10.03.2026 16:00"\t"Головуючий суддя: Філінюк І.Г."\t"460/670/13-ц"\t"Яворівський районний суд Львівської області"\t"7"\t"Позивач: Долинська Іванна Степанівна"\t"про розірвання шлюбу"'
        ].join("\n"), "utf-8");
        await service.rebuildIndexes({
            source: "court_stan",
            force: true
        });
        await service.rebuildIndexes({
            source: "court_dates",
            force: true
        });
        const courtResults = await service.searchCourtRegistry({
            query: "Долинська Іванна Степанівна"
        });
        const courtDate = await service.findCourtDateByCaseNumber("460/670/13-ц");
        expect(courtResults).toHaveLength(1);
        expect(courtResults[0].caseNumber).toBe("460/670/13-ц");
        expect(courtDate?.courtRoom).toBe("7");
    });
    it("finds court participants by partial name tokens from SQLite index", async ()=>{
        await (0, _promises.writeFile)(_path.join(tempDirectory, "court_stan", "registry.csv"), [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Тернопільський окружний адміністративний суд"\t"500/210/26"\t"П/500/243/26"\t"19.01.2026"\t"суддя-доповідач: Чепенюк Ольга Володимирівна"\t""\t"Позивач (Заявник): Пиріжок Ярослав Іванович, Відповідач (Боржник): Головне управління Пенсійного фонду України в Тернопільській області"\t"19.01.2026"\t"Призначено склад суду"\t""\t""\t"Адміністративний позов"\t"визнання бездіяльності протиправною"'
        ].join("\n"), "utf-8");
        await service.rebuildIndexes({
            source: "court_stan",
            force: true
        });
        const results = await service.searchCourtRegistry({
            query: "Пиріжок Ярослав"
        });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(expect.objectContaining({
            person: "Пиріжок Ярослав Іванович",
            caseNumber: "500/210/26"
        }));
    });
    it("splits oversized court snapshots before import, deletes the sources on success, and keeps shared indexes when folders are empty", async ()=>{
        process.env.COURT_STAN_PRE_SPLIT_MIN_BYTES = "1";
        process.env.COURT_STAN_SPLIT_ROWS_PER_FILE = "1";
        process.env.COURT_STAN_DELETE_IMPORTED_FILES = "true";
        process.env.COURT_DATES_PRE_SPLIT_MIN_BYTES = "1";
        process.env.COURT_DATES_SPLIT_ROWS_PER_FILE = "1";
        process.env.COURT_DATES_DELETE_IMPORTED_FILES = "true";
        const courtStanSourcePath = _path.join(tempDirectory, "court_stan", "registry.csv");
        const courtDatesSourcePath = _path.join(tempDirectory, "court_dates", "dates.csv");
        await (0, _promises.writeFile)(courtStanSourcePath, [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Яворівський районний суд Львівської області"\t"460/670/13-ц"\t"2/460/590/13"\t"20.02.2013"\t"головуючий суддя: Варениця Василь Степанович"\t""\t"позивач: Долинська Іванна Степанівна"\t"14.03.2013"\t"Розглянуто"\t""\t""\t"на цивільну справу"\t"про розірвання шлюбу"',
            '"Львівський окружний адміністративний суд"\t"500/210/26"\t"П/500/243/26"\t"19.01.2026"\t"суддя-доповідач: Чепенюк Ольга Володимирівна"\t""\t"Позивач: Пиріжок Ярослав Іванович"\t"19.01.2026"\t"Призначено склад суду"\t""\t""\t"Адміністративний позов"\t"визнання бездіяльності протиправною"'
        ].join("\n"), "utf-8");
        await (0, _promises.writeFile)(courtDatesSourcePath, [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"10.03.2026 16:00"\t"Головуючий суддя: Філінюк І.Г."\t"460/670/13-ц"\t"Яворівський районний суд Львівської області"\t"7"\t"Позивач: Долинська Іванна Степанівна"\t"про розірвання шлюбу"',
            '"11.03.2025 09:30"\t"Головуючий суддя: Сапіга О.О."\t"500/210/26"\t"Львівський окружний адміністративний суд"\t"4"\t"Позивач: Пиріжок Ярослав Іванович"\t"визнання бездіяльності протиправною"'
        ].join("\n"), "utf-8");
        await service.rebuildIndexes({
            source: "court_stan",
            force: true
        });
        await service.rebuildIndexes({
            source: "court_dates",
            force: true
        });
        await expect((0, _promises.stat)(courtStanSourcePath)).rejects.toThrow();
        await expect((0, _promises.stat)(courtDatesSourcePath)).rejects.toThrow();
        expect(await service.isIndexAvailableFor("court_stan")).toBe(true);
        expect(await service.isIndexAvailableFor("court_dates")).toBe(true);
        const courtResults = await service.searchCourtRegistry({
            query: "Пиріжок Ярослав"
        });
        const courtDate = await service.findCourtDateByCaseNumber("460/670/13-ц");
        expect(courtResults).toHaveLength(1);
        expect(courtDate?.courtRoom).toBe("7");
        await service.rebuildIndexes({
            source: "court_stan"
        });
        await service.rebuildIndexes({
            source: "court_dates"
        });
        const courtResultsAfterEmptyFolderRebuild = await service.searchCourtRegistry({
            query: "Долинська Іванна Степанівна"
        });
        const courtDateAfterEmptyFolderRebuild = await service.findCourtDateByCaseNumber("500/210/26");
        expect(courtResultsAfterEmptyFolderRebuild).toHaveLength(1);
        expect(courtDateAfterEmptyFolderRebuild?.courtRoom).toBe("4");
    });
    it("deletes unchanged court source files on a non-force verification pass when the shared index is already current", async ()=>{
        process.env.COURT_STAN_DELETE_IMPORTED_FILES = "false";
        process.env.COURT_DATES_DELETE_IMPORTED_FILES = "false";
        service.onModuleDestroy();
        service = new _registryindexservice.RegistryIndexService(_path.join(tempDirectory, "storage", "registry-index.db"));
        service.courtStanDirectory = _path.join(tempDirectory, "court_stan");
        service.asvpDirectory = _path.join(tempDirectory, "asvp");
        service.courtDatesDirectory = _path.join(tempDirectory, "court_dates");
        const courtStanSourcePath = _path.join(tempDirectory, "court_stan", "registry.csv");
        const courtDatesSourcePath = _path.join(tempDirectory, "court_dates", "dates.csv");
        await (0, _promises.writeFile)(courtStanSourcePath, [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Яворівський районний суд Львівської області"\t"460/670/13-ц"\t"2/460/590/13"\t"20.02.2013"\t"головуючий суддя: Варениця Василь Степанович"\t""\t"позивач: Долинська Іванна Степанівна"\t"14.03.2013"\t"Розглянуто"\t""\t""\t"на цивільну справу"\t"про розірвання шлюбу"'
        ].join("\n"), "utf-8");
        await (0, _promises.writeFile)(courtDatesSourcePath, [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"10.03.2026 16:00"\t"Головуючий суддя: Філінюк І.Г."\t"460/670/13-ц"\t"Яворівський районний суд Львівської области"\t"7"\t"Позивач: Долинська Іванна Степанівна"\t"про розірвання шлюбу"'
        ].join("\n"), "utf-8");
        await service.rebuildIndexes({
            source: "court_stan",
            force: true
        });
        await service.rebuildIndexes({
            source: "court_dates",
            force: true
        });
        await expect((0, _promises.stat)(courtStanSourcePath)).resolves.toBeDefined();
        await expect((0, _promises.stat)(courtDatesSourcePath)).resolves.toBeDefined();
        process.env.COURT_STAN_DELETE_IMPORTED_FILES = "true";
        process.env.COURT_DATES_DELETE_IMPORTED_FILES = "true";
        service.onModuleDestroy();
        service = new _registryindexservice.RegistryIndexService(_path.join(tempDirectory, "storage", "registry-index.db"));
        service.courtStanDirectory = _path.join(tempDirectory, "court_stan");
        service.asvpDirectory = _path.join(tempDirectory, "asvp");
        service.courtDatesDirectory = _path.join(tempDirectory, "court_dates");
        await service.rebuildIndexes({
            source: "court_stan"
        });
        await service.rebuildIndexes({
            source: "court_dates"
        });
        await expect((0, _promises.stat)(courtStanSourcePath)).rejects.toThrow();
        await expect((0, _promises.stat)(courtDatesSourcePath)).rejects.toThrow();
        expect(await service.isIndexAvailableFor("court_stan")).toBe(true);
        expect(await service.isIndexAvailableFor("court_dates")).toBe(true);
    });
    it("builds asvp index and searches by debtor", async ()=>{
        await (0, _promises.writeFile)(_path.join(tempDirectory, "asvp", "registry.csv"), _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"'
        ].join("\n"), "cp1251"));
        await service.rebuildIndexes({
            source: "asvp",
            force: true
        });
        const results = await service.searchAsvpRegistry({
            query: "Палінкаш Андрій Андрійович"
        });
        expect(results).toHaveLength(1);
        expect(results[0].caseNumber).toBe("80184995");
        expect(results[0].counterpartyRole).toBe("Кредитор");
        expect(results[0].sourceLabel).toBe("Реєстр виконавчих проваджень");
    });
    it("imports streamed utf-8 asvp split files from a nested split directory", async ()=>{
        await (0, _promises.mkdir)(_path.join(tempDirectory, "asvp", "split"), {
            recursive: true
        });
        await (0, _promises.writeFile)(_path.join(tempDirectory, "asvp", "split", "asvp-2026.csv"), [
            '"DEBTOR_NAME","DEBTOR_BIRTHDATE","DEBTOR_CODE","CREDITOR_NAME","CREDITOR_CODE","VP_ORDERNUM","VP_BEGINDATE","VP_STATE","ORG_NAME","DVS_CODE","PHONE_NUM","EMAIL_ADDR","BANK_ACCOUNT"',
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"'
        ].join("\n"), "utf-8");
        await service.rebuildIndexes({
            source: "asvp",
            force: true
        });
        const results = await service.searchAsvpRegistry({
            query: "Палінкаш Андрій Андрійович"
        });
        expect(results).toHaveLength(1);
        expect(results[0].caseNumber).toBe("80184995");
    });
    it("stores fresh asvp shard indexes separately from shared registry data", async ()=>{
        await (0, _promises.writeFile)(_path.join(tempDirectory, "asvp", "registry.csv"), _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"'
        ].join("\n"), "cp1251"));
        await service.rebuildIndexes({
            source: "asvp",
            force: true
        });
        const sharedDb = new Database(_path.join(tempDirectory, "storage", "registry-index.db"), {
            readonly: true
        });
        const asvpMetadataDb = new Database(_path.join(tempDirectory, "storage", "asvp-index.db"), {
            readonly: true
        });
        const shardDirectory = _path.join(tempDirectory, "storage", "asvp-index-shards");
        const shardFileNames = await (0, _promises.readdir)(shardDirectory);
        const sharedAsvpTable = sharedDb.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'asvp_records' LIMIT 1`).get();
        const metadataAsvpTable = asvpMetadataDb.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'asvp_records' LIMIT 1`).get();
        const shardDb = new Database(_path.join(shardDirectory, "asvp-2026.db"), {
            readonly: true
        });
        const asvpRowCount = shardDb.prepare(`SELECT COUNT(*) AS count FROM asvp_records`).get();
        sharedDb.close();
        asvpMetadataDb.close();
        shardDb.close();
        expect(sharedAsvpTable).toBeUndefined();
        expect(metadataAsvpTable).toBeUndefined();
        expect(shardFileNames.sort()).toEqual([
            "asvp-2026.db"
        ]);
        expect(asvpRowCount.count).toBe(1);
    });
    it("returns registry import state summaries with labels, timestamps, and availability", async ()=>{
        await service.upsertImportState("court_stan", {
            resource_name: "registry.csv",
            remote_updated_at: "2026-03-20T09:00:00.000Z",
            last_downloaded_at: "2026-03-20T09:15:00.000Z",
            last_indexed_at: "2026-03-20T09:20:00.000Z",
            last_success_at: "2026-03-20T09:20:00.000Z",
            last_status: "success",
            rows_imported: 1024
        });
        await service.upsertImportState("court_dates", {
            resource_name: "dates.csv",
            remote_updated_at: "2026-03-21T07:00:00.000Z",
            last_downloaded_at: "2026-03-21T07:10:00.000Z",
            last_status: "running",
            rows_imported: 256
        });
        await service.upsertImportState("asvp", {
            resource_name: "asvp.csv",
            remote_updated_at: "2026-03-22T08:00:00.000Z",
            last_downloaded_at: "2026-03-22T08:40:00.000Z",
            last_indexed_at: "2026-03-22T08:55:00.000Z",
            last_status: "failed",
            last_error: "database or disk is full",
            rows_imported: 0
        });
        const summaries = await service.getImportStateSummaries();
        expect(summaries).toEqual([
            expect.objectContaining({
                sourceCode: "court_stan",
                sourceLabel: "Судовий реєстр",
                available: true,
                resourceName: "registry.csv",
                remoteUpdatedAt: "2026-03-20T09:00:00.000Z",
                lastStatus: "success",
                rowsImported: 1024
            }),
            expect.objectContaining({
                sourceCode: "court_dates",
                sourceLabel: "Дати судових засідань",
                available: false,
                resourceName: "dates.csv",
                lastStatus: "running",
                rowsImported: 256
            }),
            expect.objectContaining({
                sourceCode: "asvp",
                sourceLabel: "Реєстр виконавчих проваджень",
                available: false,
                resourceName: "asvp.csv",
                lastStatus: "failed",
                lastError: "database or disk is full",
                rowsImported: 0
            })
        ]);
    });
    it("builds yearly asvp shard databases, deletes the source on success, and keeps the index when the folder is empty", async ()=>{
        process.env.ASVP_PRE_SPLIT_MIN_BYTES = "1";
        process.env.ASVP_SPLIT_ROWS_PER_FILE = "1";
        process.env.ASVP_DELETE_IMPORTED_FILES = "true";
        const sourcePath = _path.join(tempDirectory, "asvp", "registry.csv");
        await (0, _promises.writeFile)(sourcePath, _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"',
            '"Іваненко Іван Іванович","01.01.1980 00:00:00","","Львівська міська рада","26255796","70184995","06.02.2025 00:00:00","Відкрито","Львівський відділ державної виконавчої служби","44982020","(032)3-33-14","lviv@ifminjust.gov.ua","UA768201720355279000000700999"'
        ].join("\n"), "cp1251"));
        service.onModuleDestroy();
        service = new _registryindexservice.RegistryIndexService(_path.join(tempDirectory, "storage", "registry-index.db"));
        service.courtStanDirectory = _path.join(tempDirectory, "court_stan");
        service.asvpDirectory = _path.join(tempDirectory, "asvp");
        service.courtDatesDirectory = _path.join(tempDirectory, "court_dates");
        await service.rebuildIndexes({
            source: "asvp",
            force: true
        });
        await expect((0, _promises.stat)(sourcePath)).rejects.toThrow();
        expect(await service.isIndexAvailableFor("asvp")).toBe(true);
        expect((await (0, _promises.readdir)(_path.join(tempDirectory, "storage", "asvp-index-shards"))).filter((fileName)=>fileName.endsWith(".db")).sort()).toEqual([
            "asvp-2025.db",
            "asvp-2026.db"
        ]);
        const debtorResults = await service.searchAsvpRegistry({
            query: "Палінкаш Андрій Андрійович"
        });
        const creditorResults = await service.searchAsvpRegistry({
            query: "Львівська міська рада"
        });
        expect(debtorResults).toHaveLength(1);
        expect(creditorResults).toHaveLength(1);
        await service.rebuildIndexes({
            source: "asvp"
        });
        const resultsAfterEmptyFolderRebuild = await service.searchAsvpRegistry({
            query: "Іваненко Іван Іванович"
        });
        expect(resultsAfterEmptyFolderRebuild).toHaveLength(1);
    });
    it("keeps the original asvp parse error in import_state instead of replacing it with a rollback error", async ()=>{
        process.env.ASVP_INSERT_ROWS_PER_TRANSACTION = "1";
        await (0, _promises.writeFile)(_path.join(tempDirectory, "asvp", "registry.csv"), _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14"'
        ].join("\n"), "cp1251"));
        await expect(service.rebuildIndexes({
            source: "asvp",
            force: true
        })).rejects.toThrow("Invalid delimited row in registry.csv");
        const importState = await service.getImportState("asvp");
        expect(importState?.last_status).toBe("failed");
        expect(importState?.last_error).toBe("Invalid delimited row in registry.csv");
    });
    it("migrates legacy raw_row_json columns out of shared registry tables while preserving searchable data", async ()=>{
        const legacyDbPath = _path.join(tempDirectory, "storage", "registry-index.db");
        service.onModuleDestroy();
        await (0, _promises.mkdir)(_path.dirname(legacyDbPath), {
            recursive: true
        });
        const legacyDb = new Database(legacyDbPath);
        legacyDb.exec(`
      CREATE TABLE court_dates (
        id INTEGER PRIMARY KEY,
        case_number TEXT,
        case_number_normalized TEXT,
        date TEXT,
        judges TEXT,
        court_name TEXT,
        court_room TEXT,
        case_involved TEXT,
        case_description TEXT,
        raw_row_json TEXT NULL,
        source_file TEXT,
        source_row_num INTEGER NULL,
        import_batch_id TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE INDEX idx_court_dates_case_number
        ON court_dates(case_number_normalized);
      CREATE TABLE asvp_records (
        id INTEGER PRIMARY KEY,
        vp_ordernum TEXT,
        debtor_name TEXT,
        debtor_name_normalized TEXT,
        creditor_name TEXT,
        creditor_name_normalized TEXT,
        org_name TEXT,
        org_name_normalized TEXT,
        vp_begindate TEXT,
        vp_state TEXT,
        dvs_code TEXT,
        phone_num TEXT,
        email_addr TEXT,
        bank_account TEXT,
        raw_row_json TEXT NULL,
        source_file TEXT,
        source_row_num INTEGER NULL,
        import_batch_id TEXT,
        created_at TEXT,
        updated_at TEXT
      );
      CREATE INDEX idx_asvp_vp_ordernum
        ON asvp_records(vp_ordernum);
      CREATE VIRTUAL TABLE asvp_records_fts
        USING fts5(
          debtor_name_normalized,
          creditor_name_normalized,
          org_name_normalized,
          content='asvp_records',
          content_rowid='id',
          tokenize='unicode61'
        );
      CREATE TABLE import_state (
        source_code TEXT PRIMARY KEY,
        dataset_url TEXT,
        resource_name TEXT,
        resource_url TEXT,
        remote_updated_at TEXT NULL,
        local_file_hash TEXT NULL,
        extracted_hash TEXT NULL,
        last_downloaded_at TEXT NULL,
        last_indexed_at TEXT NULL,
        last_success_at TEXT NULL,
        last_status TEXT,
        last_error TEXT NULL,
        rows_imported INTEGER DEFAULT 0
      );
      CREATE TABLE import_batches (
        id TEXT PRIMARY KEY,
        source_code TEXT,
        started_at TEXT,
        finished_at TEXT NULL,
        status TEXT,
        downloaded INTEGER,
        extracted INTEGER,
        indexed INTEGER,
        rows_processed INTEGER DEFAULT 0,
        error_message TEXT NULL
      );
    `);
        legacyDb.prepare(`
        INSERT INTO court_dates (
          case_number,
          case_number_normalized,
          date,
          judges,
          court_name,
          court_room,
          case_involved,
          case_description,
          raw_row_json,
          source_file,
          source_row_num,
          import_batch_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run("460/670/13-ц", "460/670/13-ц", "10.03.2026 16:00", "Головуючий суддя: Філінюк І.Г.", "Яворівський районний суд Львівської області", "7", "Позивач: Долинська Іванна Степанівна", "про розірвання шлюбу", '{"legacy":true}', "dates.csv", 1, "batch-1", "2026-03-20T00:00:00.000Z", "2026-03-20T00:00:00.000Z");
        legacyDb.prepare(`
        INSERT INTO asvp_records (
          id,
          vp_ordernum,
          debtor_name,
          debtor_name_normalized,
          creditor_name,
          creditor_name_normalized,
          org_name,
          org_name_normalized,
          vp_begindate,
          vp_state,
          dvs_code,
          phone_num,
          email_addr,
          bank_account,
          raw_row_json,
          source_file,
          source_row_num,
          import_batch_id,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(1, "80184995", "Палінкаш Андрій Андрійович", "палінкаш андрій андрійович", "ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ", "державна судова адміністрація україни", "Тячівський відділ державної виконавчої служби", "тячівський відділ державної виконавчої служби", "06.02.2026 00:00:00", "Завершено", "34982020", "(03134)3-33-14", "tiach.vdvs.zk@ifminjust.gov.ua", "UA768201720355279000000700866", '{"legacy":true}', "registry.csv", 1, "batch-2", "2026-03-20T00:00:00.000Z", "2026-03-20T00:00:00.000Z");
        legacyDb.prepare(`
        INSERT INTO asvp_records_fts (
          rowid,
          debtor_name_normalized,
          creditor_name_normalized,
          org_name_normalized
        ) VALUES (?, ?, ?, ?)
        `).run(1, "палінкаш андрій андрійович", "державна судова адміністрація україни", "тячівський відділ державної виконавчої служби");
        legacyDb.prepare(`
        INSERT INTO import_state (
          source_code,
          last_indexed_at,
          last_success_at,
          last_status,
          rows_imported
        ) VALUES (?, ?, ?, ?, ?)
        `).run("court_dates", "2026-03-20T00:00:00.000Z", "2026-03-20T00:00:00.000Z", "success", 1);
        legacyDb.prepare(`
        INSERT INTO import_state (
          source_code,
          last_indexed_at,
          last_success_at,
          last_status,
          rows_imported
        ) VALUES (?, ?, ?, ?, ?)
        `).run("asvp", "2026-03-20T00:00:00.000Z", "2026-03-20T00:00:00.000Z", "success", 1);
        legacyDb.close();
        service = new _registryindexservice.RegistryIndexService(legacyDbPath);
        service.courtStanDirectory = _path.join(tempDirectory, "court_stan");
        service.asvpDirectory = _path.join(tempDirectory, "asvp");
        service.courtDatesDirectory = _path.join(tempDirectory, "court_dates");
        const courtDate = await service.findCourtDateByCaseNumber("460/670/13-ц");
        const asvpResults = await service.searchAsvpRegistry({
            query: "Палінкаш Андрій Андрійович"
        });
        const migratedDb = new Database(legacyDbPath, {
            readonly: true
        });
        const courtDateColumns = migratedDb.prepare(`PRAGMA table_info(court_dates)`).all();
        const asvpColumns = migratedDb.prepare(`PRAGMA table_info(asvp_records)`).all();
        migratedDb.close();
        expect(courtDate?.courtRoom).toBe("7");
        expect(asvpResults).toHaveLength(1);
        expect(courtDateColumns.some((column)=>column.name === "raw_row_json")).toBe(false);
        expect(asvpColumns.some((column)=>column.name === "raw_row_json")).toBe(false);
    });
});
function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = value;
}

//# sourceMappingURL=registry-index.service.spec.js.map