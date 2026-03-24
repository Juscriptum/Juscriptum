"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _promises = require("node:fs/promises");
const _os = /*#__PURE__*/ _interop_require_wildcard(require("os"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _courtregistryservice = require("./court-registry.service");
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
describe("CourtRegistryService", ()=>{
    let tempDirectory;
    let courtDirectory;
    let asvpDirectory;
    let courtDatesDirectory;
    let service;
    beforeEach(async ()=>{
        tempDirectory = await (0, _promises.mkdtemp)(_path.join(_os.tmpdir(), "court-registry-"));
        courtDirectory = _path.join(tempDirectory, "court");
        asvpDirectory = _path.join(tempDirectory, "asvp");
        courtDatesDirectory = _path.join(tempDirectory, "court-dates");
        await (0, _promises.mkdir)(courtDirectory);
        await (0, _promises.mkdir)(asvpDirectory);
        await (0, _promises.mkdir)(courtDatesDirectory);
        service = new _courtregistryservice.CourtRegistryService([
            courtDirectory
        ], [
            asvpDirectory
        ], [
            courtDatesDirectory
        ]);
    });
    afterEach(async ()=>{
        await (0, _promises.rm)(tempDirectory, {
            recursive: true,
            force: true
        });
    });
    it("should find participant matches by full contiguous substring", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDirectory, "registry.csv"), [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Яворівський районний суд Львівської області"\t"460/670/13-ц"\t"2/460/590/13"\t"20.02.2013"\t"головуючий суддя: Варениця Василь Степанович"\t"суддя-доповідач: Варениця Василь Степанович"\t"позивач: Долинська Іванна Степанівна, відповідач: Іщук Григорій Володимирович"\t"14.03.2013"\t"Розглянуто: рішення набрало законної сили"\t""\t""\t"на цивільну справу (позовне провадження)"\t"про розірвання шлюбу"'
        ].join("\n"), "utf-8");
        const results = await service.searchInCourtRegistry({
            query: "Долинська Іванна Степанівна"
        });
        expect(results).toEqual([
            {
                source: "court_registry",
                sourceLabel: "Судовий реєстр",
                person: "Долинська Іванна Степанівна",
                role: "позивач",
                caseDescription: "про розірвання шлюбу",
                caseNumber: "460/670/13-ц",
                courtName: "Яворівський районний суд Львівської області",
                caseProc: "2/460/590/13",
                registrationDate: "20.02.2013",
                judge: "головуючий суддя: Варениця Василь Степанович",
                type: "на цивільну справу (позовне провадження)",
                stageDate: "14.03.2013",
                stageName: "Розглянуто: рішення набрало законної сили",
                participants: "позивач: Долинська Іванна Степанівна, відповідач: Іщук Григорій Володимирович"
            }
        ]);
    });
    it("should find participant by partial full name tokens", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDirectory, "registry.csv"), [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Тернопільський окружний адміністративний суд"\t"500/210/26"\t"П/500/243/26"\t"19.01.2026"\t"суддя-доповідач: Чепенюк Ольга Володимирівна"\t""\t"Позивач (Заявник): Пиріжок Ярослав Іванович, Відповідач (Боржник): Головне управління Пенсійного фонду України в Тернопільській області"\t"19.01.2026"\t"Призначено склад суду"\t""\t""\t"Адміністративний позов"\t"визнання бездіяльності протиправною"'
        ].join("\n"), "utf-8");
        const results = await service.searchInCourtRegistry({
            query: "Пиріжок Ярослав"
        });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(expect.objectContaining({
            person: "Пиріжок Ярослав Іванович",
            caseNumber: "500/210/26"
        }));
    });
    it("should decode and search ASVP rows encoded in cp1251", async ()=>{
        const csv = [
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"'
        ].join("\n");
        await (0, _promises.writeFile)(_path.join(asvpDirectory, "registry.csv"), _iconvlite.encode(csv, "cp1251"));
        const results = await service.searchInAsvpRegistry({
            query: "Палінкаш Андрій Андрійович"
        });
        expect(results).toHaveLength(1);
        expect(results[0]).toEqual(expect.objectContaining({
            source: "asvp",
            sourceLabel: "Реєстр виконавчих проваджень",
            person: "Палінкаш Андрій Андрійович",
            role: "Боржник",
            caseNumber: "80184995",
            courtName: "Тячівський відділ державної виконавчої служби",
            counterpartyName: "ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ",
            counterpartyRole: "Кредитор"
        }));
    });
    it("should combine court and ASVP results for case search", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDirectory, "registry.csv"), [
            '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
            '"Господарський суд міста Києва"\t"910/15187/25"\t""\t"05.12.2025"\t"суддя-доповідач: Літвінова М.Є."\t""\t"Позивач: Товариство з обмеженою відповідальністю ""Альфа"""\t"19.01.2026"\t"Призначено до судового розгляду"\t""\t""\t"Позовна заява"\t"визнання недійсним договору"'
        ].join("\n"), "utf-8");
        await (0, _promises.writeFile)(_path.join(asvpDirectory, "registry.csv"), _iconvlite.encode([
            "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
            '"Товариство з обмеженою відповідальністю ""Альфа""","","","Компанія-кредитор","123","9001","01.02.2026 00:00:00","Відкрито","Орган примусового виконання","42","","",""'
        ].join("\n"), "cp1251"));
        const results = await service.searchInCaseRegistries({
            query: "Альфа"
        });
        expect(results.map((result)=>result.source)).toEqual([
            "court_registry",
            "asvp"
        ]);
    });
    it("should reject court_dates in the combined registry search API", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDatesDirectory, "dates.csv"), [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"23.03.2026 14:00"\t"Головуючий суддя: МИЦИК С.А."\t"629/450/26"\t"Лозівський міськрайонний суд Харківської області"\t"2"\t"Позивач: Іванова Людмила Яківна, відповідач: Лозівський відділ державної виконавчої служби"\t"про зняття арешту з майна боржника"'
        ].join("\n"), "utf-8");
        await expect(service.searchInCaseRegistries({
            query: "Іванова Людмила Яківна",
            source: "court_dates"
        })).rejects.toThrow(_common.BadRequestException);
    });
    it("should keep court_dates participant search available through the dedicated lookup", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDatesDirectory, "dates.csv"), [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"23.03.2026 14:00"\t"Головуючий суддя: МИЦИК С.А."\t"629/450/26"\t"Лозівський міськрайонний суд Харківської області"\t"2"\t"Позивач: Іванова Людмила Яківна, відповідач: Лозівський відділ державної виконавчої служби"\t"про зняття арешту з майна боржника"'
        ].join("\n"), "utf-8");
        const results = await service.searchCourtDates({
            query: "Іванова Людмила Яківна",
            onlyUpcoming: false
        });
        expect(results).toEqual(expect.arrayContaining([
            expect.objectContaining({
                caseNumber: "629/450/26",
                courtName: "Лозівський міськрайонний суд Харківської області",
                date: "23.03.2026 14:00"
            })
        ]));
    });
    it("should match court_dates participants regardless of apostrophe variant", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDatesDirectory, "dates.csv"), [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            `"02.04.2026 12:10"\t"Головуючий суддя: Краснокутська Н.С."\t"175/2344/26"\t"Дніпропетровський районний суд Дніпропетровської області"\t""\t"Позивач: ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ ""ДІДЖИ ФІНАНС"", відповідач: Іванова Мар'яна Василівна"\t"про стягнення заборгованості за кредитним договором"`
        ].join("\n"), "utf-8");
        const results = await service.searchCourtDates({
            query: "Іванова Марʼяна Василівна",
            onlyUpcoming: false
        });
        expect(results).toEqual(expect.arrayContaining([
            expect.objectContaining({
                caseNumber: "175/2344/26",
                caseInvolved: expect.stringContaining("Іванова Мар'яна Василівна")
            })
        ]));
    });
    it("should find a court date row by case number", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDatesDirectory, "dates.csv"), [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"10.03.2026 16:00"\t"Головуючий суддя: Філінюк І.Г."\t"916/4127/25"\t"Південно-західний апеляційний господарський суд"\t"7"\t"Позивач: ТОВ ""МП-ПРОСПЕРІТІ"""\t"про визнання незаконними дій"'
        ].join("\n"), "utf-8");
        const result = await service.findCourtDateByCaseNumber("916/4127/25");
        expect(result).toEqual({
            date: "10.03.2026 16:00",
            judges: "Головуючий суддя: Філінюк І.Г.",
            caseNumber: "916/4127/25",
            courtName: "Південно-західний апеляційний господарський суд",
            courtRoom: "7",
            caseInvolved: 'Позивач: ТОВ "МП-ПРОСПЕРІТІ"',
            caseDescription: "про визнання незаконними дій"
        });
    });
    it("should search court dates by participant name", async ()=>{
        await (0, _promises.writeFile)(_path.join(courtDatesDirectory, "dates.csv"), [
            '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
            '"25.03.2026 11:30"\t"Суддя"\t"760/123/26"\t"Шевченківський районний суд міста Києва"\t"12"\t"Іваненко Іван Іванович"\t"стягнення заборгованості"'
        ].join("\n"), "utf-8");
        const results = await service.searchCourtDates({
            query: "Іваненко Іван Іванович",
            onlyUpcoming: true
        });
        expect(results).toEqual([
            {
                date: "25.03.2026 11:30",
                judges: "Суддя",
                caseNumber: "760/123/26",
                courtName: "Шевченківський районний суд міста Києва",
                courtRoom: "12",
                caseInvolved: "Іваненко Іван Іванович",
                caseDescription: "стягнення заборгованості"
            }
        ]);
    });
    it("should reject empty queries", async ()=>{
        await expect(service.searchInCourtRegistry({
            query: "   "
        })).rejects.toThrow(_common.BadRequestException);
    });
    it("should throw when no registry directory exists", async ()=>{
        await (0, _promises.rm)(courtDirectory, {
            recursive: true,
            force: true
        });
        await expect(service.searchInCourtRegistry({
            query: "Іван"
        })).rejects.toThrow(_common.NotFoundException);
    });
    it("should resolve court dates from the internal registry index without court_dates CSV files", async ()=>{
        const indexedService = new _courtregistryservice.CourtRegistryService([
            courtDirectory
        ], [
            asvpDirectory
        ], [
            _path.join(tempDirectory, "missing-court-dates")
        ], {
            isIndexAvailableFor: jest.fn().mockImplementation(async (source)=>source === "court_stan" || source === "court_dates"),
            searchCourtRegistry: jest.fn().mockResolvedValue([
                {
                    caseNumber: "760/123/26"
                }
            ]),
            searchCourtDates: jest.fn().mockResolvedValue([
                {
                    date: "25.03.2026 11:30",
                    judges: "Суддя",
                    caseNumber: "760/123/26",
                    courtName: "Шевченківський районний суд міста Києва",
                    courtRoom: "12",
                    caseInvolved: "Іваненко Іван Іванович",
                    caseDescription: "стягнення заборгованості"
                }
            ]),
            findCourtDateByCaseNumber: jest.fn().mockResolvedValue({
                date: "25.03.2026 11:30",
                judges: "Суддя",
                caseNumber: "760/123/26",
                courtName: "Шевченківський районний суд міста Києва",
                courtRoom: "12",
                caseInvolved: "Іваненко Іван Іванович",
                caseDescription: "стягнення заборгованості"
            })
        });
        const results = await indexedService.searchCourtDates({
            query: "Іваненко Іван Іванович",
            onlyUpcoming: true
        });
        expect(results).toEqual([
            {
                date: "25.03.2026 11:30",
                judges: "Суддя",
                caseNumber: "760/123/26",
                courtName: "Шевченківський районний суд міста Києва",
                courtRoom: "12",
                caseInvolved: "Іваненко Іван Іванович",
                caseDescription: "стягнення заборгованості"
            }
        ]);
    });
    it("should return an empty court_dates search result when indexed lookup misses and raw court_dates files are absent", async ()=>{
        const indexedService = new _courtregistryservice.CourtRegistryService([
            courtDirectory
        ], [
            asvpDirectory
        ], [
            _path.join(tempDirectory, "missing-court-dates")
        ], {
            isIndexAvailableFor: jest.fn().mockImplementation(async (source)=>source === "court_stan" || source === "court_dates"),
            searchCourtDates: jest.fn().mockResolvedValue([]),
            searchCourtRegistry: jest.fn().mockResolvedValue([]),
            findCourtDateByCaseNumber: jest.fn().mockResolvedValue(null)
        });
        await expect(indexedService.searchCourtDates({
            query: "Шевченко Валерій Вадимович",
            caseNumber: "195/334/26",
            onlyUpcoming: true
        })).resolves.toEqual([]);
    });
    it("should return an empty batch match map when indexed lookup misses and raw court_dates files are absent", async ()=>{
        const indexedService = new _courtregistryservice.CourtRegistryService([
            courtDirectory
        ], [
            asvpDirectory
        ], [
            _path.join(tempDirectory, "missing-court-dates")
        ], {
            isIndexAvailableFor: jest.fn().mockImplementation(async (source)=>source === "court_dates"),
            findCourtDateByCaseNumber: jest.fn().mockResolvedValue(null)
        });
        await expect(indexedService.findCourtDatesByCaseNumbers([
            "195/334/26"
        ])).resolves.toEqual(new Map());
    });
});

//# sourceMappingURL=court-registry.service.spec.js.map