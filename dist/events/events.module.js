"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EventsModule", {
    enumerable: true,
    get: function() {
        return EventsModule;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _eventscontroller = require("./controllers/events.controller");
const _eventservice = require("./services/event.service");
const _Evententity = require("../database/entities/Event.entity");
const _Userentity = require("../database/entities/User.entity");
const _notificationsmodule = require("../notifications/notifications.module");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let EventsModule = class EventsModule {
};
EventsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _typeorm.TypeOrmModule.forFeature([
                _Evententity.Event,
                _Userentity.User
            ]),
            _notificationsmodule.NotificationsModule
        ],
        controllers: [
            _eventscontroller.EventsController
        ],
        providers: [
            _eventservice.EventService
        ],
        exports: [
            _eventservice.EventService
        ]
    })
], EventsModule);

//# sourceMappingURL=events.module.js.map