import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { dbGetAll, dbSave } from '@/lib/db';
import { ShortLink } from '@/lib/types';

function generateCode(len = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function GET() {
  const links = await dbGetAll();
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const { originalUrl } = await req.json();
  if (!originalUrl) return NextResponse.json({ error: 'URL requise' }, { status: 400 });

  const existing = await dbGetAll();
  let shortCode = generateCode();
  while (existing.some(l => l.shortCode === shortCode)) shortCode = generateCode();

  const link: ShortLink = {
    id: uuidv4(),
    shortCode,
    originalUrl,
    createdAt: Date.now(),
    clicks: [],
  };

  await dbSave(link);
  return NextResponse.json(link, { status: 201 });
}
