import { randomBytes, scrypt as scryptCallback, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { ObjectId } from 'mongodb';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../config/database';

const scrypt = promisify(scryptCallback);
const hours = 24 * 60 * 60 * 1000;
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64) as Buffer;
  return salt + ':' + hash.toString('hex');
}
export async function verifyPassword(password: string, saved: string) {
  const [salt, hex] = saved.split(':');
  if (!salt || !hex || !/^[a-f0-9]{128}$/.test(hex)) return false;
  const expected = Buffer.from(hex,'hex');
  const actual = await scrypt(password, salt, 64) as Buffer;
  return timingSafeEqual(expected,actual);
}
function digest(token:string) {return createHash('sha256').update(token).digest('hex');}
export async function createSession(userId:ObjectId) {
  const token=randomBytes(32).toString('hex');
  await db.collection('sessions').insertOne({ userId, tokenHash:digest(token), createdAt:new Date(), expiresAt:new Date(Date.now()+7*hours) });
  return token;
}
export async function findSession(token:string) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return db.collection('sessions').findOne({ tokenHash:digest(token), expiresAt:{$gt:new Date()} });
}
export async function ownerOnly(req:Request,res:Response,next:NextFunction) {
  const auth=req.get('authorization')||'';
  const token=auth.startsWith('Bearer ')?auth.slice(7):'';
  const session=await findSession(token);
  if (!session) return void res.status(401).json({error:'Sign in to manage your communities and groups'});
  res.locals.userId=session.userId as ObjectId;
  next();
}
export function sessionToken(req:Request) {
  const auth=req.get('authorization')||'';
  return auth.startsWith('Bearer ')?auth.slice(7):'';
}
export async function logout(token:string) {
  await db.collection('sessions').deleteOne({tokenHash:digest(token)});
}
