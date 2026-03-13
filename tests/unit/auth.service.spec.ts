import { Test, TestingModule } from "@nestjs/testing";
import { AuthService } from "../../src/auth/services/auth.service";
import { JwtService } from "../../src/auth/services/jwt.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../../src/database/entities/User.entity";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

/**
 * Auth Service Unit Tests
 */
describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<Repository<User>>;
  let jwtService: JwtService;

  const mockUser = {
    id: "user-id",
    email: "test@example.com",
    passwordHash: "hashed-password",
    salt: "salt",
    tenantId: "tenant-id",
    role: "organization_owner",
    status: "active",
    organization: {
      id: "tenant-id",
      subscriptionPlan: "professional",
      subscriptionStatus: "trialing",
      name: "Test Org",
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            increment: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("login", () => {
    it("should login with valid credentials", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as any);

      const result = await service.login(
        { email: "test@example.com", password: "password" },
        "127.0.0.1",
        "Mozilla/5.0",
      );

      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw error for invalid credentials", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login(
          { email: "test@example.com", password: "wrong" },
          "127.0.0.1",
          "Mozilla/5.0",
        ),
      ).rejects.toThrow("Unauthorized");
    });

    it("should throw error for suspended account", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        status: "suspended",
      } as any);

      await expect(
        service.login(
          { email: "test@example.com", password: "password" },
          "127.0.0.1",
          "Mozilla/5.0",
        ),
      ).rejects.toThrow("Unauthorized");
    });

    it("should lock account after 5 failed attempts", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        failedLoginAttempts: 4,
      } as any);

      for (let i = 0; i < 5; i++) {
        try {
          await service.login(
            { email: "test@example.com", password: "wrong" },
            "127.0.0.1",
            "Mozilla/5.0",
          );
        } catch (error) {
          // Expected
        }
      }

      // Try login with correct password
      await expect(
        service.login(
          { email: "test@example.com", password: "password" },
          "127.0.0.1",
          "Mozilla/5.0",
        ),
      ).rejects.toThrow("заблоковано");
    });
  });

  describe("registerOrganization", () => {
    it("should register organization with admin user", async () => {
      const mockOrganization = {
        id: "org-id",
        name: "Test Org",
        subscriptionPlan: "basic",
      };

      const mockSubscription = {
        id: "sub-id",
      };

      userRepository.save.mockResolvedValue(mockUser as any);

      const result = await service.registerOrganization({
        name: "Test Org",
        legalForm: "llc",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
        password: "P@ssw0rd123!",
      });

      expect(result).toBeDefined();
      expect(result.organizationId).toBeDefined();
      expect(result.userId).toBeDefined();
    });

    it("should throw error for weak password", async () => {
      await expect(
        service.registerOrganization({
          name: "Test Org",
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          password: "weak",
        }),
      ).rejects.toThrow("Password too weak");
    });
  });

  describe("forgotPassword", () => {
    it("should send password reset email", async () => {
      userRepository.findOne.mockResolvedValue(mockUser as any);
      userRepository.update.mockResolvedValue({} as any);

      await service.forgotPassword({ email: "test@example.com" });

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        expect.objectContaining({
          passwordResetToken: expect.any(String),
          passwordResetExpiresAt: expect.any(Date),
        }),
      );
    });

    it("should not reveal if user exists", async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: "nonexistent@example.com" }),
      ).resolves.not.toThrow();
    });
  });

  describe("resetPassword", () => {
    it("should reset password with valid token", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        passwordResetToken: "valid-token",
        passwordResetExpiresAt: new Date(Date.now() + 3600000),
      } as any);

      await service.resetPassword({
        token: "valid-token",
        newPassword: "NewP@ssw0rd123!",
      });

      expect(userRepository.update).toHaveBeenCalledWith(
        { id: mockUser.id },
        expect.objectContaining({
          passwordResetToken: null,
          passwordResetExpiresAt: null,
        }),
      );
    });

    it("should throw error for expired token", async () => {
      userRepository.findOne.mockResolvedValue({
        ...mockUser,
        passwordResetToken: "expired-token",
        passwordResetExpiresAt: new Date(Date.now() - 3600000),
      } as any);

      await expect(
        service.resetPassword({
          token: "expired-token",
          newPassword: "NewP@ssw0rd123!",
        }),
      ).rejects.toThrow("Unauthorized");
    });
  });
});
