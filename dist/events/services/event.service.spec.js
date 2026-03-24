"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _eventservice = require("./event.service");
const _Evententity = require("../../database/entities/Event.entity");
const _Userentity = require("../../database/entities/User.entity");
const _notificationservice = require("../../notifications/services/notification.service");
const _notificationtypesenum = require("../../database/entities/enums/notification-types.enum");
describe("EventService", ()=>{
    let service;
    let eventRepository;
    let userRepository;
    let notificationService;
    const mockEventQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
        getManyAndCount: jest.fn()
    };
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _eventservice.EventService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Evententity.Event),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        save: jest.fn(),
                        update: jest.fn(),
                        create: jest.fn(),
                        createQueryBuilder: jest.fn().mockReturnValue(mockEventQueryBuilder)
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Userentity.User),
                    useValue: {
                        findOne: jest.fn()
                    }
                },
                {
                    provide: _notificationservice.NotificationService,
                    useValue: {
                        create: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_eventservice.EventService);
        eventRepository = module.get((0, _typeorm.getRepositoryToken)(_Evententity.Event));
        userRepository = module.get((0, _typeorm.getRepositoryToken)(_Userentity.User));
        notificationService = module.get(_notificationservice.NotificationService);
        Object.values(mockEventQueryBuilder).forEach((value)=>{
            if (typeof value === "function" && "mockClear" in value) {
                value.mockClear();
            }
        });
        mockEventQueryBuilder.leftJoinAndSelect.mockReturnThis();
        mockEventQueryBuilder.where.mockReturnThis();
        mockEventQueryBuilder.andWhere.mockReturnThis();
        mockEventQueryBuilder.orderBy.mockReturnThis();
        mockEventQueryBuilder.addOrderBy.mockReturnThis();
        mockEventQueryBuilder.skip.mockReturnThis();
        mockEventQueryBuilder.take.mockReturnThis();
        mockEventQueryBuilder.getMany.mockResolvedValue([]);
        mockEventQueryBuilder.getManyAndCount.mockResolvedValue([
            [],
            0
        ]);
        eventRepository.save.mockImplementation(async (value)=>value);
        notificationService.create.mockResolvedValue({});
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("delivers reminders when event enters reminder window", async ()=>{
        const event = {
            id: "event-1",
            tenantId: "tenant-1",
            createdBy: "user-1",
            title: "Court hearing",
            type: "hearing",
            caseId: "case-1",
            eventDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
            reminderDaysBefore: 1,
            reminderSent: false,
            status: "scheduled"
        };
        eventRepository.find.mockResolvedValue([
            event
        ]);
        userRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "lawyer@example.com"
        });
        await service.processDueReminders();
        expect(notificationService.create).toHaveBeenCalledWith("tenant-1", "user-1", expect.objectContaining({
            channel: _notificationtypesenum.NotificationChannel.EMAIL,
            userEmail: "lawyer@example.com",
            data: expect.objectContaining({
                eventId: "event-1"
            })
        }));
        expect(eventRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: "event-1",
            reminderSent: true
        }));
    });
    it("skips reminders that are not yet due", async ()=>{
        const event = {
            id: "event-2",
            tenantId: "tenant-1",
            createdBy: "user-1",
            title: "Strategy meeting",
            type: "meeting",
            eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            reminderDaysBefore: 1,
            reminderSent: false,
            status: "scheduled"
        };
        eventRepository.find.mockResolvedValue([
            event
        ]);
        await service.processDueReminders();
        expect(notificationService.create).not.toHaveBeenCalled();
        expect(eventRepository.save).not.toHaveBeenCalled();
    });
    it("resets reminder flag when schedule changes", async ()=>{
        const event = {
            id: "event-3",
            tenantId: "tenant-1",
            createdBy: "user-1",
            title: "Deadline",
            reminderSent: true,
            status: "scheduled"
        };
        eventRepository.findOne.mockResolvedValue(event);
        const result = await service.update("tenant-1", "event-3", "user-1", {
            reminderDaysBefore: 2
        });
        expect(result.reminderSent).toBe(false);
        expect(eventRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: "event-3",
            reminderSent: false
        }));
    });
    it("excludes archived events from calendar feed", async ()=>{
        await service.getCalendarEvents("tenant-1", new Date("2026-03-01T00:00:00.000Z"), new Date("2026-03-31T23:59:59.999Z"));
        expect(mockEventQueryBuilder.andWhere).toHaveBeenCalledWith("event.status != :archivedStatus", {
            archivedStatus: "archived"
        });
    });
});

//# sourceMappingURL=event.service.spec.js.map