import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { CaseRegistrySyncService } from "./case-registry-sync.service";
import { Case } from "../../database/entities/Case.entity";
import { Event } from "../../database/entities/Event.entity";
import { CourtRegistryService } from "../../clients/services/court-registry.service";

describe("CaseRegistrySyncService", () => {
  let service: CaseRegistrySyncService;
  let caseRepository: jest.Mocked<Repository<Case>>;
  let eventRepository: jest.Mocked<Repository<Event>>;
  let courtRegistryService: jest.Mocked<CourtRegistryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseRegistrySyncService,
        {
          provide: getRepositoryToken(Case),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Event),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: CourtRegistryService,
          useValue: {
            findCourtDateByCaseNumber: jest.fn(),
            findCourtDatesByCaseNumbers: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(CaseRegistrySyncService);
    caseRepository = module.get(getRepositoryToken(Case));
    eventRepository = module.get(getRepositoryToken(Event));
    courtRegistryService = module.get(CourtRegistryService);
    eventRepository.create.mockImplementation((value) => value as Event);
    eventRepository.save.mockImplementation(async (value) => value as Event);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("creates a court sitting event when a date match is found", async () => {
    eventRepository.find.mockResolvedValue([]);
    courtRegistryService.findCourtDateByCaseNumber.mockResolvedValue({
      date: "10.03.2026 16:00",
      judges: "Головуючий суддя: Філінюк І.Г.",
      caseNumber: "916/4127/25",
      courtName: "Південно-західний апеляційний господарський суд",
      courtRoom: "7",
      caseInvolved: "Позивач: ТОВ",
      caseDescription: "про визнання незаконними дій",
    });

    await service.handleCaseLifecycleChange({
      id: "case-1",
      tenantId: "tenant-1",
      caseType: "judicial_case",
      registryCaseNumber: "916/4127/25",
      assignedLawyerId: "lawyer-1",
      updatedBy: "lawyer-1",
    } as Case);

    expect(courtRegistryService.findCourtDateByCaseNumber).toHaveBeenCalledWith(
      "916/4127/25",
    );
    expect(eventRepository.find).toHaveBeenCalledWith({
      where: {
        tenantId: "tenant-1",
        caseId: "case-1",
        type: "court_sitting",
        deletedAt: IsNull(),
      },
    });
    expect(eventRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Судове засідання у справі 916/4127/25",
        location: "Південно-західний апеляційний господарський суд",
        courtRoom: "7",
        responsibleContact: "Головуючий суддя: Філінюк І.Г.",
      }),
    );
    expect(eventRepository.save).toHaveBeenCalled();
  });

  it("soft deletes auto events when case is no longer eligible", async () => {
    eventRepository.find.mockResolvedValue([
      {
        id: "event-1",
        updatedBy: "lawyer-1",
        participants: { syncSource: "court_dates" },
      } as unknown as Event,
    ]);

    await service.handleCaseLifecycleChange({
      id: "case-1",
      tenantId: "tenant-1",
      caseType: "enforcement_proceeding",
      registryCaseNumber: "80184995",
      updatedBy: "lawyer-1",
    } as Case);

    expect(eventRepository.update).toHaveBeenCalledWith(
      { id: "event-1", tenantId: "tenant-1" },
      expect.objectContaining({
        updatedBy: "lawyer-1",
      }),
    );
  });

  it("syncs eligible judicial cases during daily run", async () => {
    caseRepository.find.mockResolvedValue([
      {
        id: "case-1",
        tenantId: "tenant-1",
        caseType: "judicial_case",
        registryCaseNumber: "916/4127/25",
        assignedLawyerId: "lawyer-1",
      } as Case,
    ]);
    courtRegistryService.findCourtDatesByCaseNumbers.mockResolvedValue(
      new Map([
        [
          "916/4127/25",
          {
            date: "10.03.2026 16:00",
            judges: "Суддя",
            caseNumber: "916/4127/25",
            courtName: "Суд",
            courtRoom: "7",
            caseInvolved: "",
            caseDescription: "",
          },
        ],
      ]),
    );
    eventRepository.find.mockResolvedValue([]);

    await service.syncDailyCourtEvents();

    expect(caseRepository.find).toHaveBeenCalledWith({
      where: {
        deletedAt: IsNull(),
        caseType: "judicial_case",
        registryCaseNumber: Not(IsNull()),
      },
    });
    expect(
      courtRegistryService.findCourtDatesByCaseNumbers,
    ).toHaveBeenCalledWith(["916/4127/25"]);
    expect(eventRepository.save).toHaveBeenCalled();
  });
});
