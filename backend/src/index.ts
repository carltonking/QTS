import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import passport from "passport";
import type pino from "pino";
import { loadEnv, getEnv } from "./config/env";
import { createLogger } from "./lib/logger";
import { initSentry, setupSentryErrorHandler } from "./lib/sentry";
import { prisma } from "./lib/prisma";
import { respondMiddleware } from "./middleware/respond";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import problemRoutes from "./routes/problems";
import submissionRoutes from "./routes/submissions";
import chessRoutes from "./routes/chess";
import pokerRoutes from "./routes/poker";
import mathRoutes from "./routes/math";
import quantRoutes from "./routes/quant";
import leaderboardRoutes from "./routes/leaderboard";
import adminRoutes from "./routes/admin";
import { swaggerSpec } from "./config/swagger";
import "./config/oauth";

loadEnv();
initSentry();

const logger = createLogger();
const app = express();
const env = getEnv();
const port = env.PORT;

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(passport.initialize());

app.use((req, _res, next) => {
  req.log = logger.child({
    reqId: req.headers["x-request-id"] || crypto.randomUUID(),
  }) as unknown as pino.Logger;
  next();
});

app.use(respondMiddleware);

app.get("/health", async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    response.success({
      status: "ok",
      service: "qts-backend",
      uptime: process.uptime(),
      database: "connected",
    });
  } catch {
    response
      .status(503)
      .json({
        error: "Service unavailable",
        data: { status: "error", database: "disconnected" },
      });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/chess", chessRoutes);
app.use("/api/poker", pokerRoutes);
app.use("/api/math", mathRoutes);
app.use("/api/quant", quantRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

setupSentryErrorHandler(app);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(
    { port, corsOrigin: env.CORS_ORIGIN, nodeEnv: env.NODE_ENV },
    "QTS backend started",
  );
});
