import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export async function GET() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const info: Record<string, unknown> = {
    hasUrl: !!url,
    hasToken: !!token,
  };

  if (!url || !token) {
    return NextResponse.json({ ...info, error: 'Missing env vars' });
  }

  try {
    const redis = new Redis({ url, token });

    // Ping
    info.ping = await redis.ping();

    // Liste tous les codes
    const codes = (await redis.smembers('links')) as string[];
    info.linkCodes = codes;

    // Récupère le contenu brut de chaque lien
    const rawLinks: Record<string, unknown> = {};
    for (const code of codes.slice(0, 5)) {
      const raw = await redis.get(`link:${code}`);
      rawLinks[code] = raw;
    }
    info.rawLinks = rawLinks;

    // Test: sauvegarde un lien de test et le relit immédiatement
    const testCode = 'TEST01';
    const testLink = {
      id: 'test-id',
      shortCode: testCode,
      originalUrl: 'https://google.com',
      createdAt: Date.now(),
      clicks: [],
    };
    await redis.set(`link:${testCode}`, testLink);
    await redis.sadd('links', testCode);
    const retrieved = await redis.get(`link:${testCode}`);
    info.testSaveRetrieve = {
      saved: testLink,
      retrieved,
      match: JSON.stringify(retrieved) === JSON.stringify(testLink),
    };

  } catch (e: unknown) {
    info.error = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json(info, { status: 200 });
}
