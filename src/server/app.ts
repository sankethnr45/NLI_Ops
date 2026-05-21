import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { chatRoutes } from "../routes/chat.routes.js";
import { operationalRoutes } from "../routes/operational.routes.js";
import { logger } from "../utils/logger.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((request, response, next) => {
    const start = Date.now();
    response.on("finish", () => {
      const duration = Date.now() - start;
      logger.info("HTTP Request completed", {
        category: "http",
        operation: "request",
        method: request.method,
        url: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: duration,
      });
    });
    next();
  });

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "nli-ops-assistant" });
  });

  app.use(chatRoutes);
  app.use("/api", operationalRoutes);

  app.use((error: Error, request: Request, response: Response, _next: NextFunction) => {
    logger.error("Unhandled error in request", error, {
      category: "http",
      operation: "error",
      method: request.method,
      url: request.originalUrl,
    });

    response.status(400).json({
      error: {
        message: error.message,
      },
    });
  });

  return app;
}
