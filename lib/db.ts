/**
 * Storage abstraction:
 * - Local dev  : data/links.json
 * - Production : Upstash Redis (KV_REST_API_URL + KV_REST_API_TOKEN)
 *
 * Structure Redis :
 *   link:{shortCode}          → ShortLink object
 *   userlinks:{userId}        → Set of shortCodes appartenant à l'utilisateur
 */

import { Redis } from '@upstash/redis';
import { ShortLink } from './types';
import fs from 'fs';
import path from 'path';

// ─── Redis client ─────────────────────────────────────────────────────────────

let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

// ─── File storage (dev fallback) ──────────────────────────────────────────────

const DATA_FILE = path.join(process.cwd(), 'data', 'links.json');

function readFile(): Record<string, ShortLink> {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeFile(data: Record<string, ShortLink>) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Récupère tous les liens d'un utilisateur */
export async function dbGetAll(userId: string): Promise<ShortLink[]> {
  const redis = getRedis();
  if (redis) {
    const codes = (await redis.smembers(`userlinks:${userId}`)) as string[];
    if (!codes.length) return [];
    const links = await Promise.all(
      codes.map((c) => redis.get(`link:${c}`) as Promise<ShortLink | null>)
    );
    return (links.filter(Boolean) as ShortLink[]).sort(
      (a, b) => b.createdAt - a.createdAt
    );
  }
  return Object.values(readFile())
    .filter((l) => l.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Récupère un lien par son code court (public — pour la redirection) */
export async function dbGet(code: string): Promise<ShortLink | null> {
  const redis = getRedis();
  if (redis) return redis.get(`link:${code}`) as Promise<ShortLink | null>;
  return readFile()[code] ?? null;
}

/** Sauvegarde un lien */
export async function dbSave(link: ShortLink): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`link:${link.shortCode}`, link);
    await redis.sadd(`userlinks:${link.userId}`, link.shortCode);
    return;
  }
  const data = readFile();
  data[link.shortCode] = link;
  writeFile(data);
}

/** Supprime un lien */
export async function dbDelete(code: string, userId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`link:${code}`);
    await redis.srem(`userlinks:${userId}`, code);
    return;
  }
  const data = readFile();
  delete data[code];
  writeFile(data);
}

/** Enregistre un clic */
export async function dbRecordClick(
  code: string,
  referer?: string
): Promise<void> {
  const link = await dbGet(code);
  if (!link) return;
  link.clicks.push({ timestamp: Date.now(), referer });
  await dbSave(link);
}
