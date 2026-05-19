// trigger restart
import { env } from "../config/env.js";
import { connectToMongo } from "../services/mongo.service.js";
import { createApp } from "./app.js";

async function bootstrap() {
  await connectToMongo();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`NLI ops assistant API listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
