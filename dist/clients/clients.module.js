"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ClientsModule", {
    enumerable: true,
    get: function() {
        return ClientsModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _clientscontroller = require("./controllers/clients.controller");
const _clientservice = require("./services/client.service");
const _courtregistryservice = require("./services/court-registry.service");
const _Cliententity = require("../database/entities/Client.entity");
const _Caseentity = require("../database/entities/Case.entity");
const _Evententity = require("../database/entities/Event.entity");
const _ClientNumberReleaseentity = require("../database/entities/ClientNumberRelease.entity");
const _Organizationentity = require("../database/entities/Organization.entity");
const _registryindexmodule = require("../registry-index/registry-index.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let ClientsModule = class ClientsModule {
};
ClientsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _Cliententity.Client,
                _Caseentity.Case,
                _Evententity.Event,
                _ClientNumberReleaseentity.ClientNumberRelease,
                _Organizationentity.Organization
            ]),
            _registryindexmodule.RegistryIndexModule
        ],
        controllers: [
            _clientscontroller.ClientsController
        ],
        providers: [
            _clientservice.ClientService,
            _courtregistryservice.CourtRegistryService
        ],
        exports: [
            _clientservice.ClientService,
            _courtregistryservice.CourtRegistryService
        ]
    })
], ClientsModule);

//# sourceMappingURL=clients.module.js.map