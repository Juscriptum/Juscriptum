"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CalculationsModule", {
    enumerable: true,
    get: function() {
        return CalculationsModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _calculationcontroller = require("./controllers/calculation.controller");
const _calculationservice = require("./services/calculation.service");
const _entities = require("../database/entities");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CalculationsModule = class CalculationsModule {
};
CalculationsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _entities.Calculation,
                _entities.CalculationItem,
                _entities.PricelistItem,
                _entities.Case,
                _entities.Client
            ])
        ],
        controllers: [
            _calculationcontroller.CalculationsController
        ],
        providers: [
            _calculationservice.CalculationService
        ],
        exports: [
            _calculationservice.CalculationService
        ]
    })
], CalculationsModule);

//# sourceMappingURL=calculations.module.js.map