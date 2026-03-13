import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";

/**
 * Auth Controller Integration Tests
 */
describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("should login with valid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "P@ssw0rd123!",
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.body.organization).toBeDefined();

      authToken = response.body.accessToken;
      userId = response.body.user.id;
    });

    it("should reject invalid email", async () => {
      return request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "invalid@example.com",
          password: "P@ssw0rd123!",
        })
        .expect(401);
    });

    it("should reject invalid password", async () => {
      return request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "wrong",
        })
        .expect(401);
    });

    it("should validate required fields", async () => {
      return request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({})
        .expect(400);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should refresh access token", async () => {
      const loginResponse = await request(app.getHttpServer())
        .post("/v1/auth/login")
        .send({
          email: "test@example.com",
          password: "P@ssw0rd123!",
        });

      const response = await request(app.getHttpServer())
        .post("/v1/auth/refresh")
        .send({
          refreshToken: loginResponse.body.refreshToken,
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
    });

    it("should reject invalid refresh token", async () => {
      return request(app.getHttpServer())
        .post("/v1/auth/refresh")
        .send({
          refreshToken: "invalid-token",
        })
        .expect(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("should logout user", async () => {
      const response = await request(app.getHttpServer())
        .post("/v1/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(204);

      expect(response.body).toEqual({});
    });

    it("should require authentication", async () => {
      return request(app.getHttpServer()).post("/v1/auth/logout").expect(401);
    });
  });

  describe("GET /auth/me", () => {
    it("should get current user", async () => {
      const response = await request(app.getHttpServer())
        .get("/v1/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user_id).toBe(userId);
      expect(response.body.tenant_id).toBeDefined();
      expect(response.body.role).toBeDefined();
    });

    it("should require authentication", async () => {
      return request(app.getHttpServer()).get("/v1/auth/me").expect(401);
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("should send password reset email", async () => {
      return request(app.getHttpServer())
        .post("/v1/auth/forgot-password")
        .send({
          email: "test@example.com",
        })
        .expect(204);
    });

    it("should validate email format", async () => {
      return request(app.getHttpServer())
        .post("/v1/auth/forgot-password")
        .send({
          email: "invalid-email",
        })
        .expect(400);
    });
  });

  describe("Rate Limiting", () => {
    it("should enforce rate limit on login", async () => {
      const requests = Array.from({ length: 6 }, () =>
        request(app.getHttpServer()).post("/v1/auth/login").send({
          email: "test@example.com",
          password: "wrong",
        }),
      );

      const responses = await Promise.all(requests);

      const blockedResponses = responses.filter((r) => r.status === 429);
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });
});
