import * as iconv from "iconv-lite";
import { mkdtemp, mkdir, rm, writeFile } from "fs/promises";
import * as os from "os";
import * as path from "path";
import { RegistryIndexService } from "./registry-index.service";

describe("RegistryIndexService", () => {
  let tempDirectory: string;
  let service: RegistryIndexService;

  beforeEach(async () => {
    tempDirectory = await mkdtemp(path.join(os.tmpdir(), "registry-index-"));
    await mkdir(path.join(tempDirectory, "court_stan"));
    await mkdir(path.join(tempDirectory, "asvp"));
    await mkdir(path.join(tempDirectory, "court_dates"));
    service = new RegistryIndexService(
      path.join(tempDirectory, "storage", "registry-index.db"),
    );
    (service as any).courtStanDirectory = path.join(
      tempDirectory,
      "court_stan",
    );
    (service as any).asvpDirectory = path.join(tempDirectory, "asvp");
    (service as any).courtDatesDirectory = path.join(
      tempDirectory,
      "court_dates",
    );
  });

  afterEach(async () => {
    service.onModuleDestroy();
    await rm(tempDirectory, { recursive: true, force: true });
  });

  it("builds court and court_dates indexes and searches by participant/case", async () => {
    await writeFile(
      path.join(tempDirectory, "court_stan", "registry.csv"),
      [
        '"court_name"\t"case_number"\t"case_proc"\t"registration_date"\t"judge"\t"judges"\t"participants"\t"stage_date"\t"stage_name"\t"cause_result"\t"cause_dep"\t"type"\t"description"',
        '"Яворівський районний суд Львівської області"\t"460/670/13-ц"\t"2/460/590/13"\t"20.02.2013"\t"головуючий суддя: Варениця Василь Степанович"\t""\t"позивач: Долинська Іванна Степанівна, відповідач: Іщук Григорій Володимирович"\t"14.03.2013"\t"Розглянуто"\t""\t""\t"на цивільну справу"\t"про розірвання шлюбу"',
      ].join("\n"),
      "utf-8",
    );
    await writeFile(
      path.join(tempDirectory, "court_dates", "dates.csv"),
      [
        '"date"\t"judges"\t"case"\t"court_name"\t"court_room"\t"case_involved"\t"case_description"',
        '"10.03.2026 16:00"\t"Головуючий суддя: Філінюк І.Г."\t"460/670/13-ц"\t"Яворівський районний суд Львівської області"\t"7"\t"Позивач: Долинська Іванна Степанівна"\t"про розірвання шлюбу"',
      ].join("\n"),
      "utf-8",
    );

    await service.rebuildIndexes({ source: "court_stan", force: true });
    await service.rebuildIndexes({ source: "court_dates", force: true });

    const courtResults = await service.searchCourtRegistry({
      query: "Долинська Іванна Степанівна",
    });
    const courtDate = await service.findCourtDateByCaseNumber("460/670/13-ц");

    expect(courtResults).toHaveLength(1);
    expect(courtResults[0].caseNumber).toBe("460/670/13-ц");
    expect(courtDate?.courtRoom).toBe("7");
  });

  it("builds asvp index and searches by debtor", async () => {
    await writeFile(
      path.join(tempDirectory, "asvp", "registry.csv"),
      iconv.encode(
        [
          "DEBTOR_NAME,DEBTOR_BIRTHDATE,DEBTOR_CODE,CREDITOR_NAME,CREDITOR_CODE,VP_ORDERNUM,VP_BEGINDATE,VP_STATE,ORG_NAME,DVS_CODE,PHONE_NUM,EMAIL_ADDR,BANK_ACCOUNT",
          '"Палінкаш Андрій Андрійович","08.12.1976 00:00:00","","ДЕРЖАВНА СУДОВА АДМІНІСТРАЦІЯ УКРАЇНИ","26255795","80184995","06.02.2026 00:00:00","Завершено","Тячівський відділ державної виконавчої служби","34982020","(03134)3-33-14","tiach.vdvs.zk@ifminjust.gov.ua","UA768201720355279000000700866"',
        ].join("\n"),
        "cp1251",
      ),
    );

    await service.rebuildIndexes({ source: "asvp", force: true });
    const results = await service.searchAsvpRegistry({
      query: "Палінкаш Андрій Андрійович",
    });

    expect(results).toHaveLength(1);
    expect(results[0].caseNumber).toBe("80184995");
    expect(results[0].counterpartyRole).toBe("Кредитор");
    expect(results[0].sourceLabel).toBe("Реєстр виконавчих проваджень");
  });
});
