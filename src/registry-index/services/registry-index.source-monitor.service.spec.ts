import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import * as os from "os";
import * as path from "path";
import { RegistryIndexSourceMonitorService } from "./registry-index.source-monitor.service";

describe("RegistryIndexSourceMonitorService", () => {
  const originalRunScheduledJobs = process.env.RUN_SCHEDULED_JOBS;
  let tempDirectory: string;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(
      path.join(os.tmpdir(), "registry-source-monitor-"),
    );
    await mkdir(path.join(tempDirectory, "court_stan"));
    await mkdir(path.join(tempDirectory, "asvp"));
    await mkdir(path.join(tempDirectory, "court_dates"));
  });

  afterEach(async () => {
    restoreEnv("RUN_SCHEDULED_JOBS", originalRunScheduledJobs);
    await rm(tempDirectory, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it("warns when csv files are present but scheduled tasks are disabled", async () => {
    process.env.RUN_SCHEDULED_JOBS = "false";
    await mkdir(path.join(tempDirectory, "asvp", "split"), {
      recursive: true,
    });
    await writeFile(
      path.join(tempDirectory, "asvp", "split", "asvp-2026.csv"),
      "header",
    );

    const rebuildIndexes = jest.fn();
    const service = new RegistryIndexSourceMonitorService({
      rebuildIndexes,
    } as any);
    (service as any).sourceDirectories = {
      court_stan: path.join(tempDirectory, "court_stan"),
      asvp: path.join(tempDirectory, "asvp"),
      court_dates: path.join(tempDirectory, "court_dates"),
    };
    const warnSpy = jest
      .spyOn<any, any>(service["logger"], "warn")
      .mockImplementation(() => undefined);

    await service.onApplicationBootstrap();

    expect(rebuildIndexes).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("RUN_SCHEDULED_JOBS=false"),
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("asvp"));
  });
});

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
