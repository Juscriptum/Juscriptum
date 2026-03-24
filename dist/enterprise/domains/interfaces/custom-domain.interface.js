/**
 * Custom Domain Configuration
 */ "use strict";
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
    get DNS_VERIFICATION_PREFIX () {
        return DNS_VERIFICATION_PREFIX;
    },
    get DOMAIN_NOT_FOUND () {
        return DOMAIN_NOT_FOUND;
    },
    get DOMAIN_NOT_VERIFIED () {
        return DOMAIN_NOT_VERIFIED;
    }
});
const DNS_VERIFICATION_PREFIX = "_law-organizer-verification";
const DOMAIN_NOT_FOUND = "DOMAIN_NOT_FOUND";
const DOMAIN_NOT_VERIFIED = "DOMAIN_NOT_VERIFIED";

//# sourceMappingURL=custom-domain.interface.js.map