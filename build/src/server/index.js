// trigger restart
import { env } from "../config/env.js";
import { connectToMongo } from "../services/mongo.service.js";
import { createApp } from "./app.js";
import { logger } from "../utils/logger.js";
async function bootstrap() {
    await connectToMongo();
    logger.info("MongoDB connected successfully", { category: "system", operation: "startup" });
    const app = createApp();
    app.listen(env.port, () => {
        logger.info("Server started", { category: "system", operation: "startup", port: env.port });
    });
}
bootstrap().catch((error) => {
    logger.error("Failed to start server", error, { category: "system", operation: "startup" });
    process.exit(1);
});
//# sourceMappingURL=index.js.map