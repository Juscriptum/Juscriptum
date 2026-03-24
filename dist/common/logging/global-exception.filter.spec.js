"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _common = require("@nestjs/common");
const _globalexceptionfilter = require("./global-exception.filter");
describe("GlobalExceptionFilter", ()=>{
    let filter;
    let logger;
    let request;
    let response;
    beforeEach(()=>{
        logger = {
            warn: jest.fn(),
            error: jest.fn(),
            logHttpRequest: jest.fn(),
            logSecurityEvent: jest.fn()
        };
        filter = new _globalexceptionfilter.GlobalExceptionFilter(logger);
        request = {
            method: "GET",
            path: "/v1/clients/123",
            headers: {
                "user-agent": "jest",
                "x-forwarded-for": "127.0.0.1"
            },
            socket: {
                remoteAddress: "127.0.0.1"
            },
            tenantId: "tenant-1",
            userId: "user-1",
            userRole: "lawyer",
            startTime: Date.now() - 10
        };
        response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });
    it("should emit a security event for tenant-context violations", ()=>{
        const host = {
            switchToHttp: ()=>({
                    getRequest: ()=>request,
                    getResponse: ()=>response
                })
        };
        filter.catch(new _common.ForbiddenException("Невірний tenant context"), host);
        expect(response.status).toHaveBeenCalledWith(_common.HttpStatus.FORBIDDEN);
        expect(logger.logSecurityEvent).toHaveBeenCalledWith("tenant_context_violation_detected", "high", expect.objectContaining({
            tenantId: "tenant-1",
            userId: "user-1",
            path: "/v1/clients/123"
        }));
    });
});

//# sourceMappingURL=global-exception.filter.spec.js.map