"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _jwtstrategy = require("./jwt.strategy");
describe("JwtStrategy", ()=>{
    const mockConfigService = {
        get: jest.fn().mockReturnValue("test-secret-key")
    };
    const mockUserRepository = {
        findOne: jest.fn()
    };
    const mockRevokedAccessTokenRepository = {
        findOne: jest.fn()
    };
    const basePayload = {
        user_id: "user-1",
        tenant_id: "tenant-1",
        role: "lawyer",
        subscription_plan: "basic",
        email: "stale@example.com",
        jti: "token-1",
        iat: Math.floor(new Date("2026-03-09T10:00:00.000Z").getTime() / 1000),
        exp: Math.floor(new Date("2026-03-09T10:15:00.000Z").getTime() / 1000)
    };
    let strategy;
    beforeEach(()=>{
        jest.clearAllMocks();
        strategy = new _jwtstrategy.JwtStrategy(mockConfigService, mockUserRepository, mockRevokedAccessTokenRepository);
        mockRevokedAccessTokenRepository.findOne.mockResolvedValue(null);
    });
    it("returns current role and subscription plan from the database", async ()=>{
        mockUserRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "current@example.com",
            role: "organization_admin",
            status: "active",
            lastPasswordChangeAt: null,
            organization: {
                subscriptionPlan: "enterprise"
            }
        });
        await expect(strategy.validate(basePayload)).resolves.toEqual({
            user_id: "user-1",
            tenant_id: "tenant-1",
            role: "organization_admin",
            subscription_plan: "enterprise",
            email: "current@example.com"
        });
        expect(mockUserRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                id: "user-1",
                tenantId: "tenant-1"
            }),
            relations: [
                "organization"
            ]
        }));
    });
    it("rejects missing users", async ()=>{
        mockUserRepository.findOne.mockResolvedValue(null);
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("User not found"));
    });
    it("rejects explicitly revoked access tokens", async ()=>{
        mockRevokedAccessTokenRepository.findOne.mockResolvedValue({
            id: "revoked-1"
        });
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("Access token has been revoked"));
    });
    it("rejects inactive users", async ()=>{
        mockUserRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "current@example.com",
            role: "lawyer",
            status: "suspended",
            lastPasswordChangeAt: null,
            organization: {
                subscriptionPlan: "basic"
            }
        });
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("User account is not active"));
    });
    it("rejects access tokens issued before the last password change", async ()=>{
        mockUserRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "current@example.com",
            role: "lawyer",
            status: "active",
            lastPasswordChangeAt: new Date("2026-03-09T10:05:00.000Z"),
            organization: {
                subscriptionPlan: "professional"
            }
        });
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("Access token is no longer valid after password change"));
    });
    it("rejects users without an organization relation", async ()=>{
        mockUserRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "current@example.com",
            role: "lawyer",
            status: "active",
            lastPasswordChangeAt: null,
            organization: null
        });
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("User organization not found"));
    });
    it("rejects suspended organizations", async ()=>{
        mockUserRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "current@example.com",
            role: "lawyer",
            status: "active",
            lastPasswordChangeAt: null,
            sessionInvalidBefore: null,
            organization: {
                subscriptionPlan: "basic",
                status: "suspended"
            }
        });
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("User organization is not active"));
    });
    it("rejects access tokens invalidated by session cutoff", async ()=>{
        mockUserRepository.findOne.mockResolvedValue({
            id: "user-1",
            tenantId: "tenant-1",
            email: "current@example.com",
            role: "lawyer",
            status: "active",
            lastPasswordChangeAt: null,
            sessionInvalidBefore: new Date("2026-03-09T10:05:00.000Z"),
            organization: {
                subscriptionPlan: "professional",
                status: "active"
            }
        });
        await expect(strategy.validate(basePayload)).rejects.toThrow(new _common.UnauthorizedException("Access token is no longer valid after session invalidation"));
    });
});

//# sourceMappingURL=jwt.strategy.spec.js.map