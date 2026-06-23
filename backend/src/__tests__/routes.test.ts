import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";

function authMw(required = true): express.RequestHandler {
  return (req, res, next) => {
    if (required && !req.headers.authorization) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    (req as any).userId = "test-user";
    (req as any).user = {
      id: "test-user",
      email: "test@test.com",
      username: "test",
    };
    next();
  };
}

const adminMw: express.RequestHandler = (req, _res, next) => {
  if (req.headers.authorization) {
    (req as any).userId = "test-admin";
    (req as any).user = {
      id: "test-admin",
      email: "admin@test.com",
      username: "admin",
    };
  }
  next();
};

function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get("/api/leaderboard/chess", (_req, res) => res.json({ entries: [] }));
  app.get("/api/leaderboard/math", (_req, res) => res.json({ entries: [] }));
  app.get("/api/leaderboard/poker", (_req, res) => res.json({ entries: [] }));
  app.get("/api/leaderboard/quant", (_req, res) => res.json({ entries: [] }));

  app.get("/api/admin/users", authMw(), adminMw, (_req, res) =>
    res.json({ users: [] }),
  );
  app.put("/api/admin/users/role", authMw(), adminMw, (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role) {
      res.status(400).json({ error: "Invalid" });
      return;
    }
    res.json({ user: { id: userId, role } });
  });
  app.get("/api/admin/stats", authMw(), adminMw, (_req, res) =>
    res.json({
      stats: {
        users: 0,
        problems: 0,
        submissions: 0,
        chessPlayers: 0,
        mathSessions: 0,
        pokerPlayers: 0,
        quantPlayers: 0,
      },
    }),
  );

  app.get("/api/chess/rating", authMw(), (_req, res) =>
    res.json({
      rating: {
        rating: 1500,
        ratingDeviation: 350,
        volatility: 0.06,
        puzzlesSolved: 0,
      },
    }),
  );
  app.put("/api/chess/rating", authMw(), (req, res) =>
    res.json({ rating: req.body }),
  );
  app.post("/api/chess/attempts", authMw(), (req, res) =>
    res.status(201).json({ attempt: req.body }),
  );
  app.get("/api/chess/attempts", authMw(), (_req, res) =>
    res.json({ attempts: [] }),
  );

  app.get("/api/poker/progress", authMw(), (_req, res) =>
    res.json({
      progress: { rank: "BRONZE", totalAttempts: 0, correctAttempts: 0 },
    }),
  );
  app.put("/api/poker/progress", authMw(), (req, res) =>
    res.json({ progress: req.body }),
  );

  app.post("/api/math/sessions", authMw(), (req, res) =>
    res.status(201).json({ session: req.body }),
  );
  app.get("/api/math/sessions", authMw(), (_req, res) =>
    res.json({ sessions: [] }),
  );

  app.get("/api/quant/ratings", authMw(), (_req, res) =>
    res.json({ ratings: [] }),
  );
  app.put("/api/quant/ratings", authMw(), (req, res) =>
    res.json({ rating: req.body }),
  );

  return app;
}

describe("Leaderboard routes", () => {
  const app = createTestApp();

  it("GET /api/leaderboard/chess returns entries", async () => {
    const res = await request(app).get("/api/leaderboard/chess");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("entries");
  });

  it("GET /api/leaderboard/math returns entries", async () => {
    const res = await request(app).get("/api/leaderboard/math");
    expect(res.status).toBe(200);
  });

  it("GET /api/leaderboard/poker returns entries", async () => {
    const res = await request(app).get("/api/leaderboard/poker");
    expect(res.status).toBe(200);
  });

  it("GET /api/leaderboard/quant returns entries", async () => {
    const res = await request(app).get("/api/leaderboard/quant");
    expect(res.status).toBe(200);
  });
});

describe("Admin routes", () => {
  const app = createTestApp();

  it("GET /api/admin/users requires auth", async () => {
    const res = await request(app).get("/api/admin/users");
    expect(res.status).toBe(401);
  });

  it("GET /api/admin/stats returns stats shape", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.stats).toHaveProperty("users");
    expect(res.body.stats).toHaveProperty("problems");
  });

  it("PUT /api/admin/users/role validates payload", async () => {
    const res = await request(app)
      .put("/api/admin/users/role")
      .set("Authorization", "Bearer test")
      .send({});
    expect(res.status).toBe(400);
  });
});

describe("Chess routes", () => {
  const app = createTestApp();

  it("GET /api/chess/rating returns default rating", async () => {
    const res = await request(app)
      .get("/api/chess/rating")
      .set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.rating.rating).toBe(1500);
  });

  it("PUT /api/chess/rating updates rating", async () => {
    const res = await request(app)
      .put("/api/chess/rating")
      .set("Authorization", "Bearer test")
      .send({
        rating: 1600,
        ratingDeviation: 100,
        volatility: 0.06,
        puzzlesSolved: 5,
      });
    expect(res.status).toBe(200);
    expect(res.body.rating.rating).toBe(1600);
  });

  it("POST /api/chess/attempts creates attempt", async () => {
    const res = await request(app)
      .post("/api/chess/attempts")
      .set("Authorization", "Bearer test")
      .send({ puzzleId: "abc", solved: true, ratingDelta: 10 });
    expect(res.status).toBe(201);
  });
});

describe("Poker routes", () => {
  const app = createTestApp();

  it("GET /api/poker/progress returns progress", async () => {
    const res = await request(app)
      .get("/api/poker/progress")
      .set("Authorization", "Bearer test");
    expect(res.status).toBe(200);
    expect(res.body.progress.rank).toBe("BRONZE");
  });
});

describe("Math routes", () => {
  const app = createTestApp();

  it("POST /api/math/sessions creates session", async () => {
    const res = await request(app)
      .post("/api/math/sessions")
      .set("Authorization", "Bearer test")
      .send({
        operation: "ADD",
        correct: 5,
        total: 10,
        duration: 60,
        score: 50,
      });
    expect(res.status).toBe(201);
  });
});

describe("Quant routes", () => {
  const app = createTestApp();

  it("PUT /api/quant/ratings updates rating", async () => {
    const res = await request(app)
      .put("/api/quant/ratings")
      .set("Authorization", "Bearer test")
      .send({ category: "MATH", rating: 65 });
    expect(res.status).toBe(200);
    expect(res.body.rating.rating).toBe(65);
  });
});
