"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "NotesModule", {
    enumerable: true,
    get: function() {
        return NotesModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _Caseentity = require("../database/entities/Case.entity");
const _Cliententity = require("../database/entities/Client.entity");
const _Noteentity = require("../database/entities/Note.entity");
const _Userentity = require("../database/entities/User.entity");
const _notescontroller = require("./controllers/notes.controller");
const _notesservice = require("./services/notes.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let NotesModule = class NotesModule {
};
NotesModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _Noteentity.Note,
                _Cliententity.Client,
                _Caseentity.Case,
                _Userentity.User
            ])
        ],
        controllers: [
            _notescontroller.NotesController
        ],
        providers: [
            _notesservice.NotesService
        ],
        exports: [
            _notesservice.NotesService
        ]
    })
], NotesModule);

//# sourceMappingURL=notes.module.js.map