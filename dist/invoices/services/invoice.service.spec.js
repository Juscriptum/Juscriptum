"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _testing = require("@nestjs/testing");
const _typeorm = require("@nestjs/typeorm");
const _common = require("@nestjs/common");
const _invoiceservice = require("./invoice.service");
const _Invoiceentity = require("../../database/entities/Invoice.entity");
const _Cliententity = require("../../database/entities/Client.entity");
const _storageproviderservice = require("../../file-storage/services/storage-provider.service");
const _notificationservice = require("../../notifications/services/notification.service");
describe("InvoiceService", ()=>{
    let service;
    let invoiceRepository;
    let clientRepository;
    let storageProviderService;
    let notificationService;
    const tenantId = "tenant-1";
    const userId = "user-1";
    const invoiceId = "invoice-1";
    const createMockInvoice = ()=>({
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
            updatedBy: userId
        });
    const mockClient = {
        id: "client-1",
        tenantId,
        email: "client@example.com",
        companyName: "Client LLC"
    };
    beforeEach(async ()=>{
        const module = await _testing.Test.createTestingModule({
            providers: [
                _invoiceservice.InvoiceService,
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Invoiceentity.Invoice),
                    useValue: {
                        findOne: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        update: jest.fn(),
                        createQueryBuilder: jest.fn()
                    }
                },
                {
                    provide: (0, _typeorm.getRepositoryToken)(_Cliententity.Client),
                    useValue: {
                        findOne: jest.fn()
                    }
                },
                {
                    provide: _storageproviderservice.StorageProviderService,
                    useValue: {
                        upload: jest.fn()
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
        service = module.get(_invoiceservice.InvoiceService);
        invoiceRepository = module.get((0, _typeorm.getRepositoryToken)(_Invoiceentity.Invoice));
        clientRepository = module.get((0, _typeorm.getRepositoryToken)(_Cliententity.Client));
        storageProviderService = module.get(_storageproviderservice.StorageProviderService);
        notificationService = module.get(_notificationservice.NotificationService);
        invoiceRepository.findOne.mockImplementation(async ()=>createMockInvoice());
        invoiceRepository.save.mockImplementation(async (value)=>value);
        clientRepository.findOne.mockResolvedValue(mockClient);
        storageProviderService.upload.mockResolvedValue({
            path: `tenants/${tenantId}/invoices/${invoiceId}/INV-2026-03-0001.pdf`,
            url: "https://storage.example/invoices/invoice-1.pdf",
            size: 1024
        });
        notificationService.create.mockResolvedValue({});
    });
    afterEach(()=>{
        jest.clearAllMocks();
    });
    it("generates and stores invoice pdf", async ()=>{
        const result = await service.generatePdf(tenantId, invoiceId, {
            userId
        });
        expect(result.pdfUrl).toBe("https://storage.example/invoices/invoice-1.pdf");
        expect(storageProviderService.upload).toHaveBeenCalledWith(expect.objectContaining({
            path: `tenants/${tenantId}/invoices/${invoiceId}/`,
            fileName: "INV-2026-03-0001.pdf",
            contentType: "application/pdf",
            buffer: expect.any(Buffer)
        }));
        const uploadedBuffer = storageProviderService.upload.mock.calls[0][0].buffer;
        expect(uploadedBuffer.toString("utf8")).toContain("%PDF-1.4");
        expect(invoiceRepository.save).toHaveBeenCalledWith(expect.objectContaining({
            pdfUrl: "https://storage.example/invoices/invoice-1.pdf",
            updatedBy: userId
        }));
    });
    it("sends invoice through queued email delivery and marks invoice as sent", async ()=>{
        const result = await service.send(tenantId, invoiceId, userId);
        expect(storageProviderService.upload).toHaveBeenCalled();
        expect(notificationService.create).toHaveBeenCalledWith(tenantId, null, expect.objectContaining({
            userEmail: "client@example.com",
            data: expect.objectContaining({
                invoiceId,
                pdfUrl: "https://storage.example/invoices/invoice-1.pdf"
            })
        }));
        expect(result.status).toBe("sent");
        expect(invoiceRepository.save).toHaveBeenLastCalledWith(expect.objectContaining({
            status: "sent",
            metadata: expect.objectContaining({
                delivery: expect.objectContaining({
                    status: "queued",
                    recipient: "client@example.com"
                })
            })
        }));
    });
    it("rejects sending when client email is missing", async ()=>{
        clientRepository.findOne.mockResolvedValue({
            ...mockClient,
            email: ""
        });
        await expect(service.send(tenantId, invoiceId, userId)).rejects.toThrow(_common.BadRequestException);
        expect(notificationService.create).not.toHaveBeenCalled();
        expect(storageProviderService.upload).not.toHaveBeenCalled();
    });
});

//# sourceMappingURL=invoice.service.spec.js.map