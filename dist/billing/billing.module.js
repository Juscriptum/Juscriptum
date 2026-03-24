"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BillingModule", {
    enumerable: true,
    get: function() {
        return BillingModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _config = require("@nestjs/config");
const _Subscriptionentity = require("../database/entities/Subscription.entity");
const _Organizationentity = require("../database/entities/Organization.entity");
const _billingservice = require("./services/billing.service");
const _stripeservice = require("./services/stripe.service");
const _wayforpayservice = require("./services/wayforpay.service");
const _billingtypes = require("./services/billing.types");
const _billingcontroller = require("./controllers/billing.controller");
const _billingwebhookscontroller = require("./controllers/billing-webhooks.controller");
const _authmodule = require("../auth/auth.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let BillingModule = class BillingModule {
};
BillingModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _Subscriptionentity.Subscription,
                _Organizationentity.Organization
            ]),
            _config.ConfigModule,
            (0, _common.forwardRef)(()=>_authmodule.AuthModule)
        ],
        controllers: [
            _billingcontroller.BillingController,
            _billingwebhookscontroller.BillingWebhooksController
        ],
        providers: [
            _billingservice.BillingService,
            _stripeservice.StripeService,
            _wayforpayservice.WayForPayService,
            {
                provide: _billingtypes.BILLING_SYNC_PORT,
                useExisting: _billingservice.BillingService
            }
        ],
        exports: [
            _billingservice.BillingService,
            _stripeservice.StripeService,
            _wayforpayservice.WayForPayService
        ]
    })
], BillingModule);

//# sourceMappingURL=billing.module.js.map