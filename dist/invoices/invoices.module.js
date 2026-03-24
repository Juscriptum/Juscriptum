"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InvoicesModule", {
    enumerable: true,
    get: function() {
        return InvoicesModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _invoicescontroller = require("./controllers/invoices.controller");
const _invoiceservice = require("./services/invoice.service");
const _Invoiceentity = require("../database/entities/Invoice.entity");
const _Cliententity = require("../database/entities/Client.entity");
const _filestoragemodule = require("../file-storage/file-storage.module");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let InvoicesModule = class InvoicesModule {
};
InvoicesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _Invoiceentity.Invoice,
                _Cliententity.Client
            ]),
            _filestoragemodule.FileStorageModule,
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _invoicescontroller.InvoicesController
        ],
        providers: [
            _invoiceservice.InvoiceService
        ],
        exports: [
            _invoiceservice.InvoiceService
        ]
    })
], InvoicesModule);

//# sourceMappingURL=invoices.module.js.map