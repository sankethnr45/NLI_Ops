import { type Collection, type Db, type Document, type Filter } from "mongodb";
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
export declare function connectToMongo(): Promise<Db>;
export declare function getDatabase(): Db;
export declare function getCollection<TDocument extends Document>(name: string): Collection<TDocument>;
export declare function closeMongoConnection(): Promise<void>;
//# sourceMappingURL=mongo.service.d.ts.map