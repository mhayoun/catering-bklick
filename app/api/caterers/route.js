import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { searchCaterers, upsertCaterer } from '../../../lib/store';
import { isAdminEmail } from '../../../lib/admin';
import { fillLocalizedGaps } from '../../../lib/translate';

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    keyword: searchParams.get('keyword') || '',
    locale: searchParams.get('locale') || 'he',
    districts: searchParams.getAll('districts'),
    kashrutLevels: searchParams.getAll('kashrutLevels'),
    cateringTypes: searchParams.getAll('cateringTypes'),
    eventTypes: searchParams.getAll('eventTypes'),
    minGuests: searchParams.get('minGuests') || '',
    maxMinOrder: searchParams.get('maxMinOrder') || '',
    menuCategories: searchParams.getAll('menuCategories'),
    services: searchParams.getAll('services')
  };

  const results = await searchCaterers(filters);
  // Public search only ever shows admin-approved listings.
  const approved = results.filter((c) => c.status === 'approved');
  return NextResponse.json({ results: approved });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  if (!body.businessName || !body.districts?.length || !body.cateringTypes?.length) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  const description = await fillLocalizedGaps(body.description);
  const city = await fillLocalizedGaps(body.city);

  const record = await upsertCaterer(
    { ...body, description, city, id: undefined, ownerEmail: session.user.email },
    session.user.email,
    isAdminEmail(session.user.email)
  );

  return NextResponse.json({ caterer: record }, { status: 201 });
}
