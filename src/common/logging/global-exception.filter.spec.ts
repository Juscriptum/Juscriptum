import { ArgumentsHost, ForbiddenException, HttpStatus } from "@nestjs/common";
import { Request, Response } from "express";
import { GlobalExceptionFilter } from "./global-exception.filter";
import { LoggingService } from "./logging.service";

describe("GlobalExceptionFilter", () => {
  let filter: GlobalExceptionFilter;
  let logger: jest.Mocked<LoggingService>;
  let request: Partial<Request>;
  let response: Partial<Response>;

  beforeEach(() => {
    logger = {
      warn: jest.fn(),
      error: jest.fn(),
      logHttpRequest: jest.fn(),
      logSecurityEvent: jest.fn(),
    } as unknown as jest.Mocked<LoggingService>;

    filter = new GlobalExceptionFilter(logger);
    request = {
      method: "GET",
      path: "/v1/clients/123",
      headers: { "user-agent": "jest", "x-forwarded-for": "127.0.0.1" },
      socket: { remoteAddress: "127.0.0.1" } as any,
      tenantId: "tenant-1",
      userId: "user-1",
      userRole: "lawyer",
      startTime: Date.now() - 10,
    } as any;
    response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should emit a security event for tenant-context violations", () => {
    const host = {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ArgumentsHost;

    filter.catch(new ForbiddenException("Невірний tenant context"), host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(logger.logSecurityEvent).toHaveBeenCalledWith(
      "tenant_context_violation_detected",
      "high",
      expect.objectContaining({
        tenantId: "tenant-1",
        userId: "user-1",
        path: "/v1/clients/123",
      }),
    );
  });
});
