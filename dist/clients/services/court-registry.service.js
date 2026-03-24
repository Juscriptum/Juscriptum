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
    get ASVP_REGISTRY_DIRECTORIES () {
        return ASVP_REGISTRY_DIRECTORIES;
    },
    get ASVP_SOURCE_LABEL () {
        return ASVP_SOURCE_LABEL;
    },
    get COURT_DATES_DIRECTORIES () {
        return COURT_DATES_DIRECTORIES;
    },
    get COURT_DATES_SOURCE_LABEL () {
        return COURT_DATES_SOURCE_LABEL;
    },
    get COURT_REGISTRY_DIRECTORIES () {
        return COURT_REGISTRY_DIRECTORIES;
    },
    get COURT_REGISTRY_SOURCE_LABEL () {
        return COURT_REGISTRY_SOURCE_LABEL;
    },
    get CourtRegistryService () {
        return CourtRegistryService;
    }
});
const _common = require("@nestjs/common");
const _child_process = require("child_process");
const _fs = require("fs");
const _promises = require("node:fs/promises");
const _iconvlite = /*#__PURE__*/ _interop_require_wildcard(require("iconv-lite"));
const _path = /*#__PURE__*/ _interop_require_wildcard(require("path"));
const _readline = /*#__PURE__*/ _interop_require_wildcard(require("readline"));
const _stream = require("stream");
const _registryindexservice = require("../../registry-index/services/registry-index.service");
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
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const COURT_REGISTRY_SOURCE_LABEL = "Судовий реєстр";
const ASVP_SOURCE_LABEL = "Реєстр виконавчих проваджень";
const COURT_DATES_SOURCE_LABEL = "Дати судових засідань";
const COURT_REGISTRY_DIRECTORIES = "COURT_REGISTRY_DIRECTORIES";
const ASVP_REGISTRY_DIRECTORIES = "ASVP_REGISTRY_DIRECTORIES";
const COURT_DATES_DIRECTORIES = "COURT_DATES_DIRECTORIES";
let CourtRegistryService = class CourtRegistryService {
    async searchInCourtRegistry(options) {
        this.validateSearchOptions(options);
        if (this.registryIndexService) {
            try {
                const hasIndex = await this.registryIndexService.isIndexAvailableFor("court_stan");
                if (hasIndex) {
                    return this.registryIndexService.searchCourtRegistry(options);
                }
            } catch (error) {
                this.logger.warn(`Court registry index lookup failed, falling back to CSV scan: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const normalizedQuery = this.normalizeSearchValue(options.query || "");
        const dateRange = this.buildDateRange(options.dateFrom, options.dateTo);
        const registryDirectory = await this.resolveDirectory(this.registryDirectories, "Каталог реєстру судових справ не знайдено. Очікувався `court_stan` або `court_base` у корені проєкту.");
        const fileNames = await this.listCsvFiles(registryDirectory);
        const results = [];
        for (const fileName of fileNames){
            const filePath = _path.join(registryDirectory, fileName);
            try {
                const fileResults = await this.searchCourtRegistryFile(filePath, options, normalizedQuery, dateRange);
                results.push(...fileResults);
            } catch (error) {
                this.logger.warn(`Skipping registry file ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return results;
    }
    async searchInCaseRegistries(options) {
        this.validateSearchOptions(options);
        if (options.source === "court_dates") {
            throw new _common.BadRequestException("`court_dates` використовується лише для пошуку найближчих засідань по справі. Для загального пошуку в реєстрах використовуйте `court_registry` або `asvp`.");
        }
        const shouldSearchCourt = !options.source || options.source === "court_registry";
        const shouldSearchAsvp = !options.source || options.source === "asvp";
        const [courtResults, asvpResults] = await Promise.allSettled([
            shouldSearchCourt ? this.searchInCourtRegistry(options) : Promise.resolve([]),
            shouldSearchAsvp ? this.withTimeout(this.searchInAsvpRegistry(options), this.combinedAsvpTimeoutMs, "ASVP combined search timeout") : Promise.resolve([])
        ]);
        if (courtResults.status === "rejected") {
            this.logger.warn(`Court registry search failed in combined search: ${courtResults.reason instanceof Error ? courtResults.reason.message : String(courtResults.reason)}`);
        }
        if (asvpResults.status === "rejected") {
            this.logger.warn(`ASVP search failed in combined search: ${asvpResults.reason instanceof Error ? asvpResults.reason.message : String(asvpResults.reason)}`);
        }
        return [
            ...courtResults.status === "fulfilled" ? courtResults.value : [],
            ...asvpResults.status === "fulfilled" ? asvpResults.value : []
        ];
    }
    async searchInCourtDatesRegistry(options) {
        const normalizedQuery = this.normalizeSearchValue(options.query || "");
        const results = await this.searchCourtDates({
            query: options.query,
            caseNumber: options.caseNumber,
            onlyUpcoming: false,
            limit: 50
        });
        return results.flatMap((result)=>this.extractCourtDateParticipants(result).filter((participant)=>this.matchesCourtDateParticipant(result, participant, options, normalizedQuery)).map((participant)=>({
                    source: "court_dates",
                    sourceLabel: COURT_DATES_SOURCE_LABEL,
                    person: participant.person,
                    role: participant.role,
                    caseDescription: result.caseDescription || "",
                    caseNumber: result.caseNumber || "",
                    courtName: result.courtName || "",
                    caseProc: "",
                    registrationDate: result.date || "",
                    judge: result.judges || "",
                    type: "Судове засідання",
                    stageDate: result.date || "",
                    stageName: "Найближче засідання",
                    participants: result.caseInvolved || ""
                }))).sort((left, right)=>this.compareSearchResults(left.person, right.person, normalizedQuery)).slice(0, 200);
    }
    async searchInAsvpRegistry(options) {
        this.validateSearchOptions(options);
        if (this.registryIndexService) {
            try {
                const hasIndex = await this.registryIndexService.isIndexAvailableFor("asvp");
                if (hasIndex) {
                    return this.registryIndexService.searchAsvpRegistry(options);
                }
            } catch (error) {
                this.logger.warn(`ASVP index lookup failed, falling back to raw search: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const normalizedQuery = this.normalizeSearchValue(options.query || "");
        const dateRange = this.buildDateRange(options.dateFrom, options.dateTo);
        const registryDirectory = await this.resolveDirectory(this.asvpDirectories, "Каталог реєстру виконавчих проваджень не знайдено. Очікувався `asvp` у корені проєкту.");
        const fileNames = await this.listCsvFiles(registryDirectory);
        const results = [];
        for (const fileName of fileNames){
            const filePath = _path.join(registryDirectory, fileName);
            try {
                const fileResults = await this.searchAsvpFile(filePath, options.query || "", options, normalizedQuery, dateRange);
                results.push(...fileResults);
            } catch (error) {
                this.logger.warn(`Skipping ASVP file ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return results;
    }
    async findCourtDateByCaseNumber(caseNumber) {
        if (this.registryIndexService) {
            try {
                const hasIndex = await this.registryIndexService.isIndexAvailableFor("court_dates");
                if (hasIndex) {
                    return this.registryIndexService.findCourtDateByCaseNumber(caseNumber);
                }
            } catch (error) {
                this.logger.warn(`Court dates index lookup failed, falling back to CSV scan: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const results = await this.findCourtDatesByCaseNumbers([
            caseNumber
        ]);
        return results.get(this.normalizeCaseNumber(caseNumber)) ?? null;
    }
    async findCourtDatesByCaseNumbers(caseNumbers) {
        const normalizedNumbers = new Set(caseNumbers.map((value)=>this.normalizeCaseNumber(value)).filter((value)=>value.length > 0));
        if (normalizedNumbers.size === 0) {
            return new Map();
        }
        if (this.registryIndexService) {
            try {
                const hasIndex = await this.registryIndexService.isIndexAvailableFor("court_dates");
                if (hasIndex) {
                    const indexedMatches = await Promise.all(Array.from(normalizedNumbers).map(async (normalizedCaseNumber)=>{
                        const match = await this.registryIndexService?.findCourtDateByCaseNumber(normalizedCaseNumber);
                        return match ? [
                            normalizedCaseNumber,
                            match
                        ] : null;
                    }));
                    return new Map(indexedMatches.filter((value)=>Boolean(value)));
                }
            } catch (error) {
                this.logger.warn(`Court dates indexed batch lookup failed, falling back to CSV scan: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const directory = await this.resolveDirectoryIfPresent(this.courtDatesDirectories);
        if (!directory) {
            if (this.registryIndexService) {
                this.logger.warn("Court dates raw directory is missing; returning indexed batch matches only.");
                return new Map();
            }
            throw new _common.NotFoundException("Каталог дат судових засідань не знайдено. Очікувався `court_dates` у корені проєкту.");
        }
        const fileNames = await this.listCsvFiles(directory);
        const matches = new Map();
        for (const fileName of fileNames){
            const filePath = _path.join(directory, fileName);
            try {
                for await (const row of this.readDelimitedRows(filePath, {
                    delimiter: "\t",
                    encoding: "utf-8"
                })){
                    const normalizedCaseNumber = this.normalizeCaseNumber(row.case);
                    if (!normalizedCaseNumber || !normalizedNumbers.has(normalizedCaseNumber) || matches.has(normalizedCaseNumber)) {
                        continue;
                    }
                    matches.set(normalizedCaseNumber, {
                        date: row.date || "",
                        judges: row.judges || "",
                        caseNumber: row.case || "",
                        courtName: row.court_name || "",
                        courtRoom: row.court_room || "",
                        caseInvolved: row.case_involved || "",
                        caseDescription: row.case_description || ""
                    });
                    if (matches.size === normalizedNumbers.size) {
                        return matches;
                    }
                }
            } catch (error) {
                this.logger.warn(`Skipping court dates file ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return matches;
    }
    async searchCourtDates(options) {
        const normalizedQuery = this.normalizeSearchValue(options.query || "");
        const normalizedCaseNumber = this.normalizeCaseNumber(options.caseNumber || "");
        const limit = Math.max(1, options.limit || 10);
        if (!normalizedQuery && !normalizedCaseNumber) {
            return [];
        }
        if (normalizedCaseNumber && !normalizedQuery) {
            const directMatch = await this.findCourtDateByCaseNumber(options.caseNumber || "");
            if (!directMatch) {
                return [];
            }
            if (options.onlyUpcoming && !this.isUpcomingCourtDateValue(directMatch.date, new Date())) {
                return [];
            }
            return [
                directMatch
            ];
        }
        if (this.registryIndexService) {
            try {
                const hasCourtDatesIndex = await this.registryIndexService.isIndexAvailableFor("court_dates");
                if (hasCourtDatesIndex) {
                    const directIndexedResults = await this.registryIndexService.searchCourtDates(options);
                    const filteredIndexedResults = directIndexedResults.filter((result)=>options.onlyUpcoming ? this.isUpcomingCourtDateValue(result.date, new Date()) : true).sort((left, right)=>{
                        const leftTimestamp = this.parseCourtDateValue(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                        const rightTimestamp = this.parseCourtDateValue(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                        return leftTimestamp - rightTimestamp;
                    }).slice(0, limit);
                    if (filteredIndexedResults.length > 0) {
                        return filteredIndexedResults;
                    }
                }
            } catch (error) {
                this.logger.warn(`Direct court_dates indexed search failed, falling back to secondary strategies: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const indexedResults = await this.searchCourtDatesViaRegistryIndex(options, normalizedQuery, normalizedCaseNumber, limit);
        if (indexedResults.length > 0) {
            return indexedResults;
        }
        const directory = await this.resolveDirectoryIfPresent(this.courtDatesDirectories);
        if (!directory) {
            if (this.registryIndexService) {
                this.logger.warn("Court dates raw directory is missing; returning indexed search results only.");
                return [];
            }
            throw new _common.NotFoundException("Каталог дат судових засідань не знайдено. Очікувався `court_dates` у корені проєкту.");
        }
        const fileNames = await this.listCsvFiles(directory);
        const now = new Date();
        const deduplicatedMatches = new Map();
        for (const fileName of fileNames){
            const filePath = _path.join(directory, fileName);
            try {
                for await (const row of this.readDelimitedRows(filePath, {
                    delimiter: "\t",
                    encoding: "utf-8"
                })){
                    if (!this.matchesCourtDateRow(row, normalizedCaseNumber, normalizedQuery)) {
                        continue;
                    }
                    const result = {
                        date: row.date || "",
                        judges: row.judges || "",
                        caseNumber: row.case || "",
                        courtName: row.court_name || "",
                        courtRoom: row.court_room || "",
                        caseInvolved: row.case_involved || "",
                        caseDescription: row.case_description || ""
                    };
                    if (options.onlyUpcoming && !this.isUpcomingCourtDateValue(result.date, now)) {
                        continue;
                    }
                    deduplicatedMatches.set(this.buildCourtDateMatchKey(result), result);
                }
            } catch (error) {
                this.logger.warn(`Skipping court dates file ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        return Array.from(deduplicatedMatches.values()).sort((left, right)=>{
            const leftTimestamp = this.parseCourtDateValue(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const rightTimestamp = this.parseCourtDateValue(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
            return leftTimestamp - rightTimestamp;
        }).slice(0, limit);
    }
    async searchCourtDatesViaRegistryIndex(options, normalizedQuery, normalizedCaseNumber, limit) {
        if (!this.registryIndexService) {
            return [];
        }
        try {
            const hasCourtRegistryIndex = await this.registryIndexService.isIndexAvailableFor("court_stan");
            const hasCourtDatesIndex = await this.registryIndexService.isIndexAvailableFor("court_dates");
            if (!hasCourtRegistryIndex || !hasCourtDatesIndex) {
                return [];
            }
            const registryMatches = await this.registryIndexService.searchCourtRegistry({
                query: options.query,
                caseNumber: options.caseNumber
            });
            const candidateCaseNumbers = Array.from(new Set(registryMatches.map((match)=>match.caseNumber || "").filter((value)=>{
                const normalizedValue = this.normalizeCaseNumber(value);
                if (!normalizedValue) {
                    return false;
                }
                if (normalizedCaseNumber && normalizedValue !== normalizedCaseNumber) {
                    return false;
                }
                return !normalizedQuery || Boolean(normalizedValue);
            }))).slice(0, 50);
            if (candidateCaseNumbers.length === 0) {
                return [];
            }
            const now = new Date();
            const registryIndexService = this.registryIndexService;
            const indexedCourtDates = await candidateCaseNumbers.reduce(async (accPromise, caseNumber)=>{
                const accumulator = await accPromise;
                const result = await registryIndexService.findCourtDateByCaseNumber(caseNumber);
                if (result) {
                    accumulator.push(result);
                }
                return accumulator;
            }, Promise.resolve([]));
            return indexedCourtDates.filter((result)=>options.onlyUpcoming ? this.isUpcomingCourtDateValue(result.date, now) : true).sort((left, right)=>{
                const leftTimestamp = this.parseCourtDateValue(left.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                const rightTimestamp = this.parseCourtDateValue(right.date)?.getTime() ?? Number.MAX_SAFE_INTEGER;
                return leftTimestamp - rightTimestamp;
            }).slice(0, limit);
        } catch (error) {
            this.logger.warn(`Court dates indexed lookup failed, falling back to direct scan: ${error instanceof Error ? error.message : String(error)}`);
            return [];
        }
    }
    async searchCourtRegistryFile(filePath, options, normalizedQuery, dateRange) {
        const results = [];
        for await (const row of this.readDelimitedRows(filePath, {
            delimiter: "\t",
            encoding: "utf-8"
        })){
            results.push(...this.extractCourtMatches(row, options, normalizedQuery, dateRange));
        }
        return results;
    }
    matchesCourtDateRow(row, normalizedCaseNumber, normalizedQuery) {
        if (normalizedCaseNumber && this.normalizeCaseNumber(row.case || "") !== normalizedCaseNumber) {
            return false;
        }
        if (!normalizedQuery) {
            return true;
        }
        return [
            row.case,
            row.case_involved,
            row.case_description,
            row.court_name,
            row.judges
        ].map((value)=>this.normalizeSearchValue(value || "")).some((value)=>value.includes(normalizedQuery));
    }
    parseCourtDateValue(value) {
        const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/);
        if (!match) {
            return null;
        }
        const [, day, month, year, hours, minutes] = match;
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes), 0, 0);
    }
    isUpcomingCourtDateValue(value, now) {
        const parsedDate = this.parseCourtDateValue(value);
        if (!parsedDate) {
            return false;
        }
        return parsedDate.getTime() >= now.getTime();
    }
    buildCourtDateMatchKey(result) {
        return [
            this.normalizeCaseNumber(result.caseNumber),
            result.date.trim(),
            this.normalizeSearchValue(result.courtName),
            this.normalizeSearchValue(result.courtRoom)
        ].join("|");
    }
    async searchAsvpFile(filePath, rawQuery, options, normalizedQuery, dateRange) {
        const fastResults = await this.searchAsvpFileWithNativeTools(filePath, rawQuery, options, normalizedQuery, dateRange);
        if (fastResults) {
            return fastResults;
        }
        if (await this.shouldSkipAsvpStreamFallback(filePath)) {
            this.logger.warn(`Skipping streamed ASVP fallback for ${_path.basename(filePath)} because the file exceeds ${this.asvpStreamFallbackLimitBytes} bytes`);
            return [];
        }
        const results = [];
        for await (const row of this.readDelimitedRows(filePath, {
            delimiter: ",",
            encoding: "asvp-repaired"
        })){
            results.push(...this.extractAsvpMatches(row, options, normalizedQuery, dateRange));
        }
        return results;
    }
    async searchAsvpFileWithNativeTools(filePath, rawQuery, options, normalizedQuery, dateRange) {
        const rgQuery = rawQuery.trim().replace(/\s+/g, " ");
        if (!rgQuery) {
            return null;
        }
        try {
            const lines = await this.findMatchingLinesWithIconvRg(filePath, rgQuery);
            return lines.map((line)=>this.parseDelimitedLine(line, ",")).filter((values)=>values.length === 13).map((values)=>[
                    "DEBTOR_NAME",
                    "DEBTOR_BIRTHDATE",
                    "DEBTOR_CODE",
                    "CREDITOR_NAME",
                    "CREDITOR_CODE",
                    "VP_ORDERNUM",
                    "VP_BEGINDATE",
                    "VP_STATE",
                    "ORG_NAME",
                    "DVS_CODE",
                    "PHONE_NUM",
                    "EMAIL_ADDR",
                    "BANK_ACCOUNT"
                ].reduce((accumulator, header, index)=>{
                    accumulator[header] = values[index] ?? "";
                    return accumulator;
                }, {})).flatMap((row)=>this.extractAsvpMatches(row, options, normalizedQuery, dateRange));
        } catch (error) {
            this.logger.warn(`Native ASVP search failed for ${_path.basename(filePath)}; falling back to streamed scan. ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    async findMatchingLinesWithIconvRg(filePath, query) {
        return new Promise((resolve, reject)=>{
            const iconvProcess = (0, _child_process.spawn)("iconv", [
                "-f",
                "cp1251",
                "-t",
                "utf-8",
                filePath
            ]);
            const rgProcess = (0, _child_process.spawn)("rg", [
                "-n",
                "-F",
                "-i",
                "--text",
                "--max-count",
                process.env.ASVP_RAW_SEARCH_MAX_COUNT || "1",
                query
            ]);
            const outputChunks = [];
            const errorChunks = [];
            iconvProcess.stdout.pipe(rgProcess.stdin);
            rgProcess.stdin.on("error", (error)=>{
                if (error.code === "EPIPE") {
                    return;
                }
                errorChunks.push(Buffer.from(error.message));
            });
            iconvProcess.stderr.on("data", (chunk)=>errorChunks.push(Buffer.from(chunk)));
            rgProcess.stdout.on("data", (chunk)=>outputChunks.push(Buffer.from(chunk)));
            rgProcess.stderr.on("data", (chunk)=>errorChunks.push(Buffer.from(chunk)));
            let iconvClosed = false;
            let rgClosed = false;
            let iconvCode = 0;
            let rgCode = 0;
            const timeoutId = setTimeout(()=>{
                iconvProcess.kill("SIGTERM");
                rgProcess.kill("SIGTERM");
                reject(new Error(`ASVP native search timed out after ${this.asvpNativeSearchTimeoutMs}ms`));
            }, this.asvpNativeSearchTimeoutMs);
            const maybeResolve = ()=>{
                if (!iconvClosed || !rgClosed) {
                    return;
                }
                clearTimeout(timeoutId);
                const output = Buffer.concat(outputChunks).toString("utf-8");
                const lines = output.split(/\r?\n/).map((line)=>line.trim()).filter(Boolean).map((line)=>line.replace(/^\d+:/, ""));
                const brokenPipeOnly = Buffer.concat(errorChunks).toString("utf-8").trim().match(/broken pipe|ePIPE/i);
                if (iconvCode !== 0 && !(lines.length > 0 && brokenPipeOnly)) {
                    reject(new Error(`iconv exited with code ${iconvCode}: ${Buffer.concat(errorChunks).toString("utf-8")}`));
                    return;
                }
                if (rgCode !== 0 && rgCode !== 1) {
                    reject(new Error(`rg exited with code ${rgCode}: ${Buffer.concat(errorChunks).toString("utf-8")}`));
                    return;
                }
                resolve(lines);
            };
            iconvProcess.on("error", reject);
            rgProcess.on("error", reject);
            iconvProcess.on("close", (code)=>{
                iconvClosed = true;
                iconvCode = code ?? 0;
                maybeResolve();
            });
            rgProcess.on("close", (code)=>{
                if (!iconvClosed) {
                    iconvProcess.kill("SIGTERM");
                }
                rgClosed = true;
                rgCode = code ?? 0;
                maybeResolve();
            });
        });
    }
    async shouldSkipAsvpStreamFallback(filePath) {
        try {
            const fileStat = await (0, _promises.stat)(filePath);
            return fileStat.size > this.asvpStreamFallbackLimitBytes;
        } catch  {
            return false;
        }
    }
    async withTimeout(promise, timeoutMs, label) {
        return new Promise((resolve, reject)=>{
            const timer = setTimeout(()=>{
                reject(new Error(`${label} after ${timeoutMs}ms`));
            }, timeoutMs);
            promise.then((value)=>{
                clearTimeout(timer);
                resolve(value);
            }, (error)=>{
                clearTimeout(timer);
                reject(error);
            });
        });
    }
    extractCourtMatches(row, options, normalizedQuery, dateRange) {
        if (!this.matchesDateRange(row.registration_date, dateRange)) {
            return [];
        }
        const participants = (row.participants || "").split(",").map((participant)=>participant.trim()).filter(Boolean);
        if (participants.length === 0) {
            return [];
        }
        return participants.map((participant)=>this.parseParticipant(participant)).filter((participant)=>this.matchesCourtParticipant(row, participant, options, normalizedQuery)).map((participant)=>({
                source: "court_registry",
                sourceLabel: COURT_REGISTRY_SOURCE_LABEL,
                person: participant.person,
                role: participant.role,
                caseDescription: row.description || "",
                caseNumber: row.case_number || "",
                courtName: row.court_name || "",
                caseProc: row.case_proc || "",
                registrationDate: row.registration_date || "",
                judge: row.judge || "",
                type: row.type || "",
                stageDate: row.stage_date || "",
                stageName: row.stage_name || "",
                participants: row.participants || ""
            })).sort((left, right)=>this.compareSearchResults(left.person, right.person, normalizedQuery));
    }
    extractAsvpMatches(row, options, normalizedQuery, dateRange) {
        if (!this.matchesDateRange(row.VP_BEGINDATE, dateRange, true)) {
            return [];
        }
        const debtorName = (row.DEBTOR_NAME || "").trim();
        const creditorName = (row.CREDITOR_NAME || "").trim();
        const normalizedDebtorName = this.normalizeSearchValue(debtorName);
        const normalizedCreditorName = this.normalizeSearchValue(creditorName);
        const debtorMatches = this.matchesAsvpParty(row, {
            person: debtorName,
            personNormalized: normalizedDebtorName,
            role: "Боржник"
        }, options, normalizedQuery);
        const creditorMatches = this.matchesAsvpParty(row, {
            person: creditorName,
            personNormalized: normalizedCreditorName,
            role: "Стягувач"
        }, options, normalizedQuery);
        if (!debtorMatches && !creditorMatches) {
            return [];
        }
        const results = [];
        if (debtorMatches) {
            results.push({
                source: "asvp",
                sourceLabel: ASVP_SOURCE_LABEL,
                person: debtorName,
                role: "Боржник",
                caseDescription: row.VP_STATE || "",
                caseNumber: row.VP_ORDERNUM || "",
                courtName: row.ORG_NAME || "",
                caseProc: row.DVS_CODE || "",
                registrationDate: row.VP_BEGINDATE || "",
                judge: "",
                type: "Виконавче провадження",
                stageDate: row.VP_BEGINDATE || "",
                stageName: "Виконавче провадження",
                participants: this.buildAsvpParticipants(row),
                counterpartyName: creditorName,
                counterpartyRole: "Кредитор",
                enforcementState: row.VP_STATE || ""
            });
        }
        if (creditorMatches) {
            results.push({
                source: "asvp",
                sourceLabel: ASVP_SOURCE_LABEL,
                person: creditorName,
                role: "Стягувач",
                caseDescription: row.VP_STATE || "",
                caseNumber: row.VP_ORDERNUM || "",
                courtName: row.ORG_NAME || "",
                caseProc: row.DVS_CODE || "",
                registrationDate: row.VP_BEGINDATE || "",
                judge: "",
                type: "Виконавче провадження",
                stageDate: row.VP_BEGINDATE || "",
                stageName: "Виконавче провадження",
                participants: this.buildAsvpParticipants(row),
                counterpartyName: debtorName,
                counterpartyRole: "Боржник",
                enforcementState: row.VP_STATE || ""
            });
        }
        return results.sort((left, right)=>this.compareSearchResults(left.person, right.person, normalizedQuery));
    }
    buildAsvpParticipants(row) {
        const parts = [
            row.CREDITOR_NAME ? `Стягувач: ${row.CREDITOR_NAME}` : "",
            row.DEBTOR_NAME ? `Боржник: ${row.DEBTOR_NAME}` : ""
        ].filter(Boolean);
        return parts.join(", ");
    }
    parseParticipant(participant) {
        const separatorIndex = participant.indexOf(":");
        if (separatorIndex === -1) {
            const person = participant.trim();
            return {
                role: "",
                person,
                personNormalized: this.normalizeSearchValue(person)
            };
        }
        const role = participant.slice(0, separatorIndex).trim();
        const person = participant.slice(separatorIndex + 1).trim();
        return {
            role,
            person,
            personNormalized: this.normalizeSearchValue(person)
        };
    }
    extractCourtDateParticipants(result) {
        return (result.caseInvolved || "").split(",").map((participant)=>this.parseParticipant(participant.trim())).filter((participant)=>participant.person.length > 0);
    }
    matchesCourtDateParticipant(result, participant, options, normalizedQuery) {
        return this.matchesSearchQuery(participant.personNormalized, normalizedQuery) && this.matchesContainsFilter(this.normalizeCaseNumber(result.caseNumber || ""), this.normalizeCaseNumber(options.caseNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(result.courtName || ""), this.normalizeSearchValue(options.institutionName || "")) && this.matchesContainsFilter(this.normalizeSearchValue(participant.role), this.normalizeSearchValue(options.role || "")) && this.matchesContainsFilter(this.normalizeSearchValue(result.judges || ""), this.normalizeSearchValue(options.judge || "")) && this.matchesContainsFilter(this.normalizeSearchValue("Судове засідання"), this.normalizeSearchValue(options.proceedingType || ""));
    }
    matchesCourtParticipant(row, participant, options, normalizedQuery) {
        return this.matchesSearchQuery(participant.personNormalized, normalizedQuery) && this.matchesContainsFilter(this.normalizeCaseNumber(row.case_number || ""), this.normalizeCaseNumber(options.caseNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.court_name || ""), this.normalizeSearchValue(options.institutionName || "")) && this.matchesContainsFilter(this.normalizeSearchValue(participant.role), this.normalizeSearchValue(options.role || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.stage_name || ""), this.normalizeSearchValue(options.status || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.judge || ""), this.normalizeSearchValue(options.judge || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.case_proc || ""), this.normalizeSearchValue(options.proceedingNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.type || ""), this.normalizeSearchValue(options.proceedingType || ""));
    }
    matchesAsvpParty(row, party, options, normalizedQuery) {
        return this.matchesSearchQuery(party.personNormalized, normalizedQuery) && this.matchesContainsFilter(this.normalizeCaseNumber(row.VP_ORDERNUM || ""), this.normalizeCaseNumber(options.caseNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.ORG_NAME || ""), this.normalizeSearchValue(options.institutionName || "")) && this.matchesContainsFilter(this.normalizeSearchValue(party.role), this.normalizeSearchValue(options.role || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.VP_STATE || ""), this.normalizeSearchValue(options.status || "")) && this.matchesContainsFilter(this.normalizeSearchValue(row.DVS_CODE || ""), this.normalizeSearchValue(options.proceedingNumber || "")) && this.matchesContainsFilter(this.normalizeSearchValue("Виконавче провадження"), this.normalizeSearchValue(options.proceedingType || ""));
    }
    validateSearchOptions(options) {
        const hasDateRange = Boolean(options.dateFrom || options.dateTo);
        const hasPrimaryFilter = Boolean((options.query || "").trim() || (options.caseNumber || "").trim() || (options.institutionName || "").trim() || (options.judge || "").trim() || (options.proceedingNumber || "").trim());
        const hasSecondaryFilter = Boolean((options.role || "").trim() || (options.status || "").trim() || (options.proceedingType || "").trim());
        if (hasPrimaryFilter || hasSecondaryFilter && hasDateRange) {
            return;
        }
        throw new _common.BadRequestException("Уточніть пошук: вкажіть ПІБ/запит, номер справи або провадження, суд чи орган, суддю або додайте період разом зі статусом, роллю чи типом провадження.");
    }
    buildDateRange(dateFrom, dateTo) {
        const from = this.parseIsoDate(dateFrom, "Початкова дата");
        const to = this.parseIsoDate(dateTo, "Кінцева дата");
        if (from && to && from > to) {
            throw new _common.BadRequestException("Початкова дата не може бути пізніше за кінцеву");
        }
        return {
            from,
            to
        };
    }
    parseIsoDate(value, label) {
        if (!value) {
            return undefined;
        }
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            throw new _common.BadRequestException(`${label} має бути у форматі YYYY-MM-DD`);
        }
        const timestamp = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        return Number.isNaN(timestamp) ? undefined : timestamp;
    }
    matchesDateRange(rawDate, range, withTime = false) {
        if (!range?.from && !range?.to) {
            return true;
        }
        const timestamp = this.parseRegistryDate(rawDate, withTime);
        if (timestamp === undefined) {
            return false;
        }
        if (range.from && timestamp < range.from) {
            return false;
        }
        if (range.to && timestamp > range.to + 24 * 60 * 60 * 1000 - 1) {
            return false;
        }
        return true;
    }
    parseRegistryDate(value, withTime = false) {
        const match = withTime ? value.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/) : value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (!match) {
            return undefined;
        }
        return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || "0"), Number(match[5] || "0"), Number(match[6] || "0"));
    }
    async resolveDirectory(directories, notFoundMessage) {
        const resolvedDirectory = await this.resolveDirectoryIfPresent(directories);
        if (resolvedDirectory) {
            return resolvedDirectory;
        }
        throw new _common.NotFoundException(notFoundMessage);
    }
    async resolveDirectoryIfPresent(directories) {
        for (const directory of directories){
            try {
                await (0, _promises.access)(directory);
                return directory;
            } catch  {
                continue;
            }
        }
        return null;
    }
    async listCsvFiles(directory) {
        return (await (0, _promises.readdir)(directory)).filter((fileName)=>fileName.toLowerCase().endsWith(".csv")).sort();
    }
    async *readDelimitedRows(filePath, options) {
        const rawInput = this.createDecodedInputStream(filePath, options.encoding);
        const reader = _readline.createInterface({
            input: rawInput,
            crlfDelay: Infinity
        });
        let headers = null;
        let bufferedLine = "";
        try {
            for await (const line of reader){
                if (!line.trim() && !bufferedLine) {
                    continue;
                }
                bufferedLine = bufferedLine ? `${bufferedLine}\n${line}` : line;
                if (!this.isCompleteDelimitedRecord(bufferedLine)) {
                    continue;
                }
                const record = bufferedLine;
                bufferedLine = "";
                if (!headers) {
                    headers = this.parseDelimitedLine(record, options.delimiter);
                    continue;
                }
                const values = this.parseDelimitedLine(record, options.delimiter);
                if (values.length !== headers.length) {
                    throw new _common.InternalServerErrorException(`Invalid delimited row in ${_path.basename(filePath)}`);
                }
                yield headers.reduce((accumulator, header, index)=>{
                    accumulator[header] = values[index] ?? "";
                    return accumulator;
                }, {});
            }
        } finally{
            reader.close();
            if ("close" in rawInput && typeof rawInput.close === "function") {
                rawInput.close();
            }
        }
    }
    createDecodedInputStream(filePath, encoding) {
        if (encoding === "utf-8") {
            return (0, _fs.createReadStream)(filePath, {
                encoding: "utf-8"
            });
        }
        if (encoding === "cp1251") {
            return (0, _fs.createReadStream)(filePath).pipe(_iconvlite.decodeStream("cp1251"));
        }
        return (0, _fs.createReadStream)(filePath).pipe(this.createAsvpRepairStream());
    }
    createAsvpRepairStream() {
        return new _stream.Transform({
            transform: (chunk, _encoding, callback)=>{
                const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, "latin1");
                const repairedText = _iconvlite.decode(Buffer.from(buffer.toString("latin1"), "latin1"), "cp1251");
                callback(null, repairedText);
            }
        });
    }
    isCompleteDelimitedRecord(line) {
        let inQuotes = false;
        for(let index = 0; index < line.length; index += 1){
            const char = line[index];
            const nextChar = line[index + 1];
            if (char !== '"') {
                continue;
            }
            if (inQuotes && nextChar === '"') {
                index += 1;
                continue;
            }
            inQuotes = !inQuotes;
        }
        return !inQuotes;
    }
    parseDelimitedLine(line, delimiter) {
        const values = [];
        let currentValue = "";
        let inQuotes = false;
        for(let index = 0; index < line.length; index += 1){
            const char = line[index];
            const nextChar = line[index + 1];
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentValue += '"';
                    index += 1;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }
            if (char === delimiter && !inQuotes) {
                values.push(this.cleanValue(currentValue));
                currentValue = "";
                continue;
            }
            currentValue += char;
        }
        values.push(this.cleanValue(currentValue));
        return values;
    }
    cleanValue(value) {
        return value.replace(/\r/g, "").trim();
    }
    normalizeSearchValue(value) {
        return value.normalize("NFKC").trim().replace(/[\u200B-\u200D\uFEFF]/g, "").replace(/[“”«»„]/g, '"').replace(/\s+/g, " ").replace(/[ʼ’`'ʹꞌ]/g, "'").replace(/[‐‑‒–—―]/g, "-").toLocaleLowerCase("uk-UA");
    }
    normalizeCaseNumber(value) {
        return value.trim().replace(/\s+/g, "").replace(/[‐‑‒–—―]/g, "-").toLocaleLowerCase("uk-UA");
    }
    matchesSearchQuery(normalizedCandidate, normalizedQuery) {
        if (!normalizedQuery) {
            return true;
        }
        if (!normalizedCandidate) {
            return false;
        }
        if (normalizedCandidate.includes(normalizedQuery)) {
            return true;
        }
        const candidateTokens = this.tokenizeSearchValue(normalizedCandidate);
        const queryTokens = this.tokenizeSearchValue(normalizedQuery);
        if (queryTokens.length === 0) {
            return false;
        }
        return queryTokens.every((queryToken)=>candidateTokens.some((candidateToken)=>candidateToken === queryToken || candidateToken.startsWith(queryToken) || queryToken.startsWith(candidateToken)));
    }
    matchesContainsFilter(normalizedCandidate, normalizedFilter) {
        if (!normalizedFilter) {
            return true;
        }
        if (!normalizedCandidate) {
            return false;
        }
        return normalizedCandidate.includes(normalizedFilter);
    }
    compareSearchResults(leftValue, rightValue, normalizedQuery) {
        const leftScore = this.getSearchScore(leftValue, normalizedQuery);
        const rightScore = this.getSearchScore(rightValue, normalizedQuery);
        if (leftScore !== rightScore) {
            return rightScore - leftScore;
        }
        return leftValue.localeCompare(rightValue, "uk-UA");
    }
    getSearchScore(value, normalizedQuery) {
        const normalizedValue = this.normalizeSearchValue(value);
        if (!normalizedValue || !normalizedQuery) {
            return 0;
        }
        const valueTokens = this.tokenizeSearchValue(normalizedValue);
        const queryTokens = this.tokenizeSearchValue(normalizedQuery);
        let score = 0;
        if (normalizedValue === normalizedQuery) {
            score += 1000;
        } else if (normalizedValue.startsWith(normalizedQuery)) {
            score += 700;
        } else if (normalizedValue.includes(normalizedQuery)) {
            score += 500;
        }
        queryTokens.forEach((queryToken, index)=>{
            const tokenIndex = valueTokens.findIndex((valueToken)=>valueToken === queryToken || valueToken.startsWith(queryToken) || queryToken.startsWith(valueToken));
            if (tokenIndex === -1) {
                return;
            }
            score += valueTokens[tokenIndex] === queryToken ? 120 : 80;
            if (tokenIndex === index) {
                score += 30;
            }
        });
        score -= Math.abs(normalizedValue.length - normalizedQuery.length);
        return score;
    }
    tokenizeSearchValue(value) {
        return value.split(/[-\s"'.,;:()[\]{}\\+/]+/).map((token)=>token.trim()).filter(Boolean);
    }
    constructor(registryDirectories, asvpDirectories, courtDatesDirectories, registryIndexService){
        this.registryIndexService = registryIndexService;
        this.logger = new _common.Logger(CourtRegistryService.name);
        this.asvpStreamFallbackLimitBytes = Number(process.env.ASVP_STREAM_FALLBACK_LIMIT_BYTES || `${50 * 1024 * 1024}`);
        this.asvpNativeSearchTimeoutMs = Number(process.env.ASVP_NATIVE_SEARCH_TIMEOUT_MS || "10000");
        this.combinedAsvpTimeoutMs = Number(process.env.COMBINED_ASVP_TIMEOUT_MS || "1500");
        this.registryDirectories = registryDirectories ?? [
            _path.resolve(process.cwd(), "court_stan"),
            _path.resolve(process.cwd(), "court_base")
        ];
        this.asvpDirectories = asvpDirectories ?? [
            _path.resolve(process.cwd(), "asvp")
        ];
        this.courtDatesDirectories = courtDatesDirectories ?? [
            _path.resolve(process.cwd(), "court_dates")
        ];
    }
};
CourtRegistryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Optional)()),
    _ts_param(0, (0, _common.Inject)(COURT_REGISTRY_DIRECTORIES)),
    _ts_param(1, (0, _common.Optional)()),
    _ts_param(1, (0, _common.Inject)(ASVP_REGISTRY_DIRECTORIES)),
    _ts_param(2, (0, _common.Optional)()),
    _ts_param(2, (0, _common.Inject)(COURT_DATES_DIRECTORIES)),
    _ts_param(3, (0, _common.Optional)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Array,
        Array,
        Array,
        typeof _registryindexservice.RegistryIndexService === "undefined" ? Object : _registryindexservice.RegistryIndexService
    ])
], CourtRegistryService);

//# sourceMappingURL=court-registry.service.js.map