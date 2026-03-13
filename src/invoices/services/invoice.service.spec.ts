import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BadRequestException } from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { Invoice } from "../../database/entities/Invoice.entity";
import { Client } from "../../database/entities/Client.entity";
import { StorageProviderService } from "../../file-storage/services/storage-provider.service";
import { NotificationService } from "../../notifications/services/notification.service";

describe("InvoiceService", () => {
  let service: InvoiceService;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let clientRepository: jest.Mocked<Repository<Client>>;
  let storageProviderService: jest.Mocked<StorageProviderService>;
  let notificationService: jest.Mocked<NotificationService>;

  const tenantId = "tenant-1";
  const userId = "user-1";
  const invoiceId = "invoice-1";

  const createMockInvoice = (): Invoice =>
    ({
      id: invoiceId,
      tenantId,
      clientId: "client-1",
      invoiceNumber: "INV-2026-03-0001",
      invoiceDate: new Date("2026-03-10T00:00:00.000Z"),
      dueDate: new Date("2026-03-20T00:00:00.000Z"),
      description: "Legal services",
      totalAmount: 1000,
      paidAmount: 200,
      currency: "UAH",
      status: "draft",
      metadata: {},
      pdfUrl: "",
      pdfGeneratedAt: null,
      updatedBy: userId,
    }) as unknown as Invoice;

  const mockClient = {
    id: "client-1",
    tenantId,
    email: "client@example.com",
    companyName: "Client LLC",
  } as unknown as Client;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoiceService,
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Client),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: StorageProviderService,
          useValue: {
            upload: jest.fn(),
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

    service = module.get(InvoiceService);
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    clientRepository = module.get(getRepositoryToken(Client));
    storageProviderService = module.get(StorageProviderService);
    notificationService = module.get(NotificationService);

    invoiceRepository.findOne.mockImplementation(async () =>
      createMockInvoice(),
    );
    invoiceRepository.save.mockImplementation(
      async (value) => value as Invoice,
    );
    clientRepository.findOne.mockResolvedValue(mockClient);
    storageProviderService.upload.mockResolvedValue({
      path: `tenants/${tenantId}/invoices/${invoiceId}/INV-2026-03-0001.pdf`,
      url: "https://storage.example/invoices/invoice-1.pdf",
      size: 1024,
    });
    notificationService.create.mockResolvedValue({} as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("generates and stores invoice pdf", async () => {
    const result = await service.generatePdf(tenantId, invoiceId, { userId });

    expect(result.pdfUrl).toBe(
      "https://storage.example/invoices/invoice-1.pdf",
    );
    expect(storageProviderService.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        path: `tenants/${tenantId}/invoices/${invoiceId}/`,
        fileName: "INV-2026-03-0001.pdf",
        contentType: "application/pdf",
        buffer: expect.any(Buffer),
      }),
    );
    const uploadedBuffer =
      storageProviderService.upload.mock.calls[0][0].buffer;
    expect(uploadedBuffer.toString("utf8")).toContain("%PDF-1.4");
    expect(invoiceRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        pdfUrl: "https://storage.example/invoices/invoice-1.pdf",
        updatedBy: userId,
      }),
    );
  });

  it("sends invoice through queued email delivery and marks invoice as sent", async () => {
    const result = await service.send(tenantId, invoiceId, userId);

    expect(storageProviderService.upload).toHaveBeenCalled();
    expect(notificationService.create).toHaveBeenCalledWith(
      tenantId,
      null,
      expect.objectContaining({
        userEmail: "client@example.com",
        data: expect.objectContaining({
          invoiceId,
          pdfUrl: "https://storage.example/invoices/invoice-1.pdf",
        }),
      }),
    );
    expect(result.status).toBe("sent");
    expect(invoiceRepository.save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        status: "sent",
        metadata: expect.objectContaining({
          delivery: expect.objectContaining({
            status: "queued",
            recipient: "client@example.com",
          }),
        }),
      }),
    );
  });

  it("rejects sending when client email is missing", async () => {
    clientRepository.findOne.mockResolvedValue({
      ...mockClient,
      email: "",
    } as Client);

    await expect(service.send(tenantId, invoiceId, userId)).rejects.toThrow(
      BadRequestException,
    );
    expect(notificationService.create).not.toHaveBeenCalled();
    expect(storageProviderService.upload).not.toHaveBeenCalled();
  });
});
