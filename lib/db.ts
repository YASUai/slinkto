/**
 * Storage abstraction:
 * - Local dev  : data/links.json (fichier)
 * - Production : Vercel KV      (quand KV_REST_API_URL est défini)
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

// ─── KV storage (production) ─────────────────────────────────────────────────

function isKV(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function dbGetAll(): Promise<ShortLink[]> {
  if (isKV()) {
    const { kv } = await import('@vercel/kv');
    const codes = await kv.smembers<string[]>('links');
    if (!codes.length) return [];
    const links = await Promise.all(codes.map(c => kv.get<ShortLink>(`link:${c}`)));
    return (links.filter(Boolean) as ShortLink[]).sort((a, b) => b.createdAt - a.createdAt);
  }
  return Object.values(readFile()).sort((a, b) => b.createdAt - a.createdAt);
}

export async function dbGet(code: string): Promise<ShortLink | null> {
  if (isKV()) {
    const { kv } = await import('@vercel/kv');
    return kv.get<ShortLink>(`link:${code}`);
  }
  return readFile()[code] ?? null;
}

export async function dbSave(link: ShortLink): Promise<void> {
  if (isKV()) {
    const { kv } = await import('@vercel/kv');
    await kv.set(`link:${link.shortCode}`, link);
    await kv.sadd('links', link.shortCode);
    return;
  }
  const data = readFile();
  data[link.shortCode] = link;
  writeFile(data);
}

export async function dbDelete(code: string): Promise<void> {
  if (isKV()) {
    const { kv } = await import('@vercel/kv');
    await kv.del(`link:${code}`);
    await kv.srem('links', code);
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
