"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DocumentsModule", {
    enumerable: true,
    get: function() {
        return DocumentsModule;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _typeorm = require("@nestjs/typeorm");
const _platformexpress = require("@nestjs/platform-express");
const _documentscontroller = require("./controllers/documents.controller");
const _scansessionscontroller = require("./controllers/scan-sessions.controller");
const _documentservice = require("./services/document.service");
const _documentpdfprocessingworkerservice = require("./services/document-pdf-processing-worker.service");
const _pdfpostprocessingservice = require("./services/pdf-post-processing.service");
const _scansessionservice = require("./services/scan-session.service");
const _Documententity = require("../database/entities/Document.entity");
const _DocumentProcessingArtifactentity = require("../database/entities/DocumentProcessingArtifact.entity");
const _DocumentProcessingJobentity = require("../database/entities/DocumentProcessingJob.entity");
const _DocumentSignatureentity = require("../database/entities/DocumentSignature.entity");
const _ScanPageentity = require("../database/entities/ScanPage.entity");
const _ScanSessionentity = require("../database/entities/ScanSession.entity");
const _Caseentity = require("../database/entities/Case.entity");
const _Cliententity = require("../database/entities/Client.entity");
const _filestoragemodule = require("../file-storage/file-storage.module");
const _trustverificationmodule = require("../trust-verification/trust-verification.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let DocumentsModule = class DocumentsModule {
};
DocumentsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _config.ConfigModule,
            _typeorm.TypeOrmModule.forFeature([
                _Documententity.Document,
                _DocumentProcessingJobentity.DocumentProcessingJob,
                _DocumentProcessingArtifactentity.DocumentProcessingArtifact,
                _DocumentSignatureentity.DocumentSignature,
                _ScanSessionentity.ScanSession,
                _ScanPageentity.ScanPage,
                _Caseentity.Case,
                _Cliententity.Client
            ]),
            _platformexpress.MulterModule.register({
                dest: "./uploads",
                limits: {
                    fileSize: 50 * 1024 * 1024
                }
            }),
            _filestoragemodule.FileStorageModule,
            _trustverificationmodule.TrustVerificationModule
        ],
        controllers: [
            _documentscontroller.DocumentsController,
            _scansessionscontroller.ScanSessionsController
        ],
        providers: [
            _documentservice.DocumentService,
            _documentpdfprocessingworkerservice.DocumentPdfProcessingWorkerService,
            _scansessionservice.ScanSessionService,
            _pdfpostprocessingservice.PdfPostProcessingService
        ],
        exports: [
            _documentservice.DocumentService
        ]
    })
], DocumentsModule);

//# sourceMappingURL=documents.module.js.map