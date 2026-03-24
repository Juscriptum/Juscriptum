"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TrustProviderRegistry", {
    enumerable: true,
    get: function() {
        return TrustProviderRegistry;
    }
});
const _common = require("@nestjs/common");
const _trustprovideradapters = require("./trust-provider.adapters");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let TrustProviderRegistry = class TrustProviderRegistry {
    getProvider(provider) {
        const adapter = this.providers.get(provider);
        if (!adapter) {
            throw new Error(`Unsupported trust provider: ${provider}`);
        }
        return adapter;
    }
    constructor(acskAdapter, diiaAdapter, bankIdAdapter, manualAdapter){
        this.providers = new Map([
            [
                acskAdapter.provider,
                acskAdapter
            ],
            [
                diiaAdapter.provider,
                diiaAdapter
            ],
            [
                bankIdAdapter.provider,
                bankIdAdapter
            ],
            [
                manualAdapter.provider,
                manualAdapter
            ]
        ]);
    }
};
TrustProviderRegistry = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _trustprovideradapters.AcskTrustProviderAdapter === "undefined" ? Object : _trustprovideradapters.AcskTrustProviderAdapter,
        typeof _trustprovideradapters.DiiaTrustProviderAdapter === "undefined" ? Object : _trustprovideradapters.DiiaTrustProviderAdapter,
        typeof _trustprovideradapters.BankIdNbuTrustProviderAdapter === "undefined" ? Object : _trustprovideradapters.BankIdNbuTrustProviderAdapter,
        typeof _trustprovideradapters.ManualTrustProviderAdapter === "undefined" ? Object : _trustprovideradapters.ManualTrustProviderAdapter
    ])
], TrustProviderRegistry);

//# sourceMappingURL=trust-provider.registry.js.map