import pino from "pino";
import { getEnv } from "../config/env";

let _logger: ReturnType<typeof pino> | null = null;

export function createLogger() {
  if (_logger) return _logger;
  _logger = pino({
    level: process.env.LOG_LEVEL || "info",
    transport:
      getEnv().NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss" },
          }
        : undefined,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "body.password",
        "body.token",
      ],
      censor: "[REDACTED]",
    },
  });
  return _logger;
}

export function getLogger() {
  return _logger ?? createLogger();
}
