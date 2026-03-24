"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CasesModule", {
    enumerable: true,
    get: function() {
        return CasesModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _casescontroller = require("./controllers/cases.controller");
const _caseservice = require("./services/case.service");
const _caseregistrysyncservice = require("./services/case-registry-sync.service");
const _Caseentity = require("../database/entities/Case.entity");
const _Cliententity = require("../database/entities/Client.entity");
const _Organizationentity = require("../database/entities/Organization.entity");
const _Evententity = require("../database/entities/Event.entity");
const _clientsmodule = require("../clients/clients.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let CasesModule = class CasesModule {
};
CasesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _Caseentity.Case,
                _Cliententity.Client,
                _Organizationentity.Organization,
                _Evententity.Event
            ]),
            _clientsmodule.ClientsModule
        ],
        controllers: [
            _casescontroller.CasesController
        ],
        providers: [
            _caseservice.CaseService,
            _caseregistrysyncservice.CaseRegistrySyncService
        ],
        exports: [
            _caseservice.CaseService
        ]
    })
], CasesModule);

//# sourceMappingURL=cases.module.js.map