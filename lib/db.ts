/**
 * Storage abstraction:
 * - Local dev  : data/links.json (fichier)
 * - Production : Upstash Redis   (quand KV_REST_API_URL est défini)
 */
import { ShortLink } from './types';
import fs from 'fs';
import path from 'path';

// ─── File storage (dev) ──────────────────────────────────────────────────────

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

// ─── Redis client (production) ───────────────────────────────────────────────

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const { Redis } = require('@upstash/redis');
  return new Redis({ url, token });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function dbGetAll(): Promise<ShortLink[]> {
  const redis = getRedis();
  if (redis) {
    const codes: string[] = await redis.smembers('links') ?? [];
    if (!codes.length) return [];
    const links = await Promise.all(codes.map((c: string) => redis.get<ShortLink>(`link:${c}`)));
    return (links.filter(Boolean) as ShortLink[]).sort((a, b) => b.createdAt - a.createdAt);
  }
  return Object.values(readFile()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function dbGet(code: string): Promise<ShortLink | null> {
  const redis = getRedis();
  if (redis) return redis.get<ShortLink>(`link:${code}`);
  return readFile()[code] ?? null;
}

export async function dbSave(link: ShortLink): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(`link:${link.shortCode}`, JSON.stringify(link));
    await redis.sadd('links', link.shortCode);
    return;
  }
  const data = readFile();
  data[link.shortCode] = link;
  writeFile(data);
}

export async function dbDelete(code: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`link:${code}`);
    await redis.srem('links', code);
    return;
  }
  const data = readFile();
  delete data[code];
  writeFile(data);
}

export async function dbRecordClick(code: string, referer?: string): Promise<void> {
  const link = await dbGet(code);
  if (!link) return;
  link.clicks.push({ timestamp: Date.now(), referer });
  await dbSave(link);
}
