"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.mongoClient = void 0;
exports.connectDatabase = connectDatabase;
const mongodb_1 = require("mongodb");
exports.mongoClient = new mongodb_1.MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
exports.db = exports.mongoClient.db(process.env.MONGODB_DB || 'vila_waitlist');
async function connectDatabase() {
    await exports.mongoClient.connect();
    await exports.db
        .collection('registrations')
        .createIndex({ email: 1 }, { unique: true });
    await exports.db
        .collection('organizations')
        .createIndex({ type: 1, slug: 1 }, { unique: true });
    await exports.db
        .collection('sessions')
        .createIndex({ tokenHash: 1 }, { unique: true });
    await exports.db
        .collection('sessions')
        .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
