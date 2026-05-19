import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { operationalRoutes } from "../routes/operational.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "nli-ops-assistant" });
  });

  app.use("/api", operationalRoutes);

  app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
    console.error(error);

    response.status(400).json({
      error: {
        message: error.message,
      },
    });
  });

  return app;
}
