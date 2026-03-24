"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get HealthController () {
        return _healthcontroller.HealthController;
    },
    get HealthModule () {
        return _healthmodule.HealthModule;
    },
    get OperationalMonitoringService () {
        return _operationalmonitoringservice.OperationalMonitoringService;
    }
});
const _healthcontroller = require("./health.controller");
const _healthmodule = require("./health.module");
const _operationalmonitoringservice = require("./operational-monitoring.service");

//# sourceMappingURL=index.js.map