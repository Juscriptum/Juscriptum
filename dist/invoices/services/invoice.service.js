"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InvoiceService", {
    enumerable: true,
    get: function() {
        return InvoiceService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _Invoiceentity = require("../../database/entities/Invoice.entity");
const _Cliententity = require("../../database/entities/Client.entity");
const _storageproviderservice = require("../../file-storage/services/storage-provider.service");
const _notificationservice = require("../../notifications/services/notification.service");
const _notificationtypesenum = require("../../database/entities/enums/notification-types.enum");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let InvoiceService = class InvoiceService {
    /**
   * Get all invoices with filters
   */ async findAll(tenantId, filters = {}) {
        const query = this.invoiceRepository.createQueryBuilder("invoice").where("invoice.tenantId = :tenantId AND invoice.deletedAt IS NULL", {
            tenantId
        });
        // Filter by client
        if (filters.clientId) {
            query.andWhere("invoice.clientId = :clientId", {
                clientId: filters.clientId
            });
        }
        // Filter by status
        if (filters.status) {
            query.andWhere("invoice.status = :status", {
                status: filters.status
            });
        }
        // Filter by date range
        if (filters.invoiceDateFrom && filters.invoiceDateTo) {
            query.andWhere("invoice.invoiceDate BETWEEN :invoiceDateFrom AND :invoiceDateTo", {
                invoiceDateFrom: new Date(filters.invoiceDateFrom),
                invoiceDateTo: new Date(filters.invoiceDateTo)
            });
        } else if (filters.invoiceDateFrom) {
            query.andWhere("invoice.invoiceDate >= :invoiceDateFrom", {
                invoiceDateFrom: new Date(filters.invoiceDateFrom)
            });
        } else if (filters.invoiceDateTo) {
            query.andWhere("invoice.invoiceDate <= :invoiceDateTo", {
                invoiceDateTo: new Date(filters.invoiceDateTo)
            });
        }
        // Search
        if (filters.search) {
            query.andWhere("(invoice.invoiceNumber ILIKE :search OR " + "invoice.description ILIKE :search)", {
                search: `%${filters.search}%`
            });
        }
        // Sorting
        const sortBy = filters.sortBy || "invoiceDate";
        const sortOrder = filters.sortOrder || "DESC";
        query.orderBy(`invoice.${sortBy}`, sortOrder);
        // Pagination
        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        const [data, total] = await query.getManyAndCount();
        return {
            data,
            total,
            page,
            limit
        };
    }
    /**
   * Get invoice by ID
   */ async findById(tenantId, id) {
        const invoice = await this.invoiceRepository.findOne({
            where: {
                id,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            },
            relations: [
                "createdByUser"
            ]
        });
        if (!invoice) {
            throw new _common.NotFoundException("Рахунок не знайдено");
        }
        return invoice;
    }
    /**
   * Create new invoice
   */ async create(tenantId, userId, dto) {
        // Generate invoice number
        const invoiceNumber = await this.generateInvoiceNumber(tenantId);
        const financials = this.calculateInvoiceFinancials(dto);
        const invoice = this.invoiceRepository.create({
            tenantId,
            invoiceNumber,
            clientId: dto.clientId,
            invoiceDate: new Date(dto.invoiceDate),
            dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
            description: dto.description,
            subtotal: financials.subtotal,
            discountAmount: financials.discountAmount,
            vatAmount: financials.vatAmount,
            totalAmount: financials.totalAmount,
            internalNotes: dto.internalNotes,
            clientNotes: dto.clientNotes,
            metadata: {
                items: dto.items,
                unitType: dto.unitType,
                discountPercentage: dto.discountPercentage ?? 0,
                vatRate: dto.vatRate ?? 0,
                vatIncluded: dto.vatIncluded ?? false
            },
            status: "draft",
            createdBy: userId,
            updatedBy: userId
        });
        return this.invoiceRepository.save(invoice);
    }
    /**
   * Update invoice
   */ async update(tenantId, id, userId, dto) {
        const invoice = await this.findById(tenantId, id);
        Object.assign(invoice, dto, {
            updatedBy: userId
        });
        return this.invoiceRepository.save(invoice);
    }
    /**
   * Delete invoice (soft delete)
   */ async delete(tenantId, id, userId) {
        const invoice = await this.findById(tenantId, id);
        await this.invoiceRepository.update({
            id,
            tenantId
        }, {
            deletedAt: new Date(),
            updatedBy: userId,
            status: "cancelled"
        });
    }
    /**
   * Send invoice
   */ async send(tenantId, id, userId) {
        const invoice = await this.findById(tenantId, id);
        const client = await this.clientRepository.findOne({
            where: {
                id: invoice.clientId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        });
        if (!client?.email) {
            throw new _common.BadRequestException("Неможливо надіслати рахунок без email клієнта");
        }
        if (!invoice.pdfUrl) {
            const generatedPdf = await this.generatePdf(tenantId, id, {
                userId
            });
            invoice.pdfUrl = generatedPdf.pdfUrl;
            invoice.pdfGeneratedAt = generatedPdf.pdfGeneratedAt;
        }
        await this.notificationService.create(tenantId, null, {
            type: _notificationtypesenum.NotificationType.INVOICE_CREATED,
            title: `Рахунок ${invoice.invoiceNumber}`,
            body: `Надіслано рахунок ${invoice.invoiceNumber} на ${client.email}`,
            channel: _notificationtypesenum.NotificationChannel.EMAIL,
            priority: _notificationtypesenum.NotificationPriority.HIGH,
            userEmail: client.email,
            data: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                pdfUrl: invoice.pdfUrl,
                clientId: client.id,
                deliveryKind: "invoice"
            }
        });
        invoice.status = "sent";
        invoice.updatedBy = userId;
        invoice.metadata = {
            ...invoice.metadata || {},
            delivery: {
                status: "queued",
                channel: _notificationtypesenum.NotificationChannel.EMAIL,
                recipient: client.email,
                queuedAt: new Date().toISOString()
            }
        };
        return this.invoiceRepository.save(invoice);
    }
    /**
   * Generate invoice PDF
   */ async generatePdf(tenantId, id, dto) {
        const invoice = await this.findById(tenantId, id);
        const client = invoice.clientId ? await this.clientRepository.findOne({
            where: {
                id: invoice.clientId,
                tenantId,
                deletedAt: (0, _typeorm1.IsNull)()
            }
        }) : null;
        const uploadResult = await this.storageProviderService.upload({
            path: `tenants/${tenantId}/invoices/${invoice.id}/`,
            fileName: `${invoice.invoiceNumber}.pdf`,
            contentType: "application/pdf",
            buffer: this.buildInvoicePdfBuffer(invoice, client),
            metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber
            },
            isPublic: false
        });
        const pdfUrl = uploadResult.url;
        const pdfGeneratedAt = new Date();
        invoice.pdfUrl = pdfUrl;
        invoice.pdfGeneratedAt = pdfGeneratedAt;
        invoice.updatedBy = dto.userId;
        invoice.metadata = {
            ...invoice.metadata || {},
            pdf: {
                path: uploadResult.path,
                generatedAt: pdfGeneratedAt.toISOString(),
                generatedBy: dto.userId
            }
        };
        await this.invoiceRepository.save(invoice);
        return {
            pdfUrl,
            pdfGeneratedAt
        };
    }
    calculateInvoiceFinancials(dto) {
        const computedSubtotal = dto.subtotal ?? dto.items.reduce((sum, item)=>{
            const quantity = item.quantity ?? item.duration ?? 1;
            const unitPrice = item.unitPrice ?? 0;
            return sum + quantity * unitPrice;
        }, 0);
        const discountAmount = this.roundCurrency(computedSubtotal * ((dto.discountPercentage ?? 0) / 100));
        const vatBase = this.roundCurrency(computedSubtotal - discountAmount);
        const vatRate = dto.vatRate ?? 0;
        const vatAmount = dto.vatIncluded ? this.roundCurrency(vatBase - vatBase / (1 + vatRate || 1)) : this.roundCurrency(vatBase * vatRate);
        const totalAmount = dto.vatIncluded ? vatBase : this.roundCurrency(vatBase + vatAmount);
        return {
            subtotal: this.roundCurrency(computedSubtotal),
            discountAmount,
            vatAmount,
            totalAmount
        };
    }
    roundCurrency(value) {
        return Math.round((value + Number.EPSILON) * 100) / 100;
    }
    formatCurrencyLabel(currency) {
        const normalizedCurrency = String(currency || "").trim();
        if (!normalizedCurrency || normalizedCurrency.toUpperCase() === "UAH" || normalizedCurrency === "₴" || normalizedCurrency === "грн") {
            return "грн";
        }
        return normalizedCurrency.toUpperCase();
    }
    formatCurrencyValue(value, currency) {
        return `${this.roundCurrency(value ?? 0).toLocaleString("uk-UA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })} ${this.formatCurrencyLabel(currency)}`;
    }
    buildInvoicePdfBuffer(invoice, client) {
        const lines = [
            "Law Organizer Invoice",
            `Invoice Number: ${invoice.invoiceNumber}`,
            `Invoice Date: ${this.formatDate(invoice.invoiceDate)}`,
            `Due Date: ${this.formatDate(invoice.dueDate)}`,
            `Client: ${this.getClientLabel(client)}`,
            `Description: ${invoice.description || "-"}`,
            `Total: ${this.formatCurrencyValue(invoice.totalAmount, invoice.currency)}`,
            `Paid: ${this.formatCurrencyValue(invoice.paidAmount, invoice.currency)}`,
            `Outstanding: ${this.formatCurrencyValue((invoice.totalAmount ?? 0) - (invoice.paidAmount ?? 0), invoice.currency)}`
        ];
        return this.createSimplePdf(lines.join("\n"));
    }
    getClientLabel(client) {
        if (!client) {
            return "Unknown client";
        }
        return client.companyName || [
            client.lastName,
            client.firstName
        ].filter(Boolean).join(" ").trim() || client.email || client.id;
    }
    formatDate(value) {
        return value ? new Date(value).toISOString().slice(0, 10) : "-";
    }
    createSimplePdf(content) {
        const escapedContent = content.split("\n").map((line)=>`(${this.escapePdfText(line)}) Tj`).join(" T* ");
        const stream = `BT /F1 12 Tf 50 780 Td 14 TL ${escapedContent} ET`;
        const objects = [
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
            `<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}\nendstream`
        ];
        let pdf = "%PDF-1.4\n";
        const offsets = [
            0
        ];
        objects.forEach((object, index)=>{
            offsets.push(Buffer.byteLength(pdf, "utf8"));
            pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        });
        const startXref = Buffer.byteLength(pdf, "utf8");
        pdf += `xref
0 ${objects.length + 1}
0000000000 65535 f 
${offsets.slice(1).map((offset)=>`${String(offset).padStart(10, "0")} 00000 n `).join("\n")}
trailer
<< /Root 1 0 R /Size ${objects.length + 1} >>
startxref
${startXref}
%%EOF`;
        return Buffer.from(pdf, "utf8");
    }
    escapePdfText(value) {
        return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    }
    /**
   * Record payment
   */ async recordPayment(tenantId, id, userId, payment) {
        const invoice = await this.findById(tenantId, id);
        const paidAmount = invoice.paidAmount + payment.amount;
        const isFullyPaid = paidAmount >= invoice.totalAmount;
        invoice.paidAmount = paidAmount;
        invoice.paymentMethod = payment.method;
        invoice.paymentReference = payment.reference ?? "";
        invoice.paidAt = new Date();
        invoice.status = isFullyPaid ? "paid" : "partial";
        invoice.updatedBy = userId;
        return this.invoiceRepository.save(invoice);
    }
    /**
   * Generate invoice number
   */ async generateInvoiceNumber(tenantId) {
        const prefix = "INV";
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        // Get latest invoice number for this month/year
        const latest = await this.invoiceRepository.createQueryBuilder("invoice").select("invoice.invoiceNumber").where("invoice.tenantId = :tenantId AND invoice.invoiceNumber LIKE :pattern", {
            tenantId,
            pattern: `${prefix}-${year}-${month}-%`
        }).orderBy("invoice.invoiceNumber", "DESC").limit(1).getOne();
        let number = 1;
        if (latest) {
            const parts = latest.invoiceNumber.split("-");
            number = parseInt(parts[3]) + 1;
        }
        return `${prefix}-${year}-${month}-${String(number).padStart(4, "0")}`;
    }
    /**
   * Get invoice statistics
   */ async getStatistics(tenantId) {
        const now = new Date();
        const [total] = await this.invoiceRepository.createQueryBuilder("invoice").select("COUNT(*)").where("invoice.tenantId = :tenantId AND invoice.deletedAt IS NULL", {
            tenantId
        }).getRawMany();
        const [byStatus] = await this.invoiceRepository.createQueryBuilder("invoice").select("invoice.status", "COUNT(*) as count").where("invoice.tenantId = :tenantId AND invoice.deletedAt IS NULL", {
            tenantId
        }).groupBy("invoice.status").getRawMany();
        const [totalAmount] = await this.invoiceRepository.createQueryBuilder("invoice").select("SUM(invoice.totalAmount)").where("invoice.tenantId = :tenantId AND invoice.deletedAt IS NULL", {
            tenantId
        }).getRawMany();
        const [paidAmount] = await this.invoiceRepository.createQueryBuilder("invoice").select("SUM(invoice.paidAmount)").where("invoice.tenantId = :tenantId AND invoice.deletedAt IS NULL", {
            tenantId
        }).getRawMany();
        const outstandingAmount = (totalAmount[0].sum || 0) - (paidAmount[0].sum || 0);
        const [overdueCount] = await this.invoiceRepository.createQueryBuilder("invoice").select("COUNT(*)").where("invoice.tenantId = :tenantId AND " + "invoice.status != :paid AND " + "invoice.status != :cancelled AND " + "invoice.dueDate < :now AND " + "invoice.deletedAt IS NULL", {
            tenantId,
            paid: "paid",
            cancelled: now
        }).getRawMany();
        return {
            total: parseInt(total[0].count),
            totalAmount: totalAmount[0].sum || 0,
            paidAmount: paidAmount[0].sum || 0,
            outstandingAmount,
            overdueCount: parseInt(overdueCount[0].count),
            byStatus: byStatus.reduce((acc, row)=>{
                acc[row.status] = parseInt(row.count);
                return acc;
            }, {})
        };
    }
    constructor(invoiceRepository, clientRepository, storageProviderService, notificationService){
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.storageProviderService = storageProviderService;
        this.notificationService = notificationService;
    }
};
InvoiceService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_Invoiceentity.Invoice)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_Cliententity.Client)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _storageproviderservice.StorageProviderService === "undefined" ? Object : _storageproviderservice.StorageProviderService,
        typeof _notificationservice.NotificationService === "undefined" ? Object : _notificationservice.NotificationService
    ])
], InvoiceService);

//# sourceMappingURL=invoice.service.js.map