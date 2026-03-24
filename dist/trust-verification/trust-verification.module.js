"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrustVerificationModule", {
    enumerable: true,
    get: function() {
        return TrustVerificationModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _authmodule = require("../auth/auth.module");
const _DocumentSignatureentity = require("../database/entities/DocumentSignature.entity");
const _TrustVerificationJobentity = require("../database/entities/TrustVerificationJob.entity");
const _UserIdentityentity = require("../database/entities/UserIdentity.entity");
const _trustverificationcontroller = require("./controllers/trust-verification.controller");
const _trustverificationservice = require("./services/trust-verification.service");
const _trustverificationworkerservice = require("./services/trust-verification-worker.service");
const _trustprovideradapters = require("./services/trust-provider.adapters");
const _trustcallbackauthservice = require("./services/trust-callback-auth.service");
const _trustproviderregistry = require("./services/trust-provider.registry");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let TrustVerificationModule = class TrustVerificationModule {
};
TrustVerificationModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _UserIdentityentity.UserIdentity,
                _DocumentSignatureentity.DocumentSignature,
                _TrustVerificationJobentity.TrustVerificationJob
            ]),
            _authmodule.AuthModule
        ],
        controllers: [
            _trustverificationcontroller.TrustVerificationController
        ],
        providers: [
            _trustverificationservice.TrustVerificationService,
            _trustverificationworkerservice.TrustVerificationWorkerService,
            _trustproviderregistry.TrustProviderRegistry,
            _trustcallbackauthservice.TrustCallbackAuthService,
            _trustprovideradapters.AcskTrustProviderAdapter,
            _trustprovideradapters.DiiaTrustProviderAdapter,
            _trustprovideradapters.BankIdNbuTrustProviderAdapter,
            _trustprovideradapters.ManualTrustProviderAdapter
        ],
        exports: [
            _trustverificationservice.TrustVerificationService
        ]
    })
], TrustVerificationModule);

//# sourceMappingURL=trust-verification.module.js.map