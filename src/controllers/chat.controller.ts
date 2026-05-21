import type { NextFunction, Request, Response } from "express";

import { runOperationalChat, streamOperationalChat } from "../services/orchestration.service.js";

function writeSseEvent(response: Response, event: string, data: Record<string, unknown>) {
  response.write(`event: ${event}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

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

export async function postChatStreamController(request: Request, response: Response, next: NextFunction) {
  try {
    const message = request.body?.message;

    if (typeof message !== "string") {
      throw new Error("message must be a string.");
    }

    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache");
    response.setHeader("Connection", "keep-alive");
    response.flushHeaders();

    for await (const streamEvent of streamOperationalChat(message)) {
      writeSseEvent(response, streamEvent.event, streamEvent.data);
    }

    response.end();
  } catch (error) {
    if (response.headersSent) {
      writeSseEvent(response, "error", {
        message: error instanceof Error ? error.message : "Unknown streaming error.",
      });
      response.end();
      return;
    }

    next(error);
  }
}
