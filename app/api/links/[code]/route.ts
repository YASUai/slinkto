import { NextRequest, NextResponse } from 'next/server';
import { dbGet, dbDelete, dbRecordClick } from '@/lib/db';

type Params = { params: Promise<{ code: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { code } = await params;
  const link = await dbGet(code);
  if (!link) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json(link);
}

export async function POST(_: NextRequest, { params }: Params) {
  const { code } = await params;
  const body = await _.json().catch(() => ({}));
  await dbRecordClick(code, body.referer);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { code } = await params;
  await dbDelete(code);
  return NextResponse.json({ ok: true });
}
