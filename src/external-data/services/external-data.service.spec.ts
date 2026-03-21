import { zipSync } from "fflate";
import { createServer, Server } from "http";
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
  let registryIndexService: {
    getImportState: jest.Mock;
    upsertImportState: jest.Mock;
    rebuildIndexes: jest.Mock;
  };

  beforeEach(async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), "external-data-"));
    targetDirectory = path.join(tempDirectory, "court_stan");
    await mkdir(targetDirectory, { recursive: true });
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
