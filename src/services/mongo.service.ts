import { MongoClient, type Collection, type Db, type Document, type Filter } from "mongodb";

import { env } from "../config/env.js";

export interface CursorLike<TDocument> {
  sort(sort: Record<string, 1 | -1>): CursorLike<TDocument>;
  toArray(): Promise<TDocument[]>;
}

export interface CollectionLike<TDocument extends Document = Document> {
  findOne(filter: Filter<TDocument>): Promise<TDocument | null>;
  find(filter: Filter<TDocument>): CursorLike<TDocument>;
}

export interface DatabaseLike {
  collection<TDocument extends Document = Document>(name: string): CollectionLike<TDocument>;
}

let client: MongoClient | null = null;
let database: Db | null = null;

export async function connectToMongo(): Promise<Db> {
  if (database) {
    return database;
  }

  client = new MongoClient(env.mongoUri);
  await client.connect();
  database = client.db(env.mongoDatabaseName);

  return database;
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error("MongoDB is not connected. Call connectToMongo before using database tools.");
  }

  return database;
}

export function getCollection<TDocument extends Document>(name: string): Collection<TDocument> {
  return getDatabase().collection<TDocument>(name);
}

export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close();
  }

  client = null;
  database = null;
}
