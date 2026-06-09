import { Router } from "express";
import { postChatController, postChatStreamController } from "../controllers/chat.controller.js";
export const chatRoutes = Router();
chatRoutes.post("/chat", postChatController);
chatRoutes.post("/chat/stream", postChatStreamController);
//# sourceMappingURL=chat.routes.js.map