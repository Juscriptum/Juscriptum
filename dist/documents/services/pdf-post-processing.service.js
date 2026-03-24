"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PdfPostProcessingService", {
    enumerable: true,
    get: function() {
        return PdfPostProcessingService;
    }
});
const _common = require("@nestjs/common");
const _config = require("@nestjs/config");
const _promises = require("node:fs/promises");
const _fs = require("fs");
const _os = require("os");
const _path = require("path");
const _child_process = require("child_process");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PdfPostProcessingService = class PdfPostProcessingService {
    async getRuntimeCapabilities() {
        const pythonCommand = await this.getPythonCommand();
        const [python3, pdftoppm, ocrmypdf, unpaper, tesseract, pipelineScript, cv2, pillow] = await Promise.all([
            this.commandExists(pythonCommand),
            this.commandExists(this.configService.get("PDFTOPPM_COMMAND", "pdftoppm")),
            this.commandExists(this.configService.get("OCRMYPDF_COMMAND", "ocrmypdf")),
            this.commandExists(this.configService.get("UNPAPER_COMMAND", "unpaper")),
            this.commandExists(this.configService.get("TESSERACT_COMMAND", "tesseract")),
            this.fileExists(this.getPipelineScriptPath()),
            this.pythonModuleAvailable(pythonCommand, "cv2"),
            this.pythonModuleAvailable(pythonCommand, "PIL")
        ]);
        const ready = Boolean(python3 && pdftoppm && pipelineScript && cv2 && pillow);
        return {
            python3,
            pdftoppm,
            ocrmypdf,
            unpaper,
            tesseract,
            pipelineScript,
            cv2,
            pillow,
            ready
        };
    }
    async processPdf(inputBuffer, options = {}) {
        const runtime = await this.getRuntimeCapabilities();
        const tempDir = await (0, _promises.mkdtemp)((0, _path.join)((0, _os.tmpdir)(), "law-organizer-pdf-postprocess-"));
        const sourcePdfPath = (0, _path.join)(tempDir, "source.pdf");
        const preprocessedPdfPath = (0, _path.join)(tempDir, "preprocessed.pdf");
        const finalPdfPath = (0, _path.join)(tempDir, "final.pdf");
        const metadataPath = (0, _path.join)(tempDir, "metadata.json");
        const sidecarPath = (0, _path.join)(tempDir, "ocr.txt");
        const originalPagesDir = (0, _path.join)(tempDir, "original-pages");
        const processedPagesDir = (0, _path.join)(tempDir, "processed-pages");
        const warnings = [];
        try {
            await (0, _promises.writeFile)(sourcePdfPath, inputBuffer);
            if (runtime.ready) {
                await this.execCommand(await this.getPythonCommand(), [
                    this.getPipelineScriptPath(),
                    "--input",
                    sourcePdfPath,
                    "--output",
                    preprocessedPdfPath,
                    "--metadata",
                    metadataPath,
                    "--mode",
                    options.processingMode || "document",
                    "--page-format",
                    options.targetPageFormat || "auto",
                    "--use-unpaper",
                    String(Boolean(options.useUnpaper)),
                    "--original-pages-dir",
                    originalPagesDir,
                    "--processed-pages-dir",
                    processedPagesDir
                ], {
                    timeoutMs: this.getTimeoutMs()
                });
            } else {
                warnings.push("Python/OpenCV preprocessing runtime is not fully available; preprocessing fallback copied the source PDF unchanged.");
                await (0, _promises.copyFile)(sourcePdfPath, preprocessedPdfPath);
                await (0, _promises.writeFile)(metadataPath, JSON.stringify({
                    status: "skipped_runtime_missing",
                    processingMode: options.processingMode || "document",
                    targetPageFormat: options.targetPageFormat || "auto",
                    warnings
                }, null, 2));
            }
            let outputPdfPath = preprocessedPdfPath;
            let searchablePdfBuffer = null;
            let plainTextContent = null;
            if (options.ocrEnabled) {
                if (runtime.ocrmypdf) {
                    const language = options.ocrLanguage || "ukr+rus+spa+eng";
                    await this.execCommand(this.configService.get("OCRMYPDF_COMMAND", "ocrmypdf"), [
                        "--skip-text",
                        "--force-ocr",
                        "--language",
                        language,
                        "--sidecar",
                        sidecarPath,
                        preprocessedPdfPath,
                        finalPdfPath
                    ], {
                        timeoutMs: this.getTimeoutMs()
                    });
                    outputPdfPath = finalPdfPath;
                    searchablePdfBuffer = await (0, _promises.readFile)(finalPdfPath);
                    plainTextContent = await this.readOptionalText(sidecarPath);
                } else {
                    warnings.push("OCRmyPDF runtime is not installed; OCR/searchable PDF stage was skipped.");
                }
            }
            const processedPdfBuffer = await (0, _promises.readFile)(outputPdfPath);
            const metadata = await this.readJsonMetadata(metadataPath, warnings, runtime, options);
            const pageArtifacts = await this.readPageArtifacts(originalPagesDir, processedPagesDir, metadata, options.ocrEnabled ? options.ocrLanguage || "ukr+rus+spa+eng" : null, runtime);
            return {
                processedPdfBuffer,
                searchablePdfBuffer,
                plainTextContent,
                metadata,
                runtime,
                pageArtifacts
            };
        } finally{
            await (0, _promises.rm)(tempDir, {
                recursive: true,
                force: true
            }).catch(()=>undefined);
        }
    }
    getPipelineScriptPath() {
        return (0, _path.resolve)(process.cwd(), "scripts", "pdf_postprocess_pipeline.py");
    }
    async getPythonCommand() {
        const configuredCommand = this.configService.get("PDF_POSTPROCESS_PYTHON_COMMAND");
        if (configuredCommand) {
            return configuredCommand;
        }
        const projectVenvPython = (0, _path.resolve)(process.cwd(), ".venv-pdf", "bin", "python");
        if (await this.executableExists(projectVenvPython)) {
            return projectVenvPython;
        }
        return "python3";
    }
    getTimeoutMs() {
        return Number(this.configService.get("PDF_POSTPROCESS_TIMEOUT_MS", "900000"));
    }
    async readJsonMetadata(metadataPath, warnings, runtime, options) {
        try {
            const raw = await (0, _promises.readFile)(metadataPath, "utf-8");
            const parsed = JSON.parse(raw);
            return {
                ...parsed,
                warnings: [
                    ...warnings,
                    ...this.normalizeWarnings(parsed.warnings)
                ],
                runtime,
                pipeline: "python3+opencv+unpaper+ocrmypdf+tesseract",
                requested: {
                    processingMode: options.processingMode || "document",
                    targetPageFormat: options.targetPageFormat || "auto",
                    ocrEnabled: Boolean(options.ocrEnabled),
                    ocrLanguage: options.ocrLanguage || "ukr+rus+spa+eng",
                    useUnpaper: Boolean(options.useUnpaper)
                }
            };
        } catch  {
            return {
                status: "metadata_unavailable",
                warnings,
                runtime,
                pipeline: "python3+opencv+unpaper+ocrmypdf+tesseract",
                requested: {
                    processingMode: options.processingMode || "document",
                    targetPageFormat: options.targetPageFormat || "auto",
                    ocrEnabled: Boolean(options.ocrEnabled),
                    ocrLanguage: options.ocrLanguage || "ukr+rus+spa+eng",
                    useUnpaper: Boolean(options.useUnpaper)
                }
            };
        }
    }
    normalizeWarnings(value) {
        return Array.isArray(value) ? value.filter((item)=>typeof item === "string") : [];
    }
    async readPageArtifacts(originalPagesDir, processedPagesDir, metadata, ocrLanguage, runtime) {
        const pageAnalyses = metadata.pageAnalyses && typeof metadata.pageAnalyses === "object" && !Array.isArray(metadata.pageAnalyses) ? metadata.pageAnalyses : {};
        const pageNumbers = new Set(Object.keys(pageAnalyses).map((value)=>Number(value)).filter((value)=>Number.isFinite(value) && value > 0));
        for (const directory of [
            originalPagesDir,
            processedPagesDir
        ]){
            for (const fileName of (await this.readOptionalDir(directory))){
                const match = fileName.match(/page-(\d+)\.png$/i);
                if (match) {
                    pageNumbers.add(Number(match[1]));
                }
            }
        }
        const artifacts = [];
        for (const pageNumber of [
            ...pageNumbers
        ].sort((a, b)=>a - b)){
            const originalImageBuffer = await this.readOptionalBinary((0, _path.join)(originalPagesDir, `page-${String(pageNumber).padStart(4, "0")}.png`));
            const processedImageBuffer = await this.readOptionalBinary((0, _path.join)(processedPagesDir, `page-${String(pageNumber).padStart(4, "0")}.png`));
            const ocrData = processedImageBuffer && ocrLanguage && runtime.tesseract ? await this.runTesseractPageOcr((0, _path.join)(processedPagesDir, `page-${String(pageNumber).padStart(4, "0")}.png`), ocrLanguage) : null;
            const pageMetadata = pageAnalyses[String(pageNumber)] || null;
            artifacts.push({
                pageNumber,
                originalImageBuffer,
                processedImageBuffer,
                previewImageBuffer: processedImageBuffer,
                ocrText: ocrData?.text || null,
                ocrConfidence: ocrData?.confidence ?? null,
                pageStatus: pageMetadata && typeof pageMetadata.processingStatus === "string" ? pageMetadata.processingStatus : null,
                metadata: pageMetadata
            });
        }
        return artifacts;
    }
    async readOptionalText(filePath) {
        try {
            const content = await (0, _promises.readFile)(filePath, "utf-8");
            return content.trim() || null;
        } catch  {
            return null;
        }
    }
    async readOptionalBinary(filePath) {
        try {
            return await (0, _promises.readFile)(filePath);
        } catch  {
            return null;
        }
    }
    async readOptionalDir(dirPath) {
        try {
            return await (0, _promises.readdir)(dirPath);
        } catch  {
            return [];
        }
    }
    async runTesseractPageOcr(imagePath, language) {
        const tesseractCommand = this.configService.get("TESSERACT_COMMAND", "tesseract");
        const tsv = await this.execCommandCapture(tesseractCommand, [
            imagePath,
            "stdout",
            "-l",
            language,
            "tsv"
        ], {
            timeoutMs: this.getTimeoutMs()
        });
        return this.parseTesseractTsv(tsv);
    }
    parseTesseractTsv(tsv) {
        const lines = tsv.split(/\r?\n/).filter(Boolean);
        if (lines.length <= 1) {
            return {
                text: null,
                confidence: null
            };
        }
        const texts = [];
        const confidences = [];
        for (const line of lines.slice(1)){
            const columns = line.split("\t");
            if (columns.length < 12) {
                continue;
            }
            const confidence = Number(columns[10]);
            const text = columns.slice(11).join("\t").trim();
            if (text) {
                texts.push(text);
            }
            if (Number.isFinite(confidence) && confidence >= 0) {
                confidences.push(confidence);
            }
        }
        const text = texts.join(" ").trim() || null;
        const confidence = confidences.length > 0 ? confidences.reduce((sum, value)=>sum + value, 0) / confidences.length : null;
        return {
            text,
            confidence
        };
    }
    async commandExists(command) {
        if (command.includes("/")) {
            return this.executableExists(command);
        }
        try {
            await this.execCommand("sh", [
                "-lc",
                'command -v -- "$1"',
                "sh",
                command
            ], {
                timeoutMs: 5000
            });
            return true;
        } catch  {
            return false;
        }
    }
    async executableExists(filePath) {
        try {
            await (0, _promises.access)(filePath, _fs.constants.X_OK);
            return true;
        } catch  {
            return false;
        }
    }
    async pythonModuleAvailable(pythonCommand, moduleName) {
        if (!await this.commandExists(pythonCommand)) {
            return false;
        }
        try {
            await this.execCommand(pythonCommand, [
                "-c",
                `import ${moduleName}`
            ], {
                timeoutMs: 5000
            });
            return true;
        } catch  {
            return false;
        }
    }
    async fileExists(filePath) {
        try {
            await (0, _promises.access)(filePath, _fs.constants.F_OK);
            return true;
        } catch  {
            return false;
        }
    }
    async execCommand(command, args, options) {
        await this.execCommandCapture(command, args, options);
    }
    async execCommandCapture(command, args, options) {
        return new Promise((resolvePromise, rejectPromise)=>{
            const child = (0, _child_process.spawn)(command, args, {
                stdio: [
                    "ignore",
                    "pipe",
                    "pipe"
                ]
            });
            let stdout = "";
            let stderr = "";
            const timeout = setTimeout(()=>{
                child.kill("SIGKILL");
                rejectPromise(new Error(`Command timed out: ${command} ${args.join(" ")}`));
            }, options.timeoutMs);
            child.stdout.on("data", (chunk)=>{
                stdout += chunk.toString();
            });
            child.stderr.on("data", (chunk)=>{
                stderr += chunk.toString();
            });
            child.on("error", (error)=>{
                clearTimeout(timeout);
                rejectPromise(error);
            });
            child.on("close", (code)=>{
                clearTimeout(timeout);
                if (code === 0) {
                    if (stdout.trim()) {
                        this.logger.debug(stdout.trim());
                    }
                    resolvePromise(stdout);
                    return;
                }
                rejectPromise(new Error(stderr.trim() || stdout.trim() || `Command failed (${code}): ${command} ${args.join(" ")}`));
            });
        });
    }
    constructor(configService){
        this.configService = configService;
        this.logger = new _common.Logger(PdfPostProcessingService.name);
    }
};
PdfPostProcessingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _config.ConfigService === "undefined" ? Object : _config.ConfigService
    ])
], PdfPostProcessingService);

//# sourceMappingURL=pdf-post-processing.service.js.map