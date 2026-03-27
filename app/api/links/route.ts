import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from 'uuid';
import { dbGetAll, dbSave, dbDelete } from '@/lib/db';
import { ShortLink } from '@/lib/types';

function generateCode(len = 6): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const links = await dbGetAll(userId);
  return NextResponse.json(links);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { originalUrl } = await req.json();
  if (!originalUrl) return NextResponse.json({ error: 'URL required' }, { status: 400 });

  const existing = await dbGetAll(userId);
  let shortCode = generateCode();
  while (existing.some(l => l.shortCode === shortCode)) shortCode = generateCode();

  const link: ShortLink = {
    id: uuidv4(),
    shortCode,
    originalUrl,
    createdAt: Date.now(),
    clicks: [],
    userId,
  };

  await dbSave(link);
  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  await dbDelete(code, userId);
  return NextResponse.json({ success: true });
}
