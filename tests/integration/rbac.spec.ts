import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";

/**
 * RBAC Tests
 */
describe("RBAC", () => {
  let app: INestApplication;
  let ownerToken: string;
  let adminToken: string;
  let lawyerToken: string;
  let assistantToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Login as different roles
    const ownerLogin = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "owner@example.com", password: "P@ssw0rd123!" });
    ownerToken = ownerLogin.body.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "admin@example.com", password: "P@ssw0rd123!" });
    adminToken = adminLogin.body.accessToken;

    const lawyerLogin = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "lawyer@example.com", password: "P@ssw0rd123!" });
    lawyerToken = lawyerLogin.body.accessToken;

    const assistantLogin = await request(app.getHttpServer())
      .post("/v1/auth/login")
      .send({ email: "assistant@example.com", password: "P@ssw0rd123!" });
    assistantToken = assistantLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe("User Management", () => {
    it("should allow owner to create users", async () => {
      return request(app.getHttpServer())
        .post("/v1/users")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          email: "newuser@example.com",
          firstName: "New",
          lastName: "User",
          role: "lawyer",
        })
        .expect(201);
    });

    it("should allow admin to create users", async () => {
      return request(app.getHttpServer())
        .post("/v1/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          email: "newuser2@example.com",
          firstName: "New",
          lastName: "User",
          role: "lawyer",
        })
        .expect(201);
    });

    it("should prevent lawyer from creating users", async () => {
      return request(app.getHttpServer())
        .post("/v1/users")
        .set("Authorization", `Bearer ${lawyerToken}`)
        .send({
          email: "newuser3@example.com",
          firstName: "New",
          lastName: "User",
          role: "lawyer",
        })
        .expect(403);
    });

    it("should prevent assistant from creating users", async () => {
      return request(app.getHttpServer())
        .post("/v1/users")
        .set("Authorization", `Bearer ${assistantToken}`)
        .send({
          email: "newuser4@example.com",
          firstName: "New",
          lastName: "User",
          role: "lawyer",
        })
        .expect(403);
    });
  });

  describe("Organization Management", () => {
    it("should allow owner to delete organization", async () => {
      return request(app.getHttpServer())
        .delete("/v1/organizations/me")
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(204);
    });

    it("should prevent admin from deleting organization", async () => {
      return request(app.getHttpServer())
        .delete("/v1/organizations/me")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(403);
    });

    it("should prevent lawyer from deleting organization", async () => {
      return request(app.getHttpServer())
        .delete("/v1/organizations/me")
        .set("Authorization", `Bearer ${lawyerToken}`)
        .expect(403);
    });
  });

  describe("Billing Management", () => {
    it("should allow owner to access billing", async () => {
      return request(app.getHttpServer())
        .get("/v1/billing/subscription")
        .set("Authorization", `Bearer ${ownerToken}`)
        .expect(200);
    });

    it("should allow admin to access billing", async () => {
      return request(app.getHttpServer())
        .get("/v1/billing/subscription")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);
    });

    it("should prevent lawyer from accessing billing", async () => {
      return request(app.getHttpServer())
        .get("/v1/billing/subscription")
        .set("Authorization", `Bearer ${lawyerToken}`)
        .expect(403);
    });
  });

  describe("Case Management", () => {
    it("should allow owner to create cases", async () => {
      return request(app.getHttpServer())
        .post("/v1/cases")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          name: "Test Case",
          description: "Test description",
        })
        .expect(201);
    });

    it("should allow lawyer to create cases", async () => {
      return request(app.getHttpServer())
        .post("/v1/cases")
        .set("Authorization", `Bearer ${lawyerToken}`)
        .send({
          name: "Test Case",
          description: "Test description",
        })
        .expect(201);
    });

    it("should prevent assistant from creating cases", async () => {
      return request(app.getHttpServer())
        .post("/v1/cases")
        .set("Authorization", `Bearer ${assistantToken}`)
        .send({
          name: "Test Case",
          description: "Test description",
        })
        .expect(403);
    });
  });

  describe("Role Promotion/Demotion", () => {
    it("should allow owner to promote/demote users", async () => {
      return request(app.getHttpServer())
        .patch("/v1/users/user-id")
        .set("Authorization", `Bearer ${ownerToken}`)
        .send({
          role: "admin",
        })
        .expect(200);
    });

    it("should prevent admin from promoting other admins", async () => {
      return request(app.getHttpServer())
        .patch("/v1/users/user-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: "owner",
        })
        .expect(403);
    });
  });
});
