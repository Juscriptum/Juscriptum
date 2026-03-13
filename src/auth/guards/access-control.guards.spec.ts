import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  RequirePlan,
  REQUIRED_PLAN_KEY,
  Roles,
  ROLES_KEY,
} from "../decorators/access-control.decorators";
import { RbacGuard, SubscriptionGuard } from "./index";
import {
  SubscriptionPlan,
  UserRole,
} from "../../database/entities/enums/subscription.enum";

describe("Access control decorators", () => {
  it("should attach roles metadata", () => {
    class TestController {
      @Roles(UserRole.ORGANIZATION_OWNER, UserRole.LAWYER)
      handle() {}
    }

    const metadata = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.handle,
    );

    expect(metadata).toEqual([UserRole.ORGANIZATION_OWNER, UserRole.LAWYER]);
  });

  it("should attach required plan metadata", () => {
    class TestController {
      @RequirePlan(SubscriptionPlan.PROFESSIONAL)
      handle() {}
    }

    const metadata = Reflect.getMetadata(
      REQUIRED_PLAN_KEY,
      TestController.prototype.handle,
    );

    expect(metadata).toBe(SubscriptionPlan.PROFESSIONAL);
  });
});

describe("RbacGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new RbacGuard(reflector);

  function createContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => "handler",
      getClass: () => "class",
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow access when no role metadata is defined", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it("should allow access for matching role", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ORGANIZATION_OWNER,
    ]);

    expect(
      guard.canActivate(createContext({ role: UserRole.ORGANIZATION_OWNER })),
    ).toBe(true);
  });

  it("should reject missing user role", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ORGANIZATION_OWNER,
    ]);

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it("should reject user with insufficient role", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue([
      UserRole.ORGANIZATION_OWNER,
    ]);

    expect(() =>
      guard.canActivate(createContext({ role: UserRole.ASSISTANT })),
    ).toThrow(ForbiddenException);
  });
});

describe("SubscriptionGuard", () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const guard = new SubscriptionGuard(reflector);

  function createContext(user?: Record<string, unknown>): ExecutionContext {
    return {
      getHandler: () => "handler",
      getClass: () => "class",
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should allow access when no plan metadata is defined", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it("should allow access for sufficient plan", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(
      SubscriptionPlan.PROFESSIONAL,
    );

    expect(
      guard.canActivate(
        createContext({ subscription_plan: SubscriptionPlan.ENTERPRISE }),
      ),
    ).toBe(true);
  });

  it("should reject missing subscription plan", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(
      SubscriptionPlan.PROFESSIONAL,
    );

    expect(() => guard.canActivate(createContext())).toThrow(
      UnauthorizedException,
    );
  });

  it("should reject insufficient plan", () => {
    (reflector.getAllAndOverride as jest.Mock).mockReturnValue(
      SubscriptionPlan.PROFESSIONAL,
    );

    expect(() =>
      guard.canActivate(
        createContext({ subscription_plan: SubscriptionPlan.BASIC }),
      ),
    ).toThrow(ForbiddenException);
  });
});
