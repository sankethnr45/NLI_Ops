import type { NextFunction, Request, Response } from "express";

import { runOperationalChat } from "../services/orchestration.service.js";

export async function postChatController(request: Request, response: Response, next: NextFunction) {
  try {
    const message = request.body?.message;

    if (typeof message !== "string") {
      throw new Error("message must be a string.");
    }

    const result = await runOperationalChat(message);

    response.json({
      response: result.response,
    });
  } catch (error) {
    next(error);
  }
}
