import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { isAdminEmail } from '../../../../lib/admin';
import { listCaterers } from '../../../../lib/store';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const results = await listCaterers();
  return NextResponse.json({ results });
}
