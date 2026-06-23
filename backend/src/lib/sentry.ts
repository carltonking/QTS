import * as Sentry from "@sentry/node";
import { expressIntegration, setupExpressErrorHandler } from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import type { Express } from "express";
import { getEnv } from "../config/env";

export function initSentry() {
  const env = getEnv();

  if (env.NODE_ENV !== "production" || !env.SENTRY_DSN) {
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    integrations: [nodeProfilingIntegration(), expressIntegration()],
    tracesSampleRate: 0.2,
    profilesSampleRate: 0.2,
  });
}

export function setupSentryErrorHandler(app: Express) {
  setupExpressErrorHandler(app);
}

export { Sentry };
