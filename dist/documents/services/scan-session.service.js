"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ScanSessionService", {
    enumerable: true,
    get: function() {
        return ScanSessionService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _typeorm = require("@nestjs/typeorm");
const _pdflib = require("pdf-lib");
const _qrcode = /*#__PURE__*/ _interop_require_wildcard(require("qrcode"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
const _typeorm1 = require("typeorm");
const _accesscontrol = require("../../common/security/access-control");
const _Caseentity = require("../../database/entities/Case.entity");
const _Cliententity = require("../../database/entities/Client.entity");
const _Documententity = require("../../database/entities/Document.entity");
const _ScanPageentity = require("../../database/entities/ScanPage.entity");
const _ScanSessionentity = require("../../database/entities/ScanSession.entity");
const _filestorageservice = require("../../file-storage/services/file-storage.service");
const _filescanservice = require("../../file-storage/services/file-scan.service");
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
const MAX_SCAN_PAGES = 50;
const MAX_PAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SESSION_BYTES = 200 * 1024 * 1024;
const DEFAULT_SESSION_LIFETIME_MS = 8 * 60 * 60 * 1000;
let ScanSessionService = class ScanSessionService {
    async createSession(tenantId, userId, dto, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const destinationScope = dto.destinationScope || "root";
        let clientId = null;
        let caseId = null;
        if (destinationScope === "client") {
            if (!dto.clientId) {
                throw new _common.BadRequestException("Для розміщення в папці клієнта потрібно обрати клієнта");
            }
            const clientRecord = await this.clientRepository.findOne({
                where: {
                    id: dto.clientId,
                    tenantId,
                    deletedAt: (0, _typeorm1.IsNull)()
                }
            });
            if (!clientRecord) {
                throw new _common.NotFoundException("Клієнта не знайдено");
            }
            clientId = clientRecord.id;
            if (dto.caseId) {
                const caseRecord = await this.caseRepository.findOne({
                    where: {
                        id: dto.caseId,
                        tenantId,
                        deletedAt: (0, _typeorm1.IsNull)()
                    }
                });
                if (!caseRecord) {
                    throw new _common.NotFoundException("Справу не знайдено");
                }
                if (caseRecord.clientId !== clientId) {
                    throw new _common.BadRequestException("Справа не належить обраному клієнту");
                }
                caseId = caseRecord.id;
            }
        } else if (dto.caseId) {
            throw new _common.BadRequestException("Справу можна вибрати лише разом з клієнтом");
        }
        const token = _crypto.randomBytes(24).toString("hex");
        const tokenHash = this.hashToken(token);
        const frontendBaseUrl = this.getFrontendBaseUrl();
        const sessionId = _crypto.randomUUID();
        const mobileUrl = `${frontendBaseUrl}/mobile-scan?session=${sessionId}&token=${token}`;
        const desktopUrl = `${frontendBaseUrl}/documents/scan-session?sessionId=${sessionId}`;
        const expiresAt = this.getNextSessionExpiry();
        const session = this.scanSessionRepository.create({
            id: sessionId,
            tenantId,
            caseId,
            clientId,
            createdByUserId: userId,
            tokenHash,
            status: "created",
            mobileUrl,
            desktopUrl,
            expiresAt,
            documentFormat: dto.documentFormat || "A4",
            destinationScope,
            ocrStatus: "pending"
        });
        await this.scanSessionRepository.save(session);
        const qrCode = await _qrcode.toDataURL(mobileUrl, {
            margin: 1,
            width: 320
        });
        return {
            sessionId: session.id,
            mobileUrl,
            desktopUrl,
            qrCode,
            expiresAt,
            status: session.status
        };
    }
    async getStatus(tenantId, sessionId, actor) {
        if (actor) {
            (0, _accesscontrol.assertSameTenant)(actor, tenantId);
        }
        const session = await this.findSessionOrThrow(sessionId, tenantId);
        const pages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        return this.toStatusResponse(session, pages);
    }
    async openMobileSession(sessionId, token) {
        const session = await this.validateMobileAccess(sessionId, token);
        const pages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        if (session.status === "created") {
            session.status = "opened";
            session.startedAt = session.startedAt || new Date();
        }
        this.refreshSessionExpiry(session);
        await this.scanSessionRepository.save(session);
        return this.toStatusResponse(session, pages);
    }
    async uploadPage(sessionId, file, dto) {
        const session = await this.validateMobileAccess(sessionId, dto.token);
        const existingPages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        if (existingPages.length >= MAX_SCAN_PAGES) {
            throw new _common.BadRequestException("До одного скану можна додати не більше 50 сторінок");
        }
        if (!file) {
            throw new _common.BadRequestException("Зображення сторінки не передано");
        }
        if (![
            "image/jpeg",
            "image/jpg",
            "image/png"
        ].includes(file.mimetype)) {
            throw new _common.BadRequestException("Підтримуються лише JPG та PNG");
        }
        if (file.size > MAX_PAGE_SIZE_BYTES) {
            throw new _common.BadRequestException("Розмір сторінки перевищує 10 МБ");
        }
        const nextTotalBytes = Number(session.totalBytes || 0) + Number(file.size || 0);
        if (nextTotalBytes > MAX_SESSION_BYTES) {
            throw new _common.BadRequestException("Сумарний розмір скану перевищує 200 МБ");
        }
        session.status = "uploading";
        session.startedAt = session.startedAt || new Date();
        this.refreshSessionExpiry(session);
        await this.scanSessionRepository.save(session);
        const uploadResult = await this.fileStorageService.uploadFile(session.tenantId, session.createdByUserId, file, {
            caseId: session.caseId || undefined,
            clientId: session.clientId || undefined,
            folder: "scan-sessions",
            isPublic: false,
            metadata: {
                scanSessionId: session.id,
                clientPageNumber: String(dto.clientPageNumber)
            }
        });
        const page = this.scanPageRepository.create({
            scanSessionId: session.id,
            pageNumber: dto.clientPageNumber,
            status: "uploaded",
            originalFilePath: uploadResult.path,
            thumbnailPath: uploadResult.url,
            fileSize: file.size,
            width: null,
            height: null,
            rotation: dto.rotation || 0
        });
        await this.scanPageRepository.save(page);
        await this.normalizePageNumbers(session.id);
        const refreshedPages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        session.status = refreshedPages.length > 0 ? "uploaded" : "capturing";
        session.pagesCount = refreshedPages.length;
        session.uploadedPages = refreshedPages.length;
        session.totalBytes = refreshedPages.reduce((total, item)=>total + Number(item.fileSize || 0), 0);
        this.refreshSessionExpiry(session);
        await this.scanSessionRepository.save(session);
        return this.toStatusResponse(session, refreshedPages);
    }
    async deletePage(sessionId, pageId, token) {
        const session = await this.validateMobileAccess(sessionId, token);
        const page = await this.scanPageRepository.findOne({
            where: {
                id: pageId,
                scanSessionId: session.id
            }
        });
        if (!page) {
            throw new _common.NotFoundException("Сторінку не знайдено");
        }
        if (page.originalFilePath) {
            await this.fileStorageService.deleteFile(session.tenantId, page.originalFilePath);
        }
        await this.scanPageRepository.delete(page.id);
        await this.normalizePageNumbers(session.id);
        const refreshedPages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        session.pagesCount = refreshedPages.length;
        session.uploadedPages = refreshedPages.length;
        session.totalBytes = refreshedPages.reduce((total, item)=>total + Number(item.fileSize || 0), 0);
        session.status = refreshedPages.length === 0 ? "opened" : "capturing";
        this.refreshSessionExpiry(session);
        await this.scanSessionRepository.save(session);
        return this.toStatusResponse(session, refreshedPages);
    }
    async reorderPages(sessionId, dto) {
        const session = await this.validateMobileAccess(sessionId, dto.token);
        const pages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            }
        });
        const pageMap = new Map(pages.map((page)=>[
                page.id,
                page
            ]));
        dto.pages.forEach((item)=>{
            const page = pageMap.get(item.pageId);
            if (page) {
                page.pageNumber = item.pageNumber;
            }
        });
        await this.scanPageRepository.save([
            ...pageMap.values()
        ]);
        await this.normalizePageNumbers(session.id);
        const refreshedPages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        this.refreshSessionExpiry(session);
        await this.scanSessionRepository.save(session);
        return this.toStatusResponse(session, refreshedPages);
    }
    async finalizeSession(sessionId, dto) {
        const session = await this.validateMobileAccess(sessionId, dto.token);
        const pages = await this.scanPageRepository.find({
            where: {
                scanSessionId: session.id
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        if (pages.length === 0) {
            throw new _common.BadRequestException("Немає жодної сторінки для формування PDF");
        }
        if (session.finalDocumentId) {
            throw new _common.BadRequestException("Скан уже завершено");
        }
        session.documentFormat = dto.documentFormat || session.documentFormat;
        session.status = "assembling_pdf";
        this.refreshSessionExpiry(session);
        await this.scanSessionRepository.save(session);
        try {
            const pdfBuffer = await this.buildPdfFromPages(session.tenantId, pages, session.documentFormat);
            const uploadedPdf = await this.fileStorageService.uploadFile(session.tenantId, session.createdByUserId, {
                fieldname: "file",
                originalname: `scan-${session.id}.pdf`,
                encoding: "7bit",
                mimetype: "application/pdf",
                size: pdfBuffer.length,
                destination: "",
                filename: `scan-${session.id}.pdf`,
                path: "",
                buffer: pdfBuffer,
                stream: undefined
            }, {
                caseId: session.caseId || undefined,
                clientId: session.clientId || undefined,
                folder: "documents",
                isPublic: false,
                metadata: {
                    sourceKind: "scan_session",
                    scanSessionId: session.id,
                    ocrStatus: "not_configured"
                }
            });
            const documentSeed = {
                tenantId: session.tenantId,
                caseId: session.caseId ?? undefined,
                clientId: session.clientId ?? undefined,
                fileName: uploadedPdf.path.split("/").pop() || uploadedPdf.path,
                originalName: `${this.buildScanFileName(new Date())}.pdf`,
                type: "other",
                description: "PDF, сформований із мобільного скану",
                mimeType: "application/pdf",
                fileSize: pdfBuffer.length,
                status: "draft",
                storagePath: uploadedPdf.path,
                cdnUrl: uploadedPdf.url,
                malwareScanStatus: uploadedPdf.malwareScanStatus || "pending",
                accessLevel: "internal",
                accessScope: "assigned",
                uploadedBy: session.createdByUserId,
                uploadedAt: new Date(),
                createdBy: session.createdByUserId,
                updatedBy: session.createdByUserId,
                metadata: {
                    sourceKind: "scan_session",
                    scanSessionId: session.id,
                    scanPagesCount: pages.length,
                    documentFormat: session.documentFormat,
                    destinationScope: session.destinationScope,
                    ocrStatus: "not_configured"
                }
            };
            const document = this.documentRepository.create(documentSeed);
            const savedDocument = await this.documentRepository.save(document);
            await this.fileScanService.markFileAsClean({
                tenantId: session.tenantId,
                storagePath: savedDocument.storagePath,
                fileName: savedDocument.originalName,
                mimeType: savedDocument.mimeType,
                documentId: savedDocument.id,
                scannerEngine: "internal_scan_pdf",
                metadata: {
                    sourceKind: "scan_session",
                    scanSessionId: session.id
                }
            });
            pages.forEach((page)=>{
                page.status = "processed";
            });
            await this.scanPageRepository.save(pages);
            session.status = "completed";
            session.completedAt = new Date();
            session.finalDocumentId = savedDocument.id;
            session.processedPages = pages.length;
            session.ocrStatus = "not_configured";
            session.lastError = null;
            await this.scanSessionRepository.save(session);
            return this.toStatusResponse(session, pages);
        } catch (error) {
            session.status = "failed";
            session.lastError = error instanceof Error ? error.message : "Не вдалося завершити сканування";
            session.ocrStatus = "failed";
            await this.scanSessionRepository.save(session);
            throw error;
        }
    }
    async buildPdfFromPages(tenantId, pages, format) {
        const pdf = await _pdflib.PDFDocument.create();
        for (const page of pages){
            if (!page.originalFilePath) {
                throw new _common.BadRequestException("У сторінки відсутній оригінальний файл");
            }
            const originalFilePath = page.originalFilePath;
            const buffer = await this.fileStorageService.downloadFile(tenantId, originalFilePath).catch(async (error)=>{
                if (error instanceof _common.ForbiddenException && /malware scan/i.test(error.message)) {
                    return this.fileStorageService.downloadFileForInternalProcessing(tenantId, originalFilePath);
                }
                throw error;
            });
            const isPng = originalFilePath.toLowerCase().endsWith(".png");
            const image = isPng ? await pdf.embedPng(buffer) : await pdf.embedJpg(buffer);
            const imageDims = image.scale(1);
            if (format === "Original") {
                const pdfPage = pdf.addPage([
                    imageDims.width,
                    imageDims.height
                ]);
                pdfPage.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: imageDims.width,
                    height: imageDims.height
                });
                continue;
            }
            const pageWidth = 595.28;
            const pageHeight = 841.89;
            const pdfPage = pdf.addPage([
                pageWidth,
                pageHeight
            ]);
            const ratio = Math.min(pageWidth / imageDims.width, pageHeight / imageDims.height);
            const targetWidth = imageDims.width * ratio;
            const targetHeight = imageDims.height * ratio;
            pdfPage.drawImage(image, {
                x: (pageWidth - targetWidth) / 2,
                y: (pageHeight - targetHeight) / 2,
                width: targetWidth,
                height: targetHeight
            });
        }
        return Buffer.from(await pdf.save());
    }
    async normalizePageNumbers(sessionId) {
        const pages = await this.scanPageRepository.find({
            where: {
                scanSessionId: sessionId
            },
            order: {
                pageNumber: "ASC",
                createdAt: "ASC"
            }
        });
        pages.forEach((page, index)=>{
            page.pageNumber = index + 1;
        });
        await this.scanPageRepository.save(pages);
    }
    async findSessionOrThrow(sessionId, tenantId) {
        const session = await this.scanSessionRepository.findOne({
            where: {
                id: sessionId,
                ...tenantId ? {
                    tenantId
                } : {}
            }
        });
        if (!session) {
            throw new _common.NotFoundException("Сесію сканування не знайдено");
        }
        const now = Date.now();
        if (session.expiresAt.getTime() <= now && session.status !== "completed") {
            if (this.canResumeActiveSession(session, now)) {
                session.status = this.getActiveSessionStatus(session);
                this.refreshSessionExpiry(session, now);
                await this.scanSessionRepository.save(session);
                return session;
            }
            session.status = "expired";
            await this.scanSessionRepository.save(session);
            throw new _common.ForbiddenException("Сесія сканування вже прострочена");
        }
        return session;
    }
    async validateMobileAccess(sessionId, token) {
        const session = await this.findSessionOrThrow(sessionId);
        if (session.tokenHash !== this.hashToken(token)) {
            throw new _common.ForbiddenException("Невірний токен сканування");
        }
        if ([
            "completed",
            "cancelled",
            "failed",
            "expired"
        ].includes(session.status)) {
            throw new _common.BadRequestException("Сесія сканування вже недоступна");
        }
        return session;
    }
    toStatusResponse(session, pages) {
        return {
            id: session.id,
            status: session.status,
            pagesCount: session.pagesCount,
            uploadedPages: session.uploadedPages,
            processedPages: session.processedPages,
            finalDocumentId: session.finalDocumentId,
            caseId: session.caseId,
            clientId: session.clientId,
            destinationScope: session.destinationScope,
            mobileUrl: session.mobileUrl,
            desktopUrl: session.desktopUrl,
            expiresAt: session.expiresAt,
            documentFormat: session.documentFormat,
            ocrStatus: session.ocrStatus,
            lastError: session.lastError,
            pages: pages.map((page)=>({
                    id: page.id,
                    pageNumber: page.pageNumber,
                    status: page.status,
                    previewUrl: page.thumbnailPath,
                    rotation: page.rotation,
                    fileSize: Number(page.fileSize || 0)
                }))
        };
    }
    hashToken(token) {
        return _crypto.createHash("sha256").update(token).digest("hex");
    }
    getSessionLifetimeMs() {
        const lifetimeMinutes = Number(this.configService.get("SCAN_SESSION_LIFETIME_MINUTES"));
        if (Number.isFinite(lifetimeMinutes) && lifetimeMinutes > 0) {
            return lifetimeMinutes * 60 * 1000;
        }
        return DEFAULT_SESSION_LIFETIME_MS;
    }
    getNextSessionExpiry(now = Date.now()) {
        return new Date(now + this.getSessionLifetimeMs());
    }
    refreshSessionExpiry(session, now = Date.now()) {
        if ([
            "completed",
            "cancelled",
            "failed"
        ].includes(session.status)) {
            return;
        }
        session.expiresAt = this.getNextSessionExpiry(now);
    }
    canResumeActiveSession(session, now = Date.now()) {
        if ([
            "completed",
            "cancelled",
            "failed"
        ].includes(session.status)) {
            return false;
        }
        const lastActivityAt = session.updatedAt?.getTime() || session.startedAt?.getTime() || session.createdAt?.getTime() || 0;
        return lastActivityAt + this.getSessionLifetimeMs() > now;
    }
    getActiveSessionStatus(session) {
        if (session.status !== "expired") {
            return session.status;
        }
        if (session.finalDocumentId) {
            return "completed";
        }
        if (session.pagesCount > 0 || session.uploadedPages > 0) {
            return "uploaded";
        }
        if (session.startedAt) {
            return "opened";
        }
        return "created";
    }
    getFrontendBaseUrl() {
        const mobileScanBaseUrl = this.configService.get("MOBILE_SCAN_BASE_URL") || this.configService.get("APP_URL");
        return (mobileScanBaseUrl || "http://localhost:5173").replace(/\/$/, "");
    }
    buildScanFileName(date) {
        const pad = (value)=>String(value).padStart(2, "0");
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = String(date.getFullYear()).slice(-2);
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        return `Скан-${day}${month}${year}-${hours}${minutes}`;
    }
    constructor(scanSessionRepository, scanPageRepository, caseRepository, clientRepository, documentRepository, fileStorageService, fileScanService, configService){
        this.scanSessionRepository = scanSessionRepository;
        this.scanPageRepository = scanPageRepository;
        this.caseRepository = caseRepository;
        this.clientRepository = clientRepository;
        this.documentRepository = documentRepository;
        this.fileStorageService = fileStorageService;
        this.fileScanService = fileScanService;
        this.configService = configService;
    }
};
ScanSessionService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_ScanSessionentity.ScanSession)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_ScanPageentity.ScanPage)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_Caseentity.Case)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_Cliententity.Client)),
    _ts_param(4, (0, _typeorm.InjectRepository)(_Documententity.Document)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _filestorageservice.FileStorageService === "undefined" ? Object : _filestorageservice.FileStorageService,
        typeof _filescanservice.FileScanService === "undefined" ? Object : _filescanservice.FileScanService,
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], ScanSessionService);

//# sourceMappingURL=scan-session.service.js.map