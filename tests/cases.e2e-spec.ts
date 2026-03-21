import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request, { Response } from "supertest";
import { AppModule } from "../src/app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Case } from "../src/database/entities/Case.entity";
import { Client } from "../src/database/entities/Client.entity";
import { User } from "../src/database/entities/User.entity";
import { Organization } from "../src/database/entities/Organization.entity";
import {
  SubscriptionPlan,
  SubscriptionStatus,
  UserRole,
  UserStatus,
} from "../src/database/entities/enums/subscription.enum";
import { JwtService } from "@nestjs/jwt";

jest.setTimeout(20000);

describe("CasesController (e2e)", () => {
  let app: INestApplication;
  let caseRepository: Repository<Case>;
  let clientRepository: Repository<Client>;
  let userRepository: Repository<User>;
  let organizationRepository: Repository<Organization>;
  let jwtService: JwtService;

  let authToken: string;
  let tenantId: string;
  let userId: string;
  let clientId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );

    caseRepository = moduleFixture.get<Repository<Case>>(
      getRepositoryToken(Case),
    );
    clientRepository = moduleFixture.get<Repository<Client>>(
      getRepositoryToken(Client),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
    organizationRepository = moduleFixture.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Setup test data
    tenantId = "11111111-1111-4111-8111-111111111111";
    userId = "22222222-2222-4222-8222-222222222222";
    clientId = "33333333-3333-4333-8333-333333333333";

    // Create test organization
    await organizationRepository.save({
      id: tenantId,
      name: "E2E Test Organization",
      email: "e2e@test.com",
      subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      status: "active",
      settings: {},
      metadata: {},
    });

    // Create test user
    await userRepository.save({
      id: userId,
      email: "e2e@test.com",
      passwordHash: "hashed_password",
      salt: "test-salt",
      firstName: "Test",
      lastName: "User",
      role: UserRole.LAWYER,
      status: UserStatus.ACTIVE,
      tenantId,
    });

    // Create test client
    await clientRepository.save({
      id: clientId,
      tenantId,
      type: "legal_entity",
      companyName: 'ТОВ "E2E Test Client"',
      edrpou: "12345678",
      email: "client@e2e.test",
      phone: "+380441234567",
      status: "active",
      metadata: { client_number: "001" },
    });

    // Generate JWT token
    authToken = jwtService.sign({
      user_id: userId,
      email: "e2e@test.com",
      tenant_id: tenantId,
      role: UserRole.LAWYER,
      subscription_plan: SubscriptionPlan.PROFESSIONAL,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await caseRepository.delete({ tenantId });
    await clientRepository.delete({ tenantId });
    await userRepository.delete({ tenantId });
    await organizationRepository.delete({ id: tenantId });
    await app.close();
  });

  describe("/cases (POST)", () => {
    it("should create a new case", () => {
      return request(app.getHttpServer())
        .post("/cases")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          caseNumber: "manual-value-that-must-be-ignored",
          registryCaseNumber: "757/12345/23-ц",
          caseType: "judicial_case",
          clientId: clientId,
          assignedLawyerId: userId,
          priority: "medium",
          title: "E2E Test Case",
          description: "Test case description",
          courtName: "Печерський районний суд м. Києва",
          plaintiffName: 'ТОВ "Позивач"',
          defendantName: 'ТОВ "Відповідач"',
          estimatedAmount: 100000,
          courtFee: 2000,
        })
        .expect(201)
        .then((response: Response) => {
          expect(response.body.caseNumber).toBe("001/001");
          expect(response.body.registryCaseNumber).toBe("757/12345/23-ц");
          expect(response.body.caseType).toBe("judicial_case");
          expect(response.body.status).toBe("draft");
          expect(response.body.tenantId).toBe(tenantId);
        });
    });

    it("should validate required fields", () => {
      return request(app.getHttpServer())
        .post("/cases")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Missing required fields",
        })
        .expect(400);
    });

    it("should validate case type enum", () => {
      return request(app.getHttpServer())
        .post("/cases")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          caseNumber: "123/456/23",
          caseType: "invalid_type",
          clientId: clientId,
          assignedLawyerId: userId,
          priority: "medium",
        })
        .expect(400);
    });

    it("should accept Ukrainian parties", () => {
      return request(app.getHttpServer())
        .post("/cases")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          registryCaseNumber: "755/54321/21-к",
          caseType: "criminal_proceeding",
          clientId: clientId,
          assignedLawyerId: userId,
          priority: "urgent",
          plaintiffName: "Прокуратура м. Києва",
          defendantName: "Петренко Петро Петрович",
          thirdParties: "Сидоренко С.С., третя особа",
        })
        .expect(201)
        .then((response: Response) => {
          expect(response.body.caseNumber).toBe("001/002");
          expect(response.body.registryCaseNumber).toBe("755/54321/21-к");
          expect(response.body.plaintiffName).toBe("Прокуратура м. Києва");
          expect(response.body.defendantName).toBe("Петренко Петро Петрович");
        });
    });
  });

  describe("/cases (GET)", () => {
    beforeAll(async () => {
      // Create test cases
      const caseSeeds: Array<Partial<Case>> = [
        {
          tenantId,
          caseNumber: "757/10001/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "high",
          status: "active",
          title: "Active Case 1",
          courtName: "Суд 1",
          metadata: {},
        },
        {
          tenantId,
          caseNumber: "757/10002/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "medium",
          status: "closed",
          title: "Closed Case 2",
          courtName: "Суд 2",
          metadata: {},
        },
        {
          tenantId,
          caseNumber: "755/10003/21-к",
          caseType: "criminal_proceeding",
          clientId,
          assignedLawyerId: userId,
          priority: "urgent",
          status: "active",
          title: "Urgent Criminal Case",
          courtName: "Суд 3",
          metadata: {},
        },
      ];

      await caseRepository.save(
        caseSeeds.map((caseSeed) => caseRepository.create(caseSeed)),
      );
    });

    it("should return paginated cases", () => {
      return request(app.getHttpServer())
        .get("/cases")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          expect(response.body.data).toBeInstanceOf(Array);
          expect(response.body.total).toBeGreaterThan(0);
          expect(response.body.page).toBeDefined();
          expect(response.body.limit).toBeDefined();
        });
    });

    it("should filter by status", () => {
      return request(app.getHttpServer())
        .get("/cases?status=active")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          response.body.data.forEach((c: Case) => {
            expect(c.status).toBe("active");
          });
        });
    });

    it("should filter by case type", () => {
      return request(app.getHttpServer())
        .get("/cases?caseType=criminal_proceeding")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          response.body.data.forEach((c: Case) => {
            expect(c.caseType).toBe("criminal_proceeding");
          });
        });
    });

    it("should filter by client ID", () => {
      return request(app.getHttpServer())
        .get(`/cases?clientId=${clientId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          response.body.data.forEach((c: Case) => {
            expect(c.clientId).toBe(clientId);
          });
        });
    });

    it("should search by case number", () => {
      return request(app.getHttpServer())
        .get("/cases?search=757/10001")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    it("should support pagination", () => {
      return request(app.getHttpServer())
        .get("/cases?page=1&limit=2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          expect(response.body.limit).toBe(2);
          expect(response.body.page).toBe(1);
        });
    });
  });

  describe("/cases/:id (GET)", () => {
    let testCaseId: string;

    beforeAll(async () => {
      const testCase = await caseRepository.save(
        caseRepository.create({
          tenantId,
          caseNumber: "757/20001/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "medium",
          status: "active",
          title: "Test Case for Detail View",
          description: "Detailed description",
          courtName: "Печерський суд",
          judgeName: "Іванов І.І.",
          plaintiffName: "Позивач",
          defendantName: "Відповідач",
          metadata: {},
        }),
      );
      testCaseId = testCase.id;
    });

    it("should return case by ID", () => {
      return request(app.getHttpServer())
        .get(`/cases/${testCaseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          expect(response.body.id).toBe(testCaseId);
          expect(response.body.caseNumber).toBe("757/20001/23-ц");
          expect(response.body.client).toBeDefined();
        });
    });

    it("should return 404 for non-existent case", () => {
      return request(app.getHttpServer())
        .get("/cases/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("/cases/:id (PUT)", () => {
    let testCaseId: string;

    beforeAll(async () => {
      const testCase = await caseRepository.save(
        caseRepository.create({
          tenantId,
          caseNumber: "757/30001/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "low",
          status: "draft",
          title: "Case to Update",
          metadata: {},
        }),
      );
      testCaseId = testCase.id;
    });

    it("should update case fields", () => {
      return request(app.getHttpServer())
        .put(`/cases/${testCaseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Updated Title",
          priority: "high",
          proceedingStage: "appeal",
          courtFee: 5000,
        })
        .expect(200)
        .then((response: Response) => {
          expect(response.body.title).toBe("Updated Title");
          expect(response.body.priority).toBe("high");
        });
    });

    it("should update Ukrainian party names", () => {
      return request(app.getHttpServer())
        .put(`/cases/${testCaseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          plaintiffName: "Новий позивач",
          defendantName: "Новий відповідач",
          thirdParties: "Нові треті особи",
        })
        .expect(200)
        .then((response: Response) => {
          expect(response.body.plaintiffName).toBe("Новий позивач");
        });
    });
  });

  describe("/cases/:id/status (PUT)", () => {
    let testCaseId: string;

    beforeAll(async () => {
      const testCase = await caseRepository.save(
        caseRepository.create({
          tenantId,
          caseNumber: "757/40001/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "medium",
          status: "active",
          title: "Case for Status Change",
          metadata: {},
        }),
      );
      testCaseId = testCase.id;
    });

    it("should change case status", () => {
      return request(app.getHttpServer())
        .put(`/cases/${testCaseId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "on_hold" })
        .expect(200)
        .then((response: Response) => {
          expect(response.body.status).toBe("on_hold");
        });
    });

    it("should set end date when closing case", () => {
      return request(app.getHttpServer())
        .put(`/cases/${testCaseId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "closed" })
        .expect(200)
        .then((response: Response) => {
          expect(response.body.status).toBe("closed");
          expect(response.body.endDate).toBeDefined();
        });
    });
  });

  describe("/cases/:id (DELETE)", () => {
    let testCaseId: string;

    beforeAll(async () => {
      const testCase = await caseRepository.save(
        caseRepository.create({
          tenantId,
          caseNumber: "757/50001/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "medium",
          status: "active",
          title: "Case to Delete",
          metadata: {},
        }),
      );
      testCaseId = testCase.id;
    });

    it("should soft delete a case", () => {
      return request(app.getHttpServer())
        .delete(`/cases/${testCaseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);
    });

    it("should not return deleted case", () => {
      return request(app.getHttpServer())
        .get(`/cases/${testCaseId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe("/cases/statistics (GET)", () => {
    it("should return case statistics", () => {
      return request(app.getHttpServer())
        .get("/cases/statistics")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .then((response: Response) => {
          expect(response.body.total).toBeDefined();
          expect(response.body.byStatus).toBeDefined();
          expect(response.body.byType).toBeDefined();
          expect(response.body.activeCases).toBeDefined();
        });
    });
  });

  describe("Tenant Isolation", () => {
    let otherTenantToken: string;
    const otherTenantId = "44444444-4444-4444-8444-444444444444";

    beforeAll(async () => {
      // Create another organization and user
      await organizationRepository.save({
        id: otherTenantId,
        name: "Other Organization",
        email: "other@test.com",
        subscriptionPlan: SubscriptionPlan.BASIC,
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        status: "active",
        settings: {},
        metadata: {},
      });

      await userRepository.save({
        id: "55555555-5555-4555-8555-555555555555",
        email: "other@test.com",
        passwordHash: "hashed_password",
        salt: "test-salt",
        firstName: "Other",
        lastName: "User",
        role: UserRole.LAWYER,
        status: UserStatus.ACTIVE,
        tenantId: otherTenantId,
      });

      otherTenantToken = jwtService.sign({
        user_id: "55555555-5555-4555-8555-555555555555",
        email: "other@test.com",
        tenant_id: otherTenantId,
        role: UserRole.LAWYER,
        subscription_plan: SubscriptionPlan.BASIC,
      });
    });

    it("should not allow cross-tenant access", async () => {
      // Create case in original tenant
      const testCase = await caseRepository.save(
        caseRepository.create({
          tenantId,
          caseNumber: "757/90001/23-ц",
          caseType: "judicial_case",
          clientId,
          assignedLawyerId: userId,
          priority: "medium",
          status: "active",
          title: "Tenant Isolation Test",
          metadata: {},
        }),
      );

      // Try to access with other tenant's token
      return request(app.getHttpServer())
        .get(`/cases/${testCase.id}`)
        .set("Authorization", `Bearer ${otherTenantToken}`)
        .expect(404);
    });
  });

  describe("Authentication", () => {
    it("should reject requests without token", () => {
      return request(app.getHttpServer()).get("/cases").expect(401);
    });

    it("should reject invalid tokens", () => {
      return request(app.getHttpServer())
        .get("/cases")
        .set("Authorization", "Bearer invalid_token")
        .expect(401);
    });
  });
});
