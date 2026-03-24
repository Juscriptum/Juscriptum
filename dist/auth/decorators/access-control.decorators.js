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
    get REQUIRED_PLAN_KEY () {
        return REQUIRED_PLAN_KEY;
    },
    get ROLES_KEY () {
        return ROLES_KEY;
    },
    get RequirePlan () {
        return RequirePlan;
    },
    get Roles () {
        return Roles;
    }
});
const _common = require("@nestjs/common");
const ROLES_KEY = "roles";
const REQUIRED_PLAN_KEY = "requiredPlan";
const Roles = (...roles)=>(0, _common.SetMetadata)(ROLES_KEY, roles);
const RequirePlan = (plan)=>(0, _common.SetMetadata)(REQUIRED_PLAN_KEY, plan);

//# sourceMappingURL=access-control.decorators.js.map