"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _caseregistrysyncservice = require("./case-registry-sync.service");
const _Caseentity = require("../../database/entities/Case.entity");
const _Evententity = require("../../database/entities/Event.entity");
const _courtregistryservice = require("../../clients/services/court-registry.service");
describe("CaseRegistrySyncService", ()=>{
    let service;
    let caseRepository;
    let eventRepository;
    let courtRegistryService;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _caseregistrysyncservice.CaseRegistrySyncService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Caseentity.Case),
                    useValue: {
                        find: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Evententity.Event),
                    useValue: {
                        create: jest.fn(),
                        find: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn()
                    }
                },
                {
                    provide: _courtregistryservice.CourtRegistryService,
                    useValue: {
                        findCourtDateByCaseNumber: jest.fn(),
                        findCourtDatesByCaseNumbers: jest.fn(),
                        searchCourtDates: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_caseregistrysyncservice.CaseRegistrySyncService);
        caseRepository = module.get((0, _typeorm.getRepositoryToken)(_Caseentity.Case));
        eventRepository = module.get((0, _typeorm.getRepositoryToken)(_Evententity.Event));
        courtRegistryService = module.get(_courtregistryservice.CourtRegistryService);
        eventRepository.create.mockImplementation((value)=>value);
        eventRepository.save.mockImplementation(async (value)=>value);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("creates a court sitting event when a date match is found", async ()=>{
        eventRepository.find.mockResolvedValue([]);
        courtRegistryService.findCourtDateByCaseNumber.mockResolvedValue({
            date: "10.03.2026 16:00",
            judges: "Головуючий суддя: Філінюк І.Г.",
            caseNumber: "916/4127/25",
            courtName: "Південно-західний апеляційний господарський суд",
            courtRoom: "7",
            caseInvolved: "Позивач: ТОВ",
            caseDescription: "про визнання незаконними дій"
        });
        await service.handleCaseLifecycleChange({
            id: "case-1",
            tenantId: "tenant-1",
            caseType: "judicial_case",
            registryCaseNumber: "916/4127/25",
            assignedLawyerId: "lawyer-1",
            updatedBy: "lawyer-1"
        });
        expect(courtRegistryService.findCourtDateByCaseNumber).toHaveBeenCalledWith("916/4127/25");
        expect(eventRepository.find).toHaveBeenCalledWith({
            where: {
                tenantId: "tenant-1",
                caseId: "case-1",
                type: "court_sitting",
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        expect(eventRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            title: "Судове засідання у справі 916/4127/25",
            location: "Південно-західний апеляційний господарський суд",
            courtRoom: "7",
            responsibleContact: "Головуючий суддя: Філінюк І.Г."
        }));
        expect(eventRepository.save).toHaveBeenCalled();
    });
    it("soft deletes auto events when case is no longer eligible", async ()=>{
        eventRepository.find.mockResolvedValue([
            {
                id: "event-1",
                updatedBy: "lawyer-1",
                participants: {
                    syncSource: "court_dates"
                }
            }
        ]);
        await service.handleCaseLifecycleChange({
            id: "case-1",
            tenantId: "tenant-1",
            caseType: "enforcement_proceeding",
            registryCaseNumber: "80184995",
            updatedBy: "lawyer-1"
        });
        expect(eventRepository.update).toHaveBeenCalledWith({
            id: "event-1",
            tenantId: "tenant-1"
        }, expect.objectContaining({
            updatedBy: "lawyer-1"
        }));
    });
    it("syncs eligible judicial cases during daily run", async ()=>{
        caseRepository.find.mockResolvedValue([
            {
                id: "case-1",
                tenantId: "tenant-1",
                caseType: "judicial_case",
                registryCaseNumber: "916/4127/25",
                assignedLawyerId: "lawyer-1"
            }
        ]);
        courtRegistryService.findCourtDatesByCaseNumbers.mockResolvedValue(new Map([
            [
                "916/4127/25",
                {
                    date: "10.03.2026 16:00",
                    judges: "Суддя",
                    caseNumber: "916/4127/25",
                    courtName: "Суд",
                    courtRoom: "7",
                    caseInvolved: "",
                    caseDescription: ""
                }
            ]
        ]));
        eventRepository.find.mockResolvedValue([]);
        await service.syncDailyCourtEvents();
        expect(caseRepository.find).toHaveBeenCalledWith({
            where: {
                deletedAt: (0, _typeorm1.IsNull)(),
                caseType: "judicial_case",
                registryCaseNumber: (0, _typeorm1.Not)((0, _typeorm1.IsNull)())
            }
        });
        expect(courtRegistryService.findCourtDatesByCaseNumbers).toHaveBeenCalledWith([
            "916/4127/25"
        ]);
        expect(eventRepository.save).toHaveBeenCalled();
    });
    it("builds a manual suggestion from participant search when case number is missing", async ()=>{
        courtRegistryService.searchCourtDates.mockResolvedValue([
            {
                date: "25.03.2026 11:30",
                judges: "Суддя",
                caseNumber: "760/123/26",
                courtName: "Шевченківський районний суд міста Києва",
                courtRoom: "12",
                caseInvolved: "Іваненко Іван Іванович",
                caseDescription: "стягнення заборгованості"
            }
        ]);
        eventRepository.find.mockResolvedValue([]);
        const suggestion = await service.getRegistryHearingSuggestion({
            id: "case-7",
            tenantId: "tenant-1",
            caseNumber: "001/007",
            caseType: "judicial_case",
            plaintiffName: "Іваненко Іван Іванович",
            client: {
                type: "individual",
                lastName: "Іваненко",
                firstName: "Іван",
                patronymic: "Іванович"
            }
        });
        expect(courtRegistryService.searchCourtDates).toHaveBeenCalledWith(expect.objectContaining({
            query: "Іваненко Іван Іванович",
            onlyUpcoming: true
        }));
        expect(suggestion).toEqual(expect.objectContaining({
            caseId: "case-7",
            eventAlreadyExists: false,
            matchedBy: [
                "participant_name"
            ],
            courtName: "Шевченківський районний суд міста Києва"
        }));
    });
    it("reuses the synced event payload when creating an event from suggestion", async ()=>{
        courtRegistryService.searchCourtDates.mockResolvedValue([
            {
                date: "18.03.2026 09:15",
                judges: "Суддя",
                caseNumber: "916/4127/25",
                courtName: "Суд",
                courtRoom: "3",
                caseInvolved: "Позивач",
                caseDescription: "Опис"
            }
        ]);
        eventRepository.find.mockResolvedValue([]);
        const createdEvent = await service.createSuggestedCourtEvent({
            id: "case-9",
            tenantId: "tenant-1",
            caseNumber: "001/009",
            registryCaseNumber: "916/4127/25",
            caseType: "judicial_case",
            assignedLawyerId: "lawyer-1",
            updatedBy: "lawyer-1",
            client: null
        });
        expect(eventRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            caseId: "case-9",
            type: "court_sitting"
        }));
        expect(createdEvent).toEqual(expect.objectContaining({
            caseId: "case-9",
            type: "court_sitting"
        }));
    });
});

//# sourceMappingURL=case-registry-sync.service.spec.js.map