import { NextResponse } from 'next/server';

export async function GET() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  const info: Record<string, unknown> = {
    hasUrl: !!url,
    hasToken: !!token,
    urlPrefix: url ? url.substring(0, 30) + '...' : null,
  };

  if (url && token) {
    try {
      const { Redis } = require('@upstash/redis');
      const redis = new Redis({ url, token });

      // Test ping
      const ping = await redis.ping();
      info.ping = ping;

      // Test set/get
      await redis.set('debug:test', { hello: 'world', ts: Date.now() });
      const val = await redis.get('debug:test');
      info.testValue = val;

      // List all link keys
      const members = await redis.smembers('links');
      info.linkCodes = members;

    } catch (e: unknown) {
      info.error = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json(info);
}
