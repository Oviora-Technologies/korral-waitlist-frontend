"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.createSession = createSession;
exports.findSession = findSession;
exports.ownerOnly = ownerOnly;
exports.sessionToken = sessionToken;
exports.logout = logout;
const node_crypto_1 = require("node:crypto");
const node_util_1 = require("node:util");
const database_1 = require("../config/database");
const scrypt = (0, node_util_1.promisify)(node_crypto_1.scrypt);
const hours = 24 * 60 * 60 * 1000;
async function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const hash = (await scrypt(password, salt, 64));
    return salt + ':' + hash.toString('hex');
}
async function verifyPassword(password, saved) {
    const [salt, hex] = saved.split(':');
    if (!salt || !hex || !/^[a-f0-9]{128}$/.test(hex))
        return false;
    const expected = Buffer.from(hex, 'hex');
    const actual = (await scrypt(password, salt, 64));
    return (0, node_crypto_1.timingSafeEqual)(expected, actual);
}
function digest(token) {
    return (0, node_crypto_1.createHash)('sha256').update(token).digest('hex');
}
async function createSession(userId) {
    const token = (0, node_crypto_1.randomBytes)(32).toString('hex');
    await database_1.db
        .collection('sessions')
        .insertOne({
        userId,
        tokenHash: digest(token),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * hours),
    });
    return token;
}
async function findSession(token) {
    if (!/^[a-f0-9]{64}$/.test(token))
        return null;
    return database_1.db
        .collection('sessions')
        .findOne({ tokenHash: digest(token), expiresAt: { $gt: new Date() } });
}
async function ownerOnly(req, res, next) {
    const auth = req.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const session = await findSession(token);
    if (!session)
        return void res
            .status(401)
            .json({ error: 'Sign in to manage your communities and groups' });
    res.locals.userId = session.userId;
    next();
}
function sessionToken(req) {
    const auth = req.get('authorization') || '';
    return auth.startsWith('Bearer ') ? auth.slice(7) : '';
}
async function logout(token) {
    await database_1.db.collection('sessions').deleteOne({ tokenHash: digest(token) });
}
