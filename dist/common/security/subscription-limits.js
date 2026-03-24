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
    get SUBSCRIPTION_LIMITS () {
        return SUBSCRIPTION_LIMITS;
    },
    get getPlanLevel () {
        return getPlanLevel;
    },
    get getSubscriptionLimits () {
        return getSubscriptionLimits;
    }
});
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
const SUBSCRIPTION_LIMITS = {
    [_subscriptionenum.SubscriptionPlan.BASIC]: {
        maxClients: 1,
        maxCases: 3,
        maxUsers: 1
    },
    [_subscriptionenum.SubscriptionPlan.PROFESSIONAL]: {
        maxClients: null,
        maxCases: null,
        maxUsers: 5
    },
    [_subscriptionenum.SubscriptionPlan.ENTERPRISE]: {
        maxClients: null,
        maxCases: null,
        maxUsers: null
    }
};
function getSubscriptionLimits(plan) {
    return SUBSCRIPTION_LIMITS[plan ?? _subscriptionenum.SubscriptionPlan.BASIC] ?? {
        maxClients: 1,
        maxCases: 3,
        maxUsers: 1
    };
}
function getPlanLevel(plan) {
    switch(plan){
        case _subscriptionenum.SubscriptionPlan.ENTERPRISE:
            return 3;
        case _subscriptionenum.SubscriptionPlan.PROFESSIONAL:
            return 2;
        case _subscriptionenum.SubscriptionPlan.BASIC:
        default:
            return 1;
    }
}

//# sourceMappingURL=subscription-limits.js.map