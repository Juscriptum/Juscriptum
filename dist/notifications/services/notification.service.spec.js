"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _notificationservice = require("./notification.service");
const _Notificationentity = require("../../database/entities/Notification.entity");
const _notificationtypesenum = require("../../database/entities/enums/notification-types.enum");
describe("NotificationService", ()=>{
    let service;
    let notificationRepository;
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _notificationservice.NotificationService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Notificationentity.Notification),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        find: jest.fn(),
                        findOne: jest.fn(),
                        update: jest.fn(),
                        count: jest.fn(),
                        createQueryBuilder: jest.fn()
                    }
                }
            ]
        }).compile();
        service = module.get(_notificationservice.NotificationService);
        notificationRepository = module.get((0, _typeorm.getRepositoryToken)(_Notificationentity.Notification));
        notificationRepository.create.mockImplementation((value)=>value);
        notificationRepository.save.mockImplementation(async (value)=>value);
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("queues notifications in the database after creation", async ()=>{
        await service.create("tenant-1", "user-1", {
            type: _notificationtypesenum.NotificationType.SYSTEM,
            title: "System notification",
            body: "Queued delivery",
            channel: _notificationtypesenum.NotificationChannel.IN_APP
        });
        expect(notificationRepository.save).toHaveBeenCalledTimes(2);
        expect(notificationRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({
            status: _notificationtypesenum.NotificationStatus.QUEUED,
            data: expect.objectContaining({
                queuedAt: expect.any(String)
            })
        }));
    });
    it("delivers queued email notifications", async ()=>{
        const notification = {
            id: "notification-1",
            channel: _notificationtypesenum.NotificationChannel.EMAIL,
            status: _notificationtypesenum.NotificationStatus.QUEUED,
            userEmail: "user@example.com",
            data: {},
            createdAt: new Date()
        };
        notificationRepository.find.mockResolvedValue([
            notification
        ]);
        await service.processQueuedNotifications();
        expect(notificationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: "notification-1",
            status: _notificationtypesenum.NotificationStatus.DELIVERED,
            fromEmail: expect.any(String),
            deliveredAt: expect.any(Date)
        }));
    });
    it("marks undeliverable sms notifications as failed", async ()=>{
        const notification = {
            id: "notification-2",
            channel: _notificationtypesenum.NotificationChannel.SMS,
            status: _notificationtypesenum.NotificationStatus.QUEUED,
            userPhone: "",
            data: {},
            createdAt: new Date()
        };
        notificationRepository.find.mockResolvedValue([
            notification
        ]);
        await service.processQueuedNotifications();
        expect(notificationRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            id: "notification-2",
            status: _notificationtypesenum.NotificationStatus.FAILED,
            errorMessage: "Recipient phone is missing",
            failedAt: expect.any(Date)
        }));
    });
});

//# sourceMappingURL=notification.service.spec.js.map