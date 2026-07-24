import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../../lib/auth';
import { isAdminEmail } from '../../../../../../lib/admin';
import { setCatererStatus, STATUS } from '../../../../../../lib/store';

export async function POST(request, { params }) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!isAdminEmail(email)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { action, reason } = body; // action: 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  }

  const status = action === 'approve' ? STATUS.APPROVED : STATUS.REJECTED;
  const record = await setCatererStatus(params.id, status, email, reason || null);

  if (!record) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ caterer: record });
}
