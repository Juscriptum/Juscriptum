import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";

/**
 * Tenant Isolation Tests
 */
describe("Tenant Isolation", () => {
  let app: INestApplication;
  let tenant1Token: string;
  let tenant2Token: string;
  let tenant1Id: string;
  let tenant2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create tenant 1
    const tenant1Response = await request(app.getHttpServer())
      .post("/v1/organizations/register")
      .send({
        name: "Tenant 1",
        email: "tenant1@example.com",
        firstName: "User",
        lastName: "One",
        password: "P@ssw0rd123!",
      });

    // Login as tenant 1
    const tenant1LoginResponse = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: "tenant1@example.com",
        password: "P@ssw0rd123!",
      });

    tenant1Token = tenant1LoginResponse.body.accessToken;
    tenant1Id = tenant1LoginResponse.body.organization.id;

    // Create tenant 2
    const tenant2Response = await request(app.getHttpServer())
      .post("/v1/organizations/register")
      .send({
        name: "Tenant 2",
        email: "tenant2@example.com",
        firstName: "User",
        lastName: "Two",
        password: "P@ssw0rd123!",
      });

    // Login as tenant 2
    const tenant2LoginResponse = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({
        email: "tenant2@example.com",
        password: "P@ssw0rd123!",
      });

    tenant2Token = tenant2LoginResponse.body.accessToken;
    tenant2Id = tenant2LoginResponse.body.organization.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Organization Access", () => {
    it("should return correct organization for tenant 1", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/organizations/me")
        .set("Authorization", `Bearer ${tenant1Token}`)
        .expect(200);

      expect(response.body.id).toBe(tenant1Id);
      expect(response.body.id).not.toBe(tenant2Id);
    });

    it("should return correct organization for tenant 2", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/organizations/me")
        .set("Authorization", `Bearer ${tenant2Token}`)
        .expect(200);

      expect(response.body.id).toBe(tenant2Id);
      expect(response.body.id).not.toBe(tenant1Id);
    });
  });

  describe("Data Isolation", () => {
    it("should prevent tenant 1 from accessing tenant 2 users", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/users")
        .set("Authorization", `Bearer ${tenant1Token}`)
        .expect(200);

      // Should only see users from tenant 1
      const tenant2Users = response.body.data.filter(
        (u: any) => u.tenantId === tenant2Id,
      );
      expect(tenant2Users).toHaveLength(0);
    });

    it("should prevent tenant 2 from accessing tenant 1 users", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/users")
        .set("Authorization", `Bearer ${tenant2Token}`)
        .expect(200);

      // Should only see users from tenant 2
      const tenant1Users = response.body.data.filter(
        (u: any) => u.tenantId === tenant1Id,
      );
      expect(tenant1Users).toHaveLength(0);
    });
  });

  describe("Subscription Isolation", () => {
    it("should return correct subscription for tenant 1", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/organizations/subscription")
        .set("Authorization", `Bearer ${tenant1Token}`)
        .expect(200);

      expect(response.body.tenantId).toBe(tenant1Id);
    });

    it("should return correct subscription for tenant 2", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/organizations/subscription")
        .set("Authorization", `Bearer ${tenant2Token}`)
        .expect(200);

      expect(response.body.tenantId).toBe(tenant2Id);
    });
  });

  describe("Audit Log Isolation", () => {
    it("should only show audit logs for current tenant", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/audit-logs")
        .set("Authorization", `Bearer ${tenant1Token}`)
        .expect(200);

      // All audit logs should belong to tenant 1
      const hasOtherTenantLogs = response.body.data.some(
        (log: any) => log.tenantId !== tenant1Id,
      );
      expect(hasOtherTenantLogs).toBe(false);
    });
  });
});
