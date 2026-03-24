"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get CreateInvoiceDto () {
        return CreateInvoiceDto;
    },
    get CreateInvoiceItemDto () {
        return CreateInvoiceItemDto;
    },
    get GenerateInvoicePdfDto () {
        return GenerateInvoicePdfDto;
    },
    get InvoiceFiltersDto () {
        return InvoiceFiltersDto;
    },
    get RecordPaymentDto () {
        return RecordPaymentDto;
    },
    get UpdateInvoiceDto () {
        return UpdateInvoiceDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _Invoiceentity = require("../../database/entities/Invoice.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateInvoiceDto = class CreateInvoiceDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "invoiceDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "dueDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "hourly",
        "fixed",
        "piecewise"
    ]),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "unitType", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreateInvoiceDto.prototype, "subtotal", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreateInvoiceDto.prototype, "discountPercentage", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreateInvoiceDto.prototype, "vatRate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], CreateInvoiceDto.prototype, "vatIncluded", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>CreateInvoiceItemDto),
    _ts_metadata("design:type", Array)
], CreateInvoiceDto.prototype, "items", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "internalNotes", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateInvoiceDto.prototype, "clientNotes", void 0);
let CreateInvoiceItemDto = class CreateInvoiceItemDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateInvoiceItemDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateInvoiceItemDto.prototype, "pricelistItemId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateInvoiceItemDto.prototype, "code", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreateInvoiceItemDto.prototype, "quantity", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreateInvoiceItemDto.prototype, "duration", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreateInvoiceItemDto.prototype, "unitPrice", void 0);
let UpdateInvoiceDto = class UpdateInvoiceDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", String)
], UpdateInvoiceDto.prototype, "invoiceDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDate)(),
    _ts_metadata("design:type", String)
], UpdateInvoiceDto.prototype, "dueDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateInvoiceDto.prototype, "description", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "draft",
        "sent",
        "viewed",
        "paid",
        "overdue",
        "cancelled"
    ]),
    _ts_metadata("design:type", typeof _Invoiceentity.InvoiceStatus === "undefined" ? Object : _Invoiceentity.InvoiceStatus)
], UpdateInvoiceDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], UpdateInvoiceDto.prototype, "internalNotes", void 0);
let InvoiceFiltersDto = class InvoiceFiltersDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], InvoiceFiltersDto.prototype, "clientId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        "draft",
        "sent",
        "viewed",
        "paid",
        "overdue",
        "cancelled"
    ]),
    _ts_metadata("design:type", typeof _Invoiceentity.InvoiceStatus === "undefined" ? Object : _Invoiceentity.InvoiceStatus)
], InvoiceFiltersDto.prototype, "status", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], InvoiceFiltersDto.prototype, "invoiceDateFrom", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], InvoiceFiltersDto.prototype, "invoiceDateTo", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], InvoiceFiltersDto.prototype, "search", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], InvoiceFiltersDto.prototype, "sortBy", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], InvoiceFiltersDto.prototype, "sortOrder", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], InvoiceFiltersDto.prototype, "page", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata("design:type", Number)
], InvoiceFiltersDto.prototype, "limit", void 0);
let GenerateInvoicePdfDto = class GenerateInvoicePdfDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], GenerateInvoicePdfDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], GenerateInvoicePdfDto.prototype, "sendEmail", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata("design:type", Boolean)
], GenerateInvoicePdfDto.prototype, "sendSms", void 0);
let RecordPaymentDto = class RecordPaymentDto {
};
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], RecordPaymentDto.prototype, "amount", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)([
        "cash",
        "card",
        "bank_transfer",
        "wayforpay"
    ]),
    _ts_metadata("design:type", typeof _Invoiceentity.PaymentMethod === "undefined" ? Object : _Invoiceentity.PaymentMethod)
], RecordPaymentDto.prototype, "method", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], RecordPaymentDto.prototype, "reference", void 0);

//# sourceMappingURL=invoice.dto.js.map