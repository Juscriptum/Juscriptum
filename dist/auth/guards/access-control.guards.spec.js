"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _accesscontroldecorators = require("../decorators/access-control.decorators");
const _index = require("./index");
const _subscriptionenum = require("../../database/entities/enums/subscription.enum");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
describe("Access control decorators", ()=>{
    it("should attach roles metadata", ()=>{
        let TestController = class TestController {
            handle() {}
        };
        _ts_decorate([
            (0, _accesscontroldecorators.Roles)(_subscriptionenum.UserRole.ORGANIZATION_OWNER, _subscriptionenum.UserRole.LAWYER),
            _ts_metadata("design:type", Function),
            _ts_metadata("design:paramtypes", []),
            _ts_metadata("design:returntype", void 0)
        ], TestController.prototype, "handle", null);
        const metadata = Reflect.getMetadata(_accesscontroldecorators.ROLES_KEY, TestController.prototype.handle);
        expect(metadata).toEqual([
            _subscriptionenum.UserRole.ORGANIZATION_OWNER,
            _subscriptionenum.UserRole.LAWYER
        ]);
    });
    it("should attach required plan metadata", ()=>{
        let TestController = class TestController {
            handle() {}
        };
        _ts_decorate([
            (0, _accesscontroldecorators.RequirePlan)(_subscriptionenum.SubscriptionPlan.PROFESSIONAL),
            _ts_metadata("design:type", Function),
            _ts_metadata("design:paramtypes", []),
            _ts_metadata("design:returntype", void 0)
        ], TestController.prototype, "handle", null);
        const metadata = Reflect.getMetadata(_accesscontroldecorators.REQUIRED_PLAN_KEY, TestController.prototype.handle);
        expect(metadata).toBe(_subscriptionenum.SubscriptionPlan.PROFESSIONAL);
    });
});
describe("RbacGuard", ()=>{
    const reflector = {
        getAllAndOverride: jest.fn()
    };
    const guard = new _index.RbacGuard(reflector);
    function createContext(user) {
        return {
            getHandler: ()=>"handler",
            getClass: ()=>"class",
            switchToHttp: ()=>({
                    getRequest: ()=>({
                            user
                        })
                })
        };
    }
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    it("should allow access when no role metadata is defined", ()=>{
        reflector.getAllAndOverride.mockReturnValue(undefined);
        expect(guard.canActivate(createContext())).toBe(true);
    });
    it("should allow access for matching role", ()=>{
        reflector.getAllAndOverride.mockReturnValue([
            _subscriptionenum.UserRole.ORGANIZATION_OWNER
        ]);
        expect(guard.canActivate(createContext({
            role: _subscriptionenum.UserRole.ORGANIZATION_OWNER
        }))).toBe(true);
    });
    it("should reject missing user role", ()=>{
        reflector.getAllAndOverride.mockReturnValue([
            _subscriptionenum.UserRole.ORGANIZATION_OWNER
        ]);
        expect(()=>guard.canActivate(createContext())).toThrow(_common.UnauthorizedException);
    });
    it("should reject user with insufficient role", ()=>{
        reflector.getAllAndOverride.mockReturnValue([
            _subscriptionenum.UserRole.ORGANIZATION_OWNER
        ]);
        expect(()=>guard.canActivate(createContext({
                role: _subscriptionenum.UserRole.ASSISTANT
            }))).toThrow(_common.ForbiddenException);
    });
});
describe("SubscriptionGuard", ()=>{
    const reflector = {
        getAllAndOverride: jest.fn()
    };
    const guard = new _index.SubscriptionGuard(reflector);
    function createContext(user) {
        return {
            getHandler: ()=>"handler",
            getClass: ()=>"class",
            switchToHttp: ()=>({
                    getRequest: ()=>({
                            user
                        })
                })
        };
    }
    beforeEach(()=>{
        jest.clearAllMocks();
    });
    it("should allow access when no plan metadata is defined", ()=>{
        reflector.getAllAndOverride.mockReturnValue(undefined);
        expect(guard.canActivate(createContext())).toBe(true);
    });
    it("should allow access for sufficient plan", ()=>{
        reflector.getAllAndOverride.mockReturnValue(_subscriptionenum.SubscriptionPlan.PROFESSIONAL);
        expect(guard.canActivate(createContext({
            subscription_plan: _subscriptionenum.SubscriptionPlan.ENTERPRISE
        }))).toBe(true);
    });
    it("should reject missing subscription plan", ()=>{
        reflector.getAllAndOverride.mockReturnValue(_subscriptionenum.SubscriptionPlan.PROFESSIONAL);
        expect(()=>guard.canActivate(createContext())).toThrow(_common.UnauthorizedException);
    });
    it("should reject insufficient plan", ()=>{
        reflector.getAllAndOverride.mockReturnValue(_subscriptionenum.SubscriptionPlan.PROFESSIONAL);
        expect(()=>guard.canActivate(createContext({
                subscription_plan: _subscriptionenum.SubscriptionPlan.BASIC
            }))).toThrow(_common.ForbiddenException);
    });
});

//# sourceMappingURL=access-control.guards.spec.js.map