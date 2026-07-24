import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getCaterer, upsertCaterer, deleteCaterer } from '../../../../lib/store';
import { isAdminEmail } from '../../../../lib/admin';
import { fillLocalizedGaps } from '../../../../lib/translate';

export async function GET(_request, { params }) {
  const caterer = await getCaterer(params.id);
  if (!caterer) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (caterer.status !== 'approved') {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    const allowed = email && (email === caterer.ownerEmail || isAdminEmail(email));
    if (!allowed) return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  return NextResponse.json({ caterer });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const existing = await getCaterer(params.id);
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.ownerEmail !== session.user.email) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();

  const description = await fillLocalizedGaps(body.description);
  const city = await fillLocalizedGaps(body.city);

  const record = await upsertCaterer(
    { ...existing, ...body, description, city, id: params.id, ownerEmail: existing.ownerEmail },
    session.user.email
  );
  return NextResponse.json({ caterer: record });
}

export async function DELETE(_request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const ok = await deleteCaterer(params.id, session.user.email);
  if (!ok) return NextResponse.json({ error: 'forbidden or not found' }, { status: 403 });
  return NextResponse.json({ success: true });
}
