import { zipSync } from "fflate";
import { createServer, Server } from "http";
import * as iconv from "iconv-lite";
import { AddressInfo } from "net";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import * as os from "os";
import * as path from "path";
import { ExternalDataSourceDefinition } from "../external-data.constants";
import { ExternalDataService } from "./external-data.service";

describe("ExternalDataService", () => {
  let tempDirectory: string;
  let server: Server;
  let baseUrl: string;
  let targetDirectory: string;
  let previousAsvpResumableArchiveMinBytes: string | undefined;
  let previousAsvpArchiveChunkBytes: string | undefined;
  let registryIndexService: {
    getImportState: jest.Mock;
    upsertImportState: jest.Mock;
    rebuildIndexes: jest.Mock;
  };

  beforeEach(async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), "external-data-"));
    targetDirectory = path.join(tempDirectory, "court_stan");
    await mkdir(targetDirectory, { recursive: true });
    previousAsvpResumableArchiveMinBytes =
      process.env.ASVP_RESUMABLE_ARCHIVE_MIN_BYTES;
    previousAsvpArchiveChunkBytes = process.env.ASVP_ARCHIVE_CHUNK_BYTES;
    registryIndexService = {
      getImportState: jest.fn().mockResolvedValue(null),
      upsertImportState: jest.fn().mockResolvedValue(undefined),
      rebuildIndexes: jest.fn().mockResolvedValue(undefined),
    };
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      if (!server) {
        resolve();
        return;
      }

      server.close(() => resolve());
    });
    restoreEnv(
      "ASVP_RESUMABLE_ARCHIVE_MIN_BYTES",
      previousAsvpResumableArchiveMinBytes,
    );
    restoreEnv("ASVP_ARCHIVE_CHUNK_BYTES", previousAsvpArchiveChunkBytes);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it("downloads a CSV resource and rebuilds the matching index", async () => {
    const csvBody = `"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"\n"Суд"\t"1/1"\t""\t"01.01.2026"\t""\t""\t"позивач: Іван Іванов"\t""\t""\t""\t""\t""\t""\n`;
    const resources = {
      "/court.csv": Buffer.from(csvBody, "utf-8"),
    };
    ({ server, baseUrl } = await startStaticServer(resources));

    const definitions: ExternalDataSourceDefinition[] = [
      {
        code: "court_stan",
        targetDirectory,
        indexedSource: "court_stan",
        resources: [{ name: "court", url: `${baseUrl}/court.csv` }],
      },
    ];

    const service = new ExternalDataService(
      registryIndexService as any,
      definitions,
    );

    await service.updateExternalData({ source: "court_stan" });

    expect(
      (await readFile(path.join(targetDirectory, "court.csv"))).toString(
        "utf-8",
      ),
    ).toContain(`"Суд"`);
    expect(registryIndexService.rebuildIndexes).toHaveBeenCalledWith({
      source: "court_stan",
    });
    expect(registryIndexService.upsertImportState).toHaveBeenCalled();
  });

  it("downloads an ASVP ZIP resource, streams it into year split files, and triggers the sharded ASVP rebuild path", async () => {
    targetDirectory = path.join(tempDirectory, "asvp");
    await mkdir(targetDirectory, { recursive: true });

    const csvBody = iconv.encode(
      [
        "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
        '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"',
      ].join("\n"),
      "cp1251",
    );
    const resources = {
      "/asvp.zip": Buffer.from(
        zipSync({
          "28-ex_csv_asvp.csv": Buffer.from(csvBody),
        }),
      ),
    };
    ({ server, baseUrl } = await startStaticServer(resources));

    const definitions: ExternalDataSourceDefinition[] = [
      {
        code: "asvp",
        targetDirectory,
        indexedSource: "asvp",
        resources: [{ name: "asvp", url: `${baseUrl}/asvp.zip` }],
      },
    ];

    const service = new ExternalDataService(
      registryIndexService as any,
      definitions,
    );

    await service.updateExternalData({ source: "asvp" });

    expect(
      (
        await readFile(path.join(targetDirectory, "split", "asvp-2026.csv"))
      ).toString("utf-8"),
    ).toContain("Палінкаш Андрій Андрійович");
    expect(registryIndexService.rebuildIndexes).toHaveBeenCalledWith({
      source: "asvp",
    });
    expect(registryIndexService.upsertImportState).toHaveBeenCalled();
    await expect(
      readFile(path.join(targetDirectory, "asvp.zip")),
    ).rejects.toThrow();
  });

  it("downloads an ASVP ZIP resource in resumable range chunks when forced", async () => {
    targetDirectory = path.join(tempDirectory, "asvp-ranged");
    await mkdir(targetDirectory, { recursive: true });
    process.env.ASVP_RESUMABLE_ARCHIVE_MIN_BYTES = "1";
    process.env.ASVP_ARCHIVE_CHUNK_BYTES = "1024";

    const csvBody = iconv.encode(
      [
        "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
        '"Іваненко Іван Іванович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2025 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"',
      ].join("\n"),
      "cp1251",
    );
    const resources = {
      "/asvp-ranged.zip": Buffer.from(
        zipSync({
          "28-ex_csv_asvp.csv": Buffer.from(csvBody),
        }),
      ),
    };
    ({ server, baseUrl } = await startStaticServer(resources));

    const definitions: ExternalDataSourceDefinition[] = [
      {
        code: "asvp",
        targetDirectory,
        indexedSource: "asvp",
        resources: [{ name: "asvp", url: `${baseUrl}/asvp-ranged.zip` }],
      },
    ];

    const service = new ExternalDataService(
      registryIndexService as any,
      definitions,
    );

    await service.updateExternalData({ source: "asvp" });

    expect(
      (
        await readFile(path.join(targetDirectory, "split", "asvp-2025.csv"))
      ).toString("utf-8"),
    ).toContain("Іваненко Іван Іванович");
    expect(registryIndexService.rebuildIndexes).toHaveBeenCalledWith({
      source: "asvp",
    });
  });

  it("extracts a ZIP archive into the target directory", async () => {
    const zipped = Buffer.from(
      zipSync({
        "FSU.csv": Buffer.from("id,name\n1,Test\n", "utf-8"),
      }),
    );
    const resources = {
      "/reestr.zip": zipped,
    };
    ({ server, baseUrl } = await startStaticServer(resources));

    const definitions: ExternalDataSourceDefinition[] = [
      {
        code: "reestr",
        targetDirectory,
        resources: [{ name: "reestr", url: `${baseUrl}/reestr.zip` }],
      },
    ];

    const service = new ExternalDataService(
      registryIndexService as any,
      definitions,
    );

    await service.updateExternalData({ source: "reestr" });

    expect(
      (await readFile(path.join(targetDirectory, "FSU.csv"))).toString("utf-8"),
    ).toContain("Test");
    expect(registryIndexService.rebuildIndexes).not.toHaveBeenCalled();
  });
});

async function startStaticServer(
  resources: Record<string, Buffer>,
): Promise<{ server: Server; baseUrl: string }> {
  const server = createServer((request, response) => {
    const payload = resources[request.url || ""];

    if (!payload) {
      response.statusCode = 404;
      response.end("missing");
      return;
    }

    response.setHeader("content-length", String(payload.length));
    response.setHeader(
      "content-type",
      request.url?.endsWith(".zip") ? "application/zip" : "text/csv",
    );
    response.setHeader(
      "etag",
      `"${Buffer.from(request.url || "").toString("hex")}"`,
    );
    response.setHeader(
      "last-modified",
      new Date("2026-03-13T10:00:00Z").toUTCString(),
    );
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
      const end = Math.min(
        Number(match[2] || String(payload.length - 1)),
        payload.length - 1,
      );

      if (!Number.isFinite(start) || start >= payload.length || end < start) {
        response.statusCode = 416;
        response.end();
        return;
      }

      const chunk = payload.subarray(start, end + 1);
      response.statusCode = 206;
      response.setHeader("content-length", String(chunk.length));
      response.setHeader(
        "content-range",
        `bytes ${start}-${end}/${payload.length}`,
      );

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

  await new Promise<void>((resolve) => server.listen(0, resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    server,
    baseUrl: `http://127.0.0.1:${port}`,
  };
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
