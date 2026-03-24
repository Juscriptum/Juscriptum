"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricelistsModule", {
    enumerable: true,
    get: function() {
        return PricelistsModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _pricelistcontroller = require("./controllers/pricelist.controller");
const _pricelistservice = require("./services/pricelist.service");
const _entities = require("../database/entities");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let PricelistsModule = class PricelistsModule {
};
PricelistsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _entities.Pricelist,
                _entities.PricelistCategory,
                _entities.PricelistItem
            ])
        ],
        controllers: [
            _pricelistcontroller.PricelistsController
        ],
        providers: [
            _pricelistservice.PricelistService
        ],
        exports: [
            _pricelistservice.PricelistService
        ]
    })
], PricelistsModule);

//# sourceMappingURL=pricelists.module.js.map