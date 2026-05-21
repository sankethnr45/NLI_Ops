import { Router } from "express";

import { postChatController } from "../controllers/chat.controller.js";

export const chatRoutes = Router();

chatRoutes.post("/chat", postChatController);
