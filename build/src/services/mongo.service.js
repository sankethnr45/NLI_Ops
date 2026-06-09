import { MongoClient } from "mongodb";
import { env } from "../config/env.js";
let client = null;
let database = null;
export async function connectToMongo() {
    if (database) {
        return database;
    }
    client = new MongoClient(env.mongoUri);
    await client.connect();
    database = client.db(env.mongoDatabaseName);
    return database;
}
export function getDatabase() {
    if (!database) {
        throw new Error("MongoDB is not connected. Call connectToMongo before using database tools.");
    }
    return database;
}
export function getCollection(name) {
    return getDatabase().collection(name);
}
export async function closeMongoConnection() {
    if (client) {
        await client.close();
    }
    client = null;
    database = null;
}
//# sourceMappingURL=mongo.service.js.map