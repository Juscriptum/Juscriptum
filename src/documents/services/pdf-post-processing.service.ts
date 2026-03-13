import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
  copyFile,
  access,
  readdir,
} from "fs/promises";
import { constants as fsConstants } from "fs";
import { tmpdir } from "os";
import { join, resolve } from "path";
import { spawn } from "child_process";

export interface PdfProcessingRuntimeCapabilities {
  python3: boolean;
  pdftoppm: boolean;
  ocrmypdf: boolean;
  unpaper: boolean;
  tesseract: boolean;
  pipelineScript: boolean;
  cv2: boolean;
  pillow: boolean;
  ready: boolean;
}

export interface PdfPostProcessingOptions {
  processingMode?: string;
  targetPageFormat?: string;
  ocrEnabled?: boolean;
  ocrLanguage?: string;
  useUnpaper?: boolean;
}

export interface PdfPostProcessingResult {
  processedPdfBuffer: Buffer;
  searchablePdfBuffer: Buffer | null;
  plainTextContent: string | null;
  metadata: Record<string, unknown>;
  runtime: PdfProcessingRuntimeCapabilities;
  pageArtifacts: PdfPostProcessingPageArtifact[];
}

export interface PdfPostProcessingPageArtifact {
  pageNumber: number;
  originalImageBuffer: Buffer | null;
  processedImageBuffer: Buffer | null;
  previewImageBuffer: Buffer | null;
  ocrText: string | null;
  ocrConfidence: number | null;
  pageStatus: string | null;
  metadata: Record<string, unknown> | null;
}

@Injectable()
export class PdfPostProcessingService {
  private readonly logger = new Logger(PdfPostProcessingService.name);

  constructor(private readonly configService: ConfigService) {}

  async getRuntimeCapabilities(): Promise<PdfProcessingRuntimeCapabilities> {
    const pythonCommand = await this.getPythonCommand();

    const [
      python3,
      pdftoppm,
      ocrmypdf,
      unpaper,
      tesseract,
      pipelineScript,
      cv2,
      pillow,
    ] = await Promise.all([
      this.commandExists(pythonCommand),
      this.commandExists(
        this.configService.get<string>("PDFTOPPM_COMMAND", "pdftoppm"),
      ),
      this.commandExists(
        this.configService.get<string>("OCRMYPDF_COMMAND", "ocrmypdf"),
      ),
      this.commandExists(
        this.configService.get<string>("UNPAPER_COMMAND", "unpaper"),
      ),
      this.commandExists(
        this.configService.get<string>("TESSERACT_COMMAND", "tesseract"),
      ),
      this.fileExists(this.getPipelineScriptPath()),
      this.pythonModuleAvailable(pythonCommand, "cv2"),
      this.pythonModuleAvailable(pythonCommand, "PIL"),
    ]);

    const ready = Boolean(
      python3 && pdftoppm && pipelineScript && cv2 && pillow,
    );

    return {
      python3,
      pdftoppm,
      ocrmypdf,
      unpaper,
      tesseract,
      pipelineScript,
      cv2,
      pillow,
      ready,
    };
  }

  async processPdf(
    inputBuffer: Buffer,
    options: PdfPostProcessingOptions = {},
  ): Promise<PdfPostProcessingResult> {
    const runtime = await this.getRuntimeCapabilities();
    const tempDir = await mkdtemp(
      join(tmpdir(), "law-organizer-pdf-postprocess-"),
    );
    const sourcePdfPath = join(tempDir, "source.pdf");
    const preprocessedPdfPath = join(tempDir, "preprocessed.pdf");
    const finalPdfPath = join(tempDir, "final.pdf");
    const metadataPath = join(tempDir, "metadata.json");
    const sidecarPath = join(tempDir, "ocr.txt");
    const originalPagesDir = join(tempDir, "original-pages");
    const processedPagesDir = join(tempDir, "processed-pages");
    const warnings: string[] = [];

    try {
      await writeFile(sourcePdfPath, inputBuffer);

      if (runtime.ready) {
        await this.execCommand(
          await this.getPythonCommand(),
          [
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
            processedPagesDir,
          ],
          {
            timeoutMs: this.getTimeoutMs(),
          },
        );
      } else {
        warnings.push(
          "Python/OpenCV preprocessing runtime is not fully available; preprocessing fallback copied the source PDF unchanged.",
        );
        await copyFile(sourcePdfPath, preprocessedPdfPath);
        await writeFile(
          metadataPath,
          JSON.stringify(
            {
              status: "skipped_runtime_missing",
              processingMode: options.processingMode || "document",
              targetPageFormat: options.targetPageFormat || "auto",
              warnings,
            },
            null,
            2,
          ),
        );
      }

      let outputPdfPath = preprocessedPdfPath;
      let searchablePdfBuffer: Buffer | null = null;
      let plainTextContent: string | null = null;

      if (options.ocrEnabled) {
        if (runtime.ocrmypdf) {
          const language = options.ocrLanguage || "ukr+rus+spa+eng";
          await this.execCommand(
            this.configService.get<string>("OCRMYPDF_COMMAND", "ocrmypdf"),
            [
              "--skip-text",
              "--force-ocr",
              "--language",
              language,
              "--sidecar",
              sidecarPath,
              preprocessedPdfPath,
              finalPdfPath,
            ],
            {
              timeoutMs: this.getTimeoutMs(),
            },
          );
          outputPdfPath = finalPdfPath;
          searchablePdfBuffer = await readFile(finalPdfPath);
          plainTextContent = await this.readOptionalText(sidecarPath);
        } else {
          warnings.push(
            "OCRmyPDF runtime is not installed; OCR/searchable PDF stage was skipped.",
          );
        }
      }

      const processedPdfBuffer = await readFile(outputPdfPath);
      const metadata = await this.readJsonMetadata(
        metadataPath,
        warnings,
        runtime,
        options,
      );
      const pageArtifacts = await this.readPageArtifacts(
        originalPagesDir,
        processedPagesDir,
        metadata,
        options.ocrEnabled ? options.ocrLanguage || "ukr+rus+spa+eng" : null,
        runtime,
      );

      return {
        processedPdfBuffer,
        searchablePdfBuffer,
        plainTextContent,
        metadata,
        runtime,
        pageArtifacts,
      };
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(
        () => undefined,
      );
    }
  }

  private getPipelineScriptPath(): string {
    return resolve(process.cwd(), "scripts", "pdf_postprocess_pipeline.py");
  }

  private async getPythonCommand(): Promise<string> {
    const configuredCommand = this.configService.get<string>(
      "PDF_POSTPROCESS_PYTHON_COMMAND",
    );

    if (configuredCommand) {
      return configuredCommand;
    }

    const projectVenvPython = resolve(
      process.cwd(),
      ".venv-pdf",
      "bin",
      "python",
    );

    if (await this.executableExists(projectVenvPython)) {
      return projectVenvPython;
    }

    return "python3";
  }

  private getTimeoutMs(): number {
    return Number(
      this.configService.get<string>("PDF_POSTPROCESS_TIMEOUT_MS", "900000"),
    );
  }

  private async readJsonMetadata(
    metadataPath: string,
    warnings: string[],
    runtime: PdfProcessingRuntimeCapabilities,
    options: PdfPostProcessingOptions,
  ): Promise<Record<string, unknown>> {
    try {
      const raw = await readFile(metadataPath, "utf-8");
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        ...parsed,
        warnings: [...warnings, ...this.normalizeWarnings(parsed.warnings)],
        runtime,
        pipeline: "python3+opencv+unpaper+ocrmypdf+tesseract",
        requested: {
          processingMode: options.processingMode || "document",
          targetPageFormat: options.targetPageFormat || "auto",
          ocrEnabled: Boolean(options.ocrEnabled),
          ocrLanguage: options.ocrLanguage || "ukr+rus+spa+eng",
          useUnpaper: Boolean(options.useUnpaper),
        },
      };
    } catch {
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
          useUnpaper: Boolean(options.useUnpaper),
        },
      };
    }
  }

  private normalizeWarnings(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  }

  private async readPageArtifacts(
    originalPagesDir: string,
    processedPagesDir: string,
    metadata: Record<string, unknown>,
    ocrLanguage: string | null,
    runtime: PdfProcessingRuntimeCapabilities,
  ): Promise<PdfPostProcessingPageArtifact[]> {
    const pageAnalyses =
      metadata.pageAnalyses &&
      typeof metadata.pageAnalyses === "object" &&
      !Array.isArray(metadata.pageAnalyses)
        ? (metadata.pageAnalyses as Record<string, Record<string, unknown>>)
        : {};

    const pageNumbers = new Set<number>(
      Object.keys(pageAnalyses)
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && value > 0),
    );

    for (const directory of [originalPagesDir, processedPagesDir]) {
      for (const fileName of await this.readOptionalDir(directory)) {
        const match = fileName.match(/page-(\d+)\.png$/i);
        if (match) {
          pageNumbers.add(Number(match[1]));
        }
      }
    }

    const artifacts: PdfPostProcessingPageArtifact[] = [];
    for (const pageNumber of [...pageNumbers].sort((a, b) => a - b)) {
      const originalImageBuffer = await this.readOptionalBinary(
        join(
          originalPagesDir,
          `page-${String(pageNumber).padStart(4, "0")}.png`,
        ),
      );
      const processedImageBuffer = await this.readOptionalBinary(
        join(
          processedPagesDir,
          `page-${String(pageNumber).padStart(4, "0")}.png`,
        ),
      );
      const ocrData =
        processedImageBuffer && ocrLanguage && runtime.tesseract
          ? await this.runTesseractPageOcr(
              join(
                processedPagesDir,
                `page-${String(pageNumber).padStart(4, "0")}.png`,
              ),
              ocrLanguage,
            )
          : null;
      const pageMetadata = pageAnalyses[String(pageNumber)] || null;

      artifacts.push({
        pageNumber,
        originalImageBuffer,
        processedImageBuffer,
        previewImageBuffer: processedImageBuffer,
        ocrText: ocrData?.text || null,
        ocrConfidence: ocrData?.confidence ?? null,
        pageStatus:
          pageMetadata && typeof pageMetadata.processingStatus === "string"
            ? pageMetadata.processingStatus
            : null,
        metadata: pageMetadata,
      });
    }

    return artifacts;
  }

  private async readOptionalText(filePath: string): Promise<string | null> {
    try {
      const content = await readFile(filePath, "utf-8");
      return content.trim() || null;
    } catch {
      return null;
    }
  }

  private async readOptionalBinary(filePath: string): Promise<Buffer | null> {
    try {
      return await readFile(filePath);
    } catch {
      return null;
    }
  }

  private async readOptionalDir(dirPath: string): Promise<string[]> {
    try {
      return await readdir(dirPath);
    } catch {
      return [];
    }
  }

  private async runTesseractPageOcr(
    imagePath: string,
    language: string,
  ): Promise<{ text: string | null; confidence: number | null }> {
    const tesseractCommand = this.configService.get<string>(
      "TESSERACT_COMMAND",
      "tesseract",
    );
    const tsv = await this.execCommandCapture(
      tesseractCommand,
      [imagePath, "stdout", "-l", language, "tsv"],
      { timeoutMs: this.getTimeoutMs() },
    );
    return this.parseTesseractTsv(tsv);
  }

  private parseTesseractTsv(tsv: string): {
    text: string | null;
    confidence: number | null;
  } {
    const lines = tsv.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) {
      return { text: null, confidence: null };
    }

    const texts: string[] = [];
    const confidences: number[] = [];

    for (const line of lines.slice(1)) {
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
    const confidence =
      confidences.length > 0
        ? confidences.reduce((sum, value) => sum + value, 0) /
          confidences.length
        : null;

    return {
      text,
      confidence,
    };
  }

  private async commandExists(command: string): Promise<boolean> {
    if (command.includes("/")) {
      return this.executableExists(command);
    }

    try {
      await this.execCommand(
        "sh",
        ["-lc", 'command -v -- "$1"', "sh", command],
        {
          timeoutMs: 5000,
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  private async executableExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fsConstants.X_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async pythonModuleAvailable(
    pythonCommand: string,
    moduleName: string,
  ): Promise<boolean> {
    if (!(await this.commandExists(pythonCommand))) {
      return false;
    }

    try {
      await this.execCommand(pythonCommand, ["-c", `import ${moduleName}`], {
        timeoutMs: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  private async execCommand(
    command: string,
    args: string[],
    options: { timeoutMs: number },
  ): Promise<void> {
    await this.execCommandCapture(command, args, options);
  }

  private async execCommandCapture(
    command: string,
    args: string[],
    options: { timeoutMs: number },
  ): Promise<string> {
    return new Promise<string>((resolvePromise, rejectPromise) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        rejectPromise(
          new Error(`Command timed out: ${command} ${args.join(" ")}`),
        );
      }, options.timeoutMs);

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        rejectPromise(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          if (stdout.trim()) {
            this.logger.debug(stdout.trim());
          }
          resolvePromise(stdout);
          return;
        }

        rejectPromise(
          new Error(
            stderr.trim() ||
              stdout.trim() ||
              `Command failed (${code}): ${command} ${args.join(" ")}`,
          ),
        );
      });
    });
  }
}
