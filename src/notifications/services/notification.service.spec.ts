import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationService } from "./notification.service";
import { Notification } from "../../database/entities/Notification.entity";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationType,
} from "../../database/entities/enums/notification-types.enum";

describe("NotificationService", () => {
  let service: NotificationService;
  let notificationRepository: jest.Mocked<Repository<Notification>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));
    notificationRepository.create.mockImplementation(
      (value) => value as Notification,
    );
    notificationRepository.save.mockImplementation(
      async (value) => value as Notification,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("queues notifications in the database after creation", async () => {
    await service.create("tenant-1", "user-1", {
      type: NotificationType.SYSTEM,
      title: "System notification",
      body: "Queued delivery",
      channel: NotificationChannel.IN_APP,
    });

    expect(notificationRepository.save).toHaveBeenCalledTimes(2);
    expect(notificationRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: NotificationStatus.QUEUED,
        data: expect.objectContaining({
          queuedAt: expect.any(String),
        }),
      }),
    );
  });

  it("delivers queued email notifications", async () => {
    const notification = {
      id: "notification-1",
      channel: NotificationChannel.EMAIL,
      status: NotificationStatus.QUEUED,
      userEmail: "user@example.com",
      data: {},
      createdAt: new Date(),
    } as Notification;
    notificationRepository.find.mockResolvedValue([notification]);

    await service.processQueuedNotifications();

    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "notification-1",
        status: NotificationStatus.DELIVERED,
        fromEmail: expect.any(String),
        deliveredAt: expect.any(Date),
      }),
    );
  });

  it("marks undeliverable sms notifications as failed", async () => {
    const notification = {
      id: "notification-2",
      channel: NotificationChannel.SMS,
      status: NotificationStatus.QUEUED,
      userPhone: "",
      data: {},
      createdAt: new Date(),
    } as Notification;
    notificationRepository.find.mockResolvedValue([notification]);

    await service.processQueuedNotifications();

    expect(notificationRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "notification-2",
        status: NotificationStatus.FAILED,
        errorMessage: "Recipient phone is missing",
        failedAt: expect.any(Date),
      }),
    );
  });
});
