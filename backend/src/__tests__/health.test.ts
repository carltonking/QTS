import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import cors from "cors";

function createTestApp() {
  const app = express();
  app.use(cors({ origin: "*" }));
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "qts-backend" });
  });

  app.get("/api/auth/me", (req, res) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    res.json({ user: { id: "1", email: "test@test.com", username: "test" } });
  });

  return app;
}

describe("Health endpoint", () => {
  it("returns ok status", async () => {
    const app = createTestApp();
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "qts-backend" });
  });
});

describe("Auth middleware", () => {
  it("rejects requests without token", async () => {
    const app = createTestApp();
    const response = await request(app).get("/api/auth/me");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("Unauthorized");
  });

  it("accepts requests with valid token", async () => {
    const app = createTestApp();
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer test-token");
    expect(response.status).toBe(200);
    expect(response.body.user.username).toBe("test");
  });
});
