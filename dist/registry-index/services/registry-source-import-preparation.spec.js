"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _promises = require("node:fs/promises");
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _registrysourceimportpreparation = require("./registry-source-import-preparation");
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
describe("registry-source-import-preparation", ()=>{
    const originalAsvpPreSplitEnabled = process.env.ASVP_PRE_SPLIT_ENABLED;
    const originalAsvpSplitMinBytes = process.env.ASVP_PRE_SPLIT_MIN_BYTES;
    const originalAsvpSplitRowsPerFile = process.env.ASVP_SPLIT_ROWS_PER_FILE;
    let tempDirectory;
    beforeEach(async ()=>{
        tempDirectory = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), "registry-prep-"));
    });
    afterEach(async ()=>{
        restoreEnv("ASVP_PRE_SPLIT_ENABLED", originalAsvpPreSplitEnabled);
        restoreEnv("ASVP_PRE_SPLIT_MIN_BYTES", originalAsvpSplitMinBytes);
        restoreEnv("ASVP_SPLIT_ROWS_PER_FILE", originalAsvpSplitRowsPerFile);
        await (0, _promises.rm)(tempDirectory, {
            recursive: true,
            force: true
        });
    });
    it("keeps oversized asvp files in place by default to avoid temp-disk duplication", async ()=>{
        process.env.ASVP_PRE_SPLIT_MIN_BYTES = "1";
        const sourcePath = await writeAsvpFixture(_path.join(tempDirectory, "registry.csv"));
        const plan = await (0, _registrysourceimportpreparation.prepareSourceImportPlan)("asvp", [
            sourcePath
        ]);
        expect(plan.tempRoot).toBeNull();
        expect(plan.files).toEqual([
            {
                filePath: sourcePath,
                encoding: "asvp-repaired",
                sourceFileName: "registry.csv"
            }
        ]);
    });
    it("still supports explicit asvp pre-splitting when enabled", async ()=>{
        process.env.ASVP_PRE_SPLIT_ENABLED = "true";
        process.env.ASVP_PRE_SPLIT_MIN_BYTES = "1";
        process.env.ASVP_SPLIT_ROWS_PER_FILE = "1";
        const sourcePath = await writeAsvpFixture(_path.join(tempDirectory, "registry.csv"));
        const plan = await (0, _registrysourceimportpreparation.prepareSourceImportPlan)("asvp", [
            sourcePath
        ]);
        expect(plan.tempRoot).not.toBeNull();
        expect(plan.files).toHaveLength(2);
        expect(plan.files.every((file)=>file.encoding === "utf-8")).toBe(true);
        await (0, _registrysourceimportpreparation.cleanupPreparedSourceImportPlan)(plan);
    });
});
async function writeAsvpFixture(filePath) {
    await (0, _promises.mkdir)(_path.dirname(filePath), {
        recursive: true
    });
    await (0, _promises.writeFile)(filePath, _iconvlite.encode([
        "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
        '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"',
        '"Іваненко Іван Іванович","01.01.1980 00:00:00","","Львівська міська рада","26255796","70184995","06.02.2025 00:00:00","Відкрито","Львівський відділ державної виконавчої служби","44982020","(032)3-33-14","lviv@ifminjust.gov.ua","UA768201720355279000000700999"'
    ].join("\n"), "cp1251"));
    return filePath;
}
function restoreEnv(name, value) {
    if (value === undefined) {
        delete process.env[name];
        return;
    }
    process.env[name] = value;
}

//# sourceMappingURL=registry-source-import-preparation.spec.js.map