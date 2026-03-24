import * as iconv from "iconv-lite";
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import * as os from "os";
import * as path from "path";
import {
  cleanupPreparedSourceImportPlan,
  prepareSourceImportPlan,
} from "./registry-source-import-preparation";

describe("registry-source-import-preparation", () => {
  const originalAsvpPreSplitEnabled = process.env.ASVP_PRE_SPLIT_ENABLED;
  const originalAsvpSplitMinBytes = process.env.ASVP_PRE_SPLIT_MIN_BYTES;
  const originalAsvpSplitRowsPerFile = process.env.ASVP_SPLIT_ROWS_PER_FILE;
  let tempDirectory: string;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), "registry-prep-"));
  });

  afterEach(async () => {
    restoreEnv("ASVP_PRE_SPLIT_ENABLED", originalAsvpPreSplitEnabled);
    restoreEnv("ASVP_PRE_SPLIT_MIN_BYTES", originalAsvpSplitMinBytes);
    restoreEnv("ASVP_SPLIT_ROWS_PER_FILE", originalAsvpSplitRowsPerFile);
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it("keeps oversized asvp files in place by default to avoid temp-disk duplication", async () => {
    process.env.ASVP_PRE_SPLIT_MIN_BYTES = "1";

    const sourcePath = await writeAsvpFixture(
      path.join(tempDirectory, "registry.csv"),
    );

    const plan = await prepareSourceImportPlan("asvp", [sourcePath]);

    expect(plan.tempRoot).toBeNull();
    expect(plan.files).toEqual([
      {
        filePath: sourcePath,
        encoding: "asvp-repaired",
        sourceFileName: "registry.csv",
      },
    ]);
  });

  it("still supports explicit asvp pre-splitting when enabled", async () => {
    process.env.ASVP_PRE_SPLIT_ENABLED = "true";
    process.env.ASVP_PRE_SPLIT_MIN_BYTES = "1";
    process.env.ASVP_SPLIT_ROWS_PER_FILE = "1";

    const sourcePath = await writeAsvpFixture(
      path.join(tempDirectory, "registry.csv"),
    );

    const plan = await prepareSourceImportPlan("asvp", [sourcePath]);

    expect(plan.tempRoot).not.toBeNull();
    expect(plan.files).toHaveLength(2);
    expect(plan.files.every((file) => file.encoding === "utf-8")).toBe(true);

    await cleanupPreparedSourceImportPlan(plan);
  });
});

async function writeAsvpFixture(filePath: string): Promise<string> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(
    filePath,
    iconv.encode(
      [
        "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
        '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"',
        '"Іваненко Іван Іванович","01.01.1980 00:00:00","","Львівська міська рада","26255796","70184995","06.02.2025 00:00:00","Відкрито","Львівський відділ державної виконавчої служби","44982020","(032)3-33-14","lviv@ifminjust.gov.ua","UA768201720355279000000700999"',
      ].join("\n"),
      "cp1251",
    ),
  );

  return filePath;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
