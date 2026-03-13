import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { EventService } from "./event.service";
import { Event } from "../../database/entities/Event.entity";
import { User } from "../../database/entities/User.entity";
import { NotificationService } from "../../notifications/services/notification.service";
import { NotificationChannel } from "../../database/entities/enums/notification-types.enum";

describe("EventService", () => {
  let service: EventService;
  let eventRepository: jest.Mocked<Repository<Event>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let notificationService: jest.Mocked<NotificationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: getRepositoryToken(Event),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(EventService);
    eventRepository = module.get(getRepositoryToken(Event));
    userRepository = module.get(getRepositoryToken(User));
    notificationService = module.get(NotificationService);
    eventRepository.save.mockImplementation(async (value) => value as Event);
    notificationService.create.mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delivers reminders when event enters reminder window", async () => {
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
      status: "scheduled",
    } as unknown as Event;
    eventRepository.find.mockResolvedValue([event]);
    userRepository.findOne.mockResolvedValue({
      id: "user-1",
      tenantId: "tenant-1",
      email: "lawyer@example.com",
    } as User);

    await service.processDueReminders();

    expect(notificationService.create).toHaveBeenCalledWith(
      "tenant-1",
      "user-1",
      expect.objectContaining({
        channel: NotificationChannel.EMAIL,
        userEmail: "lawyer@example.com",
        data: expect.objectContaining({
          eventId: "event-1",
        }),
      }),
    );
    expect(eventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "event-1",
        reminderSent: true,
      }),
    );
  });

  it("skips reminders that are not yet due", async () => {
    const event = {
      id: "event-2",
      tenantId: "tenant-1",
      createdBy: "user-1",
      title: "Strategy meeting",
      type: "meeting",
      eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      reminderDaysBefore: 1,
      reminderSent: false,
      status: "scheduled",
    } as unknown as Event;
    eventRepository.find.mockResolvedValue([event]);

    await service.processDueReminders();

    expect(notificationService.create).not.toHaveBeenCalled();
    expect(eventRepository.save).not.toHaveBeenCalled();
  });

  it("resets reminder flag when schedule changes", async () => {
    const event = {
      id: "event-3",
      tenantId: "tenant-1",
      createdBy: "user-1",
      title: "Deadline",
      reminderSent: true,
      status: "scheduled",
    } as unknown as Event;
    eventRepository.findOne.mockResolvedValue(event);

    const result = await service.update("tenant-1", "event-3", "user-1", {
      reminderDaysBefore: 2,
    } as any);

    expect(result.reminderSent).toBe(false);
    expect(eventRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "event-3",
        reminderSent: false,
      }),
    );
  });
});
