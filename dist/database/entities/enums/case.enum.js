/**
 * Case-related Enums
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
    get CasePriority () {
        return CasePriority;
    },
    get CaseStatus () {
        return CaseStatus;
    },
    get CaseType () {
        return CaseType;
    }
});
var CaseStatus = /*#__PURE__*/ function(CaseStatus) {
    CaseStatus["DRAFT"] = "draft";
    CaseStatus["ACTIVE"] = "active";
    CaseStatus["ON_HOLD"] = "on_hold";
    CaseStatus["CLOSED"] = "closed";
    CaseStatus["ARCHIVED"] = "archived";
    return CaseStatus;
}({});
var CasePriority = /*#__PURE__*/ function(CasePriority) {
    CasePriority["LOW"] = "low";
    CasePriority["MEDIUM"] = "medium";
    CasePriority["HIGH"] = "high";
    CasePriority["URGENT"] = "urgent";
    return CasePriority;
}({});
var CaseType = /*#__PURE__*/ function(CaseType) {
    CaseType["JUDICIAL_CASE"] = "judicial_case";
    CaseType["CRIMINAL_PROCEEDING"] = "criminal_proceeding";
    CaseType["ENFORCEMENT_PROCEEDING"] = "enforcement_proceeding";
    CaseType["CONTRACT_WORK"] = "contract_work";
    CaseType["CONSULTATION_CASE"] = "consultation_case";
    CaseType["CORPORATE_CASE"] = "corporate_case";
    CaseType["REGISTRATION_CASE"] = "registration_case";
    CaseType["ADMINISTRATIVE_APPEAL"] = "administrative_appeal";
    CaseType["MEDIATION_NEGOTIATION"] = "mediation_negotiation";
    CaseType["COMPLIANCE_AUDIT"] = "compliance_audit";
    return CaseType;
}({});

//# sourceMappingURL=case.enum.js.map